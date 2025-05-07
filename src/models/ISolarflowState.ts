/* eslint-disable @typescript-eslint/indent */
export interface ISolarflowState {
  title: string;
  nameDe: string;
  nameEn: string;
  role: string;
  min?: number; // Minimalwert
  max?: number; // Maximalwert
  step?: number; // Schrittweite
  read?: boolean; // Lesezugriff
  write?: boolean; // Schreibzugriff
  type: ioBroker.CommonType; // Datentyp
  unit?: string;
  states?: string | string[] | Record<string, string> | undefined;
}
