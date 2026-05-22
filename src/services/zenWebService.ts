import axios, { AxiosRequestConfig } from "axios";
import { iobKey } from "../constants/sensorStates/constants";
import { ZendureSolarflow } from "../main";
import * as crypto from "node:crypto";
import { IIobDeviceListData } from "../models/IIobDeviceListData";
import { IZenIobDeviceDetails } from "../models/IZenIobDeviceDetails";
import { isIP } from "node:net";

const getValueFromKVArray = (
  value: unknown,
  candidateKeys: string[],
): unknown => {
  if (!Array.isArray(value)) {
    return undefined;
  }

  for (const item of value) {
    if (!item || typeof item !== "object") {
      continue;
    }

    const row = item as Record<string, unknown>;
    const keyCandidate =
      row.key ?? row.name ?? row.id ?? row.code ?? row.property ?? row.prop;
    if (typeof keyCandidate !== "string") {
      continue;
    }

    const normalized = keyCandidate.toLowerCase();
    if (!candidateKeys.includes(normalized)) {
      continue;
    }

    return row.value ?? row.val ?? row.data ?? row.content;
  }

  return undefined;
};

const findValueDeep = (
  value: unknown,
  candidateKeys: string[],
  depth = 0,
): unknown => {
  if (depth > 8 || value == null) {
    return undefined;
  }

  if (Array.isArray(value)) {
    const kvResult = getValueFromKVArray(value, candidateKeys);
    if (kvResult != null) {
      return kvResult;
    }

    for (const entry of value) {
      const found = findValueDeep(entry, candidateKeys, depth + 1);
      if (found != null) {
        return found;
      }
    }
    return undefined;
  }

  if (typeof value !== "object") {
    return undefined;
  }

  const obj = value as Record<string, unknown>;

  for (const [k, v] of Object.entries(obj)) {
    if (candidateKeys.includes(k.toLowerCase()) && v != null && v !== "") {
      return v;
    }
  }

  for (const nestedValue of Object.values(obj)) {
    const found = findValueDeep(nestedValue, candidateKeys, depth + 1);
    if (found != null) {
      return found;
    }
  }

  return undefined;
};

const productNameToProductKey: Record<string, string> = {
  solarflow800pro2: "R3mn8U",
  solarflow800pro: "R3mn8U",
  solarflow800plus: "8n77V3",
  solarflow800: "B1NHMC",
  solarflow2400pro: "2Qe7C9",
  solarflow2400acplus: "5fG27j",
  solarflow2400ac: "BC8B7F",
  solarflow1600acplus: "64174u",
  hyper2000: "ja72U0ha",
  hub1200: "73bkTV",
  hub2000: "A8yh63",
  ace1500: "8bM93H",
  aio2400: "yWF7hV",
};

const normalizeProductToken = (value: unknown): string => {
  if (typeof value !== "string") {
    return "";
  }

  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
};

export const zenLogin = async (
  adapter: ZendureSolarflow,
): Promise<string | IIobDeviceListData | undefined> => {
  const decodedAuthCloudKey = Buffer.from(
    adapter.config.authorizationCloudKey,
    "base64",
  ).toString("utf-8");

  const lastDot = decodedAuthCloudKey.lastIndexOf(".");
  if (lastDot === -1) {
    // Invalid
  }

  const apiUrl = decodedAuthCloudKey.slice(0, lastDot);
  const appKey = decodedAuthCloudKey.slice(lastDot + 1);

  const body = {
    appKey: appKey,
  };

  // Timestamp und Nonce
  const timestamp = Math.floor(Date.now() / 1000);
  const nonce = (Math.floor(Math.random() * 90000) + 10000).toString();

  // Signatur-Parameter
  const signParams: Record<string, string | number> = {
    ...body,
    timestamp: timestamp,
    nonce: nonce,
  };

  // Signatur-String erstellen
  const bodyStr = Object.keys(signParams)
    .sort()
    .map((k) => `${k}${signParams[k]}`)
    .join("");

  const signStr = `${iobKey}${bodyStr}${iobKey}`;

  // SHA1-Hash berechnen
  const sha1 = crypto.createHash("sha1");
  sha1.update(signStr, "utf8");
  const sign = sha1.digest("hex").toUpperCase();

  // Header bauen
  const headers = {
    "Content-Type": "application/json",
    timestamp: timestamp.toString(),
    nonce: nonce,
    clientid: "zenHa",
    sign: sign,
  };

  const config: AxiosRequestConfig = {
    headers: headers,
    timeout: 10000,
  };

  // Request
  return axios
    .post(`${apiUrl}/api/ha/deviceList`, JSON.stringify(body), config)
    .then(async function (response) {
      const data = await response.data;

      return data.data;
    })
    .catch(async function (error) {
      if (error.response) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        adapter.log.error(
          `[zenLogin] Response data: ${JSON.stringify(error.response.data, null, 2)}`,
        );
        adapter.log.error(`[zenLogin] status: ${error.response.status}`);
        adapter.log.error(
          `[zenLogin] headers: ${JSON.stringify(error.response.headers, null, 2)}`,
        );
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        adapter.log.error(
          `[zenLogin] Request data: ${JSON.stringify(error.request, null, 2)}`,
        );
      } else {
        // Something happened in setting up the request that triggered an Error
        adapter.log.error(`[zenLogin] Error: ${error.message}`);
      }
      adapter.log.error(JSON.stringify(error.config, null, 2));

      return undefined;
    });
};

