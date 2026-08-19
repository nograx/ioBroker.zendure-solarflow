import Bonjour from "bonjour-service";
import type { ZendureSolarflow } from "../main";

const ZENDURE_DEVICE_NAME_PREFIX = "Zendure-";
const DISCOVERY_DURATION_MS = 10000;
const MAC_SUFFIX_LENGTH = 12;

/**
 * Browses the local network via mDNS for a fixed duration. Every discovered device whose
 * service name starts with "Zendure-" (e.g. "Zendure-SolarFlow800-<Last12MAC>") is matched
 * against the known devices in adapter.zenIobDeviceList by comparing the last 12 characters
 * of the service name (the device's MAC) against the tail of each device's snNumber. On a
 * match, the device's ipAddress is filled in (if not yet known) and it is switched to a
 * zenSDK connection instead of Cloud/MQTT.
 *
 * @param adapter the adapter instance, used for logging and device lookup
 */
export function discoverZendureDevicesViaMdns(adapter: ZendureSolarflow): void {
  const bonjour = new Bonjour(undefined, (err: Error) => {
    adapter.log.warn(`[mdnsHelper] mDNS error: ${err.message}`);
  });

  const browser = bonjour.find(null, (service) => {
    if (!service.name?.startsWith(ZENDURE_DEVICE_NAME_PREFIX)) {
      return;
    }

    adapter.log.info(
      `[mdnsHelper] Found Zendure device via mDNS: ${service.name} (host: ${service.host}, addresses: ${service.addresses?.join(", ")})`,
    );

    const macSuffix = service.name.slice(-MAC_SUFFIX_LENGTH).toUpperCase();
    const ipAddress = service.addresses?.find((address) => address.includes(".")) ?? service.addresses?.[0];

    if (!ipAddress) {
      return;
    }

    const device = adapter.zenIobDeviceList.find((x) => x.snNumber?.toUpperCase().endsWith(macSuffix));

    if (device) {
      adapter.log.debug(
        `[mdnsHelper] Matched mDNS device ${service.name} to known device with snNumber ${device.snNumber} via IP ${ipAddress}!`,
      );

      device.connectViaMdns(ipAddress);
    }
  });

  adapter.setTimeout(() => {
    browser.stop();
    bonjour.destroy();
  }, DISCOVERY_DURATION_MS);
}
