/* eslint-disable @typescript-eslint/indent */

import { aceStates } from "../constants/aceStates";
import { aioStates } from "../constants/aioStates";
import { hubStates } from "../constants/hubStates";
import { hyperStates } from "../constants/hyperStates";
import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import { ISolarflowState } from "../models/ISolarflowState";
import { updateSolarFlowState } from "../services/adapterService";
import { createCalculationStates } from "./createCalculationStates";
import { createControlStates } from "./createControlStates";
//import { deleteCalculationStates } from "./deleteCalculationStates";

const getStateDefinition = (type: string): ISolarflowState[] => {
  switch (type) {
    case "aio":
      return aioStates;
    case "hyper":
      return hyperStates;
    case "solarflow":
      return hubStates;
    case "ace":
      return aceStates;
    default:
      return [];
  }
};

export const createSolarFlowStates = async (
  adapter: ZendureSolarflow,
  device: ISolarFlowDeviceDetails,
  type: string
): Promise<void> => {
  const productKey = device.productKey.replace(adapter.FORBIDDEN_CHARS, "");
  const deviceKey = device.deviceKey.replace(adapter.FORBIDDEN_CHARS, "");

  adapter.log.debug(
    `[createSolarFlowStates] Creating or updating SolarFlow states for ${device.productName} (${productKey}/${deviceKey}) and name '${device.name}'.`
  );

  // Create device (e.g. the product type -> SolarFlow)
  await adapter?.extendObject(productKey, {
    type: "device",
    common: {
      name: {
        de: `${device.productName} (${productKey})`,
        en: `${device.productName} (${productKey})`,
      },
    },
    native: {},
  });

  // Create channel (e.g. the device specific key)
  await adapter?.extendObject(productKey + "." + deviceKey, {
    type: "channel",
    common: {
      name: { de: "Device Key " + deviceKey, en: "Device Key " + deviceKey },
    },
    native: {},
  });

  // Create calculations folder
  await adapter?.extendObject(`${productKey}.${deviceKey}.calculations`, {
    type: "channel",
    common: {
      name: {
        de: "Berechnungen für Gerät " + deviceKey,
        en: "Calculations for Device " + deviceKey,
      },
    },
    native: {},
  });

  // Create pack data folder
  await adapter?.extendObject(`${productKey}.${deviceKey}.packData`, {
    type: "channel",
    common: {
      name: {
        de: "Batterie Packs",
        en: "Battery packs",
      },
    },
    native: {},
  });

  const states = getStateDefinition(type);

  states.forEach(async (state: ISolarflowState) => {
    await adapter?.extendObject(`${productKey}.${deviceKey}.${state.title}`, {
      type: "state",
      common: {
        name: {
          de: state.nameDe,
          en: state.nameEn,
        },
        type: state.type,
        desc: state.title,
        role: state.role,
        read: true,
        write: false,
        unit: state.unit,
      },
      native: {},
    });
  });

  // Set sn number from device
  if (device.electricity) {
    await updateSolarFlowState(
      adapter,
      device.productKey,
      device.deviceKey,
      "electricLevel",
      device.electricity
    );
  }

  // Set sn number from device
  if (device.snNumber) {
    await updateSolarFlowState(
      adapter,
      device.productKey,
      device.deviceKey,
      "snNumber",
      device.snNumber.toString()
    );
  }

  // Set product name from device
  await updateSolarFlowState(
    adapter,
    device.productKey,
    device.deviceKey,
    "productName",
    device.productName
  );

  // Set wifi state from device
  await updateSolarFlowState(
    adapter,
    device.productKey,
    device.deviceKey,
    "wifiState",
    device.wifiStatus ? "Connected" : "Disconnected"
  );

  // Create control states only when using App MQTT servers - and not the fallback one!
  if (!adapter.config.useFallbackService) {
    await createControlStates(adapter, productKey, deviceKey, type);
  }

  if (
    adapter.config.useCalculation &&
    (type == "solarflow" || type == "hyper")
  ) {
    await createCalculationStates(adapter, productKey, deviceKey);
  } else {
    //await deleteCalculationStates(adapter, productKey, deviceKey);
  }
};
