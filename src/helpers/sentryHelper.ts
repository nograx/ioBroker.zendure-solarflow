import type { ZendureSolarflow } from "../main";

/**
 * Returns the Sentry object of the sentry plugin, or undefined if plugins aren't supported or Sentry is
 * disabled (e.g. by the user via 'iobroker plugin disable sentry').
 *
 * @param adapter the adapter instance
 */
const getSentry = (adapter: ZendureSolarflow): any => {
  if (!adapter.supportsFeature?.("PLUGINS")) {
    return undefined;
  }
  return adapter.getPluginInstance("sentry")?.getSentryObject();
};

/**
 * Reports an error message to Sentry.
 *
 * @param adapter the adapter instance
 * @param message the message to report
 */
export const reportErrorToSentry = (adapter: ZendureSolarflow, message: string): void => {
  getSentry(adapter)?.captureMessage(message, "error");
};

/**
 * Reports whether the adapter automation is used (once per instance), grouped into one Sentry issue per
 * status: 'disabled' (off in the adapter settings), 'inactive' (enabled in the settings, but switched off via
 * 'adapterAutomation.automationEnabled') or 'active'.
 *
 * @param adapter the adapter instance
 * @param sentry the Sentry object of the sentry plugin
 */
const reportAutomationStatistics = async (adapter: ZendureSolarflow, sentry: any): Promise<void> => {
  const globalEnabled = (await adapter.getStateAsync("adapterAutomation.automationEnabled"))?.val === true;

  let enabledDeviceCount = 0;
  for (const device of adapter.zenIobDeviceList) {
    const deviceEnabled = await adapter.getStateAsync(
      `${device.productKey}.${device.deviceKey}.adapterAutomation.automationEnabled`,
    );
    if (deviceEnabled?.val === true) {
      enabledDeviceCount++;
    }
  }

  const status = !adapter.config.enableAutomation ? "disabled" : globalEnabled ? "active" : "inactive";

  sentry.withScope((scope: any) => {
    scope.setLevel("info");
    scope.setTag("automationStatus", status);
    scope.setTag("automationEnabledDevices", String(enabledDeviceCount));
    scope.setTag("deviceCount", String(adapter.zenIobDeviceList.length));
    scope.setTag("connectionMode", adapter.config.connectionMode);
    scope.setFingerprint(["automation-statistics", status]);
    sentry.captureMessage(`Automation statistics: ${status}`);
  });
};

/**
 * Reports each used device class (once per instance) and the automation usage to Sentry, to get statistics
 * about the used devices and features.
 *
 * @param adapter the adapter instance
 */
export const reportUsageStatistics = async (adapter: ZendureSolarflow): Promise<void> => {
  const sentry = getSentry(adapter);
  if (!sentry) {
    return;
  }

  const reported = new Set<string>();
  adapter.zenIobDeviceList.forEach((device) => {
    const deviceClass = device.constructor.name;
    if (reported.has(deviceClass)) {
      return;
    }
    reported.add(deviceClass);

    sentry.withScope((scope: any) => {
      scope.setLevel("info");
      scope.setTag("deviceClass", deviceClass);
      scope.setTag("productKey", device.productKey);
      scope.setTag("productName", device.productName);
      scope.setTag("connectionMode", adapter.config.connectionMode);
      scope.setFingerprint(["device-statistics", deviceClass]);
      sentry.captureMessage(`Device statistics: ${deviceClass}`);
    });
  });

  await reportAutomationStatistics(adapter, sentry);
};
