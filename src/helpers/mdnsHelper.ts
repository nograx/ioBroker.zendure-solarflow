import type Bonjour from "bonjour-service";
import { createDeviceModel, findProductByMdnsModelName } from "./helpers";
import { reportErrorToSentry } from "./sentryHelper";
import type { IZenIobDeviceDetails } from "../models/IZenIobDeviceDetails";
import type { ZendureSolarflow } from "../main";

const ZENDURE_DEVICE_NAME_PREFIX = "Zendure-";

// Service names already reported to Sentry - a device is announced again on every mDNS query, so without
// this the same problem would be reported over and over while the adapter is running.
const reportedToSentry = new Set<string>();

// Serial numbers (upper case) of devices currently being created - createZenSdkDevice is async, and the same
// device may be announced again (or found via its configured IP) before its creation has finished.
const devicesInCreation = new Set<string>();

/**
 * Reports a problem with an mDNS-discovered or IP-configured device to Sentry (like unknown devices from the cloud device
 * list in main.ts), at most once per service name and adapter run.
 *
 * @param adapter the adapter instance
 * @param serviceName the full mDNS service name or configured address of the device (used to report only once)
 * @param message the message to report
 */
function reportToSentry(adapter: ZendureSolarflow, serviceName: string, message: string): void {
  if (reportedToSentry.has(serviceName)) {
    return;
  }
  reportedToSentry.add(serviceName);
  reportErrorToSentry(adapter, message);
}

/**
 * Whether the mDNS service was announced by a Zendure device.
 *
 * @param service the discovered mDNS service
 */
export function isZendureService(service: Bonjour.Service): boolean {
  return !!service.name?.startsWith(ZENDURE_DEVICE_NAME_PREFIX);
}

/**
 * Normalizes a Zendure model name as reported via mDNS or in the zenSDK 'product' field (e.g. "solarFlow2400AC+"
 * or "solarFlow800Pro") for a lookup with findProductByMdnsModelName.
 *
 * @param modelName the model name as reported by the device
 */
