"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var adapterAutomation_exports = {};
__export(adapterAutomation_exports, {
  checkAutomationCurrentLimit: () => checkAutomationCurrentLimit,
  resetAdapterAutomationController: () => resetAdapterAutomationController,
  runZeroFeedInAutomation: () => runZeroFeedInAutomation,
  sortAutomationDevices: () => sortAutomationDevices,
  updateAutomationDeviceMetrics: () => updateAutomationDeviceMetrics
});
module.exports = __toCommonJS(adapterAutomation_exports);
const LOG = "[adapterAutomation]";
const EXPONENT = 1.8;
const INVERTER_MIN_HOLD_MS = 5 * 60 * 1e3;
const NEARLY_FULL_SOC = 90;
const AUTO_MODEL_SETTLE_MS = 7e3;
const WAKE_UP_MS = 9e3;
const RECENT_CHANGE_SKIP_MS = 3e3;
const MIN_STANDBY_TIME_MS = 3 * 60 * 1e3;
const MIN_IDLE_BEFORE_CHARGE_MS = 5 * 60 * 1e3;
const UTILIZATION_THRESHOLD = 0.7;
const LEAD_HYSTERESIS_MARGIN = 5;
const SURPLUS_TRIGGER_BELOW_SETPOINT_W = 60;
const SURPLUS_SETPOINT_BUFFER_W = 30;
const PI_CONTROLLER = {
  KP: 0.15,
  KI: 0.02,
  INTEGRAL_MIN: -200,
  INTEGRAL_MAX: 200
};
const MAX_PI_DT_SECONDS = 10;
const deviceStates = /* @__PURE__ */ new Map();
let piIntegral = 0;
let lastPiUpdateMs;
let inDeadBand = false;
let lastGridMeterValue;
let stabilizedInverterCount = 0;
let stabilizedUntilMs = 0;
let isRunning = false;
let deviceOrder = [];
const deviceId = (device) => `${device.productKey}.${device.deviceKey}`;
const getDeviceState = (device) => {
  const id = deviceId(device);
  let state = deviceStates.get(id);
  if (!state) {
    state = {
      enabled: false,
      forceAcCharging: false,
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
      wakingUntilMs: 0
    };
    deviceStates.set(id, state);
  }
  return state;
};
const deviceLabel = (device) => getDeviceState(device).name || device.constructor.name;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const roundShare = (value) => Math.round(value * 100) / 100;
const calculatePIOutput = (setPointDiff, now) => {
  const dtSeconds = lastPiUpdateMs != null ? Math.min((now - lastPiUpdateMs) / 1e3, MAX_PI_DT_SECONDS) : 0;
  lastPiUpdateMs = now;
  const proportional = PI_CONTROLLER.KP * setPointDiff;
  piIntegral = clamp(piIntegral + setPointDiff * dtSeconds, PI_CONTROLLER.INTEGRAL_MIN, PI_CONTROLLER.INTEGRAL_MAX);
  const integral = PI_CONTROLLER.KI * piIntegral;
  return proportional + integral;
};
const resetAdapterAutomationController = (adapter) => {
  piIntegral = 0;
  lastPiUpdateMs = void 0;
  adapter.log.debug(`${LOG} PI controller integral reset`);
};
const getAutomationDevices = (adapter) => adapter.zenIobDeviceList.filter((device) => device.hasPackData && device.controlStates.length > 0);
const getOrderedAutomationDevices = (adapter) => {
  const devices = getAutomationDevices(adapter);
  const byId = new Map(devices.map((device) => [deviceId(device), device]));
  const ordered = deviceOrder.map((id) => byId.get(id)).filter((device) => device != null);
  devices.forEach((device) => {
    if (!ordered.includes(device)) {
      ordered.push(device);
    }
  });
  return ordered;
};
const isDeviceEnabled = async (adapter, device) => {
  const state = await adapter.getStateAsync(`${deviceId(device)}.adapterAutomation.automationEnabled`);
  return (state == null ? void 0 : state.val) === true;
};
const isForceAcCharging = async (adapter, device) => {
  const state = await adapter.getStateAsync(`${deviceId(device)}.adapterAutomation.forceAcCharging`);
  return (state == null ? void 0 : state.val) === true;
};
const sortAutomationDevices = (adapter) => {
  const devices = getAutomationDevices(adapter);
  const getScore = (device) => {
    const state = getDeviceState(device);
    return state.solarInputPower * 0.1 + state.soc * 0.6;
  };
  const nonAcOnly = devices.filter((device) => !device.isAcOnly);
  const avgSocNonAcOnly = nonAcOnly.length > 0 ? nonAcOnly.reduce((sum, device) => sum + getDeviceState(device).soc, 0) / nonAcOnly.length : 0;
  const applyAcOnlyPenalty = avgSocNonAcOnly > 35;
  const getEffectiveScore = (device) => {
    const score = getScore(device);
    return applyAcOnlyPenalty && device.isAcOnly ? score / 1.5 : score;
  };
  const sorted = [...devices].sort((a, b) => getEffectiveScore(b) - getEffectiveScore(a));
  const currentLead = devices.find((device) => deviceId(device) === deviceOrder[0]);
  if (currentLead && sorted[0] !== currentLead) {
    const challengerLead = sorted[0];
    if (getEffectiveScore(challengerLead) - getEffectiveScore(currentLead) < LEAD_HYSTERESIS_MARGIN) {
      sorted.splice(sorted.indexOf(currentLead), 1);
      sorted.unshift(currentLead);
    }
  }
  deviceOrder = sorted.map((device) => deviceId(device));
  adapter.log.debug(
    `${LOG} New device order: ${sorted.map((device) => `${deviceLabel(device)} ${device.deviceKey} (${getScore(device).toFixed(2)})`).join(" -> ")}`
  );
};
const updateAutomationDeviceMetrics = async (adapter) => {
  var _a;
  const devices = getAutomationDevices(adapter);
  const ignoreSuggested = ((_a = await adapter.getStateAsync("adapterAutomation.ignoreSuggestedInverseMaxPower")) == null ? void 0 : _a.val) === true;
  let needsResort = false;
  for (const device of devices) {
    const id = deviceId(device);
    const state = getDeviceState(device);
    const maxLimitState = ignoreSuggested ? await adapter.getStateAsync(`${id}.inverseMaxPower`) : await adapter.getStateAsync(`${id}.adapterAutomation.suggestedInverseMaxPower`);
    const newMaxLimit = (maxLimitState == null ? void 0 : maxLimitState.val) != null ? Number(maxLimitState.val) : 0;
    if (newMaxLimit != state.maxLimit) {
      adapter.log.debug(`${LOG} maxLimit for '${device.deviceKey}' changed: ${state.maxLimit} -> ${newMaxLimit}`);
      state.maxLimit = newMaxLimit;
      if (newMaxLimit < 500) {
        needsResort = true;
      }
    }
    const nameState = await adapter.getStateAsync(`${id}.name`);
    state.name = (nameState == null ? void 0 : nameState.val) != null ? String(nameState.val) : "";
    const solarInputPowerState = await adapter.getStateAsync(`${id}.solarInputPower`);
    state.solarInputPower = (solarInputPowerState == null ? void 0 : solarInputPowerState.val) != null ? Number(solarInputPowerState.val) : 0;
    const socState = await adapter.getStateAsync(`${id}.electricLevel`);
    state.soc = (socState == null ? void 0 : socState.val) != null ? Number(socState.val) : 0;
    const minSocState = await adapter.getStateAsync(`${id}.minSoc`);
    state.minSoc = (minSocState == null ? void 0 : minSocState.val) != null ? Number(minSocState.val) : 0;
    const chargeMaxLimitState = await adapter.getStateAsync(`${id}.chargeMaxLimit`);
    state.chargeMaxLimit = (chargeMaxLimitState == null ? void 0 : chargeMaxLimitState.val) != null ? Number(chargeMaxLimitState.val) : device.maxInputLimit;
  }
  if (needsResort) {
    adapter.log.debug(`${LOG} maxLimit changed significantly, re-sorting devices!`);
    sortAutomationDevices(adapter);
  }
};
const checkAutomationCurrentLimit = async (adapter) => {
  for (const device of getAutomationDevices(adapter)) {
    const state = getDeviceState(device);
    const currentLimitState = await adapter.getStateAsync(`${deviceId(device)}.control.setDeviceAutomationInOutLimit`);
    const currentLimit = (currentLimitState == null ? void 0 : currentLimitState.val) != null ? Number(currentLimitState.val) : 0;
    if (state.currentLimit != currentLimit) {
      adapter.log.warn(
        `${LOG} currentLimit (${state.currentLimit}) for '${device.deviceKey}' differs from state (${currentLimit}), re-syncing!`
      );
      state.currentLimit = currentLimit;
    }
  }
};
const setDeviceShares = (devices) => {
  const weightedSum = devices.reduce((sum, device) => sum + Math.pow(getDeviceState(device).soc, EXPONENT), 0);
  devices.forEach((device) => {
    const state = getDeviceState(device);
    state.share = state.maxLimit > 0 && state.soc >= state.minSoc && weightedSum > 0 ? roundShare(Math.pow(state.soc, EXPONENT) / weightedSum) : 0;
  });
};
const runZeroFeedInAutomation = async (adapter, currentGridMeterValue) => {
  var _a;
  if (isRunning || lastGridMeterValue === currentGridMeterValue) {
    return;
  }
  isRunning = true;
  try {
    const automationEnabled = ((_a = await adapter.getStateAsync("adapterAutomation.automationEnabled")) == null ? void 0 : _a.val) === true;
    if (!automationEnabled) {
      return;
    }
    lastGridMeterValue = currentGridMeterValue;
    const devices = getOrderedAutomationDevices(adapter);
    if (devices.length === 0) {
      return;
    }
    const now = Date.now();
    for (const [index, device] of devices.entries()) {
      const id = deviceId(device);
      const state = getDeviceState(device);
      state.enabled = await isDeviceEnabled(adapter, device);
      state.forceAcCharging = await isForceAcCharging(adapter, device);
      const solarInputPowerState = await adapter.getStateAsync(`${id}.solarInputPower`);
      state.solarInputPower = (solarInputPowerState == null ? void 0 : solarInputPowerState.val) != null ? Number(solarInputPowerState.val) : 0;
      const currentLimitState = await adapter.getStateAsync(`${id}.control.setDeviceAutomationInOutLimit`);
      state.lastChangeMs = (currentLimitState == null ? void 0 : currentLimitState.lc) ? now - currentLimitState.lc : Number.MAX_SAFE_INTEGER;
      if (state.enabled && state.lastChangeMs >= MIN_STANDBY_TIME_MS && state.currentLimit === 10 && state.soc < 99 && index !== 0) {
        state.currentLimit = 0;
        state.newLimit = 0;
        device.setDeviceAutomationInOutLimit(0);
      } else {
        state.currentLimit = (currentLimitState == null ? void 0 : currentLimitState.val) != null ? Number(currentLimitState.val) : 0;
      }
    }
    if (devices.some((device) => {
      const state = getDeviceState(device);
      return state.enabled && state.lastChangeMs < RECENT_CHANGE_SKIP_MS;
    })) {
      return;
    }
    const wakingDevice = devices.find((device) => {
      const state = getDeviceState(device);
      return state.enabled && state.wakingUntilMs > now;
    });
    if (wakingDevice) {
      adapter.log.debug(
        `${LOG} Device '${wakingDevice.deviceKey}' is still waking up, waiting ${Math.round((getDeviceState(wakingDevice).wakingUntilMs - now) / 1e3)}s`
      );
      return;
    }
    const currentFeedIn = devices.reduce((sum, device) => sum + Math.max(getDeviceState(device).currentLimit, 0), 0);
    const maxFeedIn = devices.reduce((sum, device) => sum + getDeviceState(device).maxLimit, 0);
    const solarInput = devices.reduce((sum, device) => sum + getDeviceState(device).solarInputPower, 0);
    const fleetMinSoc = Math.min(...devices.map((device) => getDeviceState(device).soc));
    const setPointState = await adapter.getStateAsync("adapterAutomation.setPoint");
    const setPointNearlyFullState = await adapter.getStateAsync("adapterAutomation.setPointNearlyFull");
    const baseSetPoint = (setPointState == null ? void 0 : setPointState.val) != null ? Number(setPointState.val) : 10;
    const setPointNearlyFull = (setPointNearlyFullState == null ? void 0 : setPointNearlyFullState.val) != null ? Number(setPointNearlyFullState.val) : -100;
    const setPoint = fleetMinSoc >= NEARLY_FULL_SOC && solarInput > 50 ? setPointNearlyFull : baseSetPoint;
    const hasGridSurplus = currentGridMeterValue <= setPoint - SURPLUS_TRIGGER_BELOW_SETPOINT_W;
    const surplusSetPoint = setPoint - SURPLUS_SETPOINT_BUFFER_W;
    const deadBandUpper = setPoint < 0 ? 0 : setPoint + 10;
    const deadBandTarget = (setPoint + deadBandUpper) / 2;
    if (currentGridMeterValue > setPoint && currentGridMeterValue < deadBandUpper) {
      if (!inDeadBand) {
        adapter.log.debug(
          `${LOG} currentGridMeterValue=${currentGridMeterValue} is within the acceptable range of setPoint=${setPoint} and deadBandUpper=${deadBandUpper}`
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
    const piCorrection = calculatePIOutput(setPointDiff, now);
    let piAdjustedHomeUsage = currentHomeUsage + piCorrection;
    const inputDevices = [];
    const otherDevices = [];
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
      } else if (state.enabled && (currentHomeUsage > 4800 || piAdjustedHomeUsage > maxFeedIn || utilization >= UTILIZATION_THRESHOLD && !device.isAcOnly)) {
        inputDevices.push(device);
        currentAllocatedMaxPower += state.maxLimit;
      } else {
        otherDevices.push(device);
      }
    }
    if (inputDevices.length > stabilizedInverterCount) {
      stabilizedInverterCount = inputDevices.length;
      stabilizedUntilMs = now + INVERTER_MIN_HOLD_MS;
    } else if (inputDevices.length < stabilizedInverterCount && now < stabilizedUntilMs) {
      const needed = stabilizedInverterCount - inputDevices.length;
      const candidates = otherDevices.filter((device) => getDeviceState(device).enabled && !getDeviceState(device).forceAcCharging).slice(0, needed);
      candidates.forEach((device) => {
        otherDevices.splice(otherDevices.indexOf(device), 1);
        inputDevices.push(device);
        currentAllocatedMaxPower += getDeviceState(device).maxLimit;
      });
    } else {
      stabilizedInverterCount = inputDevices.length;
    }
    inputDevices.filter((device) => getDeviceState(device).forceAcCharging).forEach((device) => {
      inputDevices.splice(inputDevices.indexOf(device), 1);
      otherDevices.push(device);
    });
    setDeviceShares(inputDevices);
    let unmetDemand = 0;
    const nonAcOnly = devices.filter((device) => !device.isAcOnly);
    const avgSocNonAcOnly = nonAcOnly.length > 0 ? nonAcOnly.reduce((sum, device) => sum + getDeviceState(device).soc, 0) / nonAcOnly.length : 0;
    for (const device of otherDevices) {
      const state = getDeviceState(device);
      if (!state.enabled) {
        continue;
      }
      if (state.forceAcCharging && state.soc < 100) {
        state.newLimit = -state.chargeMaxLimit;
      } else if (device.isAcOnly && state.soc < 100) {
        if (hasGridSurplus) {
          const surplusPower = Math.max(0, surplusSetPoint - currentGridMeterValue);
          state.newLimit = -Math.min(surplusPower, state.chargeMaxLimit);
        } else if (avgSocNonAcOnly > 70 && solarInput > 800) {
          let maxChargePower = Math.round(solarInput * 0.2 / 100) * 100;
          maxChargePower = Math.min(maxChargePower, state.chargeMaxLimit);
          state.newLimit = -maxChargePower;
        }
      } else if (state.currentLimit >= 10) {
        state.newLimit = 10;
        piAdjustedHomeUsage -= 10;
      } else {
        state.newLimit = 0;
      }
    }
    inputDevices.forEach((device) => {
      const state = getDeviceState(device);
      state.isAtCapacity = false;
      if (state.maxLimit <= 0 || !state.share) {
        return;
      }
      const solar = state.solarInputPower;
      const calculatedLimit = Math.floor(piAdjustedHomeUsage * state.share);
      state.newLimit = state.soc >= 99 && solar > 0 && !device.isAcOnly ? Math.max(calculatedLimit, solar) : calculatedLimit;
      if (!device.isAcOnly && state.soc === 99 && solar > 40) {
        state.newLimit = Math.max(100, state.newLimit);
      }
      const baseLimit = device.isAcOnly ? 0 : state.soc >= 99 && fleetMinSoc < 99 ? 30 : 10;
      state.newLimit = state.newLimit < 10 ? baseLimit : state.newLimit;
      if (state.newLimit > state.maxLimit) {
        unmetDemand += state.newLimit - state.maxLimit;
        state.isAtCapacity = true;
      }
    });
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
    const availableDeviceCount = inputDevices.filter((device) => !getDeviceState(device).isAtCapacity).length;
    if (availableDeviceCount > 0 && unmetDemand > 0) {
      inputDevices.filter((device) => {
        const state = getDeviceState(device);
        return !state.isAtCapacity && state.newLimit < state.maxLimit;
      }).forEach((device) => {
        getDeviceState(device).newLimit += unmetDemand / availableDeviceCount;
      });
    }
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
        continue;
      }
      state.newLimit = Math.round(clamp(state.newLimit, -state.chargeMaxLimit, state.maxLimit));
      if (state.newLimit < 0 && !(state.currentLimit === 0 && state.lastChangeMs >= MIN_IDLE_BEFORE_CHARGE_MS)) {
        state.newLimit = 0;
      }
      if (state.newLimit === state.currentLimit) {
        continue;
      }
      const autoModelState = await adapter.getStateAsync(`${id}.autoModel`);
      const autoModelLastChangeMs = (autoModelState == null ? void 0 : autoModelState.lc) ? now - autoModelState.lc : Number.MAX_SAFE_INTEGER;
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
        state.pendingTimeout = void 0;
        const wasZero = state.currentLimit === 0;
        state.currentLimit = newLimit;
        device.setDeviceAutomationInOutLimit(newLimit);
        if (wasZero && state.currentLimit > 0) {
          state.wakingUntilMs = Date.now() + WAKE_UP_MS;
          adapter.log.debug(
            `${LOG} Device '${device.deviceKey}' starting up from standby, waiting ${WAKE_UP_MS / 1e3}s`
          );
        }
      }, standbyDelayMs);
    }
  } finally {
    isRunning = false;
  }
};
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  checkAutomationCurrentLimit,
  resetAdapterAutomationController,
  runZeroFeedInAutomation,
  sortAutomationDevices,
  updateAutomationDeviceMetrics
});
//# sourceMappingURL=adapterAutomation.js.map
