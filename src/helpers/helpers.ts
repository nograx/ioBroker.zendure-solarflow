import type { ZendureSolarflow } from "../main";
import { Ace1500 } from "../models/deviceModels/Ace1500";
import { Aio2400 } from "../models/deviceModels/Aio2400";
import { Hyper2000 } from "../models/deviceModels/Hyper2000";
import { Sf1600AcPlus } from "../models/deviceModels/Sf1600AcPlus";
import { Sf2400Ac } from "../models/deviceModels/Sf2400Ac";
import { Sf2400AcPlus } from "../models/deviceModels/Sf2400AcPlus";
import { Sf2400Pro } from "../models/deviceModels/Sf2400Pro";
import { Sf3000MixAcPlus } from "../models/deviceModels/Sf3000MixAcPlus";
import { Sf4000MixAcPlus } from "../models/deviceModels/Sf4000MixAcPlus";
import { Sf4000MixPro } from "../models/deviceModels/Sf4000MixPro";
import { Sf800 } from "../models/deviceModels/Sf800";
import { Sf800Plus } from "../models/deviceModels/Sf800Plus";
import { Sf800Pro } from "../models/deviceModels/Sf800Pro";
import { SfHub1200 } from "../models/deviceModels/SfHub1200";
import { SfHub2000 } from "../models/deviceModels/SfHub2000";
import { SmartMeter3Ct } from "../models/deviceModels/SmartMeter3Ct";
import { SmartMeterD0 } from "../models/deviceModels/SmartMeterD0";

import type { IZenIobDeviceDetails } from "../models/IZenIobDeviceDetails";

type ZenDeviceModel =
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
  | Sf3000MixAcPlus
  | Sf4000MixAcPlus
  | Sf4000MixPro
  | SmartMeter3Ct
  | SmartMeterD0;

type ZenDeviceModelCtor = new (
  adapter: ZendureSolarflow,
  productKey: string,
  deviceKey: string,
  productName: string,
  deviceName: string,
  zenHaDeviceDetails?: IZenIobDeviceDetails,
) => ZenDeviceModel;

interface ZenDeviceDefinition {
  /** productKey(s) as reported by the Zendure cloud API that identify this device. */
  productKeys: string[];
  /** Default product name, used when no zenHaDeviceDetails (with a productModel) is available. */
  productModel: string;
  ctor: ZenDeviceModelCtor;
  /**
   * Normalized model name(s) as they appear in a device's mDNS service name (e.g. "Zendure-solarFlow2400AC+-<serial>"
   * normalizes to "solarflow2400acplus"), used to identify zenSDK-compatible devices discovered via mDNS that are
   * not (yet) known from the cloud device list. Only relevant for devices that support local zenSDK control.
   */
  mdnsModelNames?: string[];
}

