// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
  namespace ioBroker {
    interface AdapterConfig {
      connectionMode: "authKey" | "local" | "manualIps"; // Cloud (api key), local MQTT or manual IP list
      useZenSDK: boolean;
      useAddionalLocalMqtt: boolean;
      relayMqttToCloud: boolean;
      authorizationCloudKey: string;
      manualDeviceIps: string;
      localMqttUrl: string;
      localMqttPort: number;
      localDevice1ProductKey: string;
      localDevice1DeviceKey: string;
      localDevice2ProductKey: string;
      localDevice2DeviceKey: string;
      localDevice3ProductKey: string;
      localDevice3DeviceKey: string;
      localDevice4ProductKey: string;
      localDevice4DeviceKey: string;
      useCalculation: boolean;
      useLowVoltageBlock: boolean;
      forceShutdownOnLowVoltage: boolean;
      fullChargeIfNeeded: boolean;
      dischargeLimit: number;
      useRestart: boolean;
    }
  }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
