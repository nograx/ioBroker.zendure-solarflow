/* eslint-disable @typescript-eslint/indent */

import axios, { AxiosRequestConfig } from "axios";
import { ZendureSolarflow } from "../main";
import { pathsEu, pathsGlobal } from "../constants/paths";
import { ISolarFlowDevRegisterData } from "../models/ISolarflowDevRegisterResponse";

const config: AxiosRequestConfig = {
  headers: {
    "Content-Type": "application/json",
    "Accept-Language": "de-DE",
    Accept: "*/*",
  },
  timeout: 10000,
};

export const createDeveloperAccount = (
  adapter: ZendureSolarflow,
): Promise<ISolarFlowDevRegisterData> => {
  adapter.log.info(
    "[createDeveloperAccount] Connecting to Zendure Developer Web API...",
  );

  const body = {
    snNumber: adapter.config.snNumber,
    account: adapter.config.userName,
  };

  let paths = undefined;

  if (adapter.config.server == "eu") {
    paths = pathsEu;
  } else {
    paths = pathsGlobal;
  }

  return axios
    .post(paths.solarFlowDevRegisterUrl, JSON.stringify(body), config)
    .then(function (response: axios.AxiosResponse) {
      adapter.log.info("Successfully created Developer Account!");

      if (response.data && response.data.success == true) {
        return response.data.data;
      } else {
        console.warn("No Response Data!");
        return undefined;
      }
    })
    .catch(function (error) {
      if (error.response?.data?.code && error.response?.data?.msg) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        adapter.log.error(
          "Failed to created Zendure Developer Account: " +
            error.response?.data?.code +
            " - " +
            error.response.data.msg,
        );
      }

      return Promise.reject("Failed to created Zendure Developer Account!");
    });
};
