import type { ZendureSolarflow } from "../../main";
import type { ZenIobDevice } from "../../models/deviceModels/ZenIobDevice";

const LOG = "[adapterAutomation]";

// SOC-weighting exponent for distributing the required home usage across devices by their share of total SOC.
const EXPONENT = 1.8;

// Once the number of active devices grows, keep it from shrinking again for a while, to avoid rapid on/off flapping.
const INVERTER_MIN_HOLD_MS = 5 * 60 * 1000;

// Above this fleet-wide minimum SOC (%), 'adapterAutomation.setPointNearlyFull' is used instead of
// 'adapterAutomation.setPoint', since the batteries can no longer usefully absorb more power.
const NEARLY_FULL_SOC = 90;

// A device that just had its autoModel changed needs this long before it reliably accepts a new setpoint.
const AUTO_MODEL_SETTLE_MS = 7000;

// An inverter ramping up from 0W (standby) needs about this long before it actually starts delivering power.
const WAKE_UP_MS = 9000;

// Skip a control cycle if any device's output limit state changed more recently than this (still settling).
const RECENT_CHANGE_SKIP_MS = 3000;

// A device is kept at a 10W standby (instead of a full stop to 0W) once idle, so it reacts faster once needed again.
const MIN_STANDBY_TIME_MS = 3 * 60 * 1000;

// A device may only start charging (negative limit) once its output limit has been idle at 0W for at
// least this long, so it doesn't flip directly from discharging to charging (or back) too often.
const MIN_IDLE_BEFORE_CHARGE_MS = 5 * 60 * 1000;

// Fraction of the currently allocated max power that must be requested before another device is activated.
const UTILIZATION_THRESHOLD = 0.7;

// Grid meter surplus charging: once the meter is exporting this far beyond setPoint, there's clearly
// spare power to charge AC-only devices with. SURPLUS_SETPOINT_BUFFER_W keeps a margin below setPoint
// while that's active, so the meter doesn't hover right at the trigger edge and flicker in/out.
const SURPLUS_TRIGGER_BELOW_SETPOINT_W = 60;
const SURPLUS_SETPOINT_BUFFER_W = 30;

const PI_CONTROLLER = {
  KP: 0.15,
  KI: 0.02,
  INTEGRAL_MIN: -200,
  INTEGRAL_MAX: 200,
};

interface IAutomationDeviceState {
  /** Whether this device's own 'adapterAutomation.automationEnabled' switch is on, refreshed once per cycle. */
  enabled: boolean;
  soc: number;
  minSoc: number;
  maxLimit: number;
  /** Highest acceptable charge power (W); from the device's reported 'chargeMaxLimit', or maxInputLimit if not (yet) reported. */
  chargeMaxLimit: number;
  solarInputPower: number;
  currentLimit: number;
  newLimit: number;
  share: number;
  /** Whether this device was asked for more power than its maxLimit allows (no headroom left). */
  isAtCapacity: boolean;
  lastChangeMs: number;
  wakingUntilMs: number;
  pendingTimeout?: ioBroker.Timeout;
}

// Runtime automation state per device (keyed by '<productKey>.<deviceKey>'), kept outside ZenIobDevice
// since it's specific to this control loop, not part of the device's own model.
const deviceStates = new Map<string, IAutomationDeviceState>();

let piIntegral = 0;
let inDeadBand = false;
let lastGridMeterValue: number | undefined;
let stabilizedInverterCount = 0;
let stabilizedUntilMs = 0;
// Guards against overlapping cycles: runZeroFeedInAutomation does many sequential awaits, so a fast
// series of trigger updates could otherwise start a second cycle before the first one finishes.
let isRunning = false;
// Device order established by the last sortAutomationDevices() call; new/unsorted devices are appended.
let deviceOrder: string[] = [];

const deviceId = (device: ZenIobDevice): string => `${device.productKey}.${device.deviceKey}`;

