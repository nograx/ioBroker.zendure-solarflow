import { expect } from "chai";
import * as http from "http";
import type { AddressInfo } from "net";
import {
  ManualZenSdkDeviceService,
  getConfiguredDeviceAddresses,
  normalizeDeviceAddress,
} from "./manualZenSdkDeviceService";

describe("manualZenSdkDeviceService => normalizeDeviceAddress", () => {
  it("should strip protocol, path and whitespace", () => {
    expect(normalizeDeviceAddress(" http://192.168.3.34/ ")).to.equal("192.168.3.34");
    expect(normalizeDeviceAddress("https://sf800.lan:80/properties/report")).to.equal("sf800.lan:80");
    expect(normalizeDeviceAddress("192.168.3.34")).to.equal("192.168.3.34");
  });

  it("should return an empty string for non-string values", () => {
    expect(normalizeDeviceAddress(undefined)).to.equal("");
    expect(normalizeDeviceAddress(42)).to.equal("");
  });
});

describe("manualZenSdkDeviceService => getConfiguredDeviceAddresses", () => {
  it("should drop empty entries and duplicates", () => {
    expect(
      getConfiguredDeviceAddresses(["192.168.3.34", "", "  ", "http://192.168.3.34/", "192.168.3.35"]),
    ).to.deep.equal(["192.168.3.34", "192.168.3.35"]);
  });

  it("should return an empty list if nothing is configured", () => {
    expect(getConfiguredDeviceAddresses(undefined)).to.deep.equal([]);
    expect(getConfiguredDeviceAddresses("192.168.3.34")).to.deep.equal([]);
  });
});

describe("manualZenSdkDeviceService => ManualZenSdkDeviceService", () => {
  let server: http.Server;
  let address: string;

  before((done) => {
    server = http.createServer((req, res) => {
      if (req.url === "/properties/report") {
        res.setHeader("Content-Type", "application/json");
        res.end(
          JSON.stringify({ sn: "HOA1NAN9N123456", product: "solarFlow800Pro", properties: { electricLevel: 50 } }),
        );
        return;
      }
      res.statusCode = 404;
      res.end();
    });
    server.listen(0, "127.0.0.1", () => {
      address = `127.0.0.1:${(server.address() as AddressInfo).port}`;
      done();
    });
  });

  after((done) => {
    server.close(() => done());
  });

  function createFakeAdapter(devices: any[]): { adapter: any; logs: string[] } {
    const logs: string[] = [];
    const log = (level: string) => (message: string) => logs.push(`${level}: ${message}`);
    const adapter = {
      zenIobDeviceList: devices,
      log: { info: log("info"), warn: log("warn"), debug: log("debug"), error: log("error") },
      setInterval: () => ({}) as any,
      clearInterval: () => undefined,
    };
    return { adapter, logs };
  }

  const waitForChecks = (): Promise<void> => new Promise((resolve) => setTimeout(resolve, 300));

  it("should connect a known device (matched by serial number) via its configured IP", async () => {
    const calls: { ip: string; source?: string }[] = [];
    const device = {
      snNumber: "hoa1nan9n123456",
      connectViaMdns: (ip: string, source?: string) => calls.push({ ip, source }),
    };
    const { adapter } = createFakeAdapter([device]);

    const service = new ManualZenSdkDeviceService(adapter, [address]);
    service.start();
    await waitForChecks();
    service.stop();

    expect(calls).to.have.length(1);
    expect(calls[0].ip).to.equal(address);
    expect(calls[0].source).to.contain(address);
  });

  it("should warn only once for an unreachable address", async () => {
    const { adapter, logs } = createFakeAdapter([]);
    // Port 1 on localhost is closed, so the connection is refused immediately
    const service = new ManualZenSdkDeviceService(adapter, ["127.0.0.1:1"]);

    service.start();
    await waitForChecks();
    await (service as any).checkAddress("127.0.0.1:1");
    service.stop();

    expect(logs.filter((line) => line.startsWith("warn:"))).to.have.length(1);
    expect(logs.filter((line) => line.startsWith("debug:"))).to.have.length(1);
  });
});
