/* eslint-disable @typescript-eslint/indent */
import React from "react";
import { Theme, withStyles } from "@material-ui/core/styles";

import GenericApp from "@iobroker/adapter-react/GenericApp";
import Settings from "./components/settings";
import {
  GenericAppProps,
  GenericAppSettings,
} from "@iobroker/adapter-react/types";
import { StyleRules } from "@material-ui/core/styles";
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

const styles = (_theme: Theme): StyleRules => ({
  root: {},
});

class App extends GenericApp {
  constructor(props: GenericAppProps) {
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

    this.state.native["password"] = this.decrypt(this.state.native["password"]);

    return (
      <div className="App">
        <Settings
          native={this.state.native}
          onChange={(attr, value) => this.updateNativeValue(attr, value)}
        />
        {this.renderError()}
        {this.renderToast()}
        {this.renderSaveCloseButtons()}
      </div>
    );
  }
}

export default withStyles(styles)(App);
