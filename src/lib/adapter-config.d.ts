/* eslint-disable @typescript-eslint/indent */
// This file extends the AdapterConfig type from "@types/iobroker"

// Augment the globally declared type ioBroker.AdapterConfig
declare global {
  namespace ioBroker {
    interface AdapterConfig {
      server: string; // EU or global
      userName: string;
      password: string;
      useCalculation: boolean;
      useLowVoltageBlock: boolean;
    }
  }
}

// this is required so the above AdapterConfig is found by TypeScript / type checking
export {};
