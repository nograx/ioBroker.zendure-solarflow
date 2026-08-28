import type { ZendureSolarflow } from "../main";

export class FileHelper {
  private adapter: ZendureSolarflow | undefined;
  private fileNamespaceReady: Promise<void> | undefined;

  constructor(_adapter: ZendureSolarflow) {
    this.adapter = _adapter;
  }

  private get fileNamespace(): string {
    return `${this.adapter?.name}.admin`;
  }

  // Some objects DB backends (e.g. Redis) require the target namespace to already exist as a "meta"
  // object before readFile/writeFile can be used, unlike the default jsonl/file backend which does not.
  // Must use setForeignObjectNotExists here: fileNamespace ("<adapter name>.admin", shared across all instances,
  // deliberately without an instance number) does not start with this instance's own namespace, so the regular
  // setObjectNotExists would otherwise prepend it (e.g. "zendure-solarflow.0.zendure-solarflow.admin").
  private ensureFileNamespaceExists(): Promise<void> {
    if (!this.fileNamespaceReady) {
      this.fileNamespaceReady = (
        this.adapter?.setForeignObjectNotExistsAsync(this.fileNamespace, {
          type: "meta",
          common: {
            name: "Zendure Solarflow files",
            type: "meta.folder",
          },
          native: {},
        }) ?? Promise.resolve()
      ).then(() => undefined);
    }
    return this.fileNamespaceReady;
  }

  public async readDeviceListFromFile(): Promise<any> {
    await this.ensureFileNamespaceExists();

    return new Promise((resolve, reject) => {
      this.adapter?.readFile(this.fileNamespace, "deviceList.json", (err, data) => {
        if (err) {
          this.adapter?.log.error(`[onReady] Error reading device list from file: ${err.message}`);
          reject(err);
        } else {
          try {
            resolve(JSON.parse(data as string));
          } catch (parseErr) {
            reject(parseErr instanceof Error ? parseErr : new Error(String(parseErr)));
          }
        }
      });
    });
  }

  public async writeDeviceListToFile(deviceList: any): Promise<void> {
    await this.ensureFileNamespaceExists();

    this.adapter?.writeFile(this.fileNamespace, "deviceList.json", JSON.stringify(deviceList, null, 2), (err) => {
      if (err) {
        this.adapter?.log.error(`[onReady] Error saving device list to file: ${err.message}`);
      } else {
        this.adapter?.log.debug("[onReady] Device list saved to file 'deviceList.json'");
      }
    });
  }
}
