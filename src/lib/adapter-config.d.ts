// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
  namespace ioBroker {
    interface AdapterConfig {
      connectionMode; // "authKey" (Cloud), "local" (local MQTT) or "zenSDK" (zenSDK / mDNS only, no Cloud or MQTT)
      useZenSDK: boolean;
      useMdnsDiscovery: boolean;
      zenSdkDeviceIps: string[]; // IP addresses / host names of zenSDK devices, connected without mDNS
      useAddionalLocalMqtt: boolean;
      relayMqttToCloud: boolean;
      authorizationCloudKey: string;
      localMqttUrl: string;
      localMqttSSL: boolean;
      localMqttAcceptSelfSignedSSL: boolean;
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
      enableAutomation: boolean;
      automationTriggerStateId: string;
    }
  }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
