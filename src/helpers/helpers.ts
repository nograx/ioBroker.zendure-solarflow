/* eslint-disable @typescript-eslint/indent */

export const getProductNameFromProductKey = (productKey: string): string => {
  switch (productKey.toLowerCase()) {
    case "73bktv":
      return "solarflow2.0";
    case "a8yh63":
      return "solarflow hub 2000";
    case "ywf7hv":
      return "solarflow aio zy";
    case "ja72u0ha":
      return "hyper 2000";
    case "gda3tb":
      return "hyper 2000";
    case "8bm93h":
      return "ace 1500";
    case "bc8b7f":
      return "solarflow 2400 ac";
    case "b1nhmc":
      return "solarflow 800";
    default:
      return "";
  }
};
