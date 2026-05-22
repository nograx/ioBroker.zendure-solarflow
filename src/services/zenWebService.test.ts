import { expect } from "chai";
import axios from "axios";
import {
  getLanDeviceListByIps,
  parseManualDeviceIps,
} from "./zenWebService";

type TestAdapter = {
  log: {
    warn: (msg: string) => void;
    debug: (msg: string) => void;
  };
};

const createAdapter = (): TestAdapter => ({
  log: {
    warn: () => undefined,
    debug: () => undefined,
  },
});

describe("zenWebService local discovery", () => {
  const originalAxiosGet = axios.get;

  afterEach(() => {
    (axios as any).get = originalAxiosGet;
  });

  it("uses local device id as deviceKey when both deviceid and sn are present", async () => {
    (axios as any).get = async () => ({
      data: {
        productKey: "ja72U0ha",
        deviceid: "tJA4E123456",
        sn: "EOD1NL123456",
        deviceName: "Hyper",
      },
    });

    const devices = await getLanDeviceListByIps(
      createAdapter() as any,
      ["192.168.1.10"],
    );

    expect(devices).to.have.length(1);
    expect(devices[0].deviceKey).to.equal("tJA4E123456");
    expect(devices[0].snNumber).to.equal("EOD1NL123456");
  });

  it("falls back to sn as deviceKey when no local device id is present", async () => {
    (axios as any).get = async () => ({
      data: {
        productKey: "ja72U0ha",
        sn: "EOD1NL654321",
        name: "Hyper via SN",
      },
    });

    const devices = await getLanDeviceListByIps(
      createAdapter() as any,
      ["192.168.1.11"],
    );

    expect(devices).to.have.length(1);
    expect(devices[0].deviceKey).to.equal("EOD1NL654321");
    expect(devices[0].snNumber).to.equal("EOD1NL654321");
  });

  it("skips device when productKey or deviceKey cannot be identified", async () => {
    (axios as any).get = async () => ({
      data: {
        some: "payload",
      },
    });

    const devices = await getLanDeviceListByIps(
      createAdapter() as any,
      ["192.168.1.12"],
    );

    expect(devices).to.have.length(0);
  });

  it("deduplicates devices by productKey and deviceKey", async () => {
    (axios as any).get = async () => ({
      data: {
        productKey: "ja72U0ha",
        deviceid: "tJA4EDEDUP",
        sn: "EOD1NLDEDUP",
      },
    });

    const devices = await getLanDeviceListByIps(
      createAdapter() as any,
      ["192.168.1.20", "192.168.1.21"],
    );

    expect(devices).to.have.length(1);
    expect(devices[0].deviceKey).to.equal("tJA4EDEDUP");
  });

  it("maps product names to known product keys in local mode", async () => {
    (axios as any).get = async () => ({
      data: {
        product: "Hyper 2000",
        sn: "EOD1NLMAP01",
      },
    });

    const devices = await getLanDeviceListByIps(
      createAdapter() as any,
      ["192.168.1.30"],
    );

    expect(devices).to.have.length(1);
    expect(devices[0].productKey).to.equal("ja72U0ha");
    expect(devices[0].deviceKey).to.equal("EOD1NLMAP01");
  });
});

describe("parseManualDeviceIps", () => {
  it("returns unique valid IPv4 addresses from comma-separated input", () => {
    const ips = parseManualDeviceIps(
      "192.168.1.10, 192.168.1.10,invalid, 10.0.0.2",
    );

    expect(ips).to.deep.equal(["192.168.1.10", "10.0.0.2"]);
  });

  it("returns an empty list for empty input", () => {
    expect(parseManualDeviceIps(undefined)).to.deep.equal([]);
    expect(parseManualDeviceIps("")).to.deep.equal([]);
  });
});
