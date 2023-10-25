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

const styles = (_theme: Theme): StyleRules => ({
  root: {},
});

class App extends GenericApp {
  constructor(props: GenericAppProps) {
    const extendedProps: GenericAppSettings = {
      ...props,
      encryptedFields: [],
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
