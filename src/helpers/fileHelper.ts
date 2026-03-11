import { ZendureSolarflow } from "../main";

export class FileHelper {
  private adapter: ZendureSolarflow | undefined;
  constructor(_adapter: ZendureSolarflow) {
    this.adapter = _adapter;
  }

  public readDeviceListFromFile(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.adapter?.readFile(
        this.adapter.name + ".admin",
        "deviceList.json",
        (err, data) => {
          if (err) {
            this.adapter?.log.error(
              `[onReady] Error reading device list from file: ${err.message}`,
            );
            reject(err);
          } else {
            try {
              resolve(JSON.parse(data as string));
            } catch (parseErr) {
              reject(parseErr);
            }
          }
        },
      );
    });
  }

  public writeDeviceListToFile(deviceList: any): void {
    this.adapter?.writeFile(
      this.adapter.name + ".admin",
      "deviceList.json",
      JSON.stringify(deviceList, null, 2),
      (err) => {
        if (err) {
          this.adapter?.log.error(
            `[onReady] Error saving device list to file: ${err.message}`,
          );
        } else {
          this.adapter?.log.debug(
            "[onReady] Device list saved to file 'deviceList.json'",
          );
        }
      },
    );
  }
}
