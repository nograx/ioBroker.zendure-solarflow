/* eslint-disable @typescript-eslint/indent */
import React, { useEffect, useState } from "react";
import {
  Box,
  TextField,
  Input,
  FormControl,
  Select,
  MenuItem,
  FormControlLabel,
  Checkbox,
  FormLabel,
} from "@mui/material";
import { GenericApp, I18n } from "@iobroker/adapter-react-v5";

const productKeys: { value; title }[] = [
  { value: "73bkTV", title: "HUB 1200 (73bkTV)" },
  { value: "A8yh63", title: "HUB 2000 (A8yh63)" },
  { value: "yWF7hV", title: "AIO 2400 (yWF7hV)" },
  { value: "ja72U0ha", title: "Hyper 2000 (ja72U0ha)" },
  { value: "gDa3tb", title: "Hyper 2000 (gDa3tb)" },
  { value: "B3Dxda", title: "Hyper 2000 (B3Dxda)" },
  { value: "8bM93H", title: "Ace 1500 (8bM93H)" },
  { value: "BC8B7F", title: "SolarFlow 2400 AC (BC8B7F)" },
  { value: "B1NHMC", title: "SolarFlow 800 (B1NHMC)" },
  { value: "R3mn8U", title: "SolarFlow 800 Pro (R3mn8U)" },
];

interface SettingsProps {
  app: GenericApp;
  native: Record<string, any>;
  onChange: (attr: string, value: any) => void;
}

