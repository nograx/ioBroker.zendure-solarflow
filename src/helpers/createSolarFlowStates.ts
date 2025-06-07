/* eslint-disable @typescript-eslint/indent */

import { ac2400States } from "../constants/ac2400States";
import { aceStates } from "../constants/aceStates";
import { aioStates } from "../constants/aioStates";
import { hubStates } from "../constants/hubStates";
import { hyperStates } from "../constants/hyperStates";
import { solarflow800ProStates } from "../constants/solarflow800ProStates";
import { solarflow800States } from "../constants/solarflow800States";
import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import { ISolarflowState } from "../models/ISolarflowState";
import { updateSolarFlowState } from "../services/adapterService";
import { createCalculationStates } from "./createCalculationStates";
import { createControlStates } from "./createControlStates";
//import { deleteCalculationStates } from "./deleteCalculationStates";

export const getStateDefinition = (productName: string): ISolarflowState[] => {
  switch (productName.toLocaleLowerCase()) {
    case "hyper 2000":
      return hyperStates;
    case "solarflow 800":
      return solarflow800States;
    case "solarflow2.0":
      return hubStates;
    case "solarflow hub 2000":
      return hubStates;
    case "solarflow aio zy":
      return aioStates;
    case "ace 1500":
      return aceStates;
    case "solarflow 800 pro":
      return solarflow800ProStates;
    case "solarflow 2400 ac":
      return ac2400States;
    default:
      return [];
  }
};

export const createSolarFlowStates = async (
  adapter: ZendureSolarflow,
  device: ISolarFlowDeviceDetails
): Promise<void> => {
  const productKey = device.productKey.replace(adapter.FORBIDDEN_CHARS, "");
  const deviceKey = device.deviceKey.replace(adapter.FORBIDDEN_CHARS, "");

  if (
    device.productKey ==
    "s3Xk4x" /*  && adapter && adapter.userId && device.id */
  ) {
    adapter.log.debug(`[createSolarFlowStates] Smart Plug not supported.`);
    return;
    // productKey = adapter.userId;
    // deviceKey = device.id.toString();
  }

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
      name: {
        de: `${device.name} (${deviceKey})`,
        en: `${device.name} (${deviceKey})`,
      },
    },
    native: {},
  });

  // Create pack data folder
  if (!device.productName.toLocaleLowerCase().includes("smart plug")) {
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

  const states = getStateDefinition(device.productName);

  if (states.length == 0) {
    adapter.log.error(
      `[createSolarFlowLocalStates] Unknown product (${device.productName}). We cannot create control states! Please contact the developer!`
    );
    return;
  }

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

  // Set SOC from device
  if (
    device.electricity &&
    !device.productName.toLocaleLowerCase().includes("smart plug")
  ) {
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
      productKey,
      deviceKey,
      "snNumber",
      device.snNumber.toString()
    );
  }

  // Set the ACE connection info if is solarflow hub device
  if (
    (device.productName.toLocaleLowerCase() == "solarflow hub 2000" ||
      device.productName.toLocaleLowerCase() == "solarflow2.0") &&
    device._connectedWithAce != null &&
    device._connectedWithAce != undefined
  ) {
    await updateSolarFlowState(
      adapter,
      device.productKey,
      device.deviceKey,
      "connectedWithAce",
      device._connectedWithAce
    );
  }

  // Set product name from device
  await updateSolarFlowState(
    adapter,
    productKey,
    deviceKey,
    "productName",
    device.productName
  );

  // Set wifi state from device
  await updateSolarFlowState(
    adapter,
    productKey,
    deviceKey,
    "wifiState",
    device.wifiStatus ? "Connected" : "Disconnected"
  );

  if (!device.productName.toLocaleLowerCase().includes("smart plug")) {
    // Create control states only when using App MQTT servers - and not the fallback one!
    if (!adapter.config.useFallbackService) {
      await createControlStates(
        adapter,
        productKey,
        deviceKey,
        device.productName
      );
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

      await createCalculationStates(adapter, productKey, deviceKey);
    } else {
      //await deleteCalculationStates(adapter, productKey, deviceKey);
    }
  }
};
