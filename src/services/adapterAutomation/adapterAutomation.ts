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
const RECENT_CHANGE_SKIP_MS = 2000;

// A device is kept at a keep-alive limit (feed-in standby at +minLimit, or charge keep-alive at -minLimit, see
// getMinLimit) instead of a full stop to 0W once idle, so it reacts faster once needed again; after this long
// unchanged it's released to 0W. The charge keep-alive keeps an AC-only device in charge mode instead of
// dropping straight to 0W, which would switch it internally from charge to discharge/off mode and trip a relay.
const MIN_STANDBY_TIME_MS = 3 * 60 * 1000;

// Smallest non-zero limit magnitude (W) a device accepts: zenSDK devices can't go below 30W (or -30W), others 10W.
const ZEN_SDK_MIN_LIMIT_W = 30;
const DEFAULT_MIN_LIMIT_W = 10;

// A device may only start a new charge (negative limit) once it has stopped both charging and feeding in
// for at least this long, so it doesn't flip directly from discharging to charging (or back) too often.
const MIN_IDLE_BEFORE_CHARGE_MS = 5 * 60 * 1000;

// Rate limit for feed-in adjustments: only applied when the adjustment reverses direction compared to the
// last one. A fluctuating load (e.g. a washing machine) reverses direction nearly every cycle and should be
// damped; a genuine sustained change in demand keeps moving in the same direction and passes unthrottled.
// Starting (0/standby -> X) and stopping (X -> 0) are exempt, so they still react immediately.
const MAX_FEED_IN_STEP_W = 100;

// Smoothing factor for the fast, internally calculated moving average of the grid meter value, used as the
// feedback signal for feed-in and charge control - reacts to a genuine trend within a few cycles, but smooths
// out single noisy readings (e.g. a washing machine flipping between -250W and +280W every few seconds).
const SHORT_TERM_GRID_ALPHA = 0.3;

// A genuine load step (e.g. a 2000W heater switching on/off) would take the smoothed home usage many cycles to
// follow. If the current home usage deviates from the smoothed one by more than this (W) in two control cycles
// in a row, in the same direction, the average jumps straight to the current value instead. A load flipping
// back and forth (e.g. a washing machine) never deviates the same way twice in a row, so it stays smoothed.
const HOME_USAGE_STEP_W = 300;

// Much slower moving average of the grid meter value, only used to decide whether to start (or stop) surplus
// charging - a single brief excursion of the fast average must not start a new charge, otherwise the device
// keeps flickering between charging and not charging. Ongoing adjustment of an active charge still uses the
// fast average.
const CHARGE_START_GRID_ALPHA = 0.05;

// Charge limits with a magnitude between 1W and this value can't be driven cleanly by the device (charge
// current too low) - rounded down to 0 instead of sending an ineffective tiny limit.
const CHARGE_DEAD_ZONE_MAX_W = 20;

// Another AC-only device only joins charging once the total charge budget divided by the number of devices
// gives at least this much per device - e.g. at 100W: budget <= 199W -> 1 device, >= 200W -> 2 devices.
const CHARGE_MIN_PER_DEVICE_W = 100;

// Fraction of the currently allocated max power that must be requested before another device is activated.
const UTILIZATION_THRESHOLD = 0.7;

// A challenger device must beat the current lead device's score (see sortAutomationDevices) by more than
// this margin to take over as lead; otherwise the current lead stays in place. Keeps the lead device from
// swapping every hour over a marginal SOC difference (roughly 8 percentage points of SOC, given the 0.6
// SOC weight in getScore()).
const LEAD_HYSTERESIS_MARGIN = 5;

// Fallback for 'adapterAutomation.acOnlyPenalty' (%): the score lead an AC-only device needs over the
// other devices (see sortAutomationDevices) once they average above 35% SOC.
const DEFAULT_AC_ONLY_PENALTY = 50;

// Grid meter surplus charging: once the meter is exporting 'adapterAutomation.surplusChargeTrigger' W
// (this is its fallback) beyond setPoint, there's clearly spare power to charge AC-only devices with.
// SURPLUS_SETPOINT_BUFFER_W keeps a margin below setPoint while that's active, so the meter doesn't
// hover right at the trigger edge and flicker in/out - so the trigger must not be below that buffer.
const DEFAULT_SURPLUS_CHARGE_TRIGGER_W = 100;
const SURPLUS_SETPOINT_BUFFER_W = 30;

// A sole AC-only device that's surplus charging switches straight back to feed-in once the home usage
// (excluding its own charge power) exceeds setPoint by this margin - the margin keeps small fluctuations
// around setPoint from flipping it between charging and feeding in.
const SOLE_DEVICE_FEED_IN_RETURN_W = 50;

interface IPidConfig {
  KP: number;
  KI: number;
  KD: number;
  INTEGRAL_MIN: number;
  INTEGRAL_MAX: number;
}

// Feed-in controller. KD damps fast changes (brakes the controller before it overshoots); kept small since
// even the smoothed grid average still partly follows short load jumps. The integral limits allow a
// correction of up to +-100W (KI * limit), enough to remove a lasting offset of the feed-forward estimate
// (e.g. a device not delivering exactly its limit); windup is prevented by freezing it while the feed-in
// can't move further in the error's direction, and while the error is outside FEED_IN_INTEGRAL_BAND_W (see
// runZeroFeedInAutomation).
const PI_CONTROLLER: IPidConfig = {
  KP: 0.15,
  KI: 0.02,
  KD: 0.05,
  INTEGRAL_MIN: -5000,
  INTEGRAL_MAX: 5000,
};

// Charge controller for the AC-only surplus charge budget. KP is deliberately low: per cycle only a quarter
// of the error is applied on top of the current charge power, so the controller doesn't build up a
// self-reinforcing feedback loop with its own, quickly changeable charge power. KD is a bit larger than for
// feed-in, since the error is based on the already smoothed short-term grid average.
const CHARGE_PI: IPidConfig = {
  KP: 0.25,
  KI: 0.02,
  KD: 0.1,
  INTEGRAL_MIN: -400,
  INTEGRAL_MAX: 400,
};

// Caps how much wall-clock time a single PID calculate() call can inject into the integral term, so a
// first call, or one arriving after a long gap (e.g. automation was sitting in the dead band, or was just
// re-enabled), doesn't apply a large instantaneous windup as if that whole gap had been a sustained error.
// A gap longer than this also drops the derivative term for that call, since the previous error is stale.
const MAX_PI_DT_SECONDS = 10;

// The feed-in integral only builds up while the error is at most this large (W). Large errors (e.g. a load
// step) are covered by the feed-forward of the home usage within a few cycles anyway; integrating them too
// would fill the integral up to its limit during the ramp, and make the feed-in overshoot afterwards.
const FEED_IN_INTEGRAL_BAND_W = 100;

