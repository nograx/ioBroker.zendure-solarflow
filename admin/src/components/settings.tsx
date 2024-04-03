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

  function renderInput(attr: string, type: string) {
    return (
      <TextField
        autoComplete="off"
        className={`${props.classes.input} ${props.classes.controlElement}`}
        value={props.native[attr]}
        type={type || "text"}
        onChange={(e) => props.onChange(attr, e.target.value)}
        margin="normal"
      />
    );
  }

  function renderSelect(
    attr: string,
    options: { value: string; title: AdminWord }[],
    style?: React.CSSProperties,
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
    style?: React.CSSProperties,
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
            ])}
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <FormLabel>{I18n.t("userName")}:</FormLabel>
          <div>{renderInput("userName", "text")}</div>
        </div>
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
        </div>
        {password == "" && (
          <div style={{ color: "red" }}>{I18n.t("enterPassword")}</div>
        )}

        <div>{renderCheckbox("useCalculation", "useCalculation")}</div>
        <div>{renderCheckbox("useLowVoltageBlock", "useLowVoltageBlock")}</div>

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
            rel="noreferrer"
          >
            <img
              height={30}
              src={
                "https://img.shields.io/badge/PayPal-00457C?style=for-the-badge&logo=paypal&logoColor=white"
              }
            ></img>
          </a>
        </div>
      </form>
    </div>
  );
}

export default withStyles(styles)(Settings);
