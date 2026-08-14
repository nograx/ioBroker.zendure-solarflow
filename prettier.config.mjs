import iobrokerPrettierConfig from "@iobroker/eslint-config/prettier.config.mjs";

export default {
  ...iobrokerPrettierConfig,
  tabWidth: 2,
  singleQuote: false,
  singleAttributePerLine: false,
  arrowParens: "always",
};