interface IAutomationDeviceState {
  /** Whether this device's own 'adapterAutomation.automationEnabled' switch is on, refreshed once per cycle. */
  enabled: boolean;
  /** Whether this device's 'adapterAutomation.forceAcCharging' switch is on, refreshed once per cycle. */
  forceAcCharging: boolean;
  /**
   * Whether this (non AC-only) device's 'adapterAutomation.acChargingAllowed' switch is on, refreshed once per
   * cycle: it then charges from surplus like an AC-only device (see canSurplusCharge).
   */
  acChargingAllowed: boolean;
  /** Device's 'name' state, refreshed by updateAutomationDeviceMetrics; empty until first read. */
  name: string;
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
  /** Last transition from charging (negative) to not charging (>= 0); undefined = never charged. */
  chargingStoppedMs?: number;
  /** Last transition from feeding in (positive) to not feeding in (<= 0); undefined = never fed in. */
  dischargingStoppedMs?: number;
  /** Direction (-1/0/1) of the last feed-in adjustment, see MAX_FEED_IN_STEP_W. */
  lastFeedInDeltaSign?: number;
  pendingTimeout?: ioBroker.Timeout;
  /**
   * Number of limit commands sent but not yet completed (see sendDeviceLimit). zenSDK devices need several
   * HTTP requests per limit and only update 'control.setDeviceAutomationInOutLimit' once all succeeded, so
   * that state lags behind currentLimit until then.
   */
  limitCommandsInFlight: number;
}

// Runtime automation state per device (keyed by '<productKey>.<deviceKey>'), kept outside ZenIobDevice
// since it's specific to this control loop, not part of the device's own model.
const deviceStates = new Map<string, IAutomationDeviceState>();

let inDeadBand = false;
let lastGridMeterValue: number | undefined;
// Fast / slow moving averages of the grid meter value, see SHORT_TERM_GRID_ALPHA and CHARGE_START_GRID_ALPHA.
let shortTermGridAvgW: number | undefined;
let chargeStartGridAvgW: number | undefined;
// Fast moving average (SHORT_TERM_GRID_ALPHA) of the home usage (grid + own feed-in - own charge power), the
// feed-forward base for feed-in control. Smoothing the home usage rather than the grid value matters: a new
// limit shifts the grid value by the same amount at once, which a lagging grid average would only partly
// reflect - adding the full new feed-in to it overestimates the home usage and makes the limit overshoot.
let shortTermHomeUsageW: number | undefined;
// Direction (-1/1) of a home usage deviation beyond HOME_USAGE_STEP_W in the last control cycle, waiting for
// confirmation by the next one; 0 = none.
let pendingHomeUsageStepSign = 0;
let stabilizedInverterCount = 0;
let stabilizedUntilMs = 0;
// Same as stabilizedInverterCount, but for the number of AC-only devices charging at once - keeps it from
// jumping between 1 and 2 devices when the charge budget hovers around CHARGE_MIN_PER_DEVICE_W.
let stabilizedChargeDeviceCount = 0;
let stabilizedChargeUntilMs = 0;
// Guards against overlapping cycles: runZeroFeedInAutomation does many sequential awaits, so a fast
// series of trigger updates could otherwise start a second cycle before the first one finishes.
let isRunning = false;
// Incremented by stopAdapterAutomation(); a cycle (and the delayed limit commands it schedules) only
// applies its limits while this still matches the value captured at its start, so a cycle that was already
// running when automation got switched off can't override the stop's 0W afterwards.
let automationGeneration = 0;
// Device order established by the last sortAutomationDevices() call; new/unsorted devices are appended.
let deviceOrder: string[] = [];

const deviceId = (device: ZenIobDevice): string => `${device.productKey}.${device.deviceKey}`;

const getDeviceState = (device: ZenIobDevice): IAutomationDeviceState => {
  const id = deviceId(device);
  let state = deviceStates.get(id);
  if (!state) {
    state = {
      enabled: false,
      forceAcCharging: false,
      acChargingAllowed: false,
      name: "",
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
      limitCommandsInFlight: 0,
    };
    deviceStates.set(id, state);
  }
  return state;
};

// Device name for logging (from its 'name' state), falling back to the device model's class name (e.g. 'Sf800').
const deviceLabel = (device: ZenIobDevice): string => getDeviceState(device).name || device.constructor.name;

/**
 * Sends a limit to the device and tracks it as in flight until the device model has finished processing it
 * (see limitCommandsInFlight), so a lagging 'control.setDeviceAutomationInOutLimit' isn't mistaken for drift.
 *
 * @param device the device
 * @param state the device's automation state
 * @param limit the limit to send
 */
const sendDeviceLimit = async (device: ZenIobDevice, state: IAutomationDeviceState, limit: number): Promise<void> => {
  state.limitCommandsInFlight++;
  try {
    // Some device models implement this synchronously, others return a promise.
    await Promise.resolve(device.setDeviceAutomationInOutLimit(limit));
  } finally {
    state.limitCommandsInFlight--;
  }
};

// Whether a limit command for this device is scheduled or still being processed, i.e. its
// 'control.setDeviceAutomationInOutLimit' may not reflect currentLimit yet.
const isLimitCommandPending = (state: IAutomationDeviceState): boolean =>
  state.pendingTimeout !== undefined || state.limitCommandsInFlight > 0;

const clamp = (value: number, min: number, max: number): number => Math.min(Math.max(value, min), max);
const roundShare = (value: number): number => Math.round(value * 100) / 100;

// Smallest non-zero limit magnitude (W) the device accepts, also used as its feed-in standby / charge keep-alive.
const getMinLimit = (device: ZenIobDevice): number =>
  device.isZenSdkSupported ? ZEN_SDK_MIN_LIMIT_W : DEFAULT_MIN_LIMIT_W;

/**
 * Creates a PID controller (P + anti-windup I + D). The integral is scaled by actual elapsed wall-clock
 * time rather than by call count (the trigger fires on external state changes, not a fixed interval); the
 * derivative reacts to the change of the error between two calls, not per time unit.
 *
 * @param config gains and integral limits
 */
const createPidController = (
  config: IPidConfig,
): {
  calculate: (error: number, now: number, canIntegrate?: boolean, integralOnly?: boolean) => number;
  reset: () => void;
} => {
  let integral = 0;
  let previousError: number | undefined;
  let lastUpdateMs: number | undefined;

  // canIntegrate = false freezes the integral (anti-windup), e.g. while the output is already saturated.
  // integralOnly = true returns only the integral term (no P/D) and drops the previous error, e.g. when the
  // feed-forward already jumped to a new load level, so P/D don't correct the same step a second time.
  const calculate = (error: number, now: number, canIntegrate = true, integralOnly = false): number => {
    const elapsedSeconds = lastUpdateMs != null ? (now - lastUpdateMs) / 1000 : undefined;
    const dtSeconds = elapsedSeconds != null ? Math.min(elapsedSeconds, MAX_PI_DT_SECONDS) : 0;
    lastUpdateMs = now;

    const proportional = config.KP * error;

    if (canIntegrate) {
      integral = clamp(integral + error * dtSeconds, config.INTEGRAL_MIN, config.INTEGRAL_MAX);
    }

    if (integralOnly) {
      previousError = undefined;
      return config.KI * integral;
    }

    const derivative =
      previousError != null && elapsedSeconds != null && elapsedSeconds <= MAX_PI_DT_SECONDS
        ? config.KD * (error - previousError)
        : 0;
    previousError = error;

    return proportional + config.KI * integral + derivative;
  };

  const reset = (): void => {
    integral = 0;
    previousError = undefined;
    lastUpdateMs = undefined;
  };

  return { calculate, reset };
};