function Settings(props: SettingsProps) {
  const [password, setPassword] = useState<string>("");

  useEffect(() => {
    if (props.native.password) {
      const password = props.native.password;
      const decryptedPassword = props.app.decrypt(password);
      setPassword(decryptedPassword);
    }
  }, []);

  useEffect(() => {
    props.onChange("password", password);
  }, [password]);

  const inputSx = {
    marginTop: 0,
    minWidth: 200,
  };

  const controlElementSx = {
    marginBottom: 1,
  };

  function renderInput(attr: string, type: string, placeholder?: string) {
    return (
      <TextField
        variant="standard"
        autoComplete="off"
        sx={{ ...inputSx, ...controlElementSx }}
        value={props.native[attr]}
        type={type || "text"}
        onChange={(e) => props.onChange(attr, e.target.value)}
        margin="normal"
        placeholder={placeholder}
      />
    );
  }

  function renderSelect(
    attr: string,
    options: { value: string; title: AdminWord }[]
  ) {
    return (
      <FormControl
        sx={{ ...inputSx, ...controlElementSx, pt: 0.625 }}
        variant="standard"
      >
        <Select
          variant="standard"
          value={props.native[attr] || "_"}
          onChange={(e) =>
            props.onChange(attr, e.target.value === "_" ? "" : e.target.value)
          }
          input={<Input name={attr} id={attr + "-helper"} />}
        >
          {options.map((item) => (
            <MenuItem key={"key-" + item.value} value={item.value || "_"}>
              {I18n.t(item.title)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  function renderCheckbox(title: AdminWord, attr: string) {
    return (
      <FormControlLabel
        key={attr}
        sx={{ ...controlElementSx, pt: 0.625 }}
        control={
          <Checkbox
            checked={props.native[attr]}
            onChange={() => props.onChange(attr, !props.native[attr])}
            color="primary"
          />
        }
        label={I18n.t(title)}
      />
    );
  }

  return (
    <Box sx={{ margin: 2.5 }}>
      <h3>{I18n.t("donateHeader")}</h3>
      <Box sx={{ marginTop: 2.5 }}>
        {I18n.t("donate1")}

        <br />
        {I18n.t("donate2")}
      </Box>
      <Box sx={{ marginTop: 2.5 }}>
        <a
          href="https://www.paypal.com/paypalme/PeterFrommert"
          target="_blank"
          rel="noreferrer noopener"
        >
          <img
            alt="Paypal Badge"
            height={30}
            src={
              "https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white"
            }
          ></img>
        </a>
      </Box>

      <form autoComplete="off">
        <Box sx={{ marginBottom: 2.5 }}>
          <h3>{I18n.t("settings")}</h3>
        </Box>
        <Box>{I18n.t("settingsDesc")}</Box>

        {/* Connection mode Selection */}
        <Box sx={{ marginTop: 3.75 }}>
          <FormLabel>{I18n.t("connectionMode")}:</FormLabel>
          <Box>
            {renderSelect("connectionMode", [
              { value: "authKey", title: "authKey" },
              { value: "local", title: "local" },
            ])}
          </Box>
        </Box>

        {/* Auth Key */}
        {props.native["connectionMode"] == "authKey" && (
          <Box sx={{ marginTop: 1.25 }}>
            <Box>
              <FormLabel>{I18n.t("authKey")}:</FormLabel>
            </Box>
            <Box>{renderInput("authorizationCloudKey", "text")}</Box>
          </Box>
        )}

        {props.native["connectionMode"] == "local" && (
          <Box sx={{ marginTop: 1.25 }}>
            <Box>
              <FormLabel>{I18n.t("localMqttUrl")}:</FormLabel>
            </Box>
            <Box>{renderInput("localMqttUrl", "text")}</Box>
          </Box>
        )}

        <Box>{renderCheckbox("useRestart", "useRestart")}</Box>

        {props.native["connectionMode"] == "local" && (
          <Box sx={{ marginTop: 1.25 }}>
            {/* Device 1 Settings  */}
            <FormLabel>Device 1:</FormLabel>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
              }}
            >
              {renderSelect("localDevice1ProductKey", productKeys)}

              <Box sx={{ marginLeft: 1.25 }}>
                {renderInput("localDevice1DeviceKey", "text", "Device Key")}
              </Box>
            </Box>
          </Box>
        )}

        {props.native["connectionMode"] == "local" &&
          props.native["localDevice1DeviceKey"] && (
            <Box sx={{ marginTop: 1.25 }}>
              {/* Device 2 Settings  */}
              <FormLabel>Device 2:</FormLabel>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {renderSelect("localDevice2ProductKey", productKeys)}

                <Box sx={{ marginLeft: 1.25 }}>
                  {renderInput("localDevice2DeviceKey", "text", "Device Key")}
                </Box>
              </Box>
            </Box>
          )}

        {props.native["connectionMode"] == "local" &&
          props.native["localDevice2DeviceKey"] && (
            <Box sx={{ marginTop: 1.25 }}>
              {/* Device 3 Settings  */}
              <FormLabel>Device 3:</FormLabel>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {renderSelect("localDevice3ProductKey", productKeys)}

                <Box sx={{ marginLeft: 1.25 }}>
                  {renderInput("localDevice3DeviceKey", "text", "Device Key")}
                </Box>
              </Box>
            </Box>
          )}

        {props.native["connectionMode"] == "local" &&
          props.native["localDevice3DeviceKey"] && (
            <Box sx={{ marginTop: 1.25 }}>
              {/* Device 4 Settings  */}
              <FormLabel>Device 4:</FormLabel>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                }}
              >
                {renderSelect("localDevice4ProductKey", productKeys)}

                <Box sx={{ marginLeft: 1.25 }}>
                  {renderInput("localDevice4DeviceKey", "text", "Device Key")}
                </Box>
              </Box>
            </Box>
          )}

        <Box>{renderCheckbox("useCalculation", "useCalculation")}</Box>
        <Box>{renderCheckbox("useLowVoltageBlock", "useLowVoltageBlock")}</Box>

        {props.native["useLowVoltageBlock"] != undefined &&
          props.native["useLowVoltageBlock"] == true && (
            <Box>
              {renderCheckbox(
                "forceShutdownOnLowVoltage",
                "forceShutdownOnLowVoltage"
              )}

              {props.native["forceShutdownOnLowVoltage"] != undefined &&
                props.native["forceShutdownOnLowVoltage"] == true && (
                  <Box sx={{ marginTop: 1.25 }}>
                    <FormLabel>{I18n.t("dischargeLimit")}:</FormLabel>
                    <Box>{renderInput("dischargeLimit", "number")}</Box>
                  </Box>
                )}

              {props.native["forceShutdownOnLowVoltage"] != undefined &&
                props.native["forceShutdownOnLowVoltage"] == true &&
                renderCheckbox("fullChargeIfNeeded", "fullChargeIfNeeded")}
            </Box>
          )}
      </form>
    </Box>
  );
}

export default Settings;
