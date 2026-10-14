import { hyperControlStates } from "../../constants/controlStates/hyperControlStates";
import { sharedControlStates } from "../../constants/controlStates/sharedControlStates";
import type { ZendureSolarflow } from "../../main";
import type { IZenIobDeviceDetails } from "../IZenIobDeviceDetails";
import { ZenIobDevice } from "./ZenIobDevice";

export class Hyper2000 extends ZenIobDevice {
  maxInputLimit = 1200;
  maxOutputLimit = 1200;
  canChargeByAc = true;

  controlStates = [...sharedControlStates, ...hyperControlStates];

  public constructor(
    _adapter: ZendureSolarflow,
    _productKey: string,
    _deviceKey: string,
    _productName: string,
    _deviceName: string,
    _zenHaDeviceDetails?: IZenIobDeviceDetails,
  ) {
    super(
      _adapter,
      _productKey,
      _deviceKey,
      _productName,
      _deviceName,
      false, // zenSDK not supported
      _zenHaDeviceDetails,
    );
  }

  /**
   * Total battery charge power (AC + solar input) per Zendure spec: 950W with one AB1000, 1200W with one AB2000,
   * 1600W with two or more batteries. Falls back to the lowest value while the batteries aren't known yet.
   */
  public override getMaxBatteryChargePower(): number {
    if (this.batteries.length >= 2) {
      return 1600;
    }
    if (this.batteries.length === 1 && this.batteries[0].type.includes("AB2000")) {
      return 1200;
    }
    return 950;
  }

  public setAcMode(acMode: number): void {
    if (this.productKey && this.deviceKey) {
      if (acMode >= 0 && acMode <= 3) {
        this.updateProperty("acMode", acMode);
      } else {
        this.adapter.log.error(`[setAcMode] AC mode must be a value between 0 and 3!`);
      }
    }
  }

  public setAcSwitch(acSwitch: boolean): void {
    if (this.productKey && this.deviceKey) {
      this.updateProperty("acSwitch", acSwitch ? 1 : 0);
    }
  }

  public async setDeviceAutomationInOutLimit(
    limit: number, // can be negative, negative will trigger charging mode
  ): Promise<void> {
    if (this.productKey && this.deviceKey) {
      this.adapter.log.debug(`[setDeviceAutomationInOutLimit] Set device Automation limit to ${limit}!`);

      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }

      if (this.adapter.config.useLowVoltageBlock) {
        const lowVoltageBlockState = await this.adapter.getStateAsync(
          `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`,
        );
        if (lowVoltageBlockState && lowVoltageBlockState.val && lowVoltageBlockState.val == true && limit > 0) {
          limit = 0;
        }

        const fullChargeNeeded = await this.adapter.getStateAsync(
          `${this.productKey}.${this.deviceKey}.control.fullChargeNeeded`,
        );

        if (fullChargeNeeded && fullChargeNeeded.val && fullChargeNeeded.val == true && limit > 0) {
          limit = 0;
        }
      }

      // Convert maxInputLimit to negative value and compare to limit
      if (limit < 0 && limit < -this.maxInputLimit) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] limit ${limit} is below the maximum input limit of ${this.maxInputLimit}, setting to ${-this.maxInputLimit}!`,
        );
        limit = -this.maxInputLimit;
      } else if (limit > this.maxOutputLimit) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] limit ${limit} is higher the maximum output limit of ${this.maxOutputLimit}, setting to ${this.maxOutputLimit}!`,
        );
        limit = this.maxOutputLimit;
      }

      await this.sendHemsEpSetpoint(limit);
    }
  }
}
