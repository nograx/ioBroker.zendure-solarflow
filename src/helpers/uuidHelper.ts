/* eslint-disable @typescript-eslint/indent */
export const generateUniqSerial = (): string => {
  return "xxxx-xxxx-xxx-xxxx".replace(/[x]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c == "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};
