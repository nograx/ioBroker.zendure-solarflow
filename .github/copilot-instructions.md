# Copilot / AI agent instructions — ioBroker.zendure-solarflow

Short, actionable guidance so an AI agent can start making productive changes quickly.

- **Big picture**: This repo is an ioBroker adapter that reads and controls Zendure Solarflow devices. The adapter runs as an ioBroker instance and supports two modes:
  - **Cloud**: authenticate via cloud authorization key and connect to Zendure cloud MQTT (`authKey` / `zenWebService`). See `src/main.ts` and `src/services/zenWebService.ts`.
  - **Local**: connect directly to a local MQTT broker and subscribe to devices you configure in adapter settings. See `src/services/mqttLocalService.ts`.

- **Major components & flows**:
  - Adapter entry: `src/main.ts` — handles adapter lifecycle (`onReady`, `onStateChange`, `onUnload`) and configuration-mode branching.
  - MQTT plumbing: `src/services/mqttCloudZenService.ts`, `src/services/mqttLocalService.ts` and shared callbacks in `src/services/mqttSharedService.ts`. MQTT messages are parsed in `onMessage` and routed to device models.
  - Device models: implementations live under `src/models/deviceModels/*`. Instances are created by `src/helpers/helpers.ts::createDeviceModel` using the `productKey` and `deviceKey`.
  - Helpers & jobs: scheduled jobs (reset/check/calculation) are in `src/services/jobSchedule.ts`; state creation and calculations are in `src/helpers/*`.
  - Admin UI: React frontend lives in `admin/src/` and builds to `admin/build/`.

- **Key patterns to follow (concrete examples)**:
  - State id format: states are nested as `<adapter>.<instance>.<productKey>.<deviceKey>.<folder>.<state>` — `src/main.ts` parses state ids with `id.split('.')` and expects productKey at index 2 and deviceKey at index 3.
  - Only un-acked state changes are processed: `onStateChange` checks `!state.ack` before acting. Preserve this when adding control states.
  - Device model dispatch: add new device support by adding a mapping in `src/helpers/helpers.ts::createDeviceModel` and implementing a class under `src/models/deviceModels/` (constructor signature matches existing models).
  - MQTT topic parsing: `src/services/mqttSharedService.ts::onMessage` expects topics like `/server/app/<productKey>/<deviceKey>/...` and JSON payloads with `properties` and `packData` fields.
  - Control-state acknowledgement: when sending commands, device responses are used to set acked control states (see handling of `deviceAutomation` in `mqttSharedService.ts`).

- **Developer workflows / commands** (run from repo root):
  - Build full adapter: `npm run build` (cleans and runs `build-adapter all`).
  - Build only TypeScript: `npm run build:ts`.
  - Build admin UI: `npm run build:react` (React -> `admin/build/`).
  - Watch mode for iterative dev: `npm run watch` or `npm run watch:react`.
  - Typecheck: `npm run check` (`tsc --noEmit` for both server and admin tsconfig).
  - Lint: `npm run lint`.
  - Tests: unit tests `npm run test:ts`, package tests `npm run test:package`, integration `npm run test:integration`.
  - Runtime entrypoint: built adapter runs from `build/main.js`.

- **Project-specific conventions & gotchas**:
  - Node engine: `node >= 20` (see `package.json` engines).
  - Product keys: `createDeviceModel` lower-cases `_productKey` before matching; be careful with case-sensitivity when adding keys.
  - Many device properties require value conversions (e.g., `power / 10`, temperature from Kelvin in `mqttSharedService.ts`); follow existing conversion examples.
  - Avoid direct state updates without setting `ack` appropriately. Use existing helpers on device models (`updateSolarFlowState`, `updateSolarFlowControlState`) to keep control/state in sync.

- **Files to inspect when changing behavior**:
  - `src/main.ts` — adapter lifecycle and state-change dispatch
  - `src/services/mqttSharedService.ts` — central MQTT message handling
  - `src/services/mqttCloudZenService.ts`, `src/services/mqttLocalService.ts` — connection logic
  - `src/helpers/helpers.ts` & `src/models/deviceModels/*` — device-model creation and per-device logic
  - `src/services/jobSchedule.ts` and `src/helpers/*` — scheduled jobs & calculations
  - `admin/src/` — admin UI (React)

- **When making PRs**:
  - Keep changes small and targeted (adapter code is runtime-critical).
  - Run `npm run check` and `npm run test` locally before opening PR.
  - If changing MQTT behavior, include sample topics/payloads and unit tests that exercise `mqttSharedService.ts::onMessage` parsing where possible.

If anything is unclear or you want more detail for a specific area (device model, MQTT format, or admin UI), tell me which part and I'll expand the instructions or add examples/tests.
