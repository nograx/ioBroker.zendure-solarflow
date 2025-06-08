/* eslint-disable @typescript-eslint/indent */

import { ZendureSolarflow } from "../main";
import { ISolarflowState } from "../models/ISolarflowState";
import { createCalculationStates } from "./createCalculationStates";
import { createControlStates } from "./createControlStates";
import { getStateDefinition } from "./createSolarFlowStates";
import { getProductNameFromProductKey } from "./helpers";
//import { deleteCalculationStates } from "./deleteCalculationStates";

export const createSolarFlowLocalStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string
): Promise<void> => {
  productKey = productKey.replace(adapter.FORBIDDEN_CHARS, "");
  deviceKey = deviceKey.replace(adapter.FORBIDDEN_CHARS, "");

  const productName = getProductNameFromProductKey(productKey);

  if (productName == "") {
    adapter.log.error(
      `[createSolarFlowLocalStates] Unknown product (${productKey}/${deviceKey}). We cannot create control states! Please contact the developer!`
    );
    return;
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
  if (productName?.toLowerCase().includes("smart plug")) {
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

  const states = getStateDefinition(productName);

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

  // Create control states
  await createControlStates(adapter, productKey, deviceKey, productName);

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

    await createCalculationStates(adapter, productKey, deviceKey);
  } else {
    //await deleteCalculationStates(adapter, productKey, deviceKey);
  }
};
