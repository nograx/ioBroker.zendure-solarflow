/* eslint-disable @typescript-eslint/indent */
import React from "react";
import { withStyles } from "@material-ui/core/styles";
import { CreateCSSProperties } from "@material-ui/core/styles/withStyles";
import TextField from "@material-ui/core/TextField";
import Input from "@material-ui/core/Input";
import FormHelperText from "@material-ui/core/FormHelperText";
import FormControl from "@material-ui/core/FormControl";
import Select from "@material-ui/core/Select";
import MenuItem from "@material-ui/core/MenuItem";
import FormControlLabel from "@material-ui/core/FormControlLabel";
import Checkbox from "@material-ui/core/Checkbox";
import I18n from "@iobroker/adapter-react/i18n";

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
  classes: Record<string, string>;
  native: Record<string, any>;
  decrypt: any;
  onChange: (attr: string, value: any) => void;
}

interface SettingsState {
  // add your state properties here
  dummy?: undefined;
}

class Settings extends React.Component<SettingsProps, SettingsState> {
  constructor(props: SettingsProps) {
    super(props);
    this.state = {};

    //this.props.onChange("password", "");
  }

  renderPassword(title: AdminWord, attr: string, type: string) {
    return (
      <TextField
        autoComplete="off"
        label={I18n.t(title)}
        className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
        value={this.props.decrypt(this.props.native[attr])}
        type={type || "text"}
        onChange={(e) => this.props.onChange(attr, e.target.value)}
        margin="normal"
      />
    );
  }

  renderInput(title: AdminWord, attr: string, type: string) {
    return (
      <TextField
        autoComplete="off"
        label={I18n.t(title)}
        className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
        value={this.props.native[attr]}
        type={type || "text"}
        onChange={(e) => this.props.onChange(attr, e.target.value)}
        margin="normal"
      />
    );
  }

  renderSelect(
    title: AdminWord,
    attr: string,
    options: { value: string; title: AdminWord }[],
    style?: React.CSSProperties,
  ) {
    return (
      <FormControl
        className={`${this.props.classes.input} ${this.props.classes.controlElement}`}
        style={{
          paddingTop: 5,
          ...style,
        }}
      >
        <Select
          value={this.props.native[attr] || "_"}
          onChange={(e) =>
            this.props.onChange(
              attr,
              e.target.value === "_" ? "" : e.target.value,
            )
          }
          input={<Input name={attr} id={attr + "-helper"} />}
        >
          {options.map((item) => (
            <MenuItem key={"key-" + item.value} value={item.value || "_"}>
              {I18n.t(item.title)}
            </MenuItem>
          ))}
        </Select>
        <FormHelperText>{I18n.t(title)}</FormHelperText>
      </FormControl>
    );
  }

  renderCheckbox(title: AdminWord, attr: string, style?: React.CSSProperties) {
    return (
      <FormControlLabel
        key={attr}
        style={{
          paddingTop: 5,
          ...style,
        }}
        className={this.props.classes.controlElement}
        control={
          <Checkbox
            checked={this.props.native[attr]}
            onChange={() => this.props.onChange(attr, !this.props.native[attr])}
            color="primary"
          />
        }
        label={I18n.t(title)}
      />
    );
  }

  render() {
    return (
      <div style={{ margin: 20 }}>
        <form autoComplete="off" className={this.props.classes.tab}>
          <div style={{ marginBottom: 20 }}>
            <h3>{I18n.t("settings")}</h3>
          </div>
          <div>{I18n.t("settingsDesc")}</div>
          <div style={{ marginTop: 10, marginBottom: 5 }}>
            {this.renderSelect("server", "server", [
              { value: "global", title: "global" },
              { value: "eu", title: "eu" },
            ])}
          </div>
          <div>{this.renderInput("userName", "userName", "text")}</div>
          <div>{this.renderPassword("password", "password", "text")}</div>
          {this.props.native["password"] == undefined ||
            (this.props.native["password"] == "" && (
              <div style={{ color: "red" }}>{I18n.t("enterPassword")}</div>
            ))}

          <div>{this.renderCheckbox("useCalculation", "useCalculation")}</div>
          <div>
            {this.renderCheckbox("useLowVoltageBlock", "useLowVoltageBlock")}
          </div>

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
}

export default withStyles(styles)(Settings);
