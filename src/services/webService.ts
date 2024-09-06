/* eslint-disable @typescript-eslint/indent */
import { ZendureSolarflow } from "../main";
import axios, { AxiosRequestConfig } from "axios";
import { ISolarFlowDeviceDetails } from "../models/ISolarFlowDeviceDetails";

const config: AxiosRequestConfig = {
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "de-DE",
    appVersion: "4.3.1",
    "User-Agent": "Zendure/4.3.1 (iPhone; iOS 14.4.2; Scale/3.00)",
    Accept: "*/*",
    Authorization: "Basic Q29uc3VtZXJBcHA6NX4qUmRuTnJATWg0WjEyMw==",
    "Blade-Auth": "bearer (null)",
  },
  timeout: 10000,
};

export const login = (
  adapter: ZendureSolarflow
): Promise<string | undefined> => {
  if (adapter.accessToken) {
    return new Promise((resolve) => {
      if (adapter.accessToken) {
        resolve(adapter.accessToken);
      }
    });
  }

  const auth = Buffer.from(
    `${adapter.config.userName}:${adapter.config.password}`
  ).toString("base64");

  if (!config || !config.headers) {
    adapter.log.info("[login] Axios config is invalid!");
    return Promise.reject(undefined);
  }

  config.headers.Authorization = "Basic " + auth;

  const authBody = {
    password: adapter.config.password,
    account: adapter.config.userName,
    appId: "121c83f761305d6cf7b",
    appType: "iOS",
    grantType: "password",
    tenantId: "",
  };

  if (adapter.paths && adapter.paths.solarFlowTokenUrl) {
    return axios
      .post(adapter.paths.solarFlowTokenUrl, authBody, config)
      .then(function (response) {
        if (response.data.success) {
          adapter.log.info("[login] Login to Zendure Rest API successful!");
          if (response.data?.data?.userId) {
            adapter.userId = response.data?.data?.userId;
          }

          if (response.data?.data?.accessToken) {
            return response.data.data.accessToken;
          }
        } else {
          return undefined;
        }
      });
  } else {
    return Promise.reject(undefined);
  }
};

export const getDeviceList = (
  adapter: ZendureSolarflow
): Promise<ISolarFlowDeviceDetails[]> => {
  adapter.log.debug(
    "[getDeviceList] Getting device list from Zendure Rest API!"
  );

  if (
    adapter &&
    adapter.paths &&
    adapter.accessToken &&
    config &&
    config.headers
  ) {
    config.headers["Blade-Auth"] = "bearer " + adapter.accessToken;

    const body = {};

    return axios
      .post(
        adapter.paths.solarFlowQueryDeviceListUrl,
        JSON.stringify(body),
        config
      )
      .then(function (response) {
        if (response.data.data && response.data.data.length > 0) {
          return response.data.data as ISolarFlowDeviceDetails[];
        } else {
          return [];
        }
      });
  } else {
    adapter.log.error("[getDeviceList] No Access Token found!");
    return Promise.reject("No Access Token found!");
  }
};
