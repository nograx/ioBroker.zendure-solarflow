/* eslint-disable @typescript-eslint/indent */
export interface ISolarFlowDevRegisterResponse {
  code: number;
  success: boolean;
  data: ISolarFlowDevRegisterData;
  msg: string;
}

export interface ISolarFlowDevRegisterData {
  appKey: string;
  secret: string;
  mqttUrl: string;
  port: number;
}
