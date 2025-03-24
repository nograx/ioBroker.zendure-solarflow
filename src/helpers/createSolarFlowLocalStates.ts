/* eslint-disable @typescript-eslint/indent */

import { ZendureSolarflow } from "../main";
import { ISolarflowState } from "../models/ISolarflowState";
import { createCalculationStates } from "./createCalculationStates";
import { createControlStates } from "./createControlStates";
import { getStateDefinition } from "./createSolarFlowStates";
//import { deleteCalculationStates } from "./deleteCalculationStates";

export const createSolarFlowLocalStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string
): Promise<void> => {
  productKey = productKey.replace(adapter.FORBIDDEN_CHARS, "");
  deviceKey = deviceKey.replace(adapter.FORBIDDEN_CHARS, "");

  let productName = "";
  let type = "";

  switch (productKey) {
    case "73bkTV":
      productName = "Hub 1200";
      type = "solarflow";
      break;
    case "A8yh63":
      productName = "Hub 2000";
      type = "solarflow";
      break;
    case "yWF7hV":
      productName = "AIO 2400";
      type = "aio";
      break;
    case "ja72U0ha":
      productName = "Hyper 2000";
      type = "hyper";
      break;
    case "gDa3tb":
      productName = "Hyper 2000";
      type = "hyper";
      break;
    case "8bM93H":
      productName = "ACE 1500";
      type = "ace";
      break;
    default:
      break;
  }

  adapter.log.debug(
    `[createSolarFlowLocalStates] Creating or updating SolarFlow states for ${productName} (${productKey}/${deviceKey}).`
  );

  // Create device (e.g. the product type -> SolarFlow)
  await adapter?.extendObject(productKey, {
    type: "device",
    common: {
      name: {
        de: `${productName} (${productKey})`,
        en: `${productName} (${productKey})`,
      },
    },
    native: {},
  });

  // Create channel (e.g. the device specific key)
  await adapter?.extendObject(productKey + "." + deviceKey, {
    type: "channel",
    common: {
      name: {
        de: `Device Key ${deviceKey}`,
        en: `Device Key ${deviceKey}`,
      },
    },
    native: {},
  });

  // Create pack data folder
  if (type != "smartPlug") {
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
  }

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
        states: state.states,
      },
      native: {},
    });
  });

  // Create control states only when using App MQTT servers - and not the fallback one!
  if (!adapter.config.useFallbackService) {
    await createControlStates(adapter, productKey, deviceKey, type);
  }

  if (adapter.config.useCalculation) {
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

    await createCalculationStates(adapter, productKey, deviceKey, type);
  } else {
    //await deleteCalculationStates(adapter, productKey, deviceKey);
  }
};
