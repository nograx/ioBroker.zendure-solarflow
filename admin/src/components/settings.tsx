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
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import type { GenericApp } from "@iobroker/adapter-react-v5";
import { I18n, SelectID } from "@iobroker/adapter-react-v5";

const productKeys: { value; title }[] = [
  { value: "", title: "-" },
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

const productKeysWithoutEmpty = productKeys.filter((item) => item.value);

interface SettingsProps {
  app: GenericApp;
  native: Record<string, any>;
  onChange: (attr: string, value: any) => void;
}

function Settings(props: SettingsProps) {
  // The automation calculates with the value of the trigger state (smart meter grid power), so only number states are allowed
  const selectAutomationTriggerState = async (id: string): Promise<void> => {
    try {
      const socket = (props.app as unknown as { socket: any }).socket;
      const obj = await socket.getObject(id);

      if (obj?.type !== "state" || obj.common?.type !== "number") {
        props.app.showError(I18n.t("automationTriggerStateNotNumber", id, obj?.common?.type ?? obj?.type ?? "?"));
        return;
      }

      props.onChange("automationTriggerStateId", id);
    } catch (e: any) {
      props.app.showError(e?.message ?? String(e));
    }
  };

  const [showStatePicker, setShowStatePicker] = useState(false);

  useEffect(() => {
    if (props.native.connectionMode !== "authKey" && props.native.useAddionalLocalMqtt) {
      props.onChange("useAddionalLocalMqtt", false);
    }

    // 'zenSDK only' mode works exclusively with devices found via mDNS and controlled via zenSDK
    if (props.native.connectionMode === "zenSDK") {
      if (!props.native.useMdnsDiscovery) {
        props.onChange("useMdnsDiscovery", true);
      }
      if (!props.native.useZenSDK) {
        props.onChange("useZenSDK", true);
      }
    }

    if (props.native.connectionMode === "local" && !props.native.useMdnsDiscovery && props.native.useZenSDK) {
      props.onChange("useZenSDK", false);
    }
  }, [props.native.connectionMode]);

  useEffect(() => {
    // Devices found by mDNS discovery are always zenSDK devices (see discoverZendureDevicesViaMdns), so they'd
    // never get any data without zenSDK enabled.
    if (props.native.useMdnsDiscovery && !props.native.useZenSDK) {
      props.onChange("useZenSDK", true);
    }
  }, [props.native.useMdnsDiscovery]);

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

  function renderSelect(attr: string, options: { value: string; title: AdminWord }[]) {
    return (
      <FormControl sx={{ ...inputSx, ...controlElementSx, pt: 0.625 }} variant="standard">
        <Select
          variant="standard"
          value={props.native[attr] || "_"}
          onChange={(e) => props.onChange(attr, e.target.value === "_" ? "" : e.target.value)}
          input={<Input name={attr} id={`${attr}-helper`} />}
        >
          {options.map((item) => (
            <MenuItem key={`key-${item.value}`} value={item.value || "_"}>
              {I18n.t(item.title)}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    );
  }

  function renderCheckbox(title: AdminWord, attr: string, disabled?: boolean) {
    return (
      <FormControlLabel
        key={attr}
        sx={{ ...controlElementSx, pt: 0.625 }}
        control={
          <Checkbox
            checked={props.native[attr]}
            onChange={() => props.onChange(attr, !props.native[attr])}
            disabled={disabled}
            color="primary"
          />
        }
        label={I18n.t(title)}
      />
    );
  }

  const maxDevices = 4;

  function removeDevice(deviceNumber: number) {
    const updates: [string, any][] = [];
    for (let i = deviceNumber; i < maxDevices; i++) {
      updates.push([`localDevice${i}ProductKey`, props.native[`localDevice${i + 1}ProductKey`] || ""]);
      updates.push([`localDevice${i}DeviceKey`, props.native[`localDevice${i + 1}DeviceKey`] || ""]);
    }
    updates.push([`localDevice${maxDevices}ProductKey`, ""]);
    updates.push([`localDevice${maxDevices}DeviceKey`, ""]);

    // Chained via cb: updateNativeValue clones this.state.native per call, so
    // firing all updates synchronously would let only the last one survive.
    function applyNext(index: number) {
      if (index >= updates.length) {
        return;
      }
      const [attr, value] = updates[index];
      props.app.updateNativeValue(attr, value, () => applyNext(index + 1));
    }
    applyNext(0);
  }

  function renderSection(title: string, children: React.ReactNode) {
    return (
      <Paper elevation={1} sx={{ p: 2.5, mb: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: "text.primary", mb: 1 }}>
          {title}
        </Typography>
        <Divider sx={{ mb: 2 }} />
        {children}
      </Paper>
    );
  }

  const isAuthKey = props.native.connectionMode === "authKey";
  const isLocal = props.native.connectionMode === "local";
  const isZenSdkOnly = props.native.connectionMode === "zenSDK";
  const useLocalMqtt = props.native.useAddionalLocalMqtt;
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
          <a href="https://www.paypal.com/paypalme/PeterFrommert" target="_blank" rel="noreferrer noopener">
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
                  { value: "zenSDK", title: "zenSdkOnly" },
                ])}
              </Box>
            </Box>

            {isAuthKey && (
              <Box>
                <FormLabel>{I18n.t("authKey")}:</FormLabel>
                <Box>{renderInput("authorizationCloudKey", "text")}</Box>
              </Box>
            )}

            <Box>{renderCheckbox("useZenSDK", "useZenSDK", props.native.useMdnsDiscovery || isZenSdkOnly)}</Box>

            {isAuthKey && <Box>{renderCheckbox("useAddionalLocalMqtt", "useAddionalLocalMqtt")}</Box>}

            {isAuthKey && <Box>{renderCheckbox("useRestart", "useRestart")}</Box>}

            <Box>{renderCheckbox("useMdnsDiscovery", "useMdnsDiscovery", isZenSdkOnly)}</Box>
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
                {props.native.localMqttSSL && (
                  <Box sx={{ pl: 3.5 }}>
                    {renderCheckbox("localMqttAcceptSelfSignedSSL", "localMqttAcceptSelfSignedSSL")}
                  </Box>
                )}
              </Box>

              {isAuthKey && useLocalMqtt && <Box>{renderCheckbox("relayMqttToCloud", "relayMqttToCloud")}</Box>}
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
                  {renderSelect(
                    "localDevice1ProductKey",
                    props.native.localDevice1DeviceKey ? productKeysWithoutEmpty : productKeys,
                  )}
                  <Box sx={{ ml: 1.25 }}>{renderInput("localDevice1DeviceKey", "text", "Device Key")}</Box>
                  {props.native.localDevice1DeviceKey && (
                    <IconButton size="small" title={I18n.t("removeDevice")} onClick={() => removeDevice(1)}>
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>

              {props.native.localDevice1DeviceKey && (
                <Box>
                  <FormLabel>Device 2:</FormLabel>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    {renderSelect(
                      "localDevice2ProductKey",
                      props.native.localDevice2DeviceKey ? productKeysWithoutEmpty : productKeys,
                    )}
                    <Box sx={{ ml: 1.25 }}>{renderInput("localDevice2DeviceKey", "text", "Device Key")}</Box>
                    {props.native.localDevice2DeviceKey && (
                      <IconButton size="small" title={I18n.t("removeDevice")} onClick={() => removeDevice(2)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              )}

              {props.native.localDevice2DeviceKey && (
                <Box>
                  <FormLabel>Device 3:</FormLabel>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    {renderSelect(
                      "localDevice3ProductKey",
                      props.native.localDevice3DeviceKey ? productKeysWithoutEmpty : productKeys,
                    )}
                    <Box sx={{ ml: 1.25 }}>{renderInput("localDevice3DeviceKey", "text", "Device Key")}</Box>
                    {props.native.localDevice3DeviceKey && (
                      <IconButton size="small" title={I18n.t("removeDevice")} onClick={() => removeDevice(3)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Box>
                </Box>
              )}

              {props.native.localDevice3DeviceKey && (
                <Box>
                  <FormLabel>Device 4:</FormLabel>
                  <Box sx={{ display: "flex", alignItems: "center", mt: 0.5 }}>
                    {renderSelect("localDevice4ProductKey", productKeys)}
                    <Box sx={{ ml: 1.25 }}>{renderInput("localDevice4DeviceKey", "text", "Device Key")}</Box>
                    {props.native.localDevice4DeviceKey && (
                      <IconButton size="small" title={I18n.t("removeDevice")} onClick={() => removeDevice(4)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
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
              {props.native.useLowVoltageBlock && (
                <Box sx={{ pl: 3.5 }}>
                  {renderCheckbox("forceShutdownOnLowVoltage", "forceShutdownOnLowVoltage")}
                  {props.native.forceShutdownOnLowVoltage && (
                    <Box sx={{ pl: 3.5 }}>
                      <Box>
                        <FormLabel>{I18n.t("dischargeLimit")}:</FormLabel>
                        <Box>{renderInput("dischargeLimit", "number")}</Box>
                      </Box>
                      {renderCheckbox("fullChargeIfNeeded", "fullChargeIfNeeded")}
                    </Box>
                  )}
                </Box>
              )}
            </Box>
          </Stack>,
        )}

        {/* Section: Automation */}
        {renderSection(
          I18n.t("sectionAutomation"),
          <Stack spacing={1.5}>
            <Box>{renderCheckbox("enableAutomation", "enableAutomation")}</Box>

            {props.native.enableAutomation && (
              <Box>
                <FormLabel>{I18n.t("automationTriggerState")}:</FormLabel>
                <Typography variant="body2" sx={{ color: "text.secondary", mb: 0.5 }}>
                  {I18n.t("automationTriggerStateDesc")}
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center" }}>
                  <TextField
                    variant="standard"
                    sx={{ ...inputSx, ...controlElementSx, minWidth: 320 }}
                    value={props.native.automationTriggerStateId || ""}
                    placeholder={I18n.t("selectState")}
                    slotProps={{ input: { readOnly: true } }}
                    onClick={() => setShowStatePicker(true)}
                  />
                  <IconButton size="small" title={I18n.t("selectState")} onClick={() => setShowStatePicker(true)}>
                    <SearchIcon fontSize="small" />
                  </IconButton>
                  {props.native.automationTriggerStateId && (
                    <IconButton
                      size="small"
                      title={I18n.t("clear")}
                      onClick={() => props.onChange("automationTriggerStateId", "")}
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  )}
                </Box>
              </Box>
            )}
          </Stack>,
        )}
      </form>

      {showStatePicker && (
        <SelectID
          socket={(props.app as unknown as { socket: any }).socket}
          theme={props.app.state.theme}
          themeName={props.app.state.themeName}
          themeType={props.app.state.themeType}
          selected={props.native.automationTriggerStateId || undefined}
          types="state"
          onOk={(selected) => {
            const id = Array.isArray(selected) ? selected[0] : selected;
            setShowStatePicker(false);
            if (id) {
              void selectAutomationTriggerState(id);
            }
          }}
          onClose={() => setShowStatePicker(false)}
        />
      )}
    </Box>
  );
}

export default Settings;
