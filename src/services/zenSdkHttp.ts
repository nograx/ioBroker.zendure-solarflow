import { Agent } from "node:http";

export const zenSdkHttpAgent = new Agent({ keepAlive: false });
