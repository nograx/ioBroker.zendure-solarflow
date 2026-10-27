import type { ZendureSolarflow } from "../../main";

export type DeviceTask =
  | "feedIn"
  | "standby"
  | "surplusCharging"
  | "chargeKeepAlive"
  | "forceCharging"
  | "chargeBlocked"
  | "waitingForSurplus"
  | "full"
  | "idle"
  | "atMinSoc"
  | "noOutputHeadroom";

type StatusLanguage = "en" | "de";

// Codes for '<device>.adapterAutomation.status'. Each task has its own code and the lead device variant is that
// code + 1, so the lead device can be detected via 'code % 10 === 1'. Codes below 10 aren't tasks.
export const DEVICE_STATUS_AUTOMATION_DISABLED = 0;
export const DEVICE_STATUS_DEVICE_DISABLED = 1;
export const DEVICE_STATUS_WAITING_FOR_TRIGGER = 2;

const DEVICE_TASK_CODES: Record<DeviceTask, number> = {
  feedIn: 10,
  standby: 20,
  surplusCharging: 30,
  chargeKeepAlive: 40,
  forceCharging: 50,
  chargeBlocked: 60,
  waitingForSurplus: 70,
  full: 80,
  idle: 90,
  atMinSoc: 100,
  noOutputHeadroom: 110,
};

// Labels for the status codes, in the ioBroker system language (English fallback). Deliberately without power
// values (those are in the device states already), so the status only changes when a task changes.
const DEVICE_STATUS_TEXTS: Record<
  StatusLanguage,
  {
    tasks: Record<DeviceTask, string>;
    leadSuffix: string;
    automationDisabled: string;
    deviceDisabled: string;
    waitingForTrigger: string;
  }
> = {
  en: {
    tasks: {
      feedIn: "Feeding in",
      standby: "Standby",
      surplusCharging: "Charging from surplus",
      chargeKeepAlive: "Holding the charge keep-alive",
      forceCharging: "Force charging",
      chargeBlocked: "Waiting before charging may start",
      waitingForSurplus: "Waiting for surplus charging",
      full: "Fully charged, idle",
      idle: "Idle",
      atMinSoc: "Idle, battery at minimum SOC",
      noOutputHeadroom: "Idle, no output power available",
    },
    leadSuffix: " (lead device)",
    automationDisabled: "Automation disabled globally",
    deviceDisabled: "Automation disabled for this device",
    waitingForTrigger: "Waiting for a change of the automation trigger state",
  },
  de: {
    tasks: {
      feedIn: "Speist ein",
      standby: "Standby",
      surplusCharging: "Lädt aus Überschuss",
      chargeKeepAlive: "Hält den Lade-Keep-Alive",
      forceCharging: "Lädt erzwungen",
      chargeBlocked: "Wartet, bevor das Laden beginnen darf",
      waitingForSurplus: "Wartet auf Überschussladung",
      full: "Voll geladen, inaktiv",
      idle: "Inaktiv",
      atMinSoc: "Inaktiv, Akku auf minimalem SOC",
      noOutputHeadroom: "Inaktiv, keine Ausgangsleistung verfügbar",
    },
    leadSuffix: " (führendes Gerät)",
    automationDisabled: "Automatisierung global deaktiviert",
    deviceDisabled: "Automatisierung für dieses Gerät deaktiviert",
    waitingForTrigger: "Wartet auf eine Änderung des Auslöser-Datenpunkts",
  },
};

let statusLanguage: StatusLanguage | undefined;

const getStatusLanguage = async (adapter: ZendureSolarflow): Promise<StatusLanguage> => {
  if (!statusLanguage) {
    const systemConfig = await adapter.getForeignObjectAsync("system.config");
    statusLanguage = systemConfig?.common?.language === "de" ? "de" : "en";
  }
  return statusLanguage;
};

/**
 * Returns the status code for a device task.
 *
 * @param task the device's current task
 * @param isLead whether the device is the lead device
 */
export const getDeviceTaskCode = (task: DeviceTask, isLead: boolean): number =>
  DEVICE_TASK_CODES[task] + (isLead ? 1 : 0);

/**
 * Returns the 'common.states' list for '<device>.adapterAutomation.status', in the ioBroker system language.
 *
 * @param adapter the adapter instance
 */
export const getDeviceStatusStates = async (adapter: ZendureSolarflow): Promise<Record<number, string>> => {
  const texts = DEVICE_STATUS_TEXTS[await getStatusLanguage(adapter)];
  const states: Record<number, string> = {
    [DEVICE_STATUS_AUTOMATION_DISABLED]: texts.automationDisabled,
    [DEVICE_STATUS_DEVICE_DISABLED]: texts.deviceDisabled,
    [DEVICE_STATUS_WAITING_FOR_TRIGGER]: texts.waitingForTrigger,
  };

  (Object.keys(DEVICE_TASK_CODES) as DeviceTask[]).forEach((task) => {
    states[getDeviceTaskCode(task, false)] = texts.tasks[task];
    states[getDeviceTaskCode(task, true)] = `${texts.tasks[task]}${texts.leadSuffix}`;
  });

  return states;
};
