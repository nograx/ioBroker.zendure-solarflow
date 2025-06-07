/* eslint-disable @typescript-eslint/indent */

import { ac2400ControlStates } from "../constants/ac2400ControlStates";
import { aceControlStates } from "../constants/aceControlStates";
import { aioControlStates } from "../constants/aioControlStates";
import { hubControlStates } from "../constants/hubControlStates";
import { hyperControlStates } from "../constants/hyperControlStates";
import { solarflow800ControlStates } from "../constants/solarflow800ControlStates";
import { solarflow800ProControlStates } from "../constants/solarflow800ProControlStates";
import { ZendureSolarflow } from "../main";
import { ISolarflowState } from "../models/ISolarflowState";

export const getControlStateDefinition = (
  productName: string
): ISolarflowState[] => {
  switch (productName.toLocaleLowerCase()) {
    case "hyper 2000":
      return hyperControlStates;
    case "solarflow 800":
      return solarflow800ControlStates;
    case "solarflow2.0":
      return hubControlStates;
    case "solarflow hub 2000":
      return hubControlStates;
    case "solarflow aio zy":
      return aioControlStates;
    case "ace 1500":
      return aceControlStates;
    case "solarflow 800 pro":
      return solarflow800ProControlStates;
    case "solarflow 2400 ac":
      return ac2400ControlStates;
    default:
      return [];
  }
};

export const createControlStates = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  productName: string
): Promise<void> => {
  // Create control folder
  await adapter?.extendObject(`${productKey}.${deviceKey}.control`, {
    type: "channel",
    common: {
      name: {
        de: "Steuerung für Gerät " + deviceKey,
        en: "Control for device " + deviceKey,
      },
    },
    native: {},
  });

  const controlStateDefinitions = getControlStateDefinition(productName);

  controlStateDefinitions.forEach(async (state: ISolarflowState) => {
    await adapter?.extendObject(
      `${productKey}.${deviceKey}.control.${state.title}`,
      {
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
          write: true,
          unit: state.unit,
          states: state.states,
        },
        native: {},
      }
    );

    // Subscribe to state
    adapter?.subscribeStates(
      `${productKey}.${deviceKey}.control.${state.title}`
    );
  });
};
