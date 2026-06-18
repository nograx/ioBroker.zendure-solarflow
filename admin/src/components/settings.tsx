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
  Paper,
  Typography,
  Divider,
  Stack,
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
  { value: "64174u", title: "SolarFlow 1600 AC+ (64174u)" },
  { value: "65174u", title: "SolarFlow 1600 AC+ (65174u)" },
  { value: "BC8B7F", title: "SolarFlow 2400 AC (BC8B7F)" },
  { value: "5fG27j", title: "SolarFlow 2400 AC+ (5fG27j)" },
  { value: "2Qe7C9", title: "SolarFlow 2400 Pro (2Qe7C9)" },
  { value: "B1NHMC", title: "SolarFlow 800 (B1NHMC)" },
  { value: "a4ss5P", title: "SolarFlow 800 (a4ss5P)" },
  { value: "R3mn8U", title: "SolarFlow 800 Pro (R3mn8U)" },
  { value: "nVyeqM", title: "SolarFlow 800 Pro 2 (nVyeqM)" },
  { value: "8n77V3", title: "SolarFlow 800 Plus (8n77V3)" },
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
    options: { value: string; title: AdminWord }[],
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

  function renderSection(title: string, children: React.ReactNode) {
    return (
      <Paper elevation={1} sx={{ p: 2.5, mb: 2 }}>
        <Typography
          variant="subtitle1"
          sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}
        >
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
      </Paper>
    );
  }

  const isAuthKey = props.native["connectionMode"] === "authKey";
  const isLocal = props.native["connectionMode"] === "local";
  const useLocalMqtt = props.native["useAddionalLocalMqtt"];
  const showLocalMqttSection = isLocal || useLocalMqtt;

  return (
    <Box sx={{ margin: 2.5, maxWidth: 800 }}>
      {/* Donate */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>
          {I18n.t("donateHeader")}
        </Typography>
        <Typography variant="body2">{I18n.t("donate1")}</Typography>
        <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
          {I18n.t("donate2")}
        </Typography>
        <Box sx={{ mt: 1.5 }}>
          <a
            href="https://www.paypal.com/paypalme/PeterFrommert"
            target="_blank"
            rel="noreferrer noopener"
          >
            <img
              alt="Paypal Badge"
              height={30}
              src="https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white"
            />
          </a>
        </Box>
      </Box>

      <form autoComplete="off">
        <Box sx={{ mb: 3 }}>
          <Typography variant="h6">{I18n.t("settings")}</Typography>
          <Typography variant="body2" sx={{ mt: 0.5, color: "text.secondary" }}>
            {I18n.t("settingsDesc")}
          </Typography>
        </Box>

        {/* Section: Connection */}
        {renderSection(
          I18n.t("sectionConnection"),
          <Stack spacing={1.5}>
            <Box>
              <FormLabel>{I18n.t("connectionMode")}:</FormLabel>
              <Box>
                {renderSelect("connectionMode", [
                  { value: "authKey", title: "authKey" },
                  { value: "local", title: "local" },
                ])}
              </Box>
            </Box>

            {isAuthKey && (
              <Box>
                <FormLabel>{I18n.t("authKey")}:</FormLabel>
                <Box>{renderInput("authorizationCloudKey", "text")}</Box>
              </Box>
            )}

            {isAuthKey && (
              <Box>{renderCheckbox("useZenSDK", "useZenSDK")}</Box>
            )}

            {isAuthKey && (
              <Box>
                {renderCheckbox("useAddionalLocalMqtt", "useAddionalLocalMqtt")}
              </Box>
            )}

            {isAuthKey && (
              <Box>{renderCheckbox("useRestart", "useRestart")}</Box>
            )}
          </Stack>,
        )}

        {/* Section: Local MQTT */}
        {showLocalMqttSection &&
          renderSection(
            I18n.t("sectionLocalMqtt"),
            <Stack spacing={1.5}>
              <Box>
                <FormLabel>{I18n.t("localMqttUrl")}:</FormLabel>
                <Box>{renderInput("localMqttUrl", "text")}</Box>
              </Box>

              <Box>
                {renderCheckbox("localMqttSSL", "localMqttSSL")}
                {props.native["localMqttSSL"] && (
                  <Box sx={{ pl: 3.5 }}>
                    {renderCheckbox(
                      "localMqttAcceptSelfSignedSSL",
                      "localMqttAcceptSelfSignedSSL",
                    )}
                  </Box>
                )}
              </Box>

              {isAuthKey && useLocalMqtt && (
                <Box>
                  {renderCheckbox("relayMqttToCloud", "relayMqttToCloud")}
                </Box>
              )}
            </Stack>,
          )}

        {/* Section: Devices (local mode only) */}
        {isLocal &&
          renderSection(
            I18n.t("sectionDevices"),
            <Stack spacing={2}>
              <Box>
                <FormLabel>Device 1:</FormLabel>
                <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                  {renderSelect("localDevice1ProductKey", productKeys)}
                  <Box sx={{ ml: 1.25 }}>
                    {renderInput("localDevice1DeviceKey", "text", "Device Key")}
                  </Box>
                </Box>
              </Box>

              {props.native["localDevice1DeviceKey"] && (
                <Box>
                  <FormLabel>Device 2:</FormLabel>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    {renderSelect("localDevice2ProductKey", productKeys)}
                    <Box sx={{ ml: 1.25 }}>
                      {renderInput(
                        "localDevice2DeviceKey",
                        "text",
                        "Device Key",
                      )}
                    </Box>
                  </Box>
                </Box>
              )}

              {props.native["localDevice2DeviceKey"] && (
                <Box>
                  <FormLabel>Device 3:</FormLabel>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    {renderSelect("localDevice3ProductKey", productKeys)}
                    <Box sx={{ ml: 1.25 }}>
                      {renderInput(
                        "localDevice3DeviceKey",
                        "text",
                        "Device Key",
                      )}
                    </Box>
                  </Box>
                </Box>
              )}

              {props.native["localDevice3DeviceKey"] && (
                <Box>
                  <FormLabel>Device 4:</FormLabel>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    {renderSelect("localDevice4ProductKey", productKeys)}
                    <Box sx={{ ml: 1.25 }}>
                      {renderInput(
                        "localDevice4DeviceKey",
                        "text",
                        "Device Key",
                      )}
                    </Box>
                  </Box>
                </Box>
              )}
            </Stack>,
          )}

        {/* Section: Calculations & Power Management */}
        {renderSection(
          I18n.t("sectionPowerManagement"),
          <Stack spacing={0.5}>
            <Box>{renderCheckbox("useCalculation", "useCalculation")}</Box>
            <Box>
              {renderCheckbox("useLowVoltageBlock", "useLowVoltageBlock")}
              {props.native["useLowVoltageBlock"] && (
                <Box sx={{ pl: 3.5 }}>
                  {renderCheckbox(
                    "forceShutdownOnLowVoltage",
                    "forceShutdownOnLowVoltage",
                  )}
                  {props.native["forceShutdownOnLowVoltage"] && (
                    <Box sx={{ pl: 3.5 }}>
                      <Box>
                        <FormLabel>{I18n.t("dischargeLimit")}:</FormLabel>
                        <Box>{renderInput("dischargeLimit", "number")}</Box>
                      </Box>
                      {renderCheckbox(
                        "fullChargeIfNeeded",
                        "fullChargeIfNeeded",
                      )}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Stack>,
        )}
      </form>
    </Box>
  );
}

export default Settings;
