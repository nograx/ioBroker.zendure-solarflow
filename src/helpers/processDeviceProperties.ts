import { allStates } from "../constants/sensorStates/allStates";
import { ZenIobDevice } from "../models/deviceModels/ZenIobDevice";
import { ISolarFlowMqttProperties } from "../models/ISolarFlowMqttProperties";

// Cache of states already created per device in this session (avoids redundant extendObject calls)
const createdStateCache = new Map<string, Set<string>>();

// All MQTT property keys that have explicit handlers in processDeviceProperties
const handledMqttKeys = new Set<string>([
  "autoModel",
  "heatState",
  "electricLevel",
  "packData",
  "packState",
  "passMode",
  "pass",
  "autoRecover",
  "outputHomePower",
  "energyPower",
  "outputLimit",
  "smartMode",
  "buzzerSwitch",
  "outputPackPower",
  "packInputPower",
  "solarInputPower",
  "pvPower1",
  "pvPower2",
  "solarPower1",
  "solarPower2",
  "solarPower3",
  "solarPower4",
  "remainOutTime",
  "remainInputTime",
  "socSet",
  "minSoc",
  "inputLimit",
  "gridInputPower",
  "acMode",
  "hyperTmp",
  "acOutputPower",
  "gridPower",
  "acSwitch",
  "dcSwitch",
  "dcOutputPower",
  "pvBrand",
  "inverseMaxPower",
  "wifiState",
  "packNum",
  "hubState",
  "batteryElectric",
]);

const ensureState = async (
  device: ZenIobDevice,
  stateTitle: string,
  rawValue?: number | string | boolean,
): Promise<void> => {
  const deviceId = `${device.productKey}.${device.deviceKey}`;
  if (createdStateCache.get(deviceId)?.has(stateTitle)) return;

  const stateDef = allStates[stateTitle];
  const productKey = device.productKey.replace(
    device.adapter.FORBIDDEN_CHARS,
    "",
  );
  const deviceKey = device.deviceKey.replace(
    device.adapter.FORBIDDEN_CHARS,
    "",
  );

  let type: ioBroker.CommonType;
  let role: string;
  let nameDe: string;
  let nameEn: string;

  if (stateDef) {
    type = stateDef.type;
    role = stateDef.role;
    nameDe = stateDef.nameDe;
    nameEn = stateDef.nameEn;
  } else if (rawValue !== undefined) {
    const t = typeof rawValue;
    type = t === "number" ? "number" : t === "boolean" ? "boolean" : "string";
    role = "value";
    nameDe = stateTitle;
    nameEn = stateTitle;
  } else {
    return;
  }

  await device.adapter.extendObject(
    `${productKey}.${deviceKey}.${stateTitle}`,
    {
      type: "state",
      common: {
        name: { de: nameDe, en: nameEn },
        type,
        desc: stateTitle,
        role,
        read: true,
        write: false,
        unit: stateDef?.unit,
        states: stateDef?.states,
      },
      native: {},
    },
  );

  if (!createdStateCache.has(deviceId)) {
    createdStateCache.set(deviceId, new Set());
  }
  createdStateCache.get(deviceId)!.add(stateTitle);
};

