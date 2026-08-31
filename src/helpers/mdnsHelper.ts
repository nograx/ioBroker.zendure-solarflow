import Bonjour from "bonjour-service";
import { createDeviceModel, findProductByMdnsModelName } from "./helpers";
import type { IZenIobDeviceDetails } from "../models/IZenIobDeviceDetails";
import type { ZendureSolarflow } from "../main";

const ZENDURE_DEVICE_NAME_PREFIX = "Zendure-";
const DISCOVERY_DURATION_MS = 10000;

function normalizeModelName(modelName: string): string {
  return modelName
    .toLowerCase()
    .replace(/\+/g, "plus")
    .replace(/[^a-z0-9]/g, "");
}

/**
 * Splits a "Zendure-<model>-<serialNumber>" service name (e.g. "Zendure-solarFlow2400AC+-HEC4NENAN430035")
 * into its model and serial number parts. The serial number never contains a dash, so the last dash in the
 * (prefix-stripped) name is used as the separator.
 *
 * @param serviceName the full mDNS service name, including the "Zendure-" prefix
 */
function extractModelAndSerial(serviceName: string): { modelName: string; snNumber: string } | undefined {
  const withoutPrefix = serviceName.slice(ZENDURE_DEVICE_NAME_PREFIX.length);
  const lastDashIndex = withoutPrefix.lastIndexOf("-");

  if (lastDashIndex <= 0 || lastDashIndex >= withoutPrefix.length - 1) {
    return undefined;
  }

  return {
    modelName: withoutPrefix.slice(0, lastDashIndex),
    snNumber: withoutPrefix.slice(lastDashIndex + 1),
  };
}

/**
 * Creates a new device model for a device that was discovered via mDNS but is not (yet) known from the
 * cloud device list (e.g. no cloud account configured, or the device was not yet synced to the cloud). The
 * device's serial number is used as its deviceKey, since no cloud-assigned deviceKey is available for it.
 *
 * @param adapter the adapter instance, used for logging and to register the new device
 * @param serviceName the full mDNS service name the device was discovered with
 * @param ipAddress the IP address the device was discovered at
 */
function createDeviceFromMdns(adapter: ZendureSolarflow, serviceName: string, ipAddress: string): void {
  const parsed = extractModelAndSerial(serviceName);

  if (!parsed) {
    return;
  }

  if (adapter.zenIobDeviceList.some((x) => x.snNumber?.toUpperCase() === parsed.snNumber.toUpperCase())) {
    // Already created for a previous mDNS announcement of the same device in this discovery run
    return;
  }

  const product = findProductByMdnsModelName(normalizeModelName(parsed.modelName));

  if (!product) {
    adapter.log.warn(
      `[mdnsHelper] Discovered Zendure device '${serviceName}' via mDNS, but its model '${parsed.modelName}' is not known and can't be created automatically. Please connect it via the Zendure Cloud instead!`,
    );
    return;
  }

  adapter.log.info(
    `[mdnsHelper] Creating new device for mDNS-discovered device '${serviceName}' (model: ${product.productModel}, serial: ${parsed.snNumber}) at IP ${ipAddress}!`,
  );

  const zenHaDeviceDetails: IZenIobDeviceDetails = {
    deviceKey: parsed.snNumber,
    deviceName: product.productModel,
    enable: true,
    ip: ipAddress,
    lcnSupport: 0,
    online: true,
    password: "",
    port: 0,
    productKey: product.productKey,
    productModel: product.productModel,
    protocol: "",
    server: "",
    snNumber: parsed.snNumber,
    username: "",
  };

  const deviceModel = createDeviceModel(adapter, product.productKey, parsed.snNumber, zenHaDeviceDetails);

  if (deviceModel) {
    adapter.zenIobDeviceList.push(deviceModel);
  } else {
    adapter.log.error(`[mdnsHelper] Error creating device model for mDNS-discovered device '${serviceName}'!`);
  }
}

/**
 * Browses the local network via mDNS for a fixed duration. Every discovered device whose
 * service name starts with "Zendure-" (e.g. "Zendure-SolarFlow800-<serialNumber>") is matched
 * against the known devices in adapter.zenIobDeviceList by comparing its full serial number
 * (parsed from the service name) against each device's snNumber. A suffix/MAC-based match is
 * not safe here, as some Zendure serial numbers share an identical tail and only differ in a
 * short prefix. On a match, the device's ipAddress is corrected if needed and it is switched
 * to a zenSDK connection instead of Cloud/MQTT. If no match is found, a new device is created
 * directly from the mDNS name (using its serial number as deviceKey), provided its model is
 * a known zenSDK-compatible device.
 *
 * @param adapter the adapter instance, used for logging and device lookup
 */
export function discoverZendureDevicesViaMdns(adapter: ZendureSolarflow): void {
  adapter.log.info(`[mdnsHelper] Starting mDNS discovery of Zendure devices for ${DISCOVERY_DURATION_MS / 1000}s!`);

  const bonjour = new Bonjour(undefined, (err: Error) => {
    adapter.log.warn(`[mdnsHelper] mDNS error: ${err.message}`);
  });

  let foundCount = 0;

  const browser = bonjour.find(null, (service) => {
    if (!service.name?.startsWith(ZENDURE_DEVICE_NAME_PREFIX)) {
      return;
    }

    foundCount++;

    adapter.log.info(
      `[mdnsHelper] Found Zendure device via mDNS: ${service.name} (host: ${service.host}, addresses: ${service.addresses?.join(", ")})`,
    );

    const ipAddress = service.addresses?.find((address) => address.includes(".")) ?? service.addresses?.[0];

    if (!ipAddress) {
      return;
    }

    const parsed = extractModelAndSerial(service.name);

    if (!parsed) {
      return;
    }

    const device = adapter.zenIobDeviceList.find((x) => x.snNumber?.toUpperCase() === parsed.snNumber.toUpperCase());

    if (device) {
      adapter.log.debug(
        `[mdnsHelper] Matched mDNS device ${service.name} to known device with snNumber ${device.snNumber} via IP ${ipAddress}!`,
      );

      device.connectViaMdns(ipAddress, service.name, service.host);
      return;
    }

    createDeviceFromMdns(adapter, service.name, ipAddress);
  });

  adapter.setTimeout(() => {
    browser.stop();
    bonjour.destroy();

    adapter.log.info(
      `[mdnsHelper] Finished mDNS discovery of Zendure devices, found ${foundCount} device(s) via mDNS!`,
    );
  }, DISCOVERY_DURATION_MS);
}
