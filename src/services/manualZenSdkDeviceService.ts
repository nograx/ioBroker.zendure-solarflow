import axios from "axios";
import type { ZendureSolarflow } from "../main";
import { createZenSdkDevice } from "../helpers/mdnsHelper";

// Devices are checked right after start, then again periodically, so a device that was offline at adapter start
// (or got a new firmware / was reset) is still added, and a paused zenSDK polling is resumed as soon as it answers.
const CHECK_INTERVAL_MS = 5 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 4000;

/**
 * Normalizes a manually entered device address: trims it and removes a leading protocol and trailing slashes /
 * paths, so "http://192.168.3.34/" and "192.168.3.34" are treated the same.
 *
 * @param entry the address as entered in the adapter settings
 */
export function normalizeDeviceAddress(entry: unknown): string {
  if (typeof entry !== "string") {
    return "";
  }

  return entry
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/.*$/, "");
}

/**
 * Returns the configured, normalized and de-duplicated IP addresses / host names of zenSDK devices.
 *
 * @param entries the configured addresses (adapter setting 'zenSdkDeviceIps')
 */
export function getConfiguredDeviceAddresses(entries: unknown): string[] {
  if (!Array.isArray(entries)) {
    return [];
  }

  const addresses = entries.map(normalizeDeviceAddress).filter((address) => address.length > 0);

  return [...new Set(addresses)];
}

/**
 * Connects zenSDK devices by manually configured IP addresses (adapter setting 'zenSdkDeviceIps'), without any mDNS
 * discovery. This is needed if the adapter runs in another network segment (VLAN) than the devices, as mDNS
 * multicast packets are usually not routed between segments.
 *
 * Every configured address is queried via the zenSDK endpoint '/properties/report'. The device is identified by
 * the serial number ('sn') and model ('product') it reports:
 * - A device already known (from the cloud device list, the local MQTT settings or mDNS) with the same serial
 * number keeps its existing states and is switched to zenSDK with this IP address.
 * - An unknown device is created with its serial number as deviceKey, exactly like a device found via mDNS.
 */
export class ManualZenSdkDeviceService {
  private adapter: ZendureSolarflow;
  private addresses: string[];
  private checkInterval?: ioBroker.Interval;
  private checksInProgress = new Set<string>();
  /** Addresses whose last check failed, so an error is only logged once until the device answers again. */
  private failedAddresses = new Set<string>();

  constructor(adapter: ZendureSolarflow, addresses: string[]) {
    this.adapter = adapter;
    this.addresses = addresses;
  }

  /**
   * Checks all configured addresses now and then periodically, until stop() is called.
   */
  start(): void {
    if (this.checkInterval || this.addresses.length === 0) {
      return;
    }

    this.adapter.log.info(
      `[ManualZenSdkDeviceService] Connecting ${this.addresses.length} zenSDK device(s) by configured IP address: ${this.addresses.join(", ")}`,
    );

    this.checkAll();
    this.checkInterval = this.adapter.setInterval(() => this.checkAll(), CHECK_INTERVAL_MS);
  }

  /**
   * Stops the periodic checks.
   */
  stop(): void {
    if (this.checkInterval) {
      this.adapter.clearInterval(this.checkInterval);
      this.checkInterval = undefined;
    }
  }

  private checkAll(): void {
    for (const address of this.addresses) {
      void this.checkAddress(address);
    }
  }

  private async checkAddress(address: string): Promise<void> {
    if (this.checksInProgress.has(address)) {
      return;
    }

    this.checksInProgress.add(address);

    try {
      const response = await axios.get(`http://${address}/properties/report`, {
        headers: { "Content-Type": "application/json" },
        timeout: REQUEST_TIMEOUT_MS,
      });

      const data = response.data;
      const snNumber = typeof data?.sn === "string" ? data.sn.trim() : "";
      const product = typeof data?.product === "string" ? data.product.trim() : "";

      if (!snNumber) {
        this.logFailure(
          address,
          `Device at ${address} answered, but reported no serial number ('sn') on /properties/report - is this a zenSDK-compatible Zendure device?`,
        );
        return;
      }

      if (this.failedAddresses.delete(address)) {
        this.adapter.log.info(`[ManualZenSdkDeviceService] Device at ${address} (${snNumber}) is reachable again!`);
      }

      const source = `configured IP ${address}`;
      const device = this.adapter.zenIobDeviceList.find((x) => x.snNumber?.toUpperCase() === snNumber.toUpperCase());

      if (device) {
        device.connectViaMdns(address, source);
        return;
      }

      if (!product) {
        this.logFailure(
          address,
          `Device ${snNumber} at ${address} reported no model ('product') on /properties/report, so it can't be created automatically!`,
        );
        return;
      }

      createZenSdkDevice(this.adapter, product, snNumber, address, source);
    } catch (error: any) {
      this.logFailure(address, `Device at ${address} is not reachable via zenSDK: ${error?.message ?? error}`);
    } finally {
      this.checksInProgress.delete(address);
    }
  }

  private logFailure(address: string, message: string): void {
    if (this.failedAddresses.has(address)) {
      this.adapter.log.debug(`[ManualZenSdkDeviceService] ${message}`);
      return;
    }

    this.failedAddresses.add(address);
    this.adapter.log.warn(
      `[ManualZenSdkDeviceService] ${message} Retrying every ${CHECK_INTERVAL_MS / 60000} minutes.`,
    );
  }
}