export function normalizeModelName(modelName: string): string {
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
 * Finds the state tree of a device with the given serial number that was created before, e.g. from the cloud device
 * list (with the cloud deviceKey, which doesn't contain the serial number) before switching to 'zenSDK only' mode.
 * Every device writes its serial number to '<productKey>.<deviceKey>.snNumber'.
 *
 * @param adapter the adapter instance
 * @param snNumber the serial number of the device
 * @returns the productKey/deviceKey of the existing state tree, or undefined if there is none
 */
async function findExistingStateTreeKeys(
  adapter: ZendureSolarflow,
  snNumber: string,
): Promise<{ productKey: string; deviceKey: string } | undefined> {
  const states = await adapter.getStatesAsync("*.snNumber");
  const normalizedSnNumber = snNumber.toUpperCase();

  for (const [id, state] of Object.entries(states ?? {})) {
    const parts = id.substring(adapter.namespace.length + 1).split(".");

    if (parts.length === 3 && typeof state?.val === "string" && state.val.toUpperCase() === normalizedSnNumber) {
      return { productKey: parts[0], deviceKey: parts[1] };
    }
  }

  return undefined;
}

/**
 * Creates a new device model for a zenSDK-compatible device that is not (yet) known from the cloud device list
 * (e.g. no cloud account configured, or the device was not yet synced to the cloud). If a state tree for the
 * device's serial number already exists (e.g. created from the cloud device list before), it is kept, so scripts,
 * visualizations and history keep working. Otherwise the device's serial number is used as its deviceKey, since no
 * cloud-assigned deviceKey is available for it. Used for devices discovered via mDNS as well as for devices
 * configured with a fixed IP address (see manualZenSdkDeviceService.ts).
 *
 * @param adapter the adapter instance, used for logging and to register the new device
 * @param modelName the model name as reported by the device (mDNS service name part or zenSDK 'product' field)
 * @param snNumber the serial number of the device
 * @param ipAddress the IP address of the device
 * @param source description of where the device was found, for logging (e.g. the mDNS service name)
 * @returns whether the device exists now (was created, or was already created before)
 */
export async function createZenSdkDevice(
  adapter: ZendureSolarflow,
  modelName: string,
  snNumber: string,
  ipAddress: string,
  source: string,
): Promise<boolean> {
  const normalizedSnNumber = snNumber.toUpperCase();

  if (
    devicesInCreation.has(normalizedSnNumber) ||
    adapter.zenIobDeviceList.some((x) => x.snNumber?.toUpperCase() === normalizedSnNumber)
  ) {
    // Already created before (e.g. for a previous mDNS announcement of the same device), or currently being created
    return true;
  }

  const product = findProductByMdnsModelName(normalizeModelName(modelName));

  if (!product) {
    adapter.log.warn(
      `[mdnsHelper] Found Zendure device '${source}', but its model '${modelName}' is not known and can't be created automatically. Please connect it via the Zendure Cloud instead!`,
    );
    reportToSentry(adapter, source, `[mdnsHelper] Unknown zenSDK model '${modelName}' ('${source}')`);
    return false;
  }

  devicesInCreation.add(normalizedSnNumber);

  try {
    return await createZenSdkDeviceModel(adapter, product, snNumber, ipAddress, source);
  } finally {
    devicesInCreation.delete(normalizedSnNumber);
  }
}

async function createZenSdkDeviceModel(
  adapter: ZendureSolarflow,
  product: { productKey: string; productModel: string },
  snNumber: string,
  ipAddress: string,
  source: string,
): Promise<boolean> {
  let treeKeys = { productKey: product.productKey, deviceKey: snNumber };

  try {
    const existingTreeKeys = await findExistingStateTreeKeys(adapter, snNumber);

    if (existingTreeKeys) {
      adapter.log.info(
        `[mdnsHelper] Device '${source}' (serial: ${snNumber}) was created before, keeping its existing states at '${existingTreeKeys.productKey}.${existingTreeKeys.deviceKey}'!`,
      );
      treeKeys = existingTreeKeys;
    }
  } catch (error: any) {
    adapter.log.warn(
      `[mdnsHelper] Could not check for existing states of device '${source}': ${error?.message ?? error}`,
    );
  }

  adapter.log.info(
    `[mdnsHelper] Creating new device for '${source}' (model: ${product.productModel}, serial: ${snNumber}) at IP ${ipAddress}!`,
  );

  const zenHaDeviceDetails: IZenIobDeviceDetails = {
    deviceKey: snNumber,
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
    snNumber: snNumber,
    username: "",
  };

  let deviceModel = createDeviceModel(adapter, treeKeys.productKey, treeKeys.deviceKey, zenHaDeviceDetails);

  if (!deviceModel && treeKeys.productKey !== product.productKey) {
    // Existing state tree has a productKey which is no longer known, use the default keys instead
    deviceModel = createDeviceModel(adapter, product.productKey, snNumber, zenHaDeviceDetails);
  }

  if (deviceModel) {
    adapter.zenIobDeviceList.push(deviceModel);
    return true;
  }

  const message = `[mdnsHelper] Error creating device model for '${source}' (productKey '${product.productKey}')`;
  adapter.log.error(`${message}!`);
  reportToSentry(adapter, source, message);
  return false;
}

/**
 * Creates a new device model for a device that was discovered via mDNS but is not (yet) known from the
 * cloud device list.
 *
 * @param adapter the adapter instance, used for logging and to register the new device
 * @param serviceName the full mDNS service name the device was discovered with
 * @param ipAddress the IP address the device was discovered at
 */
async function createDeviceFromMdns(adapter: ZendureSolarflow, serviceName: string, ipAddress: string): Promise<void> {
  const parsed = extractModelAndSerial(serviceName);

  if (!parsed) {
    return;
  }

  await createZenSdkDevice(adapter, parsed.modelName, parsed.snNumber, ipAddress, `mDNS: ${serviceName}`);
}

/**
 * Handles a Zendure device found via mDNS (see MdnsDiscoveryService). This is called again for the
 * same device on every mDNS query, so it must be idempotent. The device is matched against the known
 * devices in adapter.zenIobDeviceList by comparing its full serial number (parsed from the service
 * name, e.g. "Zendure-SolarFlow800-<serialNumber>") against each device's snNumber. A suffix/MAC-based
 * match is not safe here, as some Zendure serial numbers share an identical tail and only differ in a
 * short prefix. On a match, the device's ipAddress is corrected if needed and it is switched to a
 * zenSDK connection instead of Cloud/MQTT. If no match is found, a new device is created directly
 * from the mDNS name (using its serial number as deviceKey), provided its model is a known
 * zenSDK-compatible device.
 *
 * @param adapter the adapter instance, used for logging and device lookup
 * @param service the discovered mDNS service
 */
export function handleDiscoveredService(adapter: ZendureSolarflow, service: Bonjour.Service): void {
  if (!isZendureService(service)) {
    return;
  }

  adapter.log.debug(
    `[mdnsHelper] Found Zendure device via mDNS: ${service.name} (host: ${service.host}, addresses: ${service.addresses?.join(", ")}, sender: ${service.referer?.address})`,
  );

  // Prefer an IPv4 address. Fall back to the sender of the mDNS response, if the response didn't include an address record.
  const ipAddress =
    service.addresses?.find((address) => address.includes(".")) ?? service.referer?.address ?? service.addresses?.[0];

  if (!ipAddress) {
    return;
  }

  const parsed = extractModelAndSerial(service.name);

  if (!parsed) {
    return;
  }

  const device = adapter.zenIobDeviceList.find((x) => x.snNumber?.toUpperCase() === parsed.snNumber.toUpperCase());

  if (device) {
    device.connectViaMdns(ipAddress, service.name, service.host);
    return;
  }

  createDeviceFromMdns(adapter, service.name, ipAddress).catch((error: any) => {
    adapter.log.error(`[mdnsHelper] Error creating device for '${service.name}': ${error?.message ?? error}`);
  });
}
