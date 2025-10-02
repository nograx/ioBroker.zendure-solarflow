/* eslint-disable @typescript-eslint/indent */

import { ZendureSolarflow } from "../main";
import { Ace1500 } from "../models/deviceModels/Ace1500";
import { Aio2400 } from "../models/deviceModels/Aio2400";
import { Hyper2000 } from "../models/deviceModels/Hyper2000";
import { Sf2400Ac } from "../models/deviceModels/Sf2400Ac";
import { Sf800 } from "../models/deviceModels/Sf800";
import { SfHub1200 } from "../models/deviceModels/SfHub1200";
import { SfHub2000 } from "../models/deviceModels/SfHub2000";

import { IZenHaDeviceDetails } from "../models/IZenHaDeviceDetails";

export const createDeviceModel = (
  _adapter: ZendureSolarflow,
  _productKey: string,
  _deviceKey: string,
  _zenHaDeviceDetails?: IZenHaDeviceDetails
): Ace1500 | Hyper2000 | Sf2400Ac | undefined => {
  switch (_productKey.toLowerCase()) {
    case "73bktv":
      return new SfHub1200(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "HUB 1200",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "HUB 1200",
        _zenHaDeviceDetails
      );
    case "a8yh63":
      return new SfHub2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "HUB 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "HUB 2000",
        _zenHaDeviceDetails
      );
    case "ywf7hv":
      return new Aio2400(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "AIO 2400",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "AIO 2400",
        _zenHaDeviceDetails
      );
    case "ja72u0ha":
      return new Hyper2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Hyper 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Hyper 2000",
        _zenHaDeviceDetails
      );
    case "gda3tb":
      return new Hyper2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Hyper 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Hyper 2000",
        _zenHaDeviceDetails
      );
    case "b3dxda":
      return new Hyper2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Hyper 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Hyper 2000",
        _zenHaDeviceDetails
      );
    case "8bm93h":
      return new Ace1500(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Ace 1500",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Ace 1500",
        _zenHaDeviceDetails
      );
    case "bc8b7f":
      return new Sf2400Ac(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 2400 AC",
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.deviceName
          : "Solarflow 2400 AC",
        _zenHaDeviceDetails
      );
    case "a4ss5P":
      return new Sf800(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 800",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Solarflow 800",
        _zenHaDeviceDetails
      );
    case "b1nhmc":
      return new Sf800(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 800",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Solarflow 800",
        _zenHaDeviceDetails
      );
    case "R3mn8U":
      return new Sf800(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 800",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Solarflow 800",
        _zenHaDeviceDetails
      );
    default:
      return undefined;
  }
};