const feedInPid = createPidController(PI_CONTROLLER);
const chargePid = createPidController(CHARGE_PI);

/**
 * Resets the feed-in and charge PID controllers, e.g. when automation is (re-)enabled or disabled.
 *
 * @param adapter the adapter instance
 */
export const resetAdapterAutomationController = (adapter: ZendureSolarflow): void => {
  feedInPid.reset();
  chargePid.reset();
  // Not updated while automation is off, so it may be long stale - re-seed from the next measurement.
  shortTermHomeUsageW = undefined;
  pendingHomeUsageStepSign = 0;
  adapter.log.debug(`${LOG} PID controllers reset`);
};

// Remembers charge/feed-in stop transitions, used to gate a new charge start (see MIN_IDLE_BEFORE_CHARGE_MS).
const trackLimitTransition = (
  state: IAutomationDeviceState,
  previousLimit: number,
  nextLimit: number,
  now: number,
): void => {
  if (previousLimit < 0 && nextLimit >= 0) {
    state.chargingStoppedMs = now;
  }
  if (previousLimit > 0 && nextLimit <= 0) {
    state.dischargingStoppedMs = now;
  }
};

/**
 * Releases a device that has been sitting unchanged at the given keep-alive limit for MIN_STANDBY_TIME_MS
 * back to a real 0W, directly (not via the regular delayed pipeline, since this check runs independently
 * of the rest of the cycle). Devices at >= 99% SOC with solar input are kept at their keep-alive limit, so
 * they don't curtail their own solar; without solar input there's nothing to export, so they're released too.
 *
 * @param device the device
 * @param state the device's automation state
 * @param keepAliveLimit the keep-alive limit to check for
 * @param now current timestamp
 */
const releaseStaleKeepAlive = (
  device: ZenIobDevice,
  state: IAutomationDeviceState,
  keepAliveLimit: number,
  now: number,
): void => {
  if (
    state.lastChangeMs < MIN_STANDBY_TIME_MS ||
    state.currentLimit !== keepAliveLimit ||
    (state.soc >= 99 && state.solarInputPower > 0)
  ) {
    return;
  }

  trackLimitTransition(state, state.currentLimit, 0, now);
  if (keepAliveLimit > 0) {
    // It has been sitting at its feed-in standby (practically idle) for MIN_STANDBY_TIME_MS already - that
    // counts as the idle time before a new charge, so it may start charging right away instead of waiting
    // another MIN_IDLE_BEFORE_CHARGE_MS (see the charge gate in runZeroFeedInAutomation).
    state.dischargingStoppedMs = undefined;
  }
  state.currentLimit = 0;
  state.newLimit = 0;
  void sendDeviceLimit(device, state, 0);
};

// For an AC-only device without (further) charge budget: if it was just charging, don't drop straight to
// 0W (see MIN_STANDBY_TIME_MS) - back off to the charge keep-alive instead.
const chargeKeepAliveOrZero = (device: ZenIobDevice, state: IAutomationDeviceState): number =>
  state.currentLimit < 0 ? -getMinLimit(device) : 0;

type DeviceTask =
  | "feedIn"
  | "standby"
  | "surplusCharging"
  | "chargeKeepAlive"
  | "forceCharging"
  | "chargeBlocked"
  | "waitingForSurplus"
  | "full"
  | "idle"
  | "disabled";

type StatusLanguage = "en" | "de";

// Texts for '<device>.adapterAutomation.status', in the ioBroker system language (English fallback). Deliberately
// without power values (those are in the device states already), so the text only changes when a task changes.
const DEVICE_TASK_TEXTS: Record<
  StatusLanguage,
  {
    tasks: Record<DeviceTask, string>;
    leadSuffix: string;
    automationDisabled: string;
    waitingForTrigger: string;
  }
> = {
  en: {
    tasks: {
      feedIn: "Feeding in",
      standby: "Standby",
      surplusCharging: "Charging from surplus",
      chargeKeepAlive: "Holding the charge keep-alive",
      forceCharging: "Force charging",
      chargeBlocked: "Waiting before charging may start",
      waitingForSurplus: "Waiting for surplus charging",
      full: "Fully charged, idle",
      idle: "Idle",
      disabled: "Automation disabled for this device",
    },
    leadSuffix: " (lead device)",
    automationDisabled: "Automation disabled globally",
    waitingForTrigger: "Waiting for a change of the automation trigger state",
  },
  de: {
    tasks: {
      feedIn: "Speist ein",
      standby: "Standby",
      surplusCharging: "Lädt aus Überschuss",
      chargeKeepAlive: "Hält den Lade-Keep-Alive",
      forceCharging: "Lädt erzwungen",
      chargeBlocked: "Wartet, bevor das Laden beginnen darf",
      waitingForSurplus: "Wartet auf Überschussladung",
      full: "Voll geladen, inaktiv",
      idle: "Inaktiv",
      disabled: "Automatisierung für dieses Gerät deaktiviert",
    },
    leadSuffix: " (führendes Gerät)",
    automationDisabled: "Automatisierung global deaktiviert",
    waitingForTrigger: "Wartet auf eine Änderung des Auslöser-Datenpunkts",
  },
};

let statusLanguage: StatusLanguage | undefined;
// Last written values, so the states are only written on an actual change (the cycle runs very often).
let lastDeviceOrderText: string | undefined;
const lastDeviceStatusTexts = new Map<string, string>();

const getStatusLanguage = async (adapter: ZendureSolarflow): Promise<StatusLanguage> => {
  if (!statusLanguage) {
    const systemConfig = await adapter.getForeignObjectAsync("system.config");
    statusLanguage = systemConfig?.common?.language === "de" ? "de" : "en";
  }
  return statusLanguage;
};

const publishDeviceOrder = async (adapter: ZendureSolarflow, devices: ZenIobDevice[]): Promise<void> => {
  const text = devices.map((device) => `${deviceLabel(device)} (${device.deviceKey})`).join(" -> ");
  if (text !== lastDeviceOrderText) {
    lastDeviceOrderText = text;
    await adapter.setState("adapterAutomation.deviceOrder", text, true);
  }
};

const publishDeviceStatusText = async (
  adapter: ZendureSolarflow,
  device: ZenIobDevice,
  text: string,
): Promise<void> => {
  const id = deviceId(device);
  if (text !== lastDeviceStatusTexts.get(id)) {
    lastDeviceStatusTexts.set(id, text);
    await adapter.setState(`${id}.adapterAutomation.status`, text, true);
  }
};