const getDeviceState = (device: ZenIobDevice): IAutomationDeviceState => {
  const id = deviceId(device);
  let state = deviceStates.get(id);
  if (!state) {
    state = {
      enabled: false,
      soc: 0,
      minSoc: 0,
      maxLimit: 0,
      chargeMaxLimit: 0,
      solarInputPower: 0,
      currentLimit: 0,
      newLimit: 0,
      share: 0,
      isAtCapacity: false,
      lastChangeMs: 0,
      wakingUntilMs: 0,
    };
    deviceStates.set(id, state);
  }
  return state;
};

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const roundShare = (value: number): number => Math.round(value * 100) / 100;

const calculatePIOutput = (setPointDiff: number): number => {
  const proportional = PI_CONTROLLER.KP * setPointDiff;

  piIntegral = clamp(piIntegral + setPointDiff, PI_CONTROLLER.INTEGRAL_MIN, PI_CONTROLLER.INTEGRAL_MAX);
  const integral = PI_CONTROLLER.KI * piIntegral;

  return proportional + integral;
};

/**
 * Resets the PI controller's integral term, e.g. when automation is (re-)enabled.
 *
 * @param adapter the adapter instance
 */
export const resetAdapterAutomationController = (adapter: ZendureSolarflow): void => {
  piIntegral = 0;
  adapter.log.debug(`${LOG} PI controller integral reset`);
};

// Devices that can participate in the zero feed-in automation: battery devices with output control.
const getAutomationDevices = (adapter: ZendureSolarflow): ZenIobDevice[] =>
  adapter.zenIobDeviceList.filter((device) => device.hasPackData && device.controlStates.length > 0);

// Automation devices in the order established by the last sort, appending any not sorted yet.
const getOrderedAutomationDevices = (adapter: ZendureSolarflow): ZenIobDevice[] => {
  const devices = getAutomationDevices(adapter);
  const byId = new Map(devices.map((device) => [deviceId(device), device]));

  const ordered = deviceOrder.map((id) => byId.get(id)).filter((device): device is ZenIobDevice => device != null);

  devices.forEach((device) => {
    if (!ordered.includes(device)) {
      ordered.push(device);
    }
  });

  return ordered;
};

const isDeviceEnabled = async (adapter: ZendureSolarflow, device: ZenIobDevice): Promise<boolean> => {
  const state = await adapter.getStateAsync(`${deviceId(device)}.adapterAutomation.automationEnabled`);
  return state?.val === true;
};

/**
 * Sorts the automation devices by a weighted score (mostly SOC, a little solar input), so the fullest /
 * most productive device is preferred as the lead device. AC-only devices (no solar input of their own)
 * need a 50% score lead once the other devices average above 35% SOC, so they aren't preferred just
 * because they happened to be charged fully from the grid.
 *
 * @param adapter the adapter instance
 */
export const sortAutomationDevices = (adapter: ZendureSolarflow): void => {
  const devices = getAutomationDevices(adapter);

  const getScore = (device: ZenIobDevice): number => {
    const state = getDeviceState(device);
    return state.solarInputPower * 0.1 + state.soc * 0.6;
  };

  const nonAcOnly = devices.filter((device) => !device.isAcOnly);
  const avgSocNonAcOnly =
    nonAcOnly.length > 0
      ? nonAcOnly.reduce((sum, device) => sum + getDeviceState(device).soc, 0) / nonAcOnly.length
      : 0;
  const applyAcOnlyPenalty = avgSocNonAcOnly > 35;

  const sorted = [...devices].sort((a, b) => {
    const scoreA = getScore(a);
    const scoreB = getScore(b);

    const effectiveScoreA = applyAcOnlyPenalty && a.isAcOnly ? scoreA / 1.5 : scoreA;
    const effectiveScoreB = applyAcOnlyPenalty && b.isAcOnly ? scoreB / 1.5 : scoreB;

    return effectiveScoreB - effectiveScoreA;
  });

  deviceOrder = sorted.map((device) => deviceId(device));

  adapter.log.debug(
    `${LOG} New device order: ${sorted.map((device) => `${device.deviceKey}(${getScore(device).toFixed(2)})`).join(" -> ")}`,
  );
};

/**
 * Refreshes each device's cached SOC, minSoc, solar input and max output limit. Intended to be called
 * on a schedule (e.g. every minute). If a device's max limit drops below 500W, the device order is
 * re-evaluated, since a device that can barely output anything shouldn't stay lead device.
 *
 * @param adapter the adapter instance
 */
