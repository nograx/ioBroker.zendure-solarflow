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
  refreshAutomationStatuses: () => refreshAutomationStatuses,
  resetAdapterAutomationController: () => resetAdapterAutomationController,
  runZeroFeedInAutomation: () => runZeroFeedInAutomation,
  sortAutomationDevices: () => sortAutomationDevices,
  stopAdapterAutomation: () => stopAdapterAutomation,
  stopDeviceAutomation: () => stopDeviceAutomation,
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
const ZEN_SDK_MIN_LIMIT_W = 30;
const DEFAULT_MIN_LIMIT_W = 10;
const MIN_IDLE_BEFORE_CHARGE_MS = 5 * 60 * 1e3;
const EXTRA_FEED_IN_CONFIRM_MS = 30 * 1e3;
const MAX_FEED_IN_STEP_W = 100;
const SHORT_TERM_GRID_ALPHA = 0.3;
const CHARGE_START_GRID_ALPHA = 0.05;
const CHARGE_DEAD_ZONE_MAX_W = 20;
const CHARGE_MIN_PER_DEVICE_W = 100;
const UTILIZATION_THRESHOLD = 0.7;
const LEAD_HYSTERESIS_MARGIN = 5;
const DEFAULT_AC_ONLY_PENALTY = 50;
const DEFAULT_SURPLUS_CHARGE_TRIGGER_W = 100;
const SURPLUS_SETPOINT_BUFFER_W = 30;
const SOLE_DEVICE_FEED_IN_RETURN_W = 50;
const PI_CONTROLLER = {
  KP: 0.15,
  KI: 0.02,
  KD: 0.05,
  INTEGRAL_MIN: -200,
  INTEGRAL_MAX: 200
};
const CHARGE_PI = {
  KP: 0.25,
  KI: 0.02,
  KD: 0.1,
  INTEGRAL_MIN: -400,
  INTEGRAL_MAX: 400
};
const MAX_PI_DT_SECONDS = 10;
const deviceStates = /* @__PURE__ */ new Map();
let inDeadBand = false;
let lastGridMeterValue;
let shortTermGridAvgW;
let chargeStartGridAvgW;
let shortTermHomeUsageW;
let stabilizedInverterCount = 0;
let stabilizedUntilMs = 0;
let stabilizedChargeDeviceCount = 0;
let stabilizedChargeUntilMs = 0;
let isRunning = false;
let automationGeneration = 0;
let deviceOrder = [];
const deviceId = (device) => `${device.productKey}.${device.deviceKey}`;
const getDeviceState = (device) => {
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
      wakingUntilMs: 0
    };
    deviceStates.set(id, state);
  }
  return state;
};
const deviceLabel = (device) => getDeviceState(device).name || device.constructor.name;
const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
const roundShare = (value) => Math.round(value * 100) / 100;
const getMinLimit = (device) => device.isZenSdkSupported ? ZEN_SDK_MIN_LIMIT_W : DEFAULT_MIN_LIMIT_W;
const createPidController = (config) => {
  let integral = 0;
  let previousError;
  let lastUpdateMs;
  const calculate = (error, now) => {
    const elapsedSeconds = lastUpdateMs != null ? (now - lastUpdateMs) / 1e3 : void 0;
    const dtSeconds = elapsedSeconds != null ? Math.min(elapsedSeconds, MAX_PI_DT_SECONDS) : 0;
    lastUpdateMs = now;
    const proportional = config.KP * error;
    integral = clamp(integral + error * dtSeconds, config.INTEGRAL_MIN, config.INTEGRAL_MAX);
    const derivative = previousError != null && elapsedSeconds != null && elapsedSeconds <= MAX_PI_DT_SECONDS ? config.KD * (error - previousError) : 0;
    previousError = error;
    return proportional + config.KI * integral + derivative;
  };
  const reset = () => {
    integral = 0;
    previousError = void 0;
    lastUpdateMs = void 0;
  };
  return { calculate, reset };
};
const feedInPid = createPidController(PI_CONTROLLER);
const chargePid = createPidController(CHARGE_PI);
const resetAdapterAutomationController = (adapter) => {
  feedInPid.reset();
  chargePid.reset();
  shortTermHomeUsageW = void 0;
  adapter.log.debug(`${LOG} PID controllers reset`);
};
const trackLimitTransition = (state, previousLimit, nextLimit, now) => {
  if (previousLimit < 0 && nextLimit >= 0) {
    state.chargingStoppedMs = now;
  }
  if (previousLimit > 0 && nextLimit <= 0) {
    state.dischargingStoppedMs = now;
  }
};
const releaseStaleKeepAlive = (device, state, keepAliveLimit, now) => {
  if (state.lastChangeMs < MIN_STANDBY_TIME_MS || state.currentLimit !== keepAliveLimit || state.soc >= 99) {
    return;
  }
  trackLimitTransition(state, state.currentLimit, 0, now);
  state.currentLimit = 0;
  state.newLimit = 0;
  device.setDeviceAutomationInOutLimit(0);
};
const chargeKeepAliveOrZero = (device, state) => state.currentLimit < 0 ? -getMinLimit(device) : 0;
const DEVICE_TASK_TEXTS = {
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
      disabled: "Automation disabled for this device"
    },
    leadSuffix: " (lead device)",
    automationDisabled: "Automation disabled globally",
    waitingForTrigger: "Waiting for a change of the automation trigger state"
  },
  de: {
    tasks: {
      feedIn: "Speist ein",
      standby: "Standby",
      surplusCharging: "L\xE4dt aus \xDCberschuss",
      chargeKeepAlive: "H\xE4lt den Lade-Keep-Alive",
      forceCharging: "L\xE4dt erzwungen",
      chargeBlocked: "Wartet, bevor das Laden beginnen darf",
      waitingForSurplus: "Wartet auf \xDCberschussladung",
      full: "Voll geladen, inaktiv",
      idle: "Inaktiv",
      disabled: "Automatisierung f\xFCr dieses Ger\xE4t deaktiviert"
    },
    leadSuffix: " (f\xFChrendes Ger\xE4t)",
    automationDisabled: "Automatisierung global deaktiviert",
    waitingForTrigger: "Wartet auf eine \xC4nderung des Ausl\xF6ser-Datenpunkts"
  }
};
let statusLanguage;
let lastDeviceOrderText;
const lastDeviceStatusTexts = /* @__PURE__ */ new Map();
const getStatusLanguage = async (adapter) => {
  var _a;
  if (!statusLanguage) {
    const systemConfig = await adapter.getForeignObjectAsync("system.config");
    statusLanguage = ((_a = systemConfig == null ? void 0 : systemConfig.common) == null ? void 0 : _a.language) === "de" ? "de" : "en";
  }
  return statusLanguage;
};
const publishDeviceOrder = async (adapter, devices) => {
  const text = devices.map((device) => `${deviceLabel(device)} (${device.deviceKey})`).join(" -> ");
  if (text !== lastDeviceOrderText) {
    lastDeviceOrderText = text;
    await adapter.setState("adapterAutomation.deviceOrder", text, true);
  }
};
const publishDeviceStatusText = async (adapter, device, text) => {
  const id = deviceId(device);
  if (text !== lastDeviceStatusTexts.get(id)) {
    lastDeviceStatusTexts.set(id, text);
    await adapter.setState(`${id}.adapterAutomation.status`, text, true);
  }
};
const publishDeviceTask = async (adapter, device, task, isLead) => {
  const texts = DEVICE_TASK_TEXTS[await getStatusLanguage(adapter)];
  await publishDeviceStatusText(adapter, device, `${texts.tasks[task]}${isLead ? texts.leadSuffix : ""}`);
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
const isAcChargingAllowed = async (adapter, device) => {
  if (!device.canChargeByAc || device.isAcOnly) {
    return false;
  }
  const state = await adapter.getStateAsync(`${deviceId(device)}.adapterAutomation.acChargingAllowed`);
  return (state == null ? void 0 : state.val) === true;
};
const canSurplusCharge = (device) => device.isAcOnly || getDeviceState(device).acChargingAllowed;
const refreshAutomationStatuses = async (adapter) => {
  var _a;
  const texts = DEVICE_TASK_TEXTS[await getStatusLanguage(adapter)];
  const nonTaskTexts = [texts.automationDisabled, texts.tasks.disabled, texts.waitingForTrigger];
  const automationEnabled = ((_a = await adapter.getStateAsync("adapterAutomation.automationEnabled")) == null ? void 0 : _a.val) === true;
  for (const device of getAutomationDevices(adapter)) {
    const lastText = lastDeviceStatusTexts.get(deviceId(device));
    if (!automationEnabled) {
      await publishDeviceStatusText(adapter, device, texts.automationDisabled);
    } else if (!await isDeviceEnabled(adapter, device)) {
      await publishDeviceStatusText(adapter, device, texts.tasks.disabled);
    } else if (lastText === void 0 || nonTaskTexts.includes(lastText)) {
      await publishDeviceStatusText(adapter, device, texts.waitingForTrigger);
    }
  }
};
const releaseDeviceToZero = async (adapter, device, reason) => {
  const state = getDeviceState(device);
  if (state.pendingTimeout) {
    adapter.clearTimeout(state.pendingTimeout);
    state.pendingTimeout = void 0;
  }
  const currentLimitState = await adapter.getStateAsync(`${deviceId(device)}.control.setDeviceAutomationInOutLimit`);
  const currentLimit = (currentLimitState == null ? void 0 : currentLimitState.val) != null ? Number(currentLimitState.val) : 0;
  trackLimitTransition(state, currentLimit, 0, Date.now());
  state.currentLimit = 0;
  state.newLimit = 0;
  if (currentLimit !== 0) {
    adapter.log.info(`${LOG} ${reason}, setting limit of '${deviceLabel(device)}' to 0W`);
    device.setDeviceAutomationInOutLimit(0);
  }
};
const stopAdapterAutomation = async (adapter) => {
  automationGeneration++;
  lastGridMeterValue = void 0;
  for (const device of getAutomationDevices(adapter)) {
    if (!await isDeviceEnabled(adapter, device)) {
      continue;
    }
    await releaseDeviceToZero(adapter, device, "Automation disabled globally");
  }
};
const stopDeviceAutomation = async (adapter, device) => {
  if (!getAutomationDevices(adapter).includes(device)) {
    return;
  }
  getDeviceState(device).enabled = false;
  await releaseDeviceToZero(adapter, device, "Automation disabled for this device");
};
const sortAutomationDevices = async (adapter) => {
  const devices = getAutomationDevices(adapter);
  const acOnlyPenaltyState = await adapter.getStateAsync("adapterAutomation.acOnlyPenalty");
  const acOnlyPenalty = typeof (acOnlyPenaltyState == null ? void 0 : acOnlyPenaltyState.val) === "number" && acOnlyPenaltyState.val >= 0 ? acOnlyPenaltyState.val : DEFAULT_AC_ONLY_PENALTY;
  const acOnlyPenaltyFactor = 1 + acOnlyPenalty / 100;
  const getScore = (device) => {
    const state = getDeviceState(device);
    return state.solarInputPower * 0.1 + state.soc * 0.6;
  };
  const nonAcOnly = devices.filter((device) => !device.isAcOnly);
  const avgSocNonAcOnly = nonAcOnly.length > 0 ? nonAcOnly.reduce((sum, device) => sum + getDeviceState(device).soc, 0) / nonAcOnly.length : 0;
  const applyAcOnlyPenalty = avgSocNonAcOnly > 35;
  const getEffectiveScore = (device) => {
    const score = getScore(device);
    return applyAcOnlyPenalty && device.isAcOnly ? score / acOnlyPenaltyFactor : score;
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
  await publishDeviceOrder(adapter, sorted);
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
    await sortAutomationDevices(adapter);
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
const getChargeShares = (devices) => {
  const weight = (device) => Math.pow(100 - getDeviceState(device).soc, EXPONENT);
  const weightedSum = devices.reduce((sum, device) => sum + weight(device), 0);
  return new Map(
    devices.map((device) => [deviceId(device), weightedSum > 0 ? roundShare(weight(device) / weightedSum) : 0])
  );
};
const runZeroFeedInAutomation = async (adapter, currentGridMeterValue) => {
  var _a, _b;
  if (isRunning || lastGridMeterValue === currentGridMeterValue) {
    return;
  }
  isRunning = true;
  const generation = automationGeneration;
  try {
    const automationEnabled = ((_a = await adapter.getStateAsync("adapterAutomation.automationEnabled")) == null ? void 0 : _a.val) === true;
    if (!automationEnabled) {
      const text = DEVICE_TASK_TEXTS[await getStatusLanguage(adapter)].automationDisabled;
      for (const device of getAutomationDevices(adapter)) {
        await publishDeviceStatusText(adapter, device, text);
      }
      return;
    }
    lastGridMeterValue = currentGridMeterValue;
    const devices = getOrderedAutomationDevices(adapter);
    await publishDeviceOrder(adapter, devices);
    if (devices.length === 0) {
      return;
    }
    const now = Date.now();
    for (const [index, device] of devices.entries()) {
      const id = deviceId(device);
      const state = getDeviceState(device);
      state.enabled = await isDeviceEnabled(adapter, device);
      state.forceAcCharging = await isForceAcCharging(adapter, device);
      state.acChargingAllowed = await isAcChargingAllowed(adapter, device);
      const solarInputPowerState = await adapter.getStateAsync(`${id}.solarInputPower`);
      state.solarInputPower = (solarInputPowerState == null ? void 0 : solarInputPowerState.val) != null ? Number(solarInputPowerState.val) : 0;
      if (state.solarInputPower > 100 && state.soc > 35) {
        (_b = state.extraFeedInCandidateSinceMs) != null ? _b : state.extraFeedInCandidateSinceMs = now;
      } else {
        state.extraFeedInCandidateSinceMs = void 0;
      }
      const currentLimitState = await adapter.getStateAsync(`${id}.control.setDeviceAutomationInOutLimit`);
      state.lastChangeMs = (currentLimitState == null ? void 0 : currentLimitState.lc) ? now - currentLimitState.lc : Number.MAX_SAFE_INTEGER;
      const freshLimit = (currentLimitState == null ? void 0 : currentLimitState.val) != null ? Number(currentLimitState.val) : 0;
      trackLimitTransition(state, state.currentLimit, freshLimit, now);
      state.currentLimit = freshLimit;
      if (state.enabled) {
        if (index !== 0) {
          releaseStaleKeepAlive(device, state, getMinLimit(device), now);
        }
        releaseStaleKeepAlive(device, state, -getMinLimit(device), now);
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
    const currentTotalChargePowerAll = devices.reduce(
      (sum, device) => sum + Math.max(0, -getDeviceState(device).currentLimit),
      0
    );
    const maxFeedIn = devices.reduce((sum, device) => sum + getDeviceState(device).maxLimit, 0);
    const solarInput = devices.reduce((sum, device) => sum + getDeviceState(device).solarInputPower, 0);
    const fleetMinSoc = Math.min(...devices.map((device) => getDeviceState(device).soc));
    const setPointState = await adapter.getStateAsync("adapterAutomation.setPoint");
    const setPointNearlyFullState = await adapter.getStateAsync("adapterAutomation.setPointNearlyFull");
    const baseSetPoint = (setPointState == null ? void 0 : setPointState.val) != null ? Number(setPointState.val) : 10;
    const setPointNearlyFull = (setPointNearlyFullState == null ? void 0 : setPointNearlyFullState.val) != null ? Number(setPointNearlyFullState.val) : -100;
    const setPoint = fleetMinSoc >= NEARLY_FULL_SOC && solarInput > 50 ? setPointNearlyFull : baseSetPoint;
    shortTermGridAvgW = shortTermGridAvgW == null ? currentGridMeterValue : shortTermGridAvgW + SHORT_TERM_GRID_ALPHA * (currentGridMeterValue - shortTermGridAvgW);
    chargeStartGridAvgW = chargeStartGridAvgW == null ? currentGridMeterValue : chargeStartGridAvgW + CHARGE_START_GRID_ALPHA * (currentGridMeterValue - chargeStartGridAvgW);
    const surplusChargeTriggerState = await adapter.getStateAsync("adapterAutomation.surplusChargeTrigger");
    const surplusChargeTrigger = typeof (surplusChargeTriggerState == null ? void 0 : surplusChargeTriggerState.val) === "number" ? Math.max(surplusChargeTriggerState.val, SURPLUS_SETPOINT_BUFFER_W) : DEFAULT_SURPLUS_CHARGE_TRIGGER_W;
    const hasGridSurplus = chargeStartGridAvgW <= setPoint - surplusChargeTrigger;
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
    const rawHomeUsage = currentGridMeterValue + currentFeedIn - currentTotalChargePowerAll;
    shortTermHomeUsageW = shortTermHomeUsageW == null ? rawHomeUsage : shortTermHomeUsageW + SHORT_TERM_GRID_ALPHA * (rawHomeUsage - shortTermHomeUsageW);
    const currentHomeUsage = shortTermHomeUsageW;
    const expectedGridW = currentHomeUsage - currentFeedIn + currentTotalChargePowerAll;
    const setPointDiff = expectedGridW - deadBandTarget;
    const piCorrection = feedInPid.calculate(setPointDiff, now);
    adapter.log.debug(
      `${LOG} Feed-in: grid=${currentGridMeterValue} rawHomeUsage=${rawHomeUsage.toFixed(1)} homeUsageAvg=${currentHomeUsage.toFixed(1)} currentFeedIn=${currentFeedIn} expectedGrid=${expectedGridW.toFixed(1)} piCorrection=${piCorrection.toFixed(1)}`
    );
    let piAdjustedHomeUsage = currentHomeUsage + piCorrection;
    const isSoleEnabledDevice = devices.filter((device) => getDeviceState(device).enabled).length === 1;
    const hasHomeDemand = currentHomeUsage > setPoint + SOLE_DEVICE_FEED_IN_RETURN_W;
    const isReleasedForSurplusCharging = (device) => {
      const state = getDeviceState(device);
      return state.enabled && !state.forceAcCharging && canSurplusCharge(device) && state.soc < 100 && state.currentLimit <= 0 && !(isSoleEnabledDevice && hasHomeDemand) && (hasGridSurplus || state.currentLimit < -getMinLimit(device));
    };
    const inputDevices = [];
    const otherDevices = [];
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
      const hasSpareSolar = state.extraFeedInCandidateSinceMs != null && now - state.extraFeedInCandidateSinceMs >= EXTRA_FEED_IN_CONFIRM_MS;
      if (state.enabled && (isLead || isFullAndCapable || hasSpareSolar)) {
        inputDevices.push(device);
        currentAllocatedMaxPower += state.maxLimit;
      } else if (state.enabled && // AC-only devices may step in too, as a last resort once the active feed-in devices are well utilized.
      (piAdjustedHomeUsage > maxFeedIn || utilization >= UTILIZATION_THRESHOLD)) {
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
      const candidates = otherDevices.filter(
        (device) => getDeviceState(device).enabled && !getDeviceState(device).forceAcCharging && !isReleasedForSurplusCharging(device)
      ).slice(0, needed);
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
    const isSurplusChargeCandidate = (device) => {
      const state = getDeviceState(device);
      return state.enabled && !state.forceAcCharging && canSurplusCharge(device);
    };
    const chargeEligibleDevices = otherDevices.filter(
      (device) => isSurplusChargeCandidate(device) && getDeviceState(device).soc < 100
    );
    const currentTotalChargePower = otherDevices.filter(isSurplusChargeCandidate).reduce((sum, device) => sum + Math.max(0, -getDeviceState(device).currentLimit), 0);
    const chargeError = surplusSetPoint - shortTermGridAvgW;
    let chargeBudgetTotal = 0;
    if (hasGridSurplus || currentTotalChargePower > 0) {
      chargeBudgetTotal = Math.max(0, currentTotalChargePower + chargePid.calculate(chargeError, now));
    }
    const orderedChargeEligible = [...chargeEligibleDevices].sort((a, b) => devices.indexOf(b) - devices.indexOf(a));
    const rawChargeDeviceCount = chargeBudgetTotal > 0 ? Math.min(orderedChargeEligible.length, Math.max(1, Math.floor(chargeBudgetTotal / CHARGE_MIN_PER_DEVICE_W))) : 0;
    let activeChargeDeviceCount;
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
        `${LOG} AC charge: chargeStartGridAvgW=${chargeStartGridAvgW.toFixed(1)} shortTermGridAvgW=${shortTermGridAvgW.toFixed(1)} hasGridSurplus=${hasGridSurplus} currentTotalChargePower=${currentTotalChargePower} chargeError=${chargeError.toFixed(1)} chargeBudgetTotal=${chargeBudgetTotal.toFixed(1)} activeChargeDevices=${activeChargeDevices.map((device) => `${deviceLabel(device)}:${chargeShares.get(deviceId(device))}`).join(",") || "-"}`
      );
    }
    for (const device of otherDevices) {
      const state = getDeviceState(device);
      if (!state.enabled) {
        continue;
      }
      if (state.forceAcCharging && state.soc < 100) {
        state.newLimit = -state.chargeMaxLimit;
      } else if (canSurplusCharge(device) && state.soc < 100) {
        const share = chargeShares.get(deviceId(device));
        let perDeviceBudget = share != null ? Math.round(Math.min(chargeBudgetTotal * share, state.chargeMaxLimit)) : 0;
        if (perDeviceBudget <= CHARGE_DEAD_ZONE_MAX_W || perDeviceBudget < getMinLimit(device)) {
          perDeviceBudget = 0;
        }
        state.newLimit = perDeviceBudget > 0 ? -perDeviceBudget : chargeKeepAliveOrZero(device, state);
      } else if (state.currentLimit >= getMinLimit(device)) {
        state.newLimit = getMinLimit(device);
        piAdjustedHomeUsage -= getMinLimit(device);
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
      const minLimit = getMinLimit(device);
      const baseLimit = device.isAcOnly || state.acChargingAllowed && state.currentLimit < 0 ? chargeKeepAliveOrZero(device, state) : minLimit;
      state.newLimit = state.newLimit < minLimit ? baseLimit : state.newLimit;
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
            const minNewLimit = state.soc === 99 && solarInput > 40 ? 100 : getMinLimit(device);
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
    const leadDevice = inputDevices.includes(devices[0]) ? devices[0] : void 0;
    const getDeviceTask = (device, state, isChargeBlocked) => {
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
        await publishDeviceTask(adapter, device, "disabled", false);
        continue;
      }
      let isChargeBlocked = false;
      state.newLimit = Math.round(clamp(state.newLimit, -state.chargeMaxLimit, state.maxLimit));
      const minLimit = getMinLimit(device);
      if (state.newLimit > 0 && state.currentLimit > minLimit && state.newLimit !== minLimit) {
        const previousLimit = state.currentLimit;
        const proposedSign = Math.sign(state.newLimit - previousLimit);
        const isReversal = state.lastFeedInDeltaSign != null && state.lastFeedInDeltaSign !== 0 && proposedSign !== 0 && proposedSign !== state.lastFeedInDeltaSign;
        if (isReversal) {
          state.newLimit = clamp(
            state.newLimit,
            previousLimit - MAX_FEED_IN_STEP_W,
            previousLimit + MAX_FEED_IN_STEP_W
          );
        }
        state.lastFeedInDeltaSign = Math.sign(state.newLimit - previousLimit);
      }
      if (state.newLimit < 0 && state.currentLimit >= 0) {
        const msSinceChargingStopped = state.chargingStoppedMs != null ? now - state.chargingStoppedMs : Number.MAX_SAFE_INTEGER;
        const msSinceDischargingStopped = state.dischargingStoppedMs != null ? now - state.dischargingStoppedMs : Number.MAX_SAFE_INTEGER;
        const msSinceIdle = Math.min(msSinceChargingStopped, msSinceDischargingStopped);
        if (state.currentLimit > 0 || msSinceIdle < MIN_IDLE_BEFORE_CHARGE_MS) {
          adapter.log.debug(
            `${LOG} '${deviceLabel(device)}' charge requested (${state.newLimit}W) but blocked: currentLimit=${state.currentLimit} msSinceChargingStopped=${msSinceChargingStopped} msSinceDischargingStopped=${msSinceDischargingStopped}`
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
      const autoModelLastChangeMs = (autoModelState == null ? void 0 : autoModelState.lc) ? now - autoModelState.lc : Number.MAX_SAFE_INTEGER;
      const settleDelayMs = Math.max(0, AUTO_MODEL_SETTLE_MS - autoModelLastChangeMs);
      if (settleDelayMs > 0) {
        state.wakingUntilMs = now + settleDelayMs;
        adapter.log.debug(`${LOG} autoModel change detected for '${device.deviceKey}', waiting ${settleDelayMs}ms`);
      }
      const standbyDelayMs = state.newLimit === minLimit ? Math.max(settleDelayMs, globalWakingDelayMs) : settleDelayMs;
      if (generation !== automationGeneration) {
        return;
      }
      if (!state.enabled) {
        continue;
      }
      if (state.pendingTimeout) {
        adapter.clearTimeout(state.pendingTimeout);
      }
      const newLimit = state.newLimit;
      state.pendingTimeout = adapter.setTimeout(() => {
        state.pendingTimeout = void 0;
        if (generation !== automationGeneration || !state.enabled) {
          return;
        }
        const wasZero = state.currentLimit === 0;
        trackLimitTransition(state, state.currentLimit, newLimit, Date.now());
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
  refreshAutomationStatuses,
  resetAdapterAutomationController,
  runZeroFeedInAutomation,
  sortAutomationDevices,
  stopAdapterAutomation,
  stopDeviceAutomation,
  updateAutomationDeviceMetrics
});
//# sourceMappingURL=adapterAutomation.js.map
