import { DeviceConnectionMode } from "../../helpers/enums";
import type { ZendureSolarflow } from "../../main";
import type { IZenIobDeviceDetails } from "../IZenIobDeviceDetails";
import { ZenIobDevice } from "./ZenIobDevice";

/**
 * Intermediate class for devices that support zenSDK automation.
 * Contains the common zenSDK automation logic to avoid code duplication.
 */
export abstract class ZenSdkIobDevice extends ZenIobDevice {
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
      true, // use zenSDK for this device
      _zenHaDeviceDetails,
    );
  }

  private resetAcModeTimeout?: ioBroker.Timeout;
  private resetSmartModeTimeout?: ioBroker.Timeout;

  public async setDeviceAutomationInOutLimit(
    limit: number, // can be negative, negative will trigger charging mode
  ): Promise<void> {
    if (this.productKey && this.deviceKey) {
      this.adapter.log.debug(`[setDeviceAutomationInOutLimit] Set device Automation limit to ${limit}!`);

      if (this.resetAcModeTimeout) {
        this.adapter.clearTimeout(this.resetAcModeTimeout);
        this.resetAcModeTimeout = undefined;
      }

      if (this.resetSmartModeTimeout) {
        this.adapter.clearTimeout(this.resetSmartModeTimeout);
        this.resetSmartModeTimeout = undefined;
      }

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

      if (this.deviceConnectionMode == DeviceConnectionMode.zenSDK) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] Using zenSDK to set input/outputlimit in combination with acMode and smartMode!`,
        );

        const currentSmartMode = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.smartMode`);
        const currentAcMode = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.acMode`);
        const currentInputLimit = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.inputLimit`);
        const currentOutputLimit = await this.adapter.getStateAsync(`${this.productKey}.${this.deviceKey}.outputLimit`);

        const results: boolean[] = [];

        if (limit < 0) {
          // Charging mode
          if (currentAcMode && currentAcMode.val != 1) {
            results.push(await this.updateProperty("acMode", 1));
          }

          if (currentSmartMode && currentSmartMode.val != 1) {
            results.push(await this.updateProperty("smartMode", 1));
          }

          if (currentOutputLimit && currentOutputLimit.val != 0) {
            results.push(await this.updateProperty("outputLimit", 0));
          }

          if (currentInputLimit && currentInputLimit.val != Math.abs(limit)) {
            results.push(await this.updateProperty("inputLimit", Math.abs(limit)));
          }
        } else if (limit > 0) {
          // Discharging mode
          if (currentAcMode && currentAcMode.val != 2) {
            results.push(await this.updateProperty("acMode", 2));
          }

          if (currentSmartMode && currentSmartMode.val != 1) {
            results.push(await this.updateProperty("smartMode", 1));
          }

          if (currentOutputLimit && currentOutputLimit.val != limit) {
            results.push(await this.updateProperty("outputLimit", limit));
          }

          if (currentInputLimit && currentInputLimit.val != 0) {
            results.push(await this.updateProperty("inputLimit", 0));
          }
        } else {
          // no limit -> Standby
          if (currentOutputLimit && currentOutputLimit.val != 0) {
            results.push(await this.updateProperty("outputLimit", 0));
          }

          if (currentInputLimit && currentInputLimit.val != 0) {
            results.push(await this.updateProperty("inputLimit", 0));
          }

          this.resetAcModeTimeout = this.adapter.setTimeout(async () => {
            this.resetAcModeTimeout = undefined;
            if (currentAcMode && currentAcMode.val != 0) {
              results.push(await this.updateProperty("acMode", 0));
            }
          }, 2000);

          this.resetSmartModeTimeout = this.adapter.setTimeout(async () => {
            this.resetSmartModeTimeout = undefined;
            if (currentSmartMode && currentSmartMode.val != 0) {
              results.push(await this.updateProperty("smartMode", 0));
            }
          }, 4000);
        }

        // Check if all updates were successful
        const success = results.every((result) => result === true);

        if (success) {
          await this?.updateSolarFlowControlState("setDeviceAutomationInOutLimit", limit);
        }
      } else {
        // Device Automation for HEMS devices
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] Using HEMS Variant of device automation, as deviceKey '${this.deviceKey}' detected!`,
        );
        await this.sendHemsEpSetpoint(limit);
      }
    }
  }
}