// Single source of truth for how a Zendure productKey (from the cloud API) or a mDNS-discovered device name maps to
// its device model class. Add a new device here once - both createDeviceModel (cloud/local config) and the mDNS
// auto-discovery of devices unknown to the cloud (see mdnsHelper.ts) read from this same list.
const deviceDefinitions: ZenDeviceDefinition[] = [
  {
    productKeys: ["73bktv"],
    productModel: "HUB 1200",
    ctor: SfHub1200,
  },
  {
    productKeys: ["a8yh63"],
    productModel: "HUB 2000",
    ctor: SfHub2000,
  },
  {
    productKeys: ["ywf7hv"],
    productModel: "AIO 2400",
    ctor: Aio2400,
  },
  {
    productKeys: ["ja72u0ha", "b3dxda", "gda3tb"],
    productModel: "Hyper 2000",
    ctor: Hyper2000,
  },
  {
    productKeys: ["8bm93h"],
    productModel: "Ace 1500",
    ctor: Ace1500,
  },
  {
    productKeys: ["64174u", "65174u"],
    productModel: "Solarflow 1600 AC+",
    ctor: Sf1600AcPlus,
    mdnsModelNames: ["solarflow1600acplus"],
  },
  {
    productKeys: ["5fg27j"],
    productModel: "Solarflow 2400 AC+",
    ctor: Sf2400AcPlus,
    mdnsModelNames: ["solarflow2400acplus"],
  },
  {
    productKeys: ["bc8b7f"],
    productModel: "Solarflow 2400 AC",
    ctor: Sf2400Ac,
    mdnsModelNames: ["solarflow2400ac"],
  },
  {
    productKeys: ["2qe7c9"],
    productModel: "Solarflow 2400 Pro",
    ctor: Sf2400Pro,
    mdnsModelNames: ["solarflow2400pro"],
  },
  {
    // No cloud productKey known for this device yet - it's only ever created via mDNS auto-discovery.
    productKeys: ["solarflow4000mixpro"],
    productModel: "Solarflow 4000 Mix Pro",
    ctor: Sf4000MixPro,
    mdnsModelNames: ["solarflow4000mixpro"],
  },
  {
    // No cloud productKey known for this device yet - it's only ever created via mDNS auto-discovery.
    productKeys: ["solarflow3000mixacplus"],
    productModel: "Solarflow 3000 Mix AC+",
    ctor: Sf3000MixAcPlus,
    mdnsModelNames: ["solarflow3000mixacplus"],
  },
  {
    // No cloud productKey known for this device yet - it's only ever created via mDNS auto-discovery.
    productKeys: ["solarflow4000mixacplus"],
    productModel: "Solarflow 4000 Mix AC+",
    ctor: Sf4000MixAcPlus,
    mdnsModelNames: ["solarflow4000mixacplus"],
  },
  {
    productKeys: ["a4ss5p", "b1nhmc"],
    productModel: "Solarflow 800",
    ctor: Sf800,
    mdnsModelNames: ["solarflow800"],
  },
  {
    productKeys: ["r3mn8u"],
    productModel: "Solarflow 800 Pro",
    ctor: Sf800Pro,
    mdnsModelNames: ["solarflow800pro"],
  },
  {
    productKeys: ["nvyeqm"],
    productModel: "Solarflow 800 Pro 2",
    ctor: Sf800Pro,
  },
  {
    productKeys: ["8n77v3"],
    productModel: "Solarflow 800 Plus",
    ctor: Sf800Plus,
    mdnsModelNames: ["solarflow800plus"],
  },
  {
    // No cloud productKey known for this accessory - it's only ever created via mDNS auto-discovery.
    productKeys: ["smartmeter3ct"],
    productModel: "Smart Meter 3CT",
    ctor: SmartMeter3Ct,
    mdnsModelNames: ["smartmeter3ct"],
  },
  {
    // No cloud productKey known for this accessory - it's only ever created via mDNS auto-discovery.
    productKeys: ["smartmeterd0"],
    productModel: "Smart Meter D0",
    ctor: SmartMeterD0,
    mdnsModelNames: ["meterreader"],
  },
];

function findDeviceDefinitionByProductKey(productKey: string): ZenDeviceDefinition | undefined {
  const normalizedProductKey = productKey.toLowerCase();
  return deviceDefinitions.find((definition) => definition.productKeys.includes(normalizedProductKey));
}

export const createDeviceModel = (
  _adapter: ZendureSolarflow,
  _productKey: string,
  _deviceKey: string,
  _zenHaDeviceDetails?: IZenIobDeviceDetails,
): ZenDeviceModel | undefined => {
  const definition = findDeviceDefinitionByProductKey(_productKey);

  if (!definition) {
    return undefined;
  }

  const productModel = _zenHaDeviceDetails?.productModel ?? definition.productModel;
  const deviceName = _zenHaDeviceDetails?.deviceName ?? definition.productModel;

  _adapter.log.debug(`[onReady] Creating deviceModel ${definition.productModel} ${_productKey}`);

  return new definition.ctor(_adapter, _productKey, _deviceKey, productModel, deviceName, _zenHaDeviceDetails);
};

/**
 * Looks up the productKey/productModel for a normalized mDNS model name (e.g. "solarflow2400acplus"), for devices
 * that support local zenSDK control and can therefore be created directly from a mDNS discovery, without being
 * known from the cloud device list.
 *
 * @param normalizedMdnsModelName the mDNS model name, normalized (lowercased, "+" replaced with "plus", all other
 * non-alphanumeric characters removed)
 */
export function findProductByMdnsModelName(
  normalizedMdnsModelName: string,
): { productKey: string; productModel: string } | undefined {
  const definition = deviceDefinitions.find((d) => d.mdnsModelNames?.includes(normalizedMdnsModelName));

  if (!definition) {
    return undefined;
  }

  return { productKey: definition.productKeys[0], productModel: definition.productModel };
}
