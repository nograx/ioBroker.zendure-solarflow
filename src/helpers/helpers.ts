/* eslint-disable @typescript-eslint/indent */

export const getProductNameFromProductKey = (productKey: string): string => {
  switch (productKey) {
    case "73bkTV":
      return "Solarflow2.0";
    case "A8yh63":
      return "Solarflow Hub 2000";
    case "yWF7hV":
      return "Solarflow AIO zy";
    case "ja72U0ha":
      return "Hyper 2000";
    case "gDa3tb":
      return "Hyper 2000";
    case "8bM93H":
      return "ACE 1500";
    default:
      return "";
  }
};
