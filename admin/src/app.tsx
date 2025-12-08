/* eslint-disable @typescript-eslint/indent */
import React from "react";
import { StyledEngineProvider, ThemeProvider } from "@mui/material";

import {
  GenericApp,
  type IobTheme,
  type GenericAppProps,
  type GenericAppState,
  GenericAppSettings,
} from "@iobroker/adapter-react-v5";
import Settings from "./components/settings";
import de from "./i18n/de.json";
import en from "./i18n/en.json";
import es from "./i18n/es.json";
import fr from "./i18n/fr.json";
import it from "./i18n/it.json";
import nl from "./i18n/nl.json";
import pl from "./i18n/pl.json";
import pt from "./i18n/pt.json";
import ru from "./i18n/ru.json";
import zhCn from "./i18n/zh-cn.json";

const styles: Record<string, any> = {
  tabContent: {
    padding: 10,
    height: "calc(100% - 56px)",
    overflow: "auto",
  },
  tabContentIFrame: {
    padding: 10,
    height: "calc(100% - 56px)",
    overflow: "auto",
  },
  selected: (theme: IobTheme): React.CSSProperties => ({
    color: theme.palette.mode === "dark" ? undefined : "#FFF !important",
  }),
  indicator: (theme: IobTheme): React.CSSProperties => ({
    backgroundColor:
      theme.palette.mode === "dark" ? theme.palette.secondary.main : "#FFF",
  }),
};

interface AppState extends GenericAppState {
  showAckTempPasswordDialog: boolean;
  theme: IobTheme;
  themeType: "light" | "dark";
  native: Record<string, any>;
  loaded: boolean;
  changed: boolean;
}

export default class App extends GenericApp<GenericAppProps, AppState> {
  constructor(props: any) {
    const extendedProps: GenericAppSettings = {
      ...props,
      encryptedFields: ["password"],
      translations: {
        de: de,
        en: en,
        es: es,
        fr: fr,
        it: it,
        nl: nl,
        pl: pl,
        pt: pt,
        ru: ru,
        "zh-cn": zhCn,
      },
    };
    super(props, extendedProps);
  }

  onConnectionReady(): void {
    // executed when connection is ready
  }

  render() {
    if (!this.state.loaded) {
      return super.render();
    }

    return (
      <StyledEngineProvider injectFirst>
        <ThemeProvider theme={this.state.theme}>
          <div
            className="App"
            style={{
              background: this.state.theme.palette.background.default,
              color: this.state.theme.palette.text.primary,
            }}
          >
            <div
              style={
                this.isIFrame ? styles.tabContentIFrame : styles.tabContent
              }
            >
              <Settings
                app={this}
                native={this.state.native}
                onChange={(attr, value) => this.updateNativeValue(attr, value)}
              />
              {this.renderError()}
              {this.renderToast()}
              {this.renderSaveCloseButtons()}
            </div>
          </div>
        </ThemeProvider>
      </StyledEngineProvider>
    );
  }
}
