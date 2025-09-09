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
    case "b3dxda":
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

export const getMinAndMaxOutputLimitForProductKey = (
  productKey: string,
  limit: number
): number => {
  const productName = getProductNameFromProductKey(productKey);

  if (limit < 100 && limit != 90 && limit != 60 && limit != 30 && limit != 0) {
    // NUR Solarflow HUB: Das Limit kann unter 100 nur in 30er Schritten gesetzt werden, dH. 30/60/90/100, wir rechnen das also um
    if (
      limit < 100 &&
      limit > 90 &&
      !productName?.includes("hyper") &&
      !productName?.includes("2400 ac") &&
      !productName?.includes("solarflow 800")
    ) {
      limit = 90;
    } else if (
      limit > 60 &&
      limit < 90 &&
      !productName?.includes("hyper") &&
      !productName?.includes("2400 ac") &&
      !productName?.includes("solarflow 800")
    ) {
      limit = 60;
    } else if (
      limit > 30 &&
      limit < 60 &&
      !productName?.includes("hyper") &&
      !productName?.includes("2400 ac") &&
      !productName?.includes("solarflow 800")
    ) {
      limit = 30;
    } else if (limit < 30) {
      limit = 30;
    }
  }

  switch (productName?.toLocaleLowerCase()) {
    case "hyper 2000":
      if (limit > 1200) {
        limit = 1200;
      }
      break;
    case "solarflow 800":
      if (limit > 800) {
        limit = 800;
      }
      break;
    case "solarflow2.0":
      if (limit > 1200) {
        limit = 1200;
      }
      break;
    case "solarflow hub 2000":
      if (limit > 1200) {
        limit = 1200;
      }
      break;
    case "solarflow aio zy":
      if (limit > 1200) {
        limit = 1200;
      }
      break;
    case "solarflow 800 pro":
      if (limit > 800) {
        limit = 800;
      }
      break;
    case "solarflow 2400 ac":
      if (limit > 2400) {
        limit = 2400;
      }
      break;
    default:
      break;
  }

  return limit;
};

export const getMinAndMaxInputLimitForProductKey = (
  productKey: string,
  limit: number
): number => {
  let maxLimit = 900;

  const productName = getProductNameFromProductKey(productKey);

  if (productName?.includes("hyper")) {
    maxLimit = 1200;
  }

  if (productName?.includes("2400 ac")) {
    maxLimit = 2400;
  }

  if (productName?.includes("solarflow 800")) {
    maxLimit = 800;
  }

  if (productName?.includes("ace")) {
    // Das Limit kann nur in 100er Schritten gesetzt werden
    limit = Math.ceil(limit / 100) * 100;
  }

  if (limit < 0) {
    limit = 0;
  } else if (limit > 0 && limit <= 30) {
    limit = 30;
  } else if (limit > maxLimit) {
    limit = maxLimit;
  }

  return limit;
};