export const updateAutomationDeviceMetrics = async (adapter: ZendureSolarflow): Promise<void> => {
  const devices = getAutomationDevices(adapter);
  const ignoreSuggested =
    (await adapter.getStateAsync("adapterAutomation.ignoreSuggestedInverseMaxPower"))?.val === true;

  let needsResort = false;

  for (const device of devices) {
    const id = deviceId(device);
    const state = getDeviceState(device);

    const maxLimitState = ignoreSuggested
      ? await adapter.getStateAsync(`${id}.inverseMaxPower`)
      : await adapter.getStateAsync(`${id}.adapterAutomation.suggestedInverseMaxPower`);
    const newMaxLimit = maxLimitState?.val != null ? Number(maxLimitState.val) : 0;

    if (newMaxLimit != state.maxLimit) {
      adapter.log.debug(`${LOG} maxLimit for '${device.deviceKey}' changed: ${state.maxLimit} -> ${newMaxLimit}`);
      state.maxLimit = newMaxLimit;

      if (newMaxLimit < 500) {
        needsResort = true;
      }
    }

    const solarInputPowerState = await adapter.getStateAsync(`${id}.solarInputPower`);
    state.solarInputPower = solarInputPowerState?.val != null ? Number(solarInputPowerState.val) : 0;

    const socState = await adapter.getStateAsync(`${id}.electricLevel`);
    state.soc = socState?.val != null ? Number(socState.val) : 0;

    const minSocState = await adapter.getStateAsync(`${id}.minSoc`);
    state.minSoc = minSocState?.val != null ? Number(minSocState.val) : 0;

    // chargeMaxLimit is reported by the device itself via MQTT/zenSDK when available; fall back to the
    // device class's hardware maxInputLimit otherwise.
    const chargeMaxLimitState = await adapter.getStateAsync(`${id}.chargeMaxLimit`);
    state.chargeMaxLimit = chargeMaxLimitState?.val != null ? Number(chargeMaxLimitState.val) : device.maxInputLimit;
  }

  if (needsResort) {
    adapter.log.debug(`${LOG} maxLimit changed significantly, re-sorting devices!`);
    sortAutomationDevices(adapter);
  }
};

/**
 * Detects if a device's actual output limit state has drifted from what automation last set (e.g.
 * changed externally), and re-syncs the cached value so the control loop doesn't act on stale data.
 *
 * @param adapter the adapter instance
 */
export const checkAutomationCurrentLimit = async (adapter: ZendureSolarflow): Promise<void> => {
  for (const device of getAutomationDevices(adapter)) {
    const state = getDeviceState(device);
    const currentLimitState = await adapter.getStateAsync(`${deviceId(device)}.control.setDeviceAutomationInOutLimit`);
    const currentLimit = currentLimitState?.val != null ? Number(currentLimitState.val) : 0;

    if (state.currentLimit != currentLimit) {
      adapter.log.warn(
        `${LOG} currentLimit (${state.currentLimit}) for '${device.deviceKey}' differs from state (${currentLimit}), re-syncing!`,
      );
      state.currentLimit = currentLimit;
    }
  }
};

/**
 * Distributes required power across the given devices proportional to soc^EXPONENT, so fuller devices
 * carry a bigger share. A device below its own configured minSoc, or without output headroom, gets none.
 *
 * @param devices candidate devices to assign a share to
 */
const setDeviceShares = (devices: ZenIobDevice[]): void => {
  const weightedSum = devices.reduce((sum, device) => sum + Math.pow(getDeviceState(device).soc, EXPONENT), 0);

  devices.forEach((device) => {
    const state = getDeviceState(device);
    state.share =
      state.maxLimit > 0 && state.soc >= state.minSoc && weightedSum > 0
        ? roundShare(Math.pow(state.soc, EXPONENT) / weightedSum)
        : 0;
  });
};

