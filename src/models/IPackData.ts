export interface IPackData {
  sn: string;
  socLevel: number;
  maxTemp: number;
  minVol: number;
  maxVol: number;
  totalVol: number;
  soh: number;
  batcur: number;
  power?: number;
  /** Pack type code, only reported by some devices (e.g. 70 = I8000). */
  packType?: number;
  //softVersion: number
}
