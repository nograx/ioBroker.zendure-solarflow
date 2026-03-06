/* eslint-disable @typescript-eslint/indent */

import { ZendureSolarflow } from "../main";
import { Ace1500 } from "../models/deviceModels/Ace1500";
import { Aio2400 } from "../models/deviceModels/Aio2400";
import { Hyper2000 } from "../models/deviceModels/Hyper2000";
import { Sf1600AcPlus } from "../models/deviceModels/Sf1600AcPlus";
import { Sf2400Ac } from "../models/deviceModels/Sf2400Ac";
import { Sf2400AcPlus } from "../models/deviceModels/Sf2400AcPlus";
import { Sf2400Pro } from "../models/deviceModels/Sf2400Pro";
import { Sf800 } from "../models/deviceModels/Sf800";
import { Sf800Plus } from "../models/deviceModels/Sf800Plus";
import { Sf800Pro } from "../models/deviceModels/Sf800Pro";
import { SfHub1200 } from "../models/deviceModels/SfHub1200";
import { SfHub2000 } from "../models/deviceModels/SfHub2000";

import { IZenIobDeviceDetails } from "../models/IZenIobDeviceDetails";

export const createDeviceModel = (
  _adapter: ZendureSolarflow,
  _productKey: string,
  _deviceKey: string,
  _zenHaDeviceDetails?: IZenIobDeviceDetails,
):
  | SfHub1200
  | SfHub2000
  | Ace1500
  | Hyper2000
  | Sf2400Ac
  | Sf800
  | Sf800Pro
  | Sf800Plus
  | Sf1600AcPlus
  | Sf2400AcPlus
  | Sf2400Pro
  | undefined => {
  switch (_productKey.toLowerCase()) {
    case "73bktv":
      _adapter.log.debug(
        `[onReady] Creating deviceModel HUB 1200 ${_productKey}`,
      );
      return new SfHub1200(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "HUB 1200",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "HUB 1200",
        _zenHaDeviceDetails,
      );
    case "a8yh63":
      _adapter.log.debug(
        `[onReady] Creating deviceModel HUB 2000 ${_productKey}`,
      );
      return new SfHub2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "HUB 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "HUB 2000",
        _zenHaDeviceDetails,
      );
    case "ywf7hv":
      _adapter.log.debug(
        `[onReady] Creating deviceModel AIO 2400 ${_productKey}`,
      );
      return new Aio2400(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "AIO 2400",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "AIO 2400",
        _zenHaDeviceDetails,
      );
    case "ja72u0ha":
      _adapter.log.debug(
        `[onReady] Creating deviceModel Hyper 2000 ${_productKey}`,
      );
      return new Hyper2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Hyper 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Hyper 2000",
        _zenHaDeviceDetails,
      );
    case "gda3tb":
      _adapter.log.debug(
        `[onReady] Creating deviceModel Hyper 2000 ${_productKey}`,
      );
      return new Hyper2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Hyper 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Hyper 2000",
        _zenHaDeviceDetails,
      );
    case "b3dxda":
      _adapter.log.debug(
        `[onReady] Creating deviceModel Hyper 2000 ${_productKey}`,
      );
      return new Hyper2000(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Hyper 2000",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Hyper 2000",
        _zenHaDeviceDetails,
      );
    case "8bm93h":
      _adapter.log.debug(
        `[onReady] Creating deviceModel ACE 1500 ${_productKey}`,
      );
      return new Ace1500(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails ? _zenHaDeviceDetails.productModel : "Ace 1500",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Ace 1500",
        _zenHaDeviceDetails,
      );
    case "65174u":
      _adapter.log.debug(
        `[onReady] Creating deviceModel Solarflow 1600 AC+ ${_productKey}`,
      );
      return new Sf1600AcPlus(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 1600 AC+",
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.deviceName
          : "Solarflow 1600 AC+",
        _zenHaDeviceDetails,
      );
    case "5fg27j":
      _adapter.log.debug(
        `[onReady] Creating deviceModel SF 2400 AC+ ${_productKey}`,
      );
      return new Sf2400AcPlus(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 2400 AC+",
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.deviceName
          : "Solarflow 2400 AC+",
        _zenHaDeviceDetails,
      );
    case "bc8b7f":
      _adapter.log.debug(
        `[onReady] Creating deviceModel SF 2400 AC ${_productKey}`,
      );
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
        _zenHaDeviceDetails,
      );
    case "2qe7c9":
      _adapter.log.debug(
        `[onReady] Creating deviceModel SF 2400 Pro ${_productKey}`,
      );
      return new Sf2400Pro(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 2400 Pro",
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.deviceName
          : "Solarflow 2400 Pro",
        _zenHaDeviceDetails,
      );
    case "a4ss5p":
      _adapter.log.debug(
        `[onReady] Creating deviceModel SF 800 ${_productKey}`,
      );
      return new Sf800(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 800",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Solarflow 800",
        _zenHaDeviceDetails,
      );
    case "b1nhmc":
      _adapter.log.debug(
        `[onReady] Creating deviceModel SF 800 ${_productKey}`,
      );
      return new Sf800(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 800",
        _zenHaDeviceDetails ? _zenHaDeviceDetails.deviceName : "Solarflow 800",
        _zenHaDeviceDetails,
      );
    case "r3mn8u":
      _adapter.log.debug(
        `[onReady] Creating deviceModel SF 800 Pro ${_productKey}`,
      );
      return new Sf800Pro(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 800 Pro",
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.deviceName
          : "Solarflow 800 Pro",
        _zenHaDeviceDetails,
      );
    case "8n77v3":
      _adapter.log.debug(
        `[onReady] Creating deviceModel SF 800 Plus ${_productKey}`,
      );
      return new Sf800Plus(
        _adapter,
        _productKey,
        _deviceKey,
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.productModel
          : "Solarflow 800 Plus",
        _zenHaDeviceDetails
          ? _zenHaDeviceDetails.deviceName
          : "Solarflow 800 Plus",
        _zenHaDeviceDetails,
      );
    default:
      return undefined;
  }
};