/**
 * Runs one cycle of the zero grid feed-in automation: given the current grid meter power (W, positive =
 * importing from the grid, negative = exporting to it), (re-)distributes output across all
 * automation-enabled devices so the grid meter tracks 'adapterAutomation.setPoint'.
 *
 * This is a port of a working standalone ioBroker script (PI-controlled, SOC-weighted power sharing
 * across multiple Zendure inverters), adapted to adapter-internal states:
 *  - 'adapterAutomation.automationEnabled' (global on/off) replaces the script's system-wide switch.
 *  - '<device>.adapterAutomation.automationEnabled' replaces the script's per-inverter "Aktiv" switch.
 *  - '<device>.adapterAutomation.suggestedInverseMaxPower' (or the plain 'inverseMaxPower' control state,
 *    if 'adapterAutomation.ignoreSuggestedInverseMaxPower' is set) replaces the script's externally
 *    maintained per-inverter MaxLimit.
 *  - '<device>.minSoc' replaces the script's single, global MIN_SOC constant.
 * Forecast-based setpoint adjustments and rolling averages (solar/grid/home usage) from the original
 * script have no equivalent here (yet) and were dropped; the current instantaneous values are used instead.
 *
 * @param adapter the adapter instance
 * @param currentGridMeterValue current grid meter power in W (positive = import, negative = export)
 */
