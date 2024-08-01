/* eslint-disable @typescript-eslint/indent */
export interface ISolarflowState {
  title: string;
  nameDe: string;
  nameEn: string;
  role: string;
  type: ioBroker.CommonType; // Datentyp
  unit?: string;
}
