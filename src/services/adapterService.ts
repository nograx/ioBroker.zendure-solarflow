import { ZendureSolarflow } from "../main";

/* eslint-disable @typescript-eslint/indent */

export const updateSolarFlowState = async (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  state: string,
  val: number | string,
): Promise<void> => {
  adapter?.setStateAsync(productKey + "." + deviceKey + "." + state, val, true);
};
