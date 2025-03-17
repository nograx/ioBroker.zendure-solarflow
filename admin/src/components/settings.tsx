/* eslint-disable @typescript-eslint/indent */
import React, { useEffect, useState } from "react";

// Import material UI
import { withStyles } from "@material-ui/core/styles";
import { CreateCSSProperties } from "@material-ui/core/styles/withStyles";
import TextField from "@material-ui/core/TextField";
import Input from "@material-ui/core/Input";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";

// Import I18n
import I18n from "@iobroker/adapter-react/i18n";
import GenericApp from "@iobroker/adapter-react/GenericApp";
import { FormLabel } from "@material-ui/core";

const styles = (): Record<string, CreateCSSProperties> => ({
  input: {
    marginTop: 0,
    minWidth: 400,
  },
  button: {
    marginRight: 20,
  },
  card: {
    maxWidth: 345,
    textAlign: "center",
  },
  media: {
    height: 180,
  },
  column: {
    display: "inline-block",
    verticalAlign: "top",
    marginRight: 20,
  },
  columnLogo: {
    width: 350,
    marginRight: 0,
  },
  columnSettings: {
    width: "calc(100% - 370px)",
  },
  controlElement: {
    //background: "#d2d2d2",
    marginBottom: 5,
  },
});

interface SettingsProps {
  app: GenericApp;
  classes: Record<string, string>;
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

  function renderInput(attr: string, type: string, placeholder?: string) {
    return (
      <TextField
        autoComplete="off"
        className={`${props.classes.input} ${props.classes.controlElement}`}
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
    style?: React.CSSProperties
  ) {
    return (
      <FormControl
        className={`${props.classes.input} ${props.classes.controlElement}`}
        style={{
          paddingTop: 5,
          ...style,
        }}
      >
        <Select
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

  function renderCheckbox(
    title: AdminWord,
    attr: string,
    style?: React.CSSProperties
  ) {
    return (
      <FormControlLabel
        key={attr}
        style={{
          paddingTop: 5,
          ...style,
        }}
        className={props.classes.controlElement}
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
    <div style={{ margin: 20 }}>
      <h3>{I18n.t("donateHeader")}</h3>
      <div style={{ marginTop: 20 }}>
        {I18n.t("donate1")}

        <br />
        {I18n.t("donate2")}
      </div>
      <div style={{ marginTop: 20 }}>
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
      </div>

      <form autoComplete="off" className={props.classes.tab}>
        <div style={{ marginBottom: 20 }}>
          <h3>{I18n.t("settings")}</h3>
        </div>
        <div>{I18n.t("settingsDesc")}</div>
        <div style={{ marginTop: 30 }}>
          <FormLabel>{I18n.t("server")}:</FormLabel>
          <div>
            {renderSelect("server", [
              { value: "global", title: "global" },
              { value: "eu", title: "eu" },
              { value: "local", title: "local" },
            ])}
          </div>
        </div>

        {props.native["server"] != "local" && (
          <div>
            {renderCheckbox("useFallbackService", "useFallbackService")}
          </div>
        )}

        {props.native["server"] != "local" && (
          <div style={{ marginTop: 10 }}>
            <div>
              <FormLabel>{I18n.t("userName")}:</FormLabel>
            </div>
            <div>{renderInput("userName", "text")}</div>
          </div>
        )}

        {props.native["server"] == "local" && (
          <div style={{ marginTop: 10 }}>
            <div>
              <FormLabel>{I18n.t("localMqttUrl")}:</FormLabel>
            </div>
            <div>{renderInput("localMqttUrl", "text")}</div>
          </div>
        )}

        {props.native["server"] != "local" &&
          (props.native["useFallbackService"] == undefined ||
            props.native["useFallbackService"] == null ||
            props.native["useFallbackService"] == false) && (
            <div style={{ marginTop: 10 }}>
              <FormLabel>{I18n.t("password")}:</FormLabel>
              <div>
                <TextField
                  autoComplete="off"
                  className={`${props.classes.input} ${props.classes.controlElement}`}
                  value={password}
                  type={"password"}
                  onChange={(e) => setPassword(e.target.value)}
                  margin="normal"
                />
              </div>

              {password == "" && props.native["server"] != "local" && (
                <div style={{ color: "red" }}>{I18n.t("enterPassword")}</div>
              )}
            </div>
          )}

        {props.native["server"] == "local" && (
          <div style={{ marginTop: 10 }}>
            {/* Device 1 Settings  */}
            <FormLabel>Device 1:</FormLabel>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                verticalAlign: "middle",
              }}
            >
              {renderSelect("localDevice1ProductKey", [
                { value: "73bkTV", title: "HUB 1200" },
                { value: "A8yh63", title: "HUB 2000" },
                { value: "yWF7hV", title: "AIO 2400" },
                { value: "ja72U0ha", title: "Hyper 2000" },
                { value: "8bM93H", title: "Ace 1500" },
              ])}

              <div style={{ marginLeft: 10 }}>
                {renderInput("localDevice1DeviceKey", "text", "Device Key")}
              </div>
            </div>
          </div>
        )}

        {props.native["server"] == "local" &&
          props.native["localDevice1DeviceKey"] && (
            <div style={{ marginTop: 10 }}>
              {/* Device 1 Settings  */}
              <FormLabel>Device 2:</FormLabel>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  verticalAlign: "middle",
                }}
              >
                {renderSelect("localDevice2ProductKey", [
                  { value: "73bkTV", title: "HUB 1200" },
                  { value: "A8yh63", title: "HUB 2000" },
                  { value: "yWF7hV", title: "AIO 2400" },
                  { value: "ja72U0ha", title: "Hyper 2000" },
                  { value: "8bM93H", title: "Ace 1500" },
                ])}

                <div style={{ marginLeft: 10 }}>
                  {renderInput("localDevice2DeviceKey", "text", "Device Key")}
                </div>
              </div>
            </div>
          )}

        {props.native["useFallbackService"] == true && (
          <div style={{ marginTop: 10 }}>
            <FormLabel>{I18n.t("snNumber")}:</FormLabel>
            <div>{renderInput("snNumber", "text")}</div>

            {(props.native["snNumber"] == undefined ||
              props.native["snNumber"] == null ||
              props.native["snNumber"] == "") && (
              <div style={{ color: "red" }}>{I18n.t("enterSnNumber")}</div>
            )}
          </div>
        )}

        <div>{renderCheckbox("useCalculation", "useCalculation")}</div>
        <div>{renderCheckbox("useLowVoltageBlock", "useLowVoltageBlock")}</div>

        {props.native["useLowVoltageBlock"] != undefined &&
          props.native["useLowVoltageBlock"] == true && (
            <div>
              {renderCheckbox(
                "forceShutdownOnLowVoltage",
                "forceShutdownOnLowVoltage"
              )}

              {props.native["forceShutdownOnLowVoltage"] != undefined &&
                props.native["forceShutdownOnLowVoltage"] == true && (
                  <div style={{ marginTop: 10 }}>
                    <FormLabel>{I18n.t("dischargeLimit")}:</FormLabel>
                    <div>{renderInput("dischargeLimit", "number")}</div>
                  </div>
                )}

              {props.native["forceShutdownOnLowVoltage"] != undefined &&
                props.native["forceShutdownOnLowVoltage"] == true &&
                renderCheckbox("fullChargeIfNeeded", "fullChargeIfNeeded")}
            </div>
          )}
      </form>
    </div>
  );
}

export default withStyles(styles)(Settings);
