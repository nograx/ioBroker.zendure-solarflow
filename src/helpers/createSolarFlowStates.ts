/* eslint-disable @typescript-eslint/indent */

import { aceStates } from "../constants/aceStates";
import { aioStates } from "../constants/aioStates";
import { hubStates } from "../constants/hubStates";
import { hyperStates } from "../constants/hyperStates";
import { smartPlugStates } from "../constants/smartPlugStates";
import { ZendureSolarflow } from "../main";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";
import { ISolarflowState } from "../models/ISolarflowState";
import { updateSolarFlowState } from "../services/adapterService";
import { createCalculationStates } from "./createCalculationStates";
import { createControlStates } from "./createControlStates";
//import { deleteCalculationStates } from "./deleteCalculationStates";

export const getStateDefinition = (type: string): ISolarflowState[] => {
  switch (type) {
    case "aio":
      return aioStates;
    case "hyper":
      return hyperStates;
    case "solarflow":
      return hubStates;
    case "ace":
      return aceStates;
    case "smartPlug":
      return smartPlugStates;
    default:
      return [];
  }
};

export const createSolarFlowStates = async (
  adapter: ZendureSolarflow,
  device: ISolarFlowDeviceDetails,
  type: string
): Promise<void> => {
  let productKey = device.productKey.replace(adapter.FORBIDDEN_CHARS, "");
  let deviceKey = device.deviceKey.replace(adapter.FORBIDDEN_CHARS, "");

  if (device.productKey == "s3Xk4x" && adapter && adapter.userId && device.id) {
    productKey = adapter.userId;
    deviceKey = device.id.toString();
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

  // Set SOC from device
  if (device.electricity && type != "smartPlug") {
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
    type == "solarflow" &&
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

  if (type != "smartPlug") {
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
  }
};