export const processDeviceProperties = async (
  device: ZenIobDevice,
  properties: ISolarFlowMqttProperties,
  isSolarFlow: boolean,
): Promise<void> => {
  // Phase 1: collect all transformed state values and control state values.
  // Side effects (setEnergyWhMax, setSocToZero, etc.) are triggered here.
  const statesToSet = new Map<string, number | string | boolean>();
  const controlStatesToSet = new Map<string, number | string | boolean>();

  if (properties?.autoModel != null) {
    statesToSet.set("autoModel", properties.autoModel);
    controlStatesToSet.set("autoModel", properties.autoModel);
  }

  if (properties?.heatState != null) {
    statesToSet.set("heatState", properties.heatState == 0 ? false : true);
  }

  if (properties?.electricLevel != null) {
    statesToSet.set("electricLevel", properties.electricLevel);

    if (
      device.adapter?.config.useCalculation &&
      properties.electricLevel == 100 &&
      isSolarFlow
    ) {
      device.setEnergyWhMax();
    }

    if (properties.electricLevel == 100) {
      const fullChargeNeeded = await device.adapter.getStateAsync(
        `${device.productKey}.${device.deviceKey}.control.fullChargeNeeded`,
      );
      if (fullChargeNeeded?.val == true) {
        await device.adapter.setState(
          `${device.productKey}.${device.deviceKey}.control.fullChargeNeeded`,
          false,
          true,
        );
      }
    }

    const minSoc = await device.adapter.getStateAsync(
      `${device.productKey}.${device.deviceKey}.minSoc`,
    );
    if (
      device.adapter?.config.useCalculation &&
      minSoc?.val &&
      properties.electricLevel == Number(minSoc.val) &&
      isSolarFlow
    ) {
      device.setSocToZero();
    }
  }

  if (properties?.packState != null) {
    statesToSet.set(
      "packState",
      properties.packState == 0
        ? "Idle"
        : properties.packState == 1
          ? "Charging"
          : properties.packState == 2
            ? "Discharging"
            : "Unknown",
    );
  }

  if (properties?.passMode != null) {
    statesToSet.set(
      "passMode",
      properties.passMode == 0
        ? "Automatic"
        : properties.passMode == 1
          ? "Always off"
          : properties.passMode == 2
            ? "Always on"
            : "Unknown",
    );
    controlStatesToSet.set("passMode", properties.passMode);
  }

  if (properties?.pass != null) {
    statesToSet.set("pass", properties.pass == 0 ? false : true);
  }

  if (properties?.autoRecover != null) {
    const value = properties.autoRecover == 0 ? false : true;
    statesToSet.set("autoRecover", value);
    controlStatesToSet.set("autoRecover", value);
  }

  if (properties?.outputHomePower != null) {
    statesToSet.set("outputHomePower", properties.outputHomePower);
  }

  if (properties?.energyPower != null) {
    statesToSet.set("energyPower", properties.energyPower);
  }

  if (properties?.outputLimit != null) {
    statesToSet.set("outputLimit", properties.outputLimit);
    controlStatesToSet.set("setOutputLimit", properties.outputLimit);
  }

  if (properties?.smartMode != null) {
    const value = properties.smartMode == 0 ? false : true;
    statesToSet.set("smartMode", value);
    controlStatesToSet.set("smartMode", value);
  }

  if (properties?.buzzerSwitch != null) {
    const value = properties.buzzerSwitch == 0 ? false : true;
    statesToSet.set("buzzerSwitch", value);
    controlStatesToSet.set("buzzerSwitch", value);
  }

  if (properties?.outputPackPower != null) {
    statesToSet.set("outputPackPower", properties.outputPackPower);
    if (properties.outputPackPower > 0) {
      statesToSet.set("packInputPower", 0);
    }
  }

  if (properties?.packInputPower != null) {
    statesToSet.set("packInputPower", properties.packInputPower);
    if (properties.packInputPower > 0) {
      statesToSet.set("outputPackPower", 0);
    }
  }

  if (properties?.solarInputPower != null) {
    statesToSet.set("solarInputPower", properties.solarInputPower);
  }

  // pvPower1/2 are reversed to align with the official app
  if (properties?.pvPower1 != null)
    statesToSet.set("pvPower2", properties.pvPower1);
  if (properties?.pvPower2 != null)
    statesToSet.set("pvPower1", properties.pvPower2);

  if (properties?.solarPower1 != null)
    statesToSet.set("pvPower1", properties.solarPower1);
  if (properties?.solarPower2 != null)
    statesToSet.set("pvPower2", properties.solarPower2);
  if (properties?.solarPower3 != null)
    statesToSet.set("pvPower3", properties.solarPower3);
  if (properties?.solarPower4 != null)
    statesToSet.set("pvPower4", properties.solarPower4);

  if (properties?.remainOutTime != null)
    statesToSet.set("remainOutTime", properties.remainOutTime);
  if (properties?.remainInputTime != null)
    statesToSet.set("remainInputTime", properties.remainInputTime);

  if (properties?.socSet != null) {
    statesToSet.set("socSet", Number(properties.socSet) / 10);
    controlStatesToSet.set("chargeLimit", Number(properties.socSet) / 10);
  }

  if (properties?.minSoc != null) {
    statesToSet.set("minSoc", Number(properties.minSoc) / 10);
    controlStatesToSet.set("dischargeLimit", Number(properties.minSoc) / 10);
  }

  if (properties?.inputLimit != null) {
    statesToSet.set("inputLimit", properties.inputLimit);
    controlStatesToSet.set("setInputLimit", properties.inputLimit);
  }

  if (properties?.gridInputPower != null)
    statesToSet.set("gridInputPower", properties.gridInputPower);

  if (properties?.acMode != null) {
    statesToSet.set("acMode", properties.acMode);
    controlStatesToSet.set("acMode", properties.acMode);
  }

  if (properties?.hyperTmp != null)
    statesToSet.set("hyperTmp", properties.hyperTmp / 10 - 273.15);
  if (properties?.acOutputPower != null)
    statesToSet.set("acOutputPower", properties.acOutputPower);
  if (properties?.gridPower != null)
    statesToSet.set("gridInputPower", properties.gridPower);

  if (properties?.acSwitch != null) {
    const value = properties.acSwitch == 0 ? false : true;
    statesToSet.set("acSwitch", value);
    controlStatesToSet.set("acSwitch", value);
  }

  if (properties?.dcSwitch != null) {
    const value = properties.dcSwitch == 0 ? false : true;
    statesToSet.set("dcSwitch", value);
    controlStatesToSet.set("dcSwitch", value);
  }

  if (properties?.dcOutputPower != null)
    statesToSet.set("dcOutputPower", properties.dcOutputPower);

  if (properties?.pvBrand != null) {
    statesToSet.set(
      "pvBrand",
      properties.pvBrand == 0
        ? "Others"
        : properties.pvBrand == 1
          ? "Hoymiles"
          : properties.pvBrand == 2
            ? "Enphase"
            : properties.pvBrand == 3
              ? "APSystems"
              : properties.pvBrand == 4
                ? "Anker"
                : properties.pvBrand == 5
                  ? "Deye"
                  : properties.pvBrand == 6
                    ? "Bosswerk"
                    : "Unknown",
    );
  }

  if (properties?.inverseMaxPower != null)
    statesToSet.set("inverseMaxPower", properties.inverseMaxPower);

  if (properties?.wifiState != null) {
    statesToSet.set("wifiState", properties.wifiState);
  }

  if (properties?.packNum != null)
    statesToSet.set("packNum", properties.packNum);

  if (properties?.hubState != null) {
    statesToSet.set("hubState", properties.hubState);
    controlStatesToSet.set("hubState", properties.hubState);
  }

  if (properties?.batteryElectric != null)
    statesToSet.set("batteryElectric", properties.batteryElectric);

  if (properties?.packData != null) {
    await device.addOrUpdatePackData(properties.packData, isSolarFlow);
  }

  // Derive packPower from outputPackPower and packInputPower
  if (statesToSet.has("outputPackPower") || statesToSet.has("packInputPower")) {
    let outputPower =
      (statesToSet.get("outputPackPower") as number | undefined) ?? 0;
    let inputPower =
      (statesToSet.get("packInputPower") as number | undefined) ?? 0;

    if (!statesToSet.has("outputPackPower")) {
      const s = await device.adapter.getStateAsync(
        `${device.productKey}.${device.deviceKey}.outputPackPower`,
      );
      outputPower = (s?.val as number) || 0;
    }
    if (!statesToSet.has("packInputPower")) {
      const s = await device.adapter.getStateAsync(
        `${device.productKey}.${device.deviceKey}.packInputPower`,
      );
      inputPower = (s?.val as number) || 0;
    }
    statesToSet.set("packPower", outputPower - inputPower);
  }

  // Phase 2: ensure states exist and set all collected values
  for (const [key, value] of statesToSet) {
    await ensureState(device, key, value);
    device.updateSolarFlowState(key, value);
  }

  // Phase 3: apply control state updates
  for (const [key, value] of controlStatesToSet) {
    device.updateSolarFlowControlState(key, value);
  }

  // Fallback: for any MQTT property not explicitly handled above, create a state and store the raw value
  for (const [key, value] of Object.entries(properties)) {
    if (handledMqttKeys.has(key)) continue;
    if (value == null || typeof value === "object") continue;

    const rawValue = value as number | string | boolean;
    await ensureState(device, key, rawValue);
    device.updateSolarFlowState(key, rawValue);

    if (device.adapter.log.level == "debug") {
      device.adapter.log.debug(
        `[onMessage] ${device.deviceKey}: ${key} = ${JSON.stringify(rawValue)} stored via fallback handler`,
      );
    }
  }
};
