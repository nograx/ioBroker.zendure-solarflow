"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);
var ZenHaDevice_exports = {};
__export(ZenHaDevice_exports, {
  ZenHaDevice: () => ZenHaDevice
});
module.exports = __toCommonJS(ZenHaDevice_exports);
var import_constants = require("../../constants/constants");
var import_createCalculationStates = require("../../helpers/createCalculationStates");
var import_timeHelper = require("../../helpers/timeHelper");
var import_mqttSharedService = require("../../services/mqttSharedService");
class ZenHaDevice {
  constructor(_adapter, _productKey, _deviceKey, _productName, _deviceName, _zenHaDeviceDetails) {
    this.batteries = [];
    this.iotTopic = "";
    this.functionTopic = "";
    this.maxInputLimit = 0;
    this.maxOutputLimit = 0;
    this.states = [];
    this.controlStates = [];
    this.addOrUpdatePackData = async (packData, isSolarFlow) => {
      if (this.adapter && this.productKey && this.deviceKey) {
        await packData.forEach(async (x) => {
          var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q, _r, _s, _t, _u, _v, _w, _x, _y, _z, _A, _B, _C;
          if (x.sn && this.adapter) {
            let batType = "";
            if (this.productKey == "yWF7hV") {
              batType = "AIO2400";
            } else if (x.sn.startsWith("A")) {
              batType = "AB1000";
            } else if (x.sn.startsWith("B")) {
              batType = "AB1000S";
            } else if (x.sn.startsWith("C")) {
              if (x.sn[3] == "F") {
                batType = "AB2000S";
              } else {
                batType = "AB2000";
              }
            } else if (x.sn.startsWith("F")) {
              batType = "AB3000X";
            }
            if (!this.batteries.some((y) => y.packSn == x.sn)) {
              this.batteries.push({
                packSn: x.sn,
                type: batType
              });
              this.adapter.log.debug(
                `[addOrUpdatePackData] Added battery ${batType} with SN ${x.sn} on deviceKey ${this.deviceKey} to batteries array!`
              );
            }
            const key = (this.productKey + "." + this.deviceKey + ".packData." + x.sn).replace(this.adapter.FORBIDDEN_CHARS, "");
            await ((_a = this.adapter) == null ? void 0 : _a.extendObject(key, {
              type: "channel",
              common: {
                name: {
                  de: batType,
                  en: batType
                }
              },
              native: {}
            }));
            await ((_b = this.adapter) == null ? void 0 : _b.extendObject(key + ".model", {
              type: "state",
              common: {
                name: {
                  de: "Batterietyp",
                  en: "Battery type"
                },
                type: "string",
                desc: "model",
                role: "value",
                read: true,
                write: false
              },
              native: {}
            }));
            await ((_c = this.adapter) == null ? void 0 : _c.setState(key + ".model", batType, true));
            await ((_d = this.adapter) == null ? void 0 : _d.extendObject(key + ".sn", {
              type: "state",
              common: {
                name: {
                  de: "Seriennummer",
                  en: "Serial id"
                },
                type: "string",
                desc: "Serial ID",
                role: "value",
                read: true,
                write: false
              },
              native: {}
            }));
            await ((_e = this.adapter) == null ? void 0 : _e.setState(key + ".sn", x.sn, true));
            if (x.socLevel) {
              await ((_f = this.adapter) == null ? void 0 : _f.extendObject(key + ".socLevel", {
                type: "state",
                common: {
                  name: {
                    de: "SOC der Batterie",
                    en: "soc of battery"
                  },
                  type: "number",
                  desc: "SOC Level",
                  role: "value",
                  read: true,
                  write: false,
                  unit: "%"
                },
                native: {}
              }));
              await ((_g = this.adapter) == null ? void 0 : _g.setState(key + ".socLevel", x.socLevel, true));
            }
            if (x.maxTemp) {
              const maxTempCelsius = x.maxTemp / 10 - 273.15;
              const maxTempState = await ((_h = this.adapter) == null ? void 0 : _h.getStateAsync(
                key + ".maxTemp"
              ));
              if (maxTempState && maxTempState.val && maxTempCelsius != maxTempState.val) {
                await ((_i = this.adapter) == null ? void 0 : _i.setState(
                  `${this.productKey}.${this.deviceKey}.lastUpdate`,
                  (/* @__PURE__ */ new Date()).getTime(),
                  true
                ));
                const currentWifiState = await this.adapter.getStateAsync(
                  `${this.productKey}.${this.deviceKey}.wifiState`
                );
                if (currentWifiState && currentWifiState.val == "Disconnected") {
                  this.updateSolarFlowState("wifiState", "Connected");
                }
              }
              await ((_j = this.adapter) == null ? void 0 : _j.extendObject(key + ".maxTemp", {
                type: "state",
                common: {
                  name: {
                    de: "Max. Temperatur der Batterie",
                    en: "max temp. of battery"
                  },
                  type: "number",
                  desc: "Max. Temp",
                  role: "value",
                  read: true,
                  write: false,
                  unit: "\xB0C"
                },
                native: {}
              }));
              await ((_k = this.adapter) == null ? void 0 : _k.setState(
                key + ".maxTemp",
                maxTempCelsius,
                true
              ));
            }
            if (x.minVol) {
              const minVol = x.minVol / 100;
              const minVolState = await ((_l = this.adapter) == null ? void 0 : _l.getStateAsync(
                key + ".minVol"
              ));
              if (minVolState && minVolState.val && minVol != minVolState.val) {
                await ((_m = this.adapter) == null ? void 0 : _m.setState(
                  `${this.productKey}.${this.deviceKey}.lastUpdate`,
                  (/* @__PURE__ */ new Date()).getTime(),
                  true
                ));
                const currentWifiState = await this.adapter.getStateAsync(
                  `${this.productKey}.${this.deviceKey}.wifiState`
                );
                if (currentWifiState && currentWifiState.val == "Disconnected") {
                  this.updateSolarFlowState("wifiState", "Connected");
                }
              }
              await ((_n = this.adapter) == null ? void 0 : _n.extendObject(key + ".minVol", {
                type: "state",
                common: {
                  name: "minVol",
                  type: "number",
                  desc: "minVol",
                  role: "value",
                  read: true,
                  write: false,
                  unit: "V"
                },
                native: {}
              }));
              await ((_o = this.adapter) == null ? void 0 : _o.setState(key + ".minVol", minVol, true));
            }
            if (x.batcur) {
              await ((_p = this.adapter) == null ? void 0 : _p.extendObject(key + ".batcur", {
                type: "state",
                common: {
                  name: "batcur",
                  type: "number",
                  desc: "batcur",
                  role: "value",
                  read: true,
                  write: false,
                  unit: "A"
                },
                native: {}
              }));
              await ((_q = this.adapter) == null ? void 0 : _q.setState(key + ".batcur", x.batcur / 10, true));
            }
            if (x.maxVol) {
              const maxVol = x.maxVol / 100;
              const maxVolState = await ((_r = this.adapter) == null ? void 0 : _r.getStateAsync(
                key + ".maxVol"
              ));
              if (maxVolState && maxVolState.val && maxVol != maxVolState.val) {
                await ((_s = this.adapter) == null ? void 0 : _s.setState(
                  `${this.productKey}.${this.deviceKey}.lastUpdate`,
                  (/* @__PURE__ */ new Date()).getTime(),
                  true
                ));
                const currentWifiState = await this.adapter.getStateAsync(
                  `${this.productKey}.${this.deviceKey}.wifiState`
                );
                if (currentWifiState && currentWifiState.val == "Disconnected") {
                  this.updateSolarFlowState("wifiState", "Connected");
                }
              }
              await ((_t = this.adapter) == null ? void 0 : _t.extendObject(key + ".maxVol", {
                type: "state",
                common: {
                  name: "maxVol",
                  type: "number",
                  desc: "maxVol",
                  role: "value",
                  read: true,
                  write: false,
                  unit: "V"
                },
                native: {}
              }));
              await ((_u = this.adapter) == null ? void 0 : _u.setState(key + ".maxVol", maxVol, true));
            }
            if (x.totalVol) {
              const totalVol = x.totalVol / 100;
              const totalVolState = await ((_v = this.adapter) == null ? void 0 : _v.getStateAsync(
                key + ".totalVol"
              ));
              if (totalVolState && totalVolState.val && totalVol != totalVolState.val) {
                await ((_w = this.adapter) == null ? void 0 : _w.setState(
                  `${this.productKey}.${this.deviceKey}.lastUpdate`,
                  (/* @__PURE__ */ new Date()).getTime(),
                  true
                ));
                const currentWifiState = await this.adapter.getStateAsync(
                  `${this.productKey}.${this.deviceKey}.wifiState`
                );
                if (currentWifiState && currentWifiState.val == "Disconnected") {
                  this.updateSolarFlowState("wifiState", "Connected");
                }
              }
              await ((_x = this.adapter) == null ? void 0 : _x.extendObject(key + ".totalVol", {
                type: "state",
                common: {
                  name: "totalVol",
                  type: "number",
                  desc: "totalVol",
                  role: "value",
                  read: true,
                  write: false,
                  unit: "V"
                },
                native: {}
              }));
              await ((_y = this.adapter) == null ? void 0 : _y.setState(key + ".totalVol", totalVol, true));
              if (isSolarFlow) {
                this.checkVoltage(totalVol);
              }
            }
            if (x.soh) {
              await ((_z = this.adapter) == null ? void 0 : _z.extendObject(key + ".soh", {
                type: "state",
                common: {
                  name: {
                    de: "Gesundheitszustand",
                    en: "State of Health"
                  },
                  type: "number",
                  desc: "State of Health",
                  role: "value",
                  read: true,
                  write: false,
                  unit: "%"
                },
                native: {}
              }));
              await ((_A = this.adapter) == null ? void 0 : _A.setState(key + ".soh", x.soh / 10, true));
            }
            if (x.power) {
              await ((_B = this.adapter) == null ? void 0 : _B.extendObject(key + ".power", {
                type: "state",
                common: {
                  name: {
                    de: "Energie",
                    en: "Power"
                  },
                  type: "number",
                  desc: "Power",
                  read: true,
                  write: false,
                  role: "value.power",
                  unit: "W"
                },
                native: {}
              }));
              await ((_C = this.adapter) == null ? void 0 : _C.setState(key + ".power", x.power, true));
            }
            let found = false;
            Object.entries(x).forEach(([key2, value]) => {
              var _a2;
              import_mqttSharedService.knownPackDataProperties.forEach((property) => {
                if (property == key2) {
                  found = true;
                }
              });
              if (found) {
              } else {
                (_a2 = this.adapter) == null ? void 0 : _a2.log.debug(
                  `[addOrUpdatePackData] ${key2} with value ${value} is a UNKNOWN PackData Mqtt Property!`
                );
              }
            });
          }
        });
      }
    };
    this.calculateSocAndEnergy = async (stateKey, value) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i, _j, _k, _l, _m, _n, _o, _p, _q;
      this.adapter.log.debug(
        `[calculateSocAndEnergy] Calculating for: ${this.productKey}.${this.deviceKey} and stateKey ${stateKey}!`
      );
      let energyWhMax = void 0;
      const minSoc = (_a = await this.adapter.getStateAsync(
        `${this.productKey}.${this.deviceKey}.minSoc`
      )) == null ? void 0 : _a.val;
      const currentSoc = (_b = await this.adapter.getStateAsync(
        `${this.productKey}.${this.deviceKey}.electricLevel`
      )) == null ? void 0 : _b.val;
      if (currentSoc && minSoc && Number(currentSoc) < Number(minSoc)) {
        this.adapter.log.debug(
          `[calculateSocAndEnergy] Don't calculate, currentSoc (${Number(currentSoc)}) is lower than minSoc (${Number(minSoc)})!`
        );
        return;
      }
      const currentEnergyState = await ((_c = this.adapter) == null ? void 0 : _c.getStateAsync(
        this.productKey + "." + this.deviceKey + ".calculations.energyWh"
      ));
      const currentEnergyMaxState = await ((_d = this.adapter) == null ? void 0 : _d.getStateAsync(
        this.productKey + "." + this.deviceKey + ".calculations.energyWhMax"
      ));
      const lowVoltageBlock = await ((_e = this.adapter) == null ? void 0 : _e.getStateAsync(
        this.productKey + "." + this.deviceKey + ".control.lowVoltageBlock"
      ));
      const currentMaxValue = Number(
        currentEnergyMaxState ? currentEnergyMaxState.val : 0
      );
      let currentEnergyWh = (currentEnergyState == null ? void 0 : currentEnergyState.val) ? Number(currentEnergyState == null ? void 0 : currentEnergyState.val) : 0;
      if (currentEnergyWh == null || currentEnergyWh == void 0 || currentEnergyWh <= 0) {
        currentEnergyWh = 0;
      }
      if (this.productKey == "yWF7hV") {
        energyWhMax = 2400;
      } else {
        for (let i = 0; i < this.batteries.length; i++) {
          if (this.batteries[i].type == "AB1000") {
            energyWhMax = (energyWhMax ? energyWhMax : 0) + 960;
          } else if (this.batteries[i].type == "AB2000") {
            energyWhMax = (energyWhMax ? energyWhMax : 0) + 1920;
          }
        }
      }
      let newEnergyWh = stateKey == "outputPack" ? currentEnergyWh + value : currentEnergyWh - value;
      if (stateKey == "outputPack" && energyWhMax != void 0 && newEnergyWh > energyWhMax) {
        newEnergyWh = energyWhMax;
        this.adapter.log.debug(
          `[calculateSocAndEnergy] newEnergyWh (${newEnergyWh}) is greater than energyWhMax (${energyWhMax}), don't extend value!`
        );
      }
      if (newEnergyWh > 0) {
        (_f = this.adapter) == null ? void 0 : _f.setState(
          `${this.productKey}.${this.deviceKey}.calculations.energyWh`,
          newEnergyWh,
          true
        );
        this.adapter.log.debug(
          `[calculateSocAndEnergy] set '${this.productKey}.${this.deviceKey}.calculations.energyWh' to ${newEnergyWh}!`
        );
        if (currentEnergyMaxState) {
          const soc = Number((newEnergyWh / currentMaxValue * 100).toFixed(1));
          await ((_g = this.adapter) == null ? void 0 : _g.setState(
            `${this.productKey}.${this.deviceKey}.calculations.soc`,
            soc > 100 ? 100 : soc,
            true
          ));
          if (newEnergyWh > currentMaxValue && !(lowVoltageBlock == null ? void 0 : lowVoltageBlock.val)) {
            await ((_h = this.adapter) == null ? void 0 : _h.setState(
              `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
              newEnergyWh,
              true
            ));
          }
          const currentOutputPackPower = await ((_i = this.adapter) == null ? void 0 : _i.getStateAsync(
            `${this.productKey}.${this.deviceKey}.outputPackPower`
          ));
          const currentPackInputPower = await ((_j = this.adapter) == null ? void 0 : _j.getStateAsync(
            this.productKey + "." + this.deviceKey + ".packInputPower"
          ));
          if (stateKey == "outputPack" && (currentOutputPackPower == null ? void 0 : currentOutputPackPower.val) != null && currentOutputPackPower != void 0) {
            const toCharge = currentMaxValue - newEnergyWh;
            const remainHoursAsDecimal = toCharge / Number(currentOutputPackPower.val);
            if (remainHoursAsDecimal < 48) {
              const remainFormatted = (0, import_timeHelper.toHoursAndMinutes)(
                Math.round(remainHoursAsDecimal * 60)
              );
              await ((_k = this.adapter) == null ? void 0 : _k.setState(
                `${this.productKey}.${this.deviceKey}.calculations.remainInputTime`,
                remainFormatted,
                true
              ));
            } else {
              await ((_l = this.adapter) == null ? void 0 : _l.setState(
                `${this.productKey}.${this.deviceKey}.calculations.remainInputTime`,
                "",
                true
              ));
            }
          } else if (stateKey == "packInput" && currentPackInputPower != null && currentPackInputPower != void 0) {
            const remainHoursAsDecimal = newEnergyWh / Number(currentPackInputPower.val);
            const remainFormatted = (0, import_timeHelper.toHoursAndMinutes)(
              Math.round(remainHoursAsDecimal * 60)
            );
            if (remainHoursAsDecimal < 48) {
              await ((_m = this.adapter) == null ? void 0 : _m.setState(
                `${this.productKey}.${this.deviceKey}.calculations.remainOutTime`,
                remainFormatted,
                true
              ));
            } else {
              await ((_n = this.adapter) == null ? void 0 : _n.setState(
                `${this.productKey}.${this.deviceKey}.calculations.remainOutTime`,
                "",
                true
              ));
            }
          }
        }
      } else if (newEnergyWh <= 0 && stateKey == "outputPack") {
        await ((_o = this.adapter) == null ? void 0 : _o.setState(
          `${this.productKey}.${this.deviceKey}.calculations.remainInputTime`,
          "",
          true
        ));
      } else if (newEnergyWh <= 0 && stateKey == "packInput") {
        await ((_p = this.adapter) == null ? void 0 : _p.setState(
          `${this.productKey}.${this.deviceKey}.calculations.remainOutTime`,
          "",
          true
        ));
        const newEnergyWhPositive = Math.abs(newEnergyWh);
        if (energyWhMax && currentMaxValue + newEnergyWhPositive <= energyWhMax) {
          await ((_q = this.adapter) == null ? void 0 : _q.setState(
            `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
            currentMaxValue + newEnergyWhPositive,
            true
          ));
        }
      }
    };
    var _a, _b;
    this.zenHaDeviceDetails = _zenHaDeviceDetails;
    this.adapter = _adapter;
    this.productKey = _productKey;
    this.deviceKey = _deviceKey;
    this.deviceName = _deviceName;
    this.productName = _productName;
    this.iotTopic = `iot/${_productKey}/${_deviceKey}/properties/write`;
    this.functionTopic = `iot/${_productKey}/${_deviceKey}/function/invoke`;
    this.createSolarFlowStates();
    this.subscribeReportTopic();
    this.subscribeIotTopic();
    this.adapter.setTimeout(() => {
      this.triggerFullTelemetryUpdate();
    }, 5e3);
    if ((_a = this.zenHaDeviceDetails) == null ? void 0 : _a.online) {
      this.updateSolarFlowState("wifiState", "Connected");
    } else if (((_b = this.zenHaDeviceDetails) == null ? void 0 : _b.online) == false) {
      this.updateSolarFlowState("wifiState", "Disconnected");
    }
  }
  async createSolarFlowStates() {
    var _a, _b, _c, _d, _e;
    const productKey = this.productKey.replace(
      this.adapter.FORBIDDEN_CHARS,
      ""
    );
    const deviceKey = this.deviceKey.replace(this.adapter.FORBIDDEN_CHARS, "");
    this.adapter.log.debug(
      `[createSolarFlowStates] Creating or updating SolarFlow states for ${this.productName} (${productKey}/${deviceKey}) and name '${this.deviceName}'.`
    );
    await ((_a = this.adapter) == null ? void 0 : _a.extendObject(productKey, {
      type: "device",
      common: {
        name: {
          de: `${this.productName} (${productKey})`,
          en: `${this.productName} (${productKey})`
        }
      },
      native: {}
    }));
    await ((_b = this.adapter) == null ? void 0 : _b.extendObject(productKey + "." + deviceKey, {
      type: "channel",
      common: {
        name: {
          de: `${this.deviceName} (${deviceKey})`,
          en: `${this.deviceName} (${deviceKey})`
        }
      },
      native: {}
    }));
    await ((_c = this.adapter) == null ? void 0 : _c.extendObject(`${productKey}.${deviceKey}.packData`, {
      type: "channel",
      common: {
        name: {
          de: "Batterie Packs",
          en: "Battery packs"
        }
      },
      native: {}
    }));
    this.states.forEach(async (state) => {
      var _a2;
      await ((_a2 = this.adapter) == null ? void 0 : _a2.extendObject(
        `${productKey}.${deviceKey}.${state.title}`,
        {
          type: "state",
          common: {
            name: {
              de: state.nameDe,
              en: state.nameEn
            },
            type: state.type,
            desc: state.title,
            role: state.role,
            read: true,
            write: false,
            unit: state.unit,
            states: state.states
          },
          native: {}
        }
      ));
    });
    await ((_d = this.adapter) == null ? void 0 : _d.extendObject(`${productKey}.${deviceKey}.control`, {
      type: "channel",
      common: {
        name: {
          de: "Steuerung f\xFCr Ger\xE4t " + deviceKey,
          en: "Control for device " + deviceKey
        }
      },
      native: {}
    }));
    this.controlStates.forEach(async (state) => {
      var _a2, _b2;
      await ((_a2 = this.adapter) == null ? void 0 : _a2.extendObject(
        `${productKey}.${deviceKey}.control.${state.title}`,
        {
          type: "state",
          common: {
            name: {
              de: state.nameDe,
              en: state.nameEn
            },
            type: state.type,
            desc: state.title,
            role: state.role,
            read: true,
            write: true,
            unit: state.unit,
            states: state.states
          },
          native: {}
        }
      ));
      (_b2 = this.adapter) == null ? void 0 : _b2.subscribeStates(
        `${productKey}.${deviceKey}.control.${state.title}`
      );
    });
    if (this.adapter.config.useCalculation) {
      await ((_e = this.adapter) == null ? void 0 : _e.extendObject(
        `${productKey}.${deviceKey}.calculations`,
        {
          type: "channel",
          common: {
            name: {
              de: "Berechnungen f\xFCr Ger\xE4t " + deviceKey,
              en: "Calculations for Device " + deviceKey
            }
          },
          native: {}
        }
      ));
      await (0, import_createCalculationStates.createCalculationStates)(this.adapter, productKey, deviceKey);
    }
  }
  subscribeReportTopic() {
    var _a;
    const reportTopic = `/${this.productKey}/${this.deviceKey}/#`;
    if (this.adapter) {
      this.adapter.log.debug(
        `[subscribeReportTopic] Subscribing to MQTT Topic: ${reportTopic}`
      );
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.subscribe(reportTopic, import_mqttSharedService.onSubscribeReportTopic);
    }
  }
  subscribeIotTopic() {
    var _a, _b, _c;
    const iotTopic = `iot/${this.productKey}/${this.deviceKey}/#`;
    (_a = this.adapter) == null ? void 0 : _a.log.debug(
      `[subscribeIotTopic] Subscribing to MQTT Topic: ${iotTopic}`
    );
    (_c = (_b = this.adapter) == null ? void 0 : _b.mqttClient) == null ? void 0 : _c.subscribe(iotTopic, (error) => {
      (0, import_mqttSharedService.onSubscribeIotTopic)(error, this.productKey, this.deviceKey);
    });
  }
  setDeviceAutomationInOutLimit(limit) {
    var _a;
    (_a = this.adapter) == null ? void 0 : _a.log.error(
      `[setAcMode] Method setDeviceAutomationInOutLimit (set to ${limit}) not defined in base class!`
    );
    return;
  }
  setAcMode(acMode) {
    var _a;
    (_a = this.adapter) == null ? void 0 : _a.log.error(
      `[setAcMode] Method setAcMode (set to ${acMode}) not defined in base class!`
    );
    return;
  }
  setDcSwitch(dcSwitch) {
    var _a;
    (_a = this.adapter) == null ? void 0 : _a.log.error(
      `[setAcMode] Method setDcSwitch (set to ${dcSwitch}) not defined in base class!`
    );
    return;
  }
  setAcSwitch(acSwitch) {
    var _a;
    (_a = this.adapter) == null ? void 0 : _a.log.error(
      `[setAcMode] Method setAcSwitch (set to ${acSwitch}) not defined in base class!`
    );
    return;
  }
  setHubState(hubState) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      if (hubState == 0 || hubState == 1) {
        const topic = `iot/${this.productKey}/${this.deviceKey}/properties/write`;
        const socSetLimit = { properties: { hubState } };
        this.adapter.log.debug(
          `[setHubState] Setting Hub State for deviceKey ${this.deviceKey} to ${hubState}!`
        );
        (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(socSetLimit));
      } else {
        this.adapter.log.debug(`[setHubState] Hub state is not 0 or 1!`);
      }
    }
  }
  setPassMode(passMode) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const topic = `iot/${this.productKey}/${this.deviceKey}/properties/write`;
      const setPassModeContent = { properties: { passMode } };
      this.adapter.log.debug(
        `[setPassMode] Set passMode for deviceKey ${this.deviceKey} to ${passMode}!`
      );
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
        topic,
        JSON.stringify(setPassModeContent)
      );
    }
  }
  setAutoRecover(autoRecover) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const topic = `iot/${this.productKey}/${this.deviceKey}/properties/write`;
      const setAutoRecoverContent = {
        properties: { autoRecover: autoRecover ? 1 : 0 }
      };
      this.adapter.log.debug(
        `[setAutoRecover] Set autoRecover for deviceKey ${this.deviceKey} to ${autoRecover}!`
      );
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
        topic,
        JSON.stringify(setAutoRecoverContent)
      );
    }
  }
  /**
   * Will set the discharge limit (minSoc)
   * @param socSet the desired minimum soc
   * @returns void
   */
  setDischargeLimit(minSoc) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      if (minSoc >= 0 && minSoc <= 50) {
        const topic = `iot/${this.productKey}/${this.deviceKey}/properties/write`;
        const socSetLimit = { properties: { minSoc: minSoc * 10 } };
        this.adapter.log.debug(
          `[setDischargeLimit] Setting Discharge Limit for device key ${this.deviceKey} to ${minSoc}!`
        );
        (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(socSetLimit));
      } else {
        this.adapter.log.debug(
          `[setDischargeLimit] Discharge limit is not in range 0<>50!`
        );
      }
    }
  }
  /**
   * Will set the maximum charge limit
   * @param socSet the desired max SOC
   * @returns void
   */
  setChargeLimit(socSet) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      if (socSet >= 40 && socSet <= 100) {
        const socSetLimit = { properties: { socSet: socSet * 10 } };
        this.adapter.log.debug(
          `[setChargeLimit] Setting ChargeLimit for device key ${this.deviceKey} to ${socSet}!`
        );
        (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
          this.iotTopic,
          JSON.stringify(socSetLimit)
        );
      } else {
        this.adapter.log.debug(
          `[setChargeLimit] Charge limit is not in range 40<>100!`
        );
      }
    }
  }
  /**
   * Will set the 'energy plan'
   * @param autoModel autoModel value, like 8 for smart matching
   * @returns void
   */
  setAutoModel(autoModel) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      let setAutoModelContent = { properties: { autoModel } };
      switch (autoModel) {
        case 8: {
          setAutoModelContent = {
            properties: {
              autoModelProgram: 1,
              autoModelValue: {
                chargingType: 0,
                chargingPower: 0,
                outPower: 0
              },
              msgType: 1,
              autoModel: 8
            }
          };
          break;
        }
        case 9:
          setAutoModelContent = {
            properties: {
              autoModelProgram: 2,
              autoModelValue: {
                chargingType: 3,
                chargingPower: 0,
                outPower: 0
              },
              msgType: 1,
              autoModel: 9
            }
          };
          break;
      }
      this.adapter.log.debug(
        `[setAutoModel] Setting autoModel for device key ${this.deviceKey} to ${autoModel}!`
      );
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
        this.iotTopic,
        JSON.stringify(setAutoModelContent)
      );
    }
  }
  async setOutputLimit(limit) {
    var _a, _b, _c;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const autoModel = (_a = await this.adapter.getStateAsync(
        this.productKey + "." + this.deviceKey + ".autoModel"
      )) == null ? void 0 : _a.val;
      if (autoModel != 0) {
        this.adapter.log.warn(
          "Operation mode (autoModel) is not set to '0', we can't set the output limit!"
        );
        return;
      }
      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }
      if (limit > this.maxOutputLimit) {
        limit = this.maxOutputLimit;
      }
      if (limit < 100 && limit != 90 && limit != 60 && limit != 30 && limit != 0 && (this.productKey == "73bktv" || this.productKey == "a8yh63")) {
        if (limit < 100 && limit > 90) {
          limit = 90;
        } else if (limit > 60 && limit < 90) {
          limit = 60;
        } else if (limit > 30 && limit < 60) {
          limit = 30;
        } else if (limit < 30) {
          limit = 30;
        }
      }
      if (this.adapter.config.useLowVoltageBlock) {
        const lowVoltageBlockState = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.lowVoltageBlock"
        );
        if (lowVoltageBlockState && lowVoltageBlockState.val && lowVoltageBlockState.val == true) {
          limit = 0;
        }
        const fullChargeNeeded = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".control.fullChargeNeeded"
        );
        if (fullChargeNeeded && fullChargeNeeded.val && fullChargeNeeded.val == true) {
          limit = 0;
        }
      }
      const currentLimit = (_b = await this.adapter.getStateAsync(
        this.productKey + "." + this.deviceKey + ".outputLimit"
      )) == null ? void 0 : _b.val;
      if (currentLimit != null && currentLimit != void 0) {
        if (currentLimit != limit) {
          const outputlimit = { properties: { outputLimit: limit } };
          this.adapter.msgCounter += 1;
          const timestamp = /* @__PURE__ */ new Date();
          timestamp.setMilliseconds(0);
          (_c = this.adapter.mqttClient) == null ? void 0 : _c.publish(
            this.iotTopic,
            JSON.stringify(outputlimit)
          );
        }
      }
    }
  }
  setInputLimit(limit) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      limit = Math.abs(limit);
      if (limit) {
        limit = Math.round(limit);
      } else {
        limit = 0;
      }
      if (limit < 0) {
        limit = 0;
      } else if (limit > 0 && limit <= 30) {
        limit = 30;
      } else if (limit > this.maxInputLimit) {
        limit = this.maxInputLimit;
      }
      if (this.productKey.includes("8bm93h")) {
        limit = Math.ceil(limit / 100) * 100;
      }
      const inputLimitContent = { properties: { inputLimit: limit } };
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
        this.iotTopic,
        JSON.stringify(inputLimitContent)
      );
    }
  }
  setSmartMode(smartModeOn) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const setSmartModeContent = {
        properties: { smartMode: smartModeOn ? 1 : 0 }
      };
      this.adapter.log.debug(
        `[setBuzzer] Setting Smart Mode for device key ${this.deviceKey} to ${smartModeOn}!`
      );
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
        this.iotTopic,
        JSON.stringify(setSmartModeContent)
      );
    }
  }
  setBuzzerSwitch(buzzerOn) {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const setBuzzerSwitchContent = {
        properties: { buzzerSwitch: buzzerOn ? 1 : 0 }
      };
      this.adapter.log.debug(
        `[setBuzzer] Setting Buzzer for device key ${this.deviceKey} to ${buzzerOn}!`
      );
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(
        this.iotTopic,
        JSON.stringify(setBuzzerSwitchContent)
      );
    }
  }
  triggerFullTelemetryUpdate() {
    var _a;
    if (this.adapter.mqttClient && this.productKey && this.deviceKey) {
      const topic = `iot/${this.productKey}/${this.deviceKey}/properties/read`;
      const getAllContent = { properties: ["getAll"] };
      this.adapter.log.debug(
        `[triggerFullTelemetryUpdate] Triggering full telemetry update for device key ${this.deviceKey}!`
      );
      (_a = this.adapter.mqttClient) == null ? void 0 : _a.publish(topic, JSON.stringify(getAllContent));
    }
  }
  async updateSolarFlowState(state, val) {
    var _a, _b;
    const currentValue = await this.adapter.getStateAsync(
      `${this.productKey}.${this.deviceKey}.${state}`
    );
    await ((_a = this.adapter) == null ? void 0 : _a.setState(
      `${this.productKey}.${this.deviceKey}.${state}`,
      val,
      true
    ));
    if ((currentValue == null ? void 0 : currentValue.val) != val && state != "wifiState") {
      await ((_b = this.adapter) == null ? void 0 : _b.setState(
        `${this.productKey}.${this.deviceKey}.lastUpdate`,
        (/* @__PURE__ */ new Date()).getTime(),
        true
      ));
      const currentWifiState = await this.adapter.getStateAsync(
        `${this.productKey}.${this.deviceKey}.wifiState`
      );
      if (currentWifiState && currentWifiState.val == "Disconnected") {
        this.updateSolarFlowState("wifiState", "Connected");
      }
    }
  }
  async updateSolarFlowControlState(state, val) {
    var _a, _b;
    const stateExist = await ((_a = this.adapter) == null ? void 0 : _a.objectExists(
      `${this.productKey}.${this.deviceKey}.control.${state}`
    ));
    if (stateExist) {
      await ((_b = this.adapter) == null ? void 0 : _b.setState(
        `${this.productKey}.${this.deviceKey}.control.${state}`,
        val,
        true
      ));
    }
  }
  async checkVoltage(voltage) {
    var _a, _b, _c, _d;
    if (voltage < 46.1) {
      if (this.adapter.config.useCalculation) {
        this.setSocToZero();
      }
      if (this.adapter.config.useLowVoltageBlock) {
        await ((_a = this.adapter) == null ? void 0 : _a.setState(
          `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`,
          true,
          true
        ));
        const autoModel = (_b = await this.adapter.getStateAsync(
          this.productKey + "." + this.deviceKey + ".autoModel"
        )) == null ? void 0 : _b.val;
        if (autoModel == 8) {
          this.setDeviceAutomationInOutLimit(0);
        } else {
          this.setOutputLimit(0);
        }
        if (this.adapter.config.forceShutdownOnLowVoltage) {
          const currentSoc = await this.adapter.getStateAsync(
            `${this.productKey}.${this.deviceKey}.electricLevel`
          );
          if (currentSoc && Number(currentSoc.val) > 50) {
            if (this.adapter.config.fullChargeIfNeeded) {
              await ((_c = this.adapter) == null ? void 0 : _c.setState(
                `${this.productKey}.${this.deviceKey}.control.fullChargeNeeded`,
                true,
                true
              ));
            }
          } else {
            if (currentSoc && currentSoc.val) {
              this.setDischargeLimit(Number(currentSoc.val));
            }
            const hubState = await this.adapter.getStateAsync(
              `${this.productKey}.${this.deviceKey}.hubState`
            );
            if (!hubState || Number(hubState.val) != 1) {
              this.adapter.log.warn(
                `[checkVoltage] hubState is not set to 'Stop output and shut down', device will NOT go offline!`
              );
            }
          }
        }
      }
    } else if (voltage >= 47.5) {
      const lowVoltageBlock = await this.adapter.getStateAsync(
        `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`
      );
      if (lowVoltageBlock && lowVoltageBlock.val == true) {
        await ((_d = this.adapter) == null ? void 0 : _d.setState(
          `${this.productKey}.${this.deviceKey}.control.lowVoltageBlock`,
          false,
          true
        ));
        if (this.adapter.config.useLowVoltageBlock && this.adapter.config.forceShutdownOnLowVoltage) {
          this.setDischargeLimit(
            this.adapter.config.dischargeLimit ? this.adapter.config.dischargeLimit : 5
          );
        }
      }
    }
  }
  /**
   * Calculates the energy for all items in 'calculationStateKeys'.
   *
   * @returns Promise<void>
   *
   * @beta
   */
  calculateEnergy() {
    import_constants.calculationStateKeys.forEach(async (stateKey) => {
      var _a, _b, _c, _d, _e, _f, _g, _h, _i;
      let stateNameEnergyWh = "";
      let stateNameEnergykWh = "";
      let stateNamePower = "";
      if (stateKey == "pvPower1") {
        stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodayWh`;
        stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodaykWh`;
        stateNamePower = `${this.productKey}.${this.deviceKey}.pvPower1`;
      } else if (stateKey == "pvPower2") {
        stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodayWh`;
        stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodaykWh`;
        stateNamePower = `${this.productKey}.${this.deviceKey}.pvPower2`;
      } else {
        stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodayWh`;
        stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
        stateNamePower = `${this.productKey}.${this.deviceKey}.${stateKey}Power`;
      }
      const currentPowerState = await ((_a = this.adapter) == null ? void 0 : _a.getStateAsync(stateNamePower));
      const currentEnergyState = await ((_b = this.adapter) == null ? void 0 : _b.getStateAsync(stateNameEnergyWh));
      if ((currentEnergyState == null ? void 0 : currentEnergyState.val) == 0) {
        await ((_c = this.adapter) == null ? void 0 : _c.setState(stateNameEnergyWh, 1e-6, true));
      } else if (currentEnergyState && currentEnergyState.lc && currentPowerState && currentPowerState.val != void 0 && currentPowerState.val != null) {
        const timeFrame = 3e4;
        const addEnergyValue = Number(currentPowerState.val) * timeFrame / 36e5;
        let newEnergyValue = Number(currentEnergyState.val) + addEnergyValue;
        if (newEnergyValue < 0) {
          newEnergyValue = 0;
        }
        await ((_d = this.adapter) == null ? void 0 : _d.setState(stateNameEnergyWh, newEnergyValue, true));
        await ((_e = this.adapter) == null ? void 0 : _e.setState(
          stateNameEnergykWh,
          Number((newEnergyValue / 1e3).toFixed(2)),
          true
        ));
        if ((stateKey == "outputPack" || stateKey == "packInput") && addEnergyValue > 0) {
          await this.calculateSocAndEnergy(stateKey, addEnergyValue);
        } else {
          if (stateKey == "outputPack") {
            await ((_f = this.adapter) == null ? void 0 : _f.setState(
              `${this.productKey}.${this.deviceKey}.calculations.remainInputTime`,
              "",
              true
            ));
          } else if (stateKey == "packInput") {
            await ((_g = this.adapter) == null ? void 0 : _g.setState(
              `${this.productKey}.${this.deviceKey}.calculations.remainOutTime`,
              "",
              true
            ));
          }
        }
      } else if (currentPowerState && currentEnergyState) {
        await ((_h = this.adapter) == null ? void 0 : _h.setState(stateNameEnergyWh, 0, true));
        await ((_i = this.adapter) == null ? void 0 : _i.setState(stateNameEnergykWh, 0, true));
      }
    });
  }
  async setSocToZero() {
    var _a, _b, _c;
    await ((_a = this.adapter) == null ? void 0 : _a.setState(
      `${this.productKey}.${this.deviceKey}.calculations.soc`,
      0,
      true
    ));
    const energyWhState = await this.adapter.getStateAsync(
      `${this.productKey}.${this.deviceKey}.calculations.energyWh`
    );
    const energyWhMaxState = await this.adapter.getStateAsync(
      `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`
    );
    const newMax = Number(energyWhMaxState == null ? void 0 : energyWhMaxState.val) - Number(energyWhState == null ? void 0 : energyWhState.val);
    await ((_b = this.adapter) == null ? void 0 : _b.setState(
      `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
      newMax,
      true
    ));
    await ((_c = this.adapter) == null ? void 0 : _c.setState(
      `${this.productKey}.${this.deviceKey}.calculations.energyWh`,
      0,
      true
    ));
  }
  async setEnergyWhMax() {
    var _a, _b;
    const currentEnergyState = await ((_a = this.adapter) == null ? void 0 : _a.getStateAsync(
      this.productKey + "." + this.deviceKey + ".calculations.energyWh"
    ));
    if (currentEnergyState) {
      await ((_b = this.adapter) == null ? void 0 : _b.setState(
        `${this.productKey}.${this.deviceKey}.calculations.energyWhMax`,
        currentEnergyState == null ? void 0 : currentEnergyState.val,
        true
      ));
    }
  }
  resetValuesForDevice() {
    import_constants.calculationStateKeys.forEach(async (stateKey) => {
      var _a, _b;
      let stateNameEnergyWh = "";
      let stateNameEnergykWh = "";
      if (stateKey == "pvPower1") {
        stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodayWh`;
        stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv1EnergyTodaykWh`;
      } else if (stateKey == "pvPower2") {
        stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodayWh`;
        stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.solarInputPv2EnergyTodaykWh`;
      } else {
        stateNameEnergyWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodayWh`;
        stateNameEnergykWh = `${this.productKey}.${this.deviceKey}.calculations.${stateKey}EnergyTodaykWh`;
      }
      await ((_a = this.adapter) == null ? void 0 : _a.setState(stateNameEnergyWh, 0, true));
      await ((_b = this.adapter) == null ? void 0 : _b.setState(stateNameEnergykWh, 0, true));
    });
  }
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ZenHaDevice
});
//# sourceMappingURL=ZenHaDevice.js.map
