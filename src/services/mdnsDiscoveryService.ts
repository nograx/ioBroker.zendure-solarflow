import Bonjour from "bonjour-service";
import type { ZendureSolarflow } from "../main";
import { handleDiscoveredService, isZendureService } from "../helpers/mdnsHelper";

// mDNS runs on UDP multicast, and packets are easily lost (especially by devices in WiFi power-save mode),
// so the network is queried again shortly after start: after 5s, 15s, 30s and 60s. Then every 5 minutes.
const INITIAL_QUERY_INTERVALS_MS = [5000, 10000, 15000, 30000];
const QUERY_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Browses the local network via mDNS for Zendure devices as long as the adapter is running, so devices
 * that are connected to the network later (or missed an earlier query) are still found and added.
 */
export class MdnsDiscoveryService {
  private adapter: ZendureSolarflow;
  private bonjour?: Bonjour;
  private browser?: Bonjour.Browser;
  private queryTimeout?: ioBroker.Timeout;
  private queryCount = 0;

  constructor(adapter: ZendureSolarflow) {
    this.adapter = adapter;
  }

  /**
   * Starts the discovery. Found devices are handled by handleDiscoveredService.
   */
  start(): void {
    if (this.bonjour) {
      return;
    }

    this.adapter.log.info("[MdnsDiscoveryService] Starting continuous mDNS discovery of Zendure devices!");

    this.bonjour = new Bonjour(undefined, (err: Error) => {
      this.adapter.log.warn(`[MdnsDiscoveryService] mDNS error: ${err.message}`);
    });

    this.query();
  }

  /**
   * Sends a new mDNS query by replacing the browser. A browser only reports a service once and doesn't notice
   * address changes, so a fresh browser reports every responding device again, with its current IP address.
   * Announcements of devices joining the network in between are received by the running browser.
   */
  private query(): void {
    if (!this.bonjour) {
      return;
    }

    this.browser?.stop();
    this.browser = this.bonjour.find(null, (service) => handleDiscoveredService(this.adapter, service));
    this.browser.on("down", (service: Bonjour.Service) => {
      if (isZendureService(service)) {
        this.adapter.log.debug(`[MdnsDiscoveryService] Zendure device ${service.name} left the network (mDNS)!`);
      }
    });

    const delayMs = INITIAL_QUERY_INTERVALS_MS[this.queryCount] ?? QUERY_INTERVAL_MS;
    this.queryCount++;
    this.queryTimeout = this.adapter.setTimeout(() => this.query(), delayMs);
  }

  /**
   * Stops the discovery and releases the mDNS socket.
   */
  stop(): void {
    if (this.queryTimeout) {
      this.adapter.clearTimeout(this.queryTimeout);
      this.queryTimeout = undefined;
    }

    this.browser?.stop();
    this.browser = undefined;

    this.bonjour?.destroy();
    this.bonjour = undefined;
  }
}
