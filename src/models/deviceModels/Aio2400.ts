import { aioControlStates } from "../../constants/aioControlStates";
import { aioStates } from "../../constants/aioStates";
import { ZendureSolarflow } from "../../main";
import { IDeviceAutomationPayload } from "../IDeviceAutomationPayload";
import { IZenHaDeviceDetails } from "../IZenHaDeviceDetails";
import { ZenHaDevice } from "./ZenHaDevice";

export class Aio2400 extends ZenHaDevice {
  maxInputLimit = 0;
  maxOutputLimit = 1200;

  states = aioStates;
  controlStates = aioControlStates;

  public constructor(
    _adapter: ZendureSolarflow,
    _productKey: string,
    _deviceKey: string,
    _productName: string,
    _deviceName: string,
    _zenHaDeviceDetails?: IZenHaDeviceDetails
  ) {
    super(
      _adapter,
      _productKey,
      _deviceKey,
      _productName,
      _deviceName,
      _zenHaDeviceDetails
    );
  }

  public async setDeviceAutomationInOutLimit(
    limit: number // can be negative, negative will trigger charging mode
  ): Promise<void> {
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      this.adapter.log.debug(
        `[setDeviceAutomationInOutLimit] Set device Automation limit to ${limit}!`
      );

      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }

      if (this.adapter.config.useLowVoltageBlock) {
        const lowVoltageBlockState = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.lowVoltageBlock"
        );
        if (
          lowVoltageBlockState &&
          lowVoltageBlockState.val &&
          lowVoltageBlockState.val == true &&
          limit > 0
        ) {
          limit = 0;
        }

        const fullChargeNeeded = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.fullChargeNeeded"
        );

        if (
          fullChargeNeeded &&
          fullChargeNeeded.val &&
          fullChargeNeeded.val == true &&
          limit > 0
        ) {
          limit = 0;
        }
      }

      if (limit < 0) {
        this.adapter.log.debug(
          `[setDeviceAutomationInOutLimit] AIO 2400 can not charge by AC!`
        );
        return;
      } else {
        if (limit > this.maxOutputLimit) {
          limit = this.maxOutputLimit;
        }
      }

      if (
        limit < 100 &&
        limit != 90 &&
        limit != 60 &&
        limit != 30 &&
        limit != 0
      ) {
        // NUR Solarflow HUB: Das Limit kann unter 100 nur in 30er Schritten gesetzt werden, dH. 30/60/90/100, wir rechnen das also um
        if (limit < 100 && limit > 90) {
          limit = 90;
        } else if (limit > 60 && limit < 90) {
          limit = 60;
        } else if (limit > 30 && limit < 60) {
          limit = 30;
        } else if (limit < 30) {
          limit = 30;
        }
      }

      this.adapter.msgCounter += 1;

      const timestamp = new Date();
      timestamp.setMilliseconds(0);

      let _arguments: IDeviceAutomationPayload[] = [];

      // Output
      this.adapter.log.debug(
        `[setDeviceAutomationInOutLimit] Using FEED IN variant of AIO device automation, as device '${this.productKey}' detected and limit is positive!`
      );
      _arguments = [
        {
          autoModelProgram: 2,
          autoModelValue: limit,
          msgType: 1,
          autoModel: 8,
        },
      ];

      const deviceAutomation = {
        arguments: _arguments,
        function: "deviceAutomation",
        messageId: this.adapter.msgCounter,
        deviceKey: this.deviceKey,
        timestamp: timestamp.getTime() / 1000,
      };
      this.adapter.mqttClient?.publish(
        this.functionTopic,
        JSON.stringify(deviceAutomation)
      );
    }
  }
}
