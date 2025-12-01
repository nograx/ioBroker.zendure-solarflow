import React from "react";
import ReactDOM from "react-dom";
import { ThemeProvider } from "@mui/material/styles";
import theme from "@iobroker/adapter-react/Theme";
import Utils from "@iobroker/adapter-react/Components/Utils";
import App from "./app";

let themeName = Utils.getThemeName();

function build(): void {
  ReactDOM.render(
    <ThemeProvider theme={theme(themeName)}>
      <App
        adapterName="zendure-solarflow"
        onThemeChange={(_theme) => {
          themeName = _theme;
          build();
        }}
      />
    </ThemeProvider>,
    document.getElementById("root")
  );
}

build();
