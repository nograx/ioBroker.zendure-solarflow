/* eslint-disable @typescript-eslint/indent */
// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
  namespace ioBroker {
    interface AdapterConfig {
      server: string; // EU, global or local mqtt
      userName: string;
      password: string;
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
      useFallbackService: boolean;
      snNumber: string;
    }
  }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