const publishDeviceTask = async (
  adapter: ZendureSolarflow,
  device: ZenIobDevice,
  task: DeviceTask,
  isLead: boolean,
): Promise<void> => {
  const texts = DEVICE_TASK_TEXTS[await getStatusLanguage(adapter)];
  await publishDeviceStatusText(adapter, device, `${texts.tasks[task]}${isLead ? texts.leadSuffix : ""}`);
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

const isForceAcCharging = async (adapter: ZendureSolarflow, device: ZenIobDevice): Promise<boolean> => {
  const state = await adapter.getStateAsync(`${deviceId(device)}.adapterAutomation.forceAcCharging`);
  return state?.val === true;
};

// The state only exists for devices that can charge by AC but aren't AC-only (see ZenIobDevice).
const isAcChargingAllowed = async (adapter: ZendureSolarflow, device: ZenIobDevice): Promise<boolean> => {
  if (!device.canChargeByAc || device.isAcOnly) {
    return false;
  }
  const state = await adapter.getStateAsync(`${deviceId(device)}.adapterAutomation.acChargingAllowed`);
  return state?.val === true;
};

// Whether the device may charge from grid surplus: always for AC-only devices, for others only if allowed.
const canSurplusCharge = (device: ZenIobDevice): boolean => device.isAcOnly || getDeviceState(device).acChargingAllowed;

/**
 * Publishes '<device>.adapterAutomation.status' for states the control cycle can't report itself: the cycle
 * only runs when the automation trigger state changes, so without this the status stays empty (or stale
 * after an on/off switch) until the grid meter value changes. Tasks already published by the cycle are kept.
 *
 * @param adapter the adapter instance
 */
export const refreshAutomationStatuses = async (adapter: ZendureSolarflow): Promise<void> => {
  const texts = DEVICE_TASK_TEXTS[await getStatusLanguage(adapter)];
  const nonTaskTexts = [texts.automationDisabled, texts.tasks.disabled, texts.waitingForTrigger];
  const automationEnabled = (await adapter.getStateAsync("adapterAutomation.automationEnabled"))?.val === true;

  for (const device of getAutomationDevices(adapter)) {
    const lastText = lastDeviceStatusTexts.get(deviceId(device));

    if (!automationEnabled) {
      await publishDeviceStatusText(adapter, device, texts.automationDisabled);
    } else if (!(await isDeviceEnabled(adapter, device))) {
      await publishDeviceStatusText(adapter, device, texts.tasks.disabled);
    } else if (lastText === undefined || nonTaskTexts.includes(lastText)) {
      await publishDeviceStatusText(adapter, device, texts.waitingForTrigger);
    }
  }
};

// Cancels a device's pending (delayed) limit command and sets its 'control.setDeviceAutomationInOutLimit'
// to 0 (if it isn't already), so it doesn't keep feeding in or charging at the last automation limit.
const releaseDeviceToZero = async (adapter: ZendureSolarflow, device: ZenIobDevice, reason: string): Promise<void> => {
  const state = getDeviceState(device);

  if (state.pendingTimeout) {
    adapter.clearTimeout(state.pendingTimeout);
    state.pendingTimeout = undefined;
  }

  const currentLimitState = await adapter.getStateAsync(`${deviceId(device)}.control.setDeviceAutomationInOutLimit`);
  const currentLimit = currentLimitState?.val != null ? Number(currentLimitState.val) : 0;

  trackLimitTransition(state, currentLimit, 0, Date.now());
  state.currentLimit = 0;
  state.newLimit = 0;

  if (currentLimit !== 0) {
    adapter.log.info(`${LOG} ${reason}, setting limit of '${deviceLabel(device)}' to 0W`);
    void sendDeviceLimit(device, state, 0);
  }
};

/**
 * Called when the global automation is switched off: releases every automation-enabled device to 0W (see
 * releaseDeviceToZero). Devices with automation disabled are left alone, like in the regular cycle.
 *
 * @param adapter the adapter instance
 */
export const stopAdapterAutomation = async (adapter: ZendureSolarflow): Promise<void> => {
  automationGeneration++;
  // Forget the last trigger value, so the first trigger after re-enabling isn't skipped as a duplicate.
  lastGridMeterValue = undefined;

  for (const device of getAutomationDevices(adapter)) {
    if (!(await isDeviceEnabled(adapter, device))) {
      continue;
    }

    await releaseDeviceToZero(adapter, device, "Automation disabled globally");
  }
};

/**
 * Called when a single device's '<device>.adapterAutomation.automationEnabled' is switched off: releases
 * that device to 0W (see releaseDeviceToZero). The regular cycle leaves it alone from then on.
 *
 * @param adapter the adapter instance
 * @param device the device automation was disabled for
 */
export const stopDeviceAutomation = async (adapter: ZendureSolarflow, device: ZenIobDevice): Promise<void> => {
  if (!getAutomationDevices(adapter).includes(device)) {
    return;
  }

  // Mark it disabled right away, so a cycle that's already running doesn't send it a new limit.
  getDeviceState(device).enabled = false;

  await releaseDeviceToZero(adapter, device, "Automation disabled for this device");
};

/**
 * Sorts the automation devices by a weighted score (mostly SOC, a little solar input), so the fullest /
 * most productive device is preferred as the lead device. AC-only devices (no solar input of their own)
 * need a score lead of 'adapterAutomation.acOnlyPenalty' percent (default 50%) once the other devices
 * average above 35% SOC, so they aren't preferred just because they happened to be charged fully from
 * the grid.
 *
 * The current lead device keeps that position unless a challenger beats its score by more than
 * LEAD_HYSTERESIS_MARGIN, so the lead doesn't swap on every re-sort over a marginal SOC difference.
 *
 * @param adapter the adapter instance
 */
export const sortAutomationDevices = async (adapter: ZendureSolarflow): Promise<void> => {
  const devices = getAutomationDevices(adapter);

  const acOnlyPenaltyState = await adapter.getStateAsync("adapterAutomation.acOnlyPenalty");
  const acOnlyPenalty =
    typeof acOnlyPenaltyState?.val === "number" && acOnlyPenaltyState.val >= 0
      ? acOnlyPenaltyState.val
      : DEFAULT_AC_ONLY_PENALTY;
  const acOnlyPenaltyFactor = 1 + acOnlyPenalty / 100;

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

  const getEffectiveScore = (device: ZenIobDevice): number => {
    const score = getScore(device);
    return applyAcOnlyPenalty && device.isAcOnly ? score / acOnlyPenaltyFactor : score;
  };

  const sorted = [...devices].sort((a, b) => getEffectiveScore(b) - getEffectiveScore(a));

  const currentLead = devices.find((device) => deviceId(device) === deviceOrder[0]);

  if (currentLead && sorted[0] !== currentLead) {
    const challengerLead = sorted[0];

    if (getEffectiveScore(challengerLead) - getEffectiveScore(currentLead) < LEAD_HYSTERESIS_MARGIN) {
      // Challenger isn't clearly ahead - keep the current lead in place to avoid flapping.
      sorted.splice(sorted.indexOf(currentLead), 1);
      sorted.unshift(currentLead);
    }
  }

  deviceOrder = sorted.map((device) => deviceId(device));
  await publishDeviceOrder(adapter, sorted);

  adapter.log.debug(
    `${LOG} New device order: ${sorted.map((device) => `${deviceLabel(device)} ${device.deviceKey} (${getScore(device).toFixed(2)})`).join(" -> ")}`,
  );
};

/**
 * Refreshes each device's cached name, SOC, minSoc, solar input and max output limit. Intended to be called
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

    const nameState = await adapter.getStateAsync(`${id}.name`);
    state.name = nameState?.val != null ? String(nameState.val) : "";

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
    await sortAutomationDevices(adapter);
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
    if (isLimitCommandPending(state)) {
      // The control state is only updated once the device has processed the command - not drifted, just lagging.
      continue;
    }

    const currentLimitState = await adapter.getStateAsync(`${deviceId(device)}.control.setDeviceAutomationInOutLimit`);
    const currentLimit = currentLimitState?.val != null ? Number(currentLimitState.val) : 0;

    // Re-check: a command may have been sent while awaiting the state above.
    if (!isLimitCommandPending(state) && state.currentLimit != currentLimit) {
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
 * Distributes a charge budget across the given devices proportional to (100 - soc)^EXPONENT - the inverse of
 * setDeviceShares: the device with the LOWEST SOC gets the biggest share, so it catches up faster.
 *
 * @param devices devices sharing the charge budget
 * @returns share (0..1) per device id
 */
const getChargeShares = (devices: ZenIobDevice[]): Map<string, number> => {
  const weight = (device: ZenIobDevice): number => Math.pow(100 - getDeviceState(device).soc, EXPONENT);
  const weightedSum = devices.reduce((sum, device) => sum + weight(device), 0);

  return new Map(
    devices.map((device) => [deviceId(device), weightedSum > 0 ? roundShare(weight(device) / weightedSum) : 0]),
  );
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
 * Forecast-based setpoint adjustments and the externally maintained rolling averages (solar/grid) from the
 * original script have no equivalent here (yet) and were dropped; the current instantaneous solar input is
 * used instead, and the grid meter value is smoothed by internal moving averages (see SHORT_TERM_GRID_ALPHA
 * and CHARGE_START_GRID_ALPHA).
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
  const generation = automationGeneration;

  try {
    const automationEnabled = (await adapter.getStateAsync("adapterAutomation.automationEnabled"))?.val === true;
    if (!automationEnabled) {
      const text = DEVICE_TASK_TEXTS[await getStatusLanguage(adapter)].automationDisabled;
      for (const device of getAutomationDevices(adapter)) {
        await publishDeviceStatusText(adapter, device, text);
      }
      return;
    }

    lastGridMeterValue = currentGridMeterValue;

    const devices = getOrderedAutomationDevices(adapter);
    // Devices discovered after the last sort (e.g. via mDNS) are appended here, so keep the order state in sync.
    await publishDeviceOrder(adapter, devices);
    if (devices.length === 0) {
      return;
    }

    const now = Date.now();

    // Refresh enabled status, solar input and current limit for every device; release stale keep-alive
    // limits of enabled devices to 0 (the lead device only from feed-in standby to 0 if it may charge from surplus).
    for (const [index, device] of devices.entries()) {
      const id = deviceId(device);
      const state = getDeviceState(device);

      state.enabled = await isDeviceEnabled(adapter, device);
      state.forceAcCharging = await isForceAcCharging(adapter, device);
      state.acChargingAllowed = await isAcChargingAllowed(adapter, device);

      const solarInputPowerState = await adapter.getStateAsync(`${id}.solarInputPower`);
      state.solarInputPower = solarInputPowerState?.val != null ? Number(solarInputPowerState.val) : 0;

      const currentLimitState = await adapter.getStateAsync(`${id}.control.setDeviceAutomationInOutLimit`);
      state.lastChangeMs = currentLimitState?.lc ? now - currentLimitState.lc : Number.MAX_SAFE_INTEGER;

      // While a limit command is still being processed, the control state lags behind - keep the cached limit.
      if (state.limitCommandsInFlight === 0) {
        const freshLimit = currentLimitState?.val != null ? Number(currentLimitState.val) : 0;
        trackLimitTransition(state, state.currentLimit, freshLimit, now);
        state.currentLimit = freshLimit;
      }

      if (state.enabled) {
        // The lead device is normally kept at its feed-in standby - except devices that may charge from surplus
        // (AC-only, or 'adapterAutomation.acChargingAllowed'): they have to get down to 0W eventually,
        // otherwise they could never be released for surplus charging.
        if (index !== 0 || canSurplusCharge(device)) {
          releaseStaleKeepAlive(device, state, getMinLimit(device), now);
        }
        releaseStaleKeepAlive(device, state, -getMinLimit(device), now);
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

    // Only devices under automation control count here: a device with automation disabled may be controlled
    // manually, and its power is already part of the grid meter value - counting its limit as own feed-in
    // would add it to the home usage, so the automated devices would cover that power a second time.
    const enabledDevices = devices.filter((device) => getDeviceState(device).enabled);
    const currentFeedIn = enabledDevices.reduce(
      (sum, device) => sum + Math.max(getDeviceState(device).currentLimit, 0),
      0,
    );
    // Power currently being charged from AC (all enabled devices) - subtracted from the home usage below, so
    // the feed-in controller doesn't mistake the devices' own charging for home consumption and feed in even
    // more to cover it (which would then let the charge power rise further, without any real limit).
    const currentTotalChargePowerAll = enabledDevices.reduce(
      (sum, device) => sum + Math.max(0, -getDeviceState(device).currentLimit),
      0,
    );
    const maxFeedIn = enabledDevices.reduce((sum, device) => sum + getDeviceState(device).maxLimit, 0);
    const solarInput = devices.reduce((sum, device) => sum + getDeviceState(device).solarInputPower, 0);
    const fleetMinSoc = Math.min(...devices.map((device) => getDeviceState(device).soc));

    const setPointState = await adapter.getStateAsync("adapterAutomation.setPoint");
    const setPointNearlyFullState = await adapter.getStateAsync("adapterAutomation.setPointNearlyFull");
    const baseSetPoint = setPointState?.val != null ? Number(setPointState.val) : 10;
    const setPointNearlyFull = setPointNearlyFullState?.val != null ? Number(setPointNearlyFullState.val) : -100;

    const setPoint = fleetMinSoc >= NEARLY_FULL_SOC && solarInput > 50 ? setPointNearlyFull : baseSetPoint;

    shortTermGridAvgW =
      shortTermGridAvgW == null
        ? currentGridMeterValue
        : shortTermGridAvgW + SHORT_TERM_GRID_ALPHA * (currentGridMeterValue - shortTermGridAvgW);
    chargeStartGridAvgW =
      chargeStartGridAvgW == null
        ? currentGridMeterValue
        : chargeStartGridAvgW + CHARGE_START_GRID_ALPHA * (currentGridMeterValue - chargeStartGridAvgW);

    // Sustained grid export beyond setPoint: clear surplus power that AC-only devices could charge with.
    // Based on the slow average, so a new charge only starts on a confirmed surplus, not on a brief dip.
    const surplusChargeTriggerState = await adapter.getStateAsync("adapterAutomation.surplusChargeTrigger");
    const surplusChargeTrigger =
      typeof surplusChargeTriggerState?.val === "number"
        ? Math.max(surplusChargeTriggerState.val, SURPLUS_SETPOINT_BUFFER_W)
        : DEFAULT_SURPLUS_CHARGE_TRIGGER_W;
    const hasGridSurplus = chargeStartGridAvgW <= setPoint - surplusChargeTrigger;
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

    // Based on the short-term home usage average rather than the raw meter value, so strongly fluctuating loads
    // don't produce a new, strongly fluctuating limit on every trigger while the actual trend barely changes.
    // Only updated here, i.e. not while a device is waking up or settling (see above): the grid value doesn't
    // reflect the commanded limit yet then, so it would wrongly count that limit as extra home usage.
    const rawHomeUsage = currentGridMeterValue + currentFeedIn - currentTotalChargePowerAll;
    // Confirmed load step (see HOME_USAGE_STEP_W): jump to the current home usage instead of smoothing.
    let isHomeUsageStep = false;
    if (shortTermHomeUsageW == null) {
      shortTermHomeUsageW = rawHomeUsage;
      pendingHomeUsageStepSign = 0;
    } else {
      const deviation = rawHomeUsage - shortTermHomeUsageW;
      const deviationSign = Math.abs(deviation) > HOME_USAGE_STEP_W ? Math.sign(deviation) : 0;
      isHomeUsageStep = deviationSign !== 0 && deviationSign === pendingHomeUsageStepSign;

      if (isHomeUsageStep) {
        shortTermHomeUsageW = rawHomeUsage;
        pendingHomeUsageStepSign = 0;
      } else {
        shortTermHomeUsageW += SHORT_TERM_GRID_ALPHA * deviation;
        pendingHomeUsageStepSign = deviationSign;
      }
    }
    const currentHomeUsage = shortTermHomeUsageW;

    // Grid value expected from the smoothed home usage and the current limits - unlike shortTermGridAvgW,
    // it follows a limit change immediately, so the PI controller doesn't keep pushing in the same direction.
    const expectedGridW = currentHomeUsage - currentFeedIn + currentTotalChargePowerAll;
    const setPointDiff = expectedGridW - deadBandTarget;
    // Anti-windup: don't build up the integral while the feed-in can't follow anyway - importing with all
    // devices already at their maximum, or exporting with nothing feeding in (e.g. solar surplus) - or while
    // the error is large (see FEED_IN_INTEGRAL_BAND_W).
    const isFeedInSaturated =
      (setPointDiff > 0 && currentFeedIn >= maxFeedIn) || (setPointDiff < 0 && currentFeedIn <= 0);
    const piCorrection = feedInPid.calculate(
      setPointDiff,
      now,
      !isFeedInSaturated && Math.abs(setPointDiff) <= FEED_IN_INTEGRAL_BAND_W,
      // After a step jump the feed-forward already covers the whole new load - P/D on top would count it twice.
      isHomeUsageStep,
    );

    adapter.log.debug(
      `${LOG} Feed-in: grid=${currentGridMeterValue} rawHomeUsage=${rawHomeUsage.toFixed(1)} homeUsageAvg=${currentHomeUsage.toFixed(1)} ` +
        `step=${isHomeUsageStep} currentFeedIn=${currentFeedIn} expectedGrid=${expectedGridW.toFixed(1)} piCorrection=${piCorrection.toFixed(1)}`,
    );

    let piAdjustedHomeUsage = currentHomeUsage + piCorrection;

    // An AC-only device that isn't feeding in is released from feed-in duty (even as lead device) while
    // there's a confirmed surplus, or while it's actively charging (beyond its charge keep-alive) - otherwise
    // e.g. a single AC-only device would always be the lead feed-in device and never charge from surplus.
    // Once its charge has wound down to the keep-alive and no surplus is left, it rejoins feed-in selection.
    // If it's the only enabled device, nothing else can cover the home while it charges - so it rejoins
    // immediately once there's real home demand (excluding its own charge power), taking precedence over the
    // lagging slow surplus average.
    const isSoleEnabledDevice = enabledDevices.length === 1;
    const hasHomeDemand = currentHomeUsage > setPoint + SOLE_DEVICE_FEED_IN_RETURN_W;

    const isReleasedForSurplusCharging = (device: ZenIobDevice): boolean => {
      const state = getDeviceState(device);
      return (
        state.enabled &&
        !state.forceAcCharging &&
        canSurplusCharge(device) &&
        state.soc < 100 &&
        state.currentLimit <= 0 &&
        !(isSoleEnabledDevice && hasHomeDemand) &&
        (hasGridSurplus || state.currentLimit < -getMinLimit(device))
      );
    };

    const inputDevices: ZenIobDevice[] = [];
    const otherDevices: ZenIobDevice[] = [];
    let currentAllocatedMaxPower = 0;

    for (const [index, device] of devices.entries()) {
      const state = getDeviceState(device);

      if (isReleasedForSurplusCharging(device)) {
        otherDevices.push(device);
        continue;
      }

      const utilization = currentAllocatedMaxPower > 0 ? piAdjustedHomeUsage / currentAllocatedMaxPower : 1;

      const isLead = index === 0;
      const isFullAndCapable = state.soc >= 95 && !device.isAcOnly;

      if (state.enabled && (isLead || isFullAndCapable)) {
        inputDevices.push(device);
        currentAllocatedMaxPower += state.maxLimit;
      } else if (
        state.enabled &&
        // AC-only devices may step in too, as a last resort once the active feed-in devices are well utilized.
        (piAdjustedHomeUsage > maxFeedIn || utilization >= UTILIZATION_THRESHOLD)
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
      const candidates = otherDevices
        .filter(
          (device) =>
            getDeviceState(device).enabled &&
            !getDeviceState(device).forceAcCharging &&
            !isReleasedForSurplusCharging(device),
        )
        .slice(0, needed);

      candidates.forEach((device) => {
        otherDevices.splice(otherDevices.indexOf(device), 1);
        inputDevices.push(device);
        currentAllocatedMaxPower += getDeviceState(device).maxLimit;
      });
    } else {
      stabilizedInverterCount = inputDevices.length;
    }

    // Devices with 'adapterAutomation.forceAcCharging' set should charge at their full chargeMaxLimit
    // regardless of the fleet's feed-in needs - pull them out of the feed-in group entirely, they're
    // handled together with the other non-feed-in devices below.
    inputDevices
      .filter((device) => getDeviceState(device).forceAcCharging)
      .forEach((device) => {
        inputDevices.splice(inputDevices.indexOf(device), 1);
        otherDevices.push(device);
      });

    setDeviceShares(inputDevices);

    // Total power that couldn't be assigned to a device because it exceeded that device's maxLimit; needs
    // to be redistributed to devices that still have headroom.
    let unmetDemand = 0;

    // AC-only devices that may opportunistically charge from surplus this cycle (forced chargers are
    // handled separately below).
    const isSurplusChargeCandidate = (device: ZenIobDevice): boolean => {
      const state = getDeviceState(device);
      return state.enabled && !state.forceAcCharging && canSurplusCharge(device);
    };
    // A device still feeding in (e.g. at its feed-in standby) can't start charging right away anyway (see the
    // charge gate below), so it gets no share of the charge budget - that goes to devices that can use it.
    const chargeEligibleDevices = otherDevices.filter(
      (device) =>
        isSurplusChargeCandidate(device) &&
        getDeviceState(device).soc < 100 &&
        getDeviceState(device).currentLimit <= 0,
    );

    // Charge power the surplus charging devices are currently drawing - base for the PID adjustment below.
    const currentTotalChargePower = otherDevices
      .filter(isSurplusChargeCandidate)
      .reduce((sum, device) => sum + Math.max(0, -getDeviceState(device).currentLimit), 0);

    const chargeError = surplusSetPoint - shortTermGridAvgW;

    // Total charge budget for the whole GROUP (not per device): PID-controlled based on the measured,
    // smoothed surplus - or, if no surplus is confirmed yet and nothing is charging, a rough estimate from
    // the solar input. hasGridSurplus deliberately uses a stricter threshold than surplusSetPoint, so a new
    // charge only starts on a clear surplus, while an ongoing charge is smoothly regulated towards
    // surplusSetPoint (winding down to 0 by itself over a few cycles) instead of jumping hard to 0.
    let chargeBudgetTotal = 0;
    if (hasGridSurplus || currentTotalChargePower > 0) {
      chargeBudgetTotal = Math.max(0, currentTotalChargePower + chargePid.calculate(chargeError, now));
    }

    // The LAST device in the device order is picked for charging first - stable, since the order only
    // changes on re-sort.
    const orderedChargeEligible = [...chargeEligibleDevices].sort((a, b) => devices.indexOf(b) - devices.indexOf(a));

    const rawChargeDeviceCount =
      chargeBudgetTotal > 0
        ? Math.min(orderedChargeEligible.length, Math.max(1, Math.floor(chargeBudgetTotal / CHARGE_MIN_PER_DEVICE_W)))
        : 0;

    // Hold the number of charging devices for a while once it grows (like stabilizedInverterCount). A budget
    // of 0 (no charging wanted anymore) always applies immediately, bypassing the hold.
    let activeChargeDeviceCount: number;
    if (rawChargeDeviceCount === 0) {
      stabilizedChargeDeviceCount = 0;
      activeChargeDeviceCount = 0;
    } else if (rawChargeDeviceCount > stabilizedChargeDeviceCount) {
      stabilizedChargeDeviceCount = rawChargeDeviceCount;
      stabilizedChargeUntilMs = now + INVERTER_MIN_HOLD_MS;
      activeChargeDeviceCount = rawChargeDeviceCount;
    } else if (rawChargeDeviceCount < stabilizedChargeDeviceCount && now < stabilizedChargeUntilMs) {
      activeChargeDeviceCount = Math.min(orderedChargeEligible.length, stabilizedChargeDeviceCount);
    } else {
      stabilizedChargeDeviceCount = rawChargeDeviceCount;
      activeChargeDeviceCount = rawChargeDeviceCount;
    }

    const activeChargeDevices = orderedChargeEligible.slice(0, activeChargeDeviceCount);
    const chargeShares = getChargeShares(activeChargeDevices);

    if (chargeEligibleDevices.length > 0) {
      adapter.log.debug(
        `${LOG} AC charge: chargeStartGridAvgW=${chargeStartGridAvgW.toFixed(1)} shortTermGridAvgW=${shortTermGridAvgW.toFixed(1)} ` +
          `hasGridSurplus=${hasGridSurplus} currentTotalChargePower=${currentTotalChargePower} chargeError=${chargeError.toFixed(1)} ` +
          `chargeBudgetTotal=${chargeBudgetTotal.toFixed(1)} activeChargeDevices=${
            activeChargeDevices
              .map((device) => `${deviceLabel(device)}:${chargeShares.get(deviceId(device))}`)
              .join(",") || "-"
          }`,
      );
    }

    // Devices not currently needed for the main feed-in target: idle at 0W (or feed-in standby), or, for
    // AC-only devices, charge their share of the surplus charge budget.
    // Devices with automation disabled are left alone entirely (no command sent at all).
    for (const device of otherDevices) {
      const state = getDeviceState(device);

      if (!state.enabled) {
        continue;
      }

      if (state.forceAcCharging && state.soc < 100) {
        // Manual override: charge at the device's full chargeMaxLimit, ignoring solar surplus/SOC heuristics.
        state.newLimit = -state.chargeMaxLimit;
      } else if (canSurplusCharge(device) && state.soc < 100) {
        const share = chargeShares.get(deviceId(device));
        let perDeviceBudget = share != null ? Math.round(Math.min(chargeBudgetTotal * share, state.chargeMaxLimit)) : 0;

        // Also below the device's own minimum limit, which it can't be set to anyway.
        if (perDeviceBudget <= CHARGE_DEAD_ZONE_MAX_W || perDeviceBudget < getMinLimit(device)) {
          perDeviceBudget = 0;
        }

        if (perDeviceBudget > 0) {
          state.newLimit = -perDeviceBudget;
        } else if (state.currentLimit >= getMinLimit(device)) {
          // Was feeding in: back off to its feed-in standby like any other device, not straight to 0W - it
          // reacts faster once needed again, and is released to 0W later (see releaseStaleKeepAlive).
          state.newLimit = getMinLimit(device);
          piAdjustedHomeUsage -= getMinLimit(device);
        } else {
          // No (further) budget for this device: end charging explicitly (via the charge keep-alive)
          // rather than leaving a possibly still running old limit in place.
          state.newLimit = chargeKeepAliveOrZero(device, state);
        }
      } else if (state.currentLimit >= getMinLimit(device)) {
        // Keep the device at its feed-in standby rather than a full stop - it reacts faster once needed again.
        state.newLimit = getMinLimit(device);
        piAdjustedHomeUsage -= getMinLimit(device);
      } else {
        state.newLimit = 0;
      }
    }

    // Assign each input device its share of the required power, prioritizing fully charged devices so
    // they at least export their own solar input instead of curtailing it.
    inputDevices.forEach((device) => {
      const state = getDeviceState(device);
      state.isAtCapacity = false;

      // Anything below the device's minimum limit can't be set: floor it to that minimum (feed-in standby).
      // A device that just rejoined feed-in from charging gets its charge keep-alive instead (AC-only devices,
      // and other devices that charge from surplus via 'adapterAutomation.acChargingAllowed'). An AC-only or
      // non-lead device that isn't feeding in yet stays at 0W, so a tiny share doesn't pull it out of idle -
      // only the lead device is kept at its feed-in standby.
      const minLimit = getMinLimit(device);
      let baseLimit = minLimit;
      if ((device.isAcOnly || state.acChargingAllowed) && state.currentLimit < 0) {
        baseLimit = chargeKeepAliveOrZero(device, state);
      } else if ((device.isAcOnly || device !== devices[0]) && state.currentLimit < minLimit) {
        baseLimit = 0;
      }

      if (state.maxLimit <= 0 || !state.share) {
        // No share (e.g. below minSoc, or no output headroom): without this, newLimit would still hold the value
        // from the previous cycle and be sent again unchanged, although this cycle never assigned it. Park the
        // device at its base limit instead, so its limit is always the result of the current calculation.
        state.newLimit = baseLimit;
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

      state.newLimit = state.newLimit < minLimit ? baseLimit : state.newLimit;

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
            const minNewLimit = state.soc === 99 && solarInput > 40 ? 100 : getMinLimit(device);
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

    // The shares above split piAdjustedHomeUsage, but flooring a small share up to the device's minimum limit
    // (or parking a device without share at its feed-in standby) adds power nobody accounted for: e.g. a
    // required 243W with shares 0.9/0.1 gives 218W + 24W, the 24W is floored to 30W, so the group feeds in
    // 248W. With one device always at standby this is a constant offset of up to its minimum limit, which the
    // PI controller would have to remove first. Take that excess off the devices above their minimum instead,
    // proportional to their headroom above it, so the sum of all limits matches the required power.
    // Fully charged devices exporting their own solar are left alone - that surplus is intended (see above).
    inputDevices.forEach((device) => {
      // Cap at maxLimit first (the final clamp below does the same anyway), so a device asked for more than it
      // can deliver doesn't inflate the excess with power it will never feed in.
      const state = getDeviceState(device);
      state.newLimit = Math.min(state.newLimit, state.maxLimit);
    });
    const assignedFeedIn = inputDevices.reduce((sum, device) => sum + Math.max(getDeviceState(device).newLimit, 0), 0);
    const excessFeedIn = assignedFeedIn - Math.max(piAdjustedHomeUsage, 0);

    if (excessFeedIn > 0) {
      const reducibleDevices = inputDevices.filter((device) => {
        const state = getDeviceState(device);
        return !fullSocDevices.includes(device) && state.newLimit > getMinLimit(device);
      });
      const totalHeadroom = reducibleDevices.reduce(
        (sum, device) => sum + getDeviceState(device).newLimit - getMinLimit(device),
        0,
      );

      if (totalHeadroom > 0) {
        // Never below a device's minimum limit: if the headroom isn't enough, the remaining excess stays.
        const reductionFactor = Math.min(1, excessFeedIn / totalHeadroom);
        reducibleDevices.forEach((device) => {
          const state = getDeviceState(device);
          state.newLimit -= (state.newLimit - getMinLimit(device)) * reductionFactor;
        });
      }
    }

    // Final per-device limits of the feed-in group, to check the allocation against the 'Feed-in:' line above.
    adapter.log.debug(
      `${LOG} Allocation: piAdjustedHomeUsage=${piAdjustedHomeUsage.toFixed(1)} excessFeedIn=${excessFeedIn.toFixed(1)} ` +
        `inputDevices=${
          inputDevices
            .map((device) => `${deviceLabel(device)}:${Math.round(getDeviceState(device).newLimit)}`)
            .join(",") || "-"
        }`,
    );

    // If a device is (or is about to start) ramping up from standby, keep other feed-in standby limits in sync
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

    // Human-readable task per device for '<device>.adapterAutomation.status'. The lead device is only flagged
    // as such while it's actually part of the feed-in group (not while released for surplus charging).
    const leadDevice = inputDevices.includes(devices[0]) ? devices[0] : undefined;

    const getDeviceTask = (
      device: ZenIobDevice,
      state: IAutomationDeviceState,
      isChargeBlocked: boolean,
    ): DeviceTask => {
      const minLimit = getMinLimit(device);

      if (isChargeBlocked) {
        return "chargeBlocked";
      }
      if (state.newLimit > 0) {
        return state.newLimit === minLimit ? "standby" : "feedIn";
      }
      if (state.newLimit < 0) {
        if (state.forceAcCharging) {
          return "forceCharging";
        }
        return state.newLimit === -minLimit ? "chargeKeepAlive" : "surplusCharging";
      }
      if (state.soc >= 100) {
        return "full";
      }
      if (canSurplusCharge(device) && !state.forceAcCharging && otherDevices.includes(device)) {
        return "waitingForSurplus";
      }
      return "idle";
    };

    for (const device of devices) {
      const id = deviceId(device);
      const state = getDeviceState(device);

      if (!state.enabled) {
        // Automation is disabled for this device - leave it alone entirely (no command sent), rather
        // than forcing it to a specific limit.
        await publishDeviceTask(adapter, device, "disabled", false);
        continue;
      }

      let isChargeBlocked = false;

      state.newLimit = Math.round(clamp(state.newLimit, -state.chargeMaxLimit, state.maxLimit));

      // Feed-in rate limit (see MAX_FEED_IN_STEP_W) - only for ongoing adjustment of a device that's already
      // feeding in (above its standby), and only when reversing direction; start/stop/standby are left untouched.
      const minLimit = getMinLimit(device);
      if (state.newLimit > 0 && state.currentLimit > minLimit && state.newLimit !== minLimit) {
        const previousLimit = state.currentLimit;
        const proposedSign = Math.sign(state.newLimit - previousLimit);
        const isReversal =
          state.lastFeedInDeltaSign != null &&
          state.lastFeedInDeltaSign !== 0 &&
          proposedSign !== 0 &&
          proposedSign !== state.lastFeedInDeltaSign;

        if (isReversal) {
          state.newLimit = clamp(
            state.newLimit,
            previousLimit - MAX_FEED_IN_STEP_W,
            previousLimit + MAX_FEED_IN_STEP_W,
          );
        }

        state.lastFeedInDeltaSign = Math.sign(state.newLimit - previousLimit);
      }

      // Gate only a NEW charge start (device isn't charging yet); an ongoing charge may adjust its power
      // without waiting again. Covers both charging -> charging and feeding in -> charging, so a device
      // can't jump from feeding in via 0 into charging within seconds (e.g. after a sudden load drop).
      if (state.newLimit < 0 && state.currentLimit >= 0) {
        const msSinceChargingStopped =
          state.chargingStoppedMs != null ? now - state.chargingStoppedMs : Number.MAX_SAFE_INTEGER;
        const msSinceDischargingStopped =
          state.dischargingStoppedMs != null ? now - state.dischargingStoppedMs : Number.MAX_SAFE_INTEGER;
        const msSinceIdle = Math.min(msSinceChargingStopped, msSinceDischargingStopped);

        if (state.currentLimit > 0 || msSinceIdle < MIN_IDLE_BEFORE_CHARGE_MS) {
          // Still feeding in, or only just stopped charging/feeding in - hold at 0W instead of flipping
          // straight into charging.
          adapter.log.debug(
            `${LOG} '${deviceLabel(device)}' charge requested (${state.newLimit}W) but blocked: currentLimit=${state.currentLimit} ` +
              `msSinceChargingStopped=${msSinceChargingStopped} msSinceDischargingStopped=${msSinceDischargingStopped}`,
          );
          state.newLimit = 0;
          isChargeBlocked = true;
        }
      }

      await publishDeviceTask(adapter, device, getDeviceTask(device, state, isChargeBlocked), device === leadDevice);

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

      const standbyDelayMs = state.newLimit === minLimit ? Math.max(settleDelayMs, globalWakingDelayMs) : settleDelayMs;

      if (generation !== automationGeneration) {
        // Automation was switched off while this cycle was running - don't override the stop's 0W.
        return;
      }
      if (!state.enabled) {
        // Automation was disabled for this device while this cycle was running.
        continue;
      }

      if (state.pendingTimeout) {
        adapter.clearTimeout(state.pendingTimeout);
      }

      const newLimit = state.newLimit;
      state.pendingTimeout = adapter.setTimeout(() => {
        state.pendingTimeout = undefined;

        // Automation was switched off (globally or for this device) since this command was scheduled.
        if (generation !== automationGeneration || !state.enabled) {
          return;
        }

        const wasZero = state.currentLimit === 0;
        trackLimitTransition(state, state.currentLimit, newLimit, Date.now());
        state.currentLimit = newLimit;
        void sendDeviceLimit(device, state, newLimit);

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
