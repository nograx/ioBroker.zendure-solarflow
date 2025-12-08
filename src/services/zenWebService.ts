/* eslint-disable @typescript-eslint/indent */
import axios, { AxiosRequestConfig } from "axios";
import { haKey } from "../constants/constants";
import { ZendureSolarflow } from "../main";
import * as crypto from "crypto";
import { IHaDeviceListData } from "../models/IHaDeviceListData";

export const zenLogin = async (
  adapter: ZendureSolarflow
): Promise<string | IHaDeviceListData | undefined> => {
  const decodedAuthCloudKey = Buffer.from(
    adapter.config.authorizationCloudKey,
    "base64"
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

  const signStr = `${haKey}${bodyStr}${haKey}`;

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
        adapter.log.error(error.response.data);
        adapter.log.error(error.response.status);
        adapter.log.error(error.response.headers);
      } else if (error.request) {
        // The request was made but no response was received
        // `error.request` is an instance of XMLHttpRequest in the browser and an instance of
        // http.ClientRequest in node.js
        adapter.log.error(error.request);
      } else {
        // Something happened in setting up the request that triggered an Error
        adapter.log.error("Error" + error.message);
      }
      adapter.log.error(error.config);
    });
};
