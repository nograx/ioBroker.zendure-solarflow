import { ISolarFlowPaths } from "../models/ISolarFlowPaths";

/* eslint-disable @typescript-eslint/indent */
const hostname = `app.zendure.tech`;
const versionGlobal = `v2`;
const versionEu = `eu`; // currently not used! Only the global server is ready at the moment

const solarFlowDevRegisterPath = `developer/api/apply`;
const solarFlowTokenPath = `auth/app/token`;
const solarFlowDeviceListPath = `productModule/device/queryDeviceListByConsumerId`;

export const pathsGlobal: ISolarFlowPaths = {
  solarFlowDevRegisterUrl: `https://${hostname}/${versionGlobal}/${solarFlowDevRegisterPath}`,
  solarFlowTokenUrl: `https://${hostname}/${versionGlobal}/${solarFlowTokenPath}`,
  solarFlowQueryDeviceListUrl: `https://${hostname}/${versionGlobal}/${solarFlowDeviceListPath}`,
  mqttUrl: "mq.zen-iot.com",
  mqttPort: 1883,
  mqttPassword: "b0sjUENneTZPWnhk",
};

export const pathsEu: ISolarFlowPaths = {
  solarFlowDevRegisterUrl: `https://${hostname}/${versionEu}/${solarFlowDevRegisterPath}`,
  solarFlowTokenUrl: `https://${hostname}/${versionEu}/${solarFlowTokenPath}`,
  solarFlowQueryDeviceListUrl: `https://${hostname}/${versionEu}/${solarFlowDeviceListPath}`,
  mqttUrl: "mqtteu.zen-iot.com",
  mqttPort: 1883,
  mqttPassword: "SDZzJGo5Q3ROYTBO",
};