export const parseManualDeviceIps = (rawValue: string | undefined): string[] => {
  if (!rawValue) {
    return [];
  }

  const ipSet = new Set<string>();
  for (const part of rawValue.split(",")) {
    const ip = part.trim();
    if (!ip) {
      continue;
    }
    if (isIP(ip) !== 4) {
      continue;
    }
    ipSet.add(ip);
  }

  return [...ipSet];
};

export const getLanDeviceListByIps = async (
  adapter: ZendureSolarflow,
  ips: string[],
): Promise<IZenIobDeviceDetails[]> => {
  const config: AxiosRequestConfig = {
    headers: {
      "Content-Type": "application/json",
    },
    timeout: 4000,
  };

  const requests = ips.map(async (ip) => {
    try {
      const response = await axios.get(`http://${ip}/properties/report`, config);
      const data = response?.data ?? {};

      const rawProductKey = findValueDeep(data, [
        "productkey",
        "product_key",
        "product",
        "productid",
        "product_id",
        "modelkey",
        "model_key",
      ]);
      const rawDeviceKey = findValueDeep(data, [
        "devicekey",
        "device_key",
        "deviceid",
        "device_id",
        "devkey",
        "dev_key",
        "did",
      ]);
      const snNumber =
        findValueDeep(data, [
          "sn",
          "snnumber",
          "serial",
          "serialnumber",
          "serial_number",
        ]) ?? undefined;

      const productToken = normalizeProductToken(rawProductKey);
      const mappedProductKey = productNameToProductKey[productToken];

      const productKey =
        (typeof rawProductKey === "string" &&
        /^[A-Za-z0-9]{6,10}$/.test(rawProductKey)
          ? rawProductKey
          : mappedProductKey) ??
        undefined;
      const deviceKey =
        (rawDeviceKey != null ? String(rawDeviceKey) : undefined) ||
        (snNumber != null ? String(snNumber) : undefined);
      const productModel =
        findValueDeep(data, [
          "productmodel",
          "product_model",
          "model",
          "modelname",
          "model_name",
          "productname",
          "product_name",
          "product",
        ]) ??
        rawProductKey ??
        productKey;
      const deviceName =
        findValueDeep(data, [
          "devicename",
          "device_name",
          "name",
          "alias",
        ]) ??
        snNumber ??
        deviceKey;

      if (!productKey || !deviceKey) {
        const topLevelKeys =
          typeof data === "object" && data !== null ? Object.keys(data) : [];
        adapter.log.warn(
          `[manualIps] Could not identify productKey/deviceKey for IP ${ip}; skipping device.`,
        );
        adapter.log.debug(
          `[manualIps] Unknown payload keys for ${ip}: ${topLevelKeys.join(",") || "none"}`,
        );
        adapter.log.debug(
          `[manualIps] Raw detected values for ${ip}: product='${String(rawProductKey ?? "")}', sn='${String(snNumber ?? "")}', device='${String(rawDeviceKey ?? "")}'`,
        );
        return undefined;
      }

      const productKeyFinal = String(productKey);
      const deviceKeyFinal = String(deviceKey);
      const snNumberFinal = String(snNumber || "");

      const mapped: IZenIobDeviceDetails = {
        deviceKey: deviceKeyFinal,
        deviceName: String(deviceName || deviceKeyFinal),
        enable: true,
        ip,
        lcnSupport: 1,
        online: true,
        password: "",
        port: 1883,
        productKey: productKeyFinal,
        productModel: String(productModel || productKeyFinal),
        protocol: "http",
        server: "",
        snNumber: snNumberFinal,
        username: "",
      };

      return mapped;
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      adapter.log.warn(
        `[manualIps] Could not query device at IP ${ip}: ${message}`,
      );
      return undefined;
    }
  });

  const resolved = await Promise.all(requests);
  const devices = resolved.filter((x): x is IZenIobDeviceDetails => !!x);

  const dedupedMap = new Map<string, IZenIobDeviceDetails>();
  for (const device of devices) {
    dedupedMap.set(`${device.productKey}|${device.deviceKey}`, device);
  }

  return [...dedupedMap.values()];
};
