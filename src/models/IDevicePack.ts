export interface IDevicePack {
  packSn: string;
  type: string;
  /** Nominal capacity (Wh), undefined for an unknown battery type. */
  capacityWh?: number;
}
