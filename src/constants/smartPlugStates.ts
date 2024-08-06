/* eslint-disable @typescript-eslint/indent */

import { ISolarflowState } from "../models/ISolarflowState";

export const smartPlugStates: ISolarflowState[] = [
  {
    title: "lastUpdate",
    nameDe: "Letztes Update",
    nameEn: "Last Update",
    type: "number",
    role: "value.time",
  },
];