export const runZeroFeedInAutomation = async (
  adapter: ZendureSolarflow,
  currentGridMeterValue: number,
): Promise<void> => {
  if (isRunning || lastGridMeterValue === currentGridMeterValue) {
    return;
  }

  // Set the guard synchronously (before the first await below), so a trigger arriving while we're still
  // awaiting the automationEnabled check can't slip through and start a second, overlapping cycle.
  isRunning = true;

  try {
    const automationEnabled = (await adapter.getStateAsync("adapterAutomation.automationEnabled"))?.val === true;
    if (!automationEnabled) {
      return;
    }

    lastGridMeterValue = currentGridMeterValue;

    const devices = getOrderedAutomationDevices(adapter);
    if (devices.length === 0) {
      return;
    }

    const now = Date.now();

    // Refresh enabled status, solar input and current limit for every device; send stale 10W-standby,
    // non-lead, enabled devices to 0.
    for (const [index, device] of devices.entries()) {
      const id = deviceId(device);
      const state = getDeviceState(device);

      state.enabled = await isDeviceEnabled(adapter, device);

      const solarInputPowerState = await adapter.getStateAsync(`${id}.solarInputPower`);
      state.solarInputPower = solarInputPowerState?.val != null ? Number(solarInputPowerState.val) : 0;

      const currentLimitState = await adapter.getStateAsync(`${id}.control.setDeviceAutomationInOutLimit`);
      state.lastChangeMs = currentLimitState?.lc ? now - currentLimitState.lc : Number.MAX_SAFE_INTEGER;

      if (
        state.enabled &&
        state.lastChangeMs >= MIN_STANDBY_TIME_MS &&
        state.currentLimit === 10 &&
        state.soc < 99 &&
        index !== 0
      ) {
        state.currentLimit = 0;
        state.newLimit = 0;
        device.setDeviceAutomationInOutLimit(0);
      } else {
        state.currentLimit = currentLimitState?.val != null ? Number(currentLimitState.val) : 0;
      }
    }

    if (
      devices.some((device) => {
        const state = getDeviceState(device);
        return state.enabled && state.lastChangeMs < RECENT_CHANGE_SKIP_MS;
      })
    ) {
      // An enabled device's limit was changed too recently - let it settle before acting again.
      return;
    }

    const wakingDevice = devices.find((device) => {
      const state = getDeviceState(device);
      return state.enabled && state.wakingUntilMs > now;
    });
    if (wakingDevice) {
      adapter.log.debug(
        `${LOG} Device '${wakingDevice.deviceKey}' is still waking up, waiting ${Math.round((getDeviceState(wakingDevice).wakingUntilMs - now) / 1000)}s`,
      );
      return;
    }

    const currentFeedIn = devices.reduce((sum, device) => sum + Math.max(getDeviceState(device).currentLimit, 0), 0);
    const maxFeedIn = devices.reduce((sum, device) => sum + getDeviceState(device).maxLimit, 0);
    const solarInput = devices.reduce((sum, device) => sum + getDeviceState(device).solarInputPower, 0);
    const fleetMinSoc = Math.min(...devices.map((device) => getDeviceState(device).soc));

    const setPointState = await adapter.getStateAsync("adapterAutomation.setPoint");
    const setPointNearlyFullState = await adapter.getStateAsync("adapterAutomation.setPointNearlyFull");
    const baseSetPoint = setPointState?.val != null ? Number(setPointState.val) : 10;
    const setPointNearlyFull = setPointNearlyFullState?.val != null ? Number(setPointNearlyFullState.val) : -100;

    const setPoint = fleetMinSoc >= NEARLY_FULL_SOC && solarInput > 50 ? setPointNearlyFull : baseSetPoint;

    // Comfortable grid export beyond setPoint: clear surplus power that AC-only devices could charge with.
    const hasGridSurplus = currentGridMeterValue <= setPoint - SURPLUS_TRIGGER_BELOW_SETPOINT_W;
    const surplusSetPoint = setPoint - SURPLUS_SETPOINT_BUFFER_W;

    // Bei negativem Setpoint: obere Dead-Band-Grenze auf 0W begrenzen, damit der Regler nicht dauerhaft
    // aktiv bleibt, wenn der Zielwert physikalisch nicht erreichbar ist.
    const deadBandUpper = setPoint < 0 ? 0 : setPoint + 10;
    const deadBandTarget = (setPoint + deadBandUpper) / 2;

    if (currentGridMeterValue > setPoint && currentGridMeterValue < deadBandUpper) {
      if (!inDeadBand) {
        adapter.log.debug(
          `${LOG} currentGridMeterValue=${currentGridMeterValue} is within the acceptable range of setPoint=${setPoint} and deadBandUpper=${deadBandUpper}`,
        );
        inDeadBand = true;
      }
      return;
    }

    if (inDeadBand) {
      adapter.log.debug(`${LOG} currentGridMeterValue=${currentGridMeterValue}, leaving dead band!`);
      inDeadBand = false;
    }

    const currentHomeUsage = currentGridMeterValue + currentFeedIn;

    const setPointDiff = currentGridMeterValue - deadBandTarget;
    const piCorrection = calculatePIOutput(setPointDiff);

    let piAdjustedHomeUsage = currentHomeUsage + piCorrection;

    const inputDevices: ZenIobDevice[] = [];
    const otherDevices: ZenIobDevice[] = [];
    let currentAllocatedMaxPower = 0;

    for (const [index, device] of devices.entries()) {
      const state = getDeviceState(device);

      const utilization = currentAllocatedMaxPower > 0 ? piAdjustedHomeUsage / currentAllocatedMaxPower : 1;

      const isLead = index === 0;
      const isFullAndCapable = state.soc >= 95 && !device.isAcOnly;
      const hasSpareSolar = state.solarInputPower > 100 && state.soc > 35 && currentHomeUsage > 400;

      if (state.enabled && (isLead || isFullAndCapable || hasSpareSolar)) {
        inputDevices.push(device);
        currentAllocatedMaxPower += state.maxLimit;
      } else if (
        state.enabled &&
        (currentHomeUsage > 4800 ||
          piAdjustedHomeUsage > maxFeedIn ||
          (utilization >= UTILIZATION_THRESHOLD && !device.isAcOnly))
      ) {
        inputDevices.push(device);
        currentAllocatedMaxPower += state.maxLimit;
      } else {
        otherDevices.push(device);
      }
    }

    // Hold the number of active devices for a while once it grows, to avoid rapid on/off flapping when the
    // required power hovers around the activation threshold.
    if (inputDevices.length > stabilizedInverterCount) {
      stabilizedInverterCount = inputDevices.length;
      stabilizedUntilMs = now + INVERTER_MIN_HOLD_MS;
    } else if (inputDevices.length < stabilizedInverterCount && now < stabilizedUntilMs) {
      const needed = stabilizedInverterCount - inputDevices.length;
      const candidates = otherDevices.filter((device) => getDeviceState(device).enabled).slice(0, needed);

      candidates.forEach((device) => {
        otherDevices.splice(otherDevices.indexOf(device), 1);
        inputDevices.push(device);
        currentAllocatedMaxPower += getDeviceState(device).maxLimit;
      });
    } else {
      stabilizedInverterCount = inputDevices.length;
    }

    setDeviceShares(inputDevices);

    // Total power that couldn't be assigned to a device because it exceeded that device's maxLimit; needs
    // to be redistributed to devices that still have headroom.
    let unmetDemand = 0;

    const nonAcOnly = devices.filter((device) => !device.isAcOnly);
    const avgSocNonAcOnly =
      nonAcOnly.length > 0
        ? nonAcOnly.reduce((sum, device) => sum + getDeviceState(device).soc, 0) / nonAcOnly.length
        : 0;

    // Devices not currently needed for the main feed-in target: idle at 0W (or 10W standby), or, for
    // AC-only devices once the other batteries are reasonably charged, opportunistically charge from surplus solar.
    // Devices with automation disabled are left alone entirely (no command sent at all).
    for (const device of otherDevices) {
      const state = getDeviceState(device);

      if (!state.enabled) {
        continue;
      }

      if (device.isAcOnly && state.soc < 100) {
        if (hasGridSurplus) {
          // Charge proportional to the actual measured surplus (relative to the buffered surplusSetPoint),
          // which is more accurate than the solarInput-based estimate below.
          const surplusPower = Math.max(0, surplusSetPoint - currentGridMeterValue);
          state.newLimit = -Math.min(surplusPower, state.chargeMaxLimit);
        } else if (avgSocNonAcOnly > 70 && solarInput > 800) {
          // No confirmed grid surplus yet, but the other batteries are reasonably charged (avg SOC > 70%)
          // and there's meaningful solar production (>800W) - estimate a safe charge power as 20% of the
          // current total solar input, capped at this device's chargeMaxLimit.
          let maxChargePower = Math.round((solarInput * 0.2) / 100) * 100;
          maxChargePower = Math.min(maxChargePower, state.chargeMaxLimit);
          state.newLimit = -maxChargePower;
        }
      } else if (state.currentLimit >= 10) {
        // Keep the device at a 10W standby rather than a full stop - it reacts faster once needed again.
        state.newLimit = 10;
        piAdjustedHomeUsage -= 10;
      } else {
        state.newLimit = 0;
      }
    }

    // Assign each input device its share of the required power, prioritizing fully charged devices so
    // they at least export their own solar input instead of curtailing it.
    inputDevices.forEach((device) => {
      const state = getDeviceState(device);
      state.isAtCapacity = false;

      if (state.maxLimit <= 0 || !state.share) {
        return;
      }

      const solar = state.solarInputPower;
      const calculatedLimit = Math.floor(piAdjustedHomeUsage * state.share);

      state.newLimit =
        state.soc >= 99 && solar > 0 && !device.isAcOnly ? Math.max(calculatedLimit, solar) : calculatedLimit;

      if (!device.isAcOnly && state.soc === 99 && solar > 40) {
        // soc == 99: at least 100W once solar input exceeds 40W.
        state.newLimit = Math.max(100, state.newLimit);
      }

      const baseLimit = device.isAcOnly ? 0 : state.soc >= 99 && fleetMinSoc < 99 ? 30 : 10;
      state.newLimit = state.newLimit < 10 ? baseLimit : state.newLimit;

      if (state.newLimit > state.maxLimit) {
        unmetDemand += state.newLimit - state.maxLimit;
        state.isAtCapacity = true;
      }
    });

    // A fully charged device that's capped below its calculated share frees up power for AC-only devices
    // to absorb instead (they'd otherwise just curtail solar or sit idle).
    const fullSocDevices = inputDevices.filter((device) => getDeviceState(device).soc >= 99 && !device.isAcOnly);

    if (fullSocDevices.length > 0) {
      let totalExtraPower = 0;

      fullSocDevices.forEach((device) => {
        const state = getDeviceState(device);
        const calculatedShare = Math.floor(piAdjustedHomeUsage * state.share);
        const extra = state.newLimit - Math.max(calculatedShare, 0);
        if (extra > 0) {
          totalExtraPower += extra;
        }
      });

      if (totalExtraPower > 0) {
        const reducibleDevices = inputDevices.filter((device) => device.isAcOnly);
        const totalReducibleShare = reducibleDevices.reduce((sum, device) => sum + getDeviceState(device).share, 0);

        if (totalReducibleShare > 0) {
          reducibleDevices.forEach((device) => {
            const state = getDeviceState(device);
            const reduction = Math.round(totalExtraPower * (state.share / totalReducibleShare));
            const minNewLimit = state.soc === 99 && solarInput > 40 ? 100 : 10;
            state.newLimit = Math.max(minNewLimit, state.newLimit - reduction);
          });
        }
      }
    }

    // Redistribute unmet demand (devices that were asked for more than their own maxLimit allows) across
    // devices that still have headroom.
    const availableDeviceCount = inputDevices.filter((device) => !getDeviceState(device).isAtCapacity).length;

    if (availableDeviceCount > 0 && unmetDemand > 0) {
      inputDevices
        .filter((device) => {
          const state = getDeviceState(device);
          return !state.isAtCapacity && state.newLimit < state.maxLimit;
        })
        .forEach((device) => {
          getDeviceState(device).newLimit += unmetDemand / availableDeviceCount;
        });
    }

    // If a device is (or is about to start) ramping up from standby, keep other 10W-standby limits in sync
    // with the same delay so they don't apply before the ramping device has settled.
    const globalWakingDelayMs = devices.reduce((max, device) => {
      const state = getDeviceState(device);
      if (state.wakingUntilMs > now) {
        return Math.max(max, state.wakingUntilMs - now);
      }
      if (state.currentLimit === 0 && state.newLimit > 0) {
        return Math.max(max, WAKE_UP_MS);
      }
      return max;
    }, 0);

    for (const device of devices) {
      const id = deviceId(device);
      const state = getDeviceState(device);

      if (!state.enabled) {
        // Automation is disabled for this device - leave it alone entirely (no command sent), rather
        // than forcing it to a specific limit.
        continue;
      }

      state.newLimit = Math.round(clamp(state.newLimit, -state.chargeMaxLimit, state.maxLimit));

      if (state.newLimit < 0 && !(state.currentLimit === 0 && state.lastChangeMs >= MIN_IDLE_BEFORE_CHARGE_MS)) {
        // Charging was requested, but the device hasn't been idle at 0W for long enough yet (or is
        // currently discharging) - hold it at 0W instead of flipping straight into charging.
        state.newLimit = 0;
      }

      if (state.newLimit === state.currentLimit) {
        continue;
      }

      const autoModelState = await adapter.getStateAsync(`${id}.autoModel`);
      const autoModelLastChangeMs = autoModelState?.lc ? now - autoModelState.lc : Number.MAX_SAFE_INTEGER;
      const settleDelayMs = Math.max(0, AUTO_MODEL_SETTLE_MS - autoModelLastChangeMs);

      if (settleDelayMs > 0) {
        state.wakingUntilMs = now + settleDelayMs;
        adapter.log.debug(`${LOG} autoModel change detected for '${device.deviceKey}', waiting ${settleDelayMs}ms`);
      }

      const standbyDelayMs = state.newLimit === 10 ? Math.max(settleDelayMs, globalWakingDelayMs) : settleDelayMs;

      if (state.pendingTimeout) {
        adapter.clearTimeout(state.pendingTimeout);
      }

      const newLimit = state.newLimit;
      state.pendingTimeout = adapter.setTimeout(() => {
        state.pendingTimeout = undefined;

        const wasZero = state.currentLimit === 0;
        state.currentLimit = newLimit;
        device.setDeviceAutomationInOutLimit(newLimit);

        if (wasZero && state.currentLimit > 0) {
          state.wakingUntilMs = Date.now() + WAKE_UP_MS;
          adapter.log.debug(
            `${LOG} Device '${device.deviceKey}' starting up from standby, waiting ${WAKE_UP_MS / 1000}s`,
          );
        }
      }, standbyDelayMs);
    }
  } finally {
    isRunning = false;
  }
};
