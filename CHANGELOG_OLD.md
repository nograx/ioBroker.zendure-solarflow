# Older changes

### 3.6.0 (2026-03-06)

- Fix packInputPower & outputPackPower on new Solarflow devices
- Fix device constructor in local mode
- Fix setDeviceAutomationInOutLimit for Solarflow 1600 AC+
- Read more data from Zendure WebService
- Set ACK flag correctly for hemsEP function
- Refactor some files

### 3.5.4 (2026-03-05)

- Add device key '65174u' for Solarflow 1600 AC+

### 3.5.3 (2026-03-01)

- Fix setDeviceAutomationInOutLimit on certain HEMS devices like 2400 AC(+)

### 3.5.2 (2026-02-28)

- Add productKey '5fG27j' for Solarflow 2400 AC+

### 3.5.1 (2026-02-19)

- Try to update state only if state exist for this device
- Improved error handling

### 3.5.0 (2026-02-18)

- Add productKey '2Qe7C9' for Solarflow 2400 Pro
- Add event handler (log message) for MQTT disconnect

### 3.4.0 (2026-02-16)

- Add productKey '8n77V3' for Solarflow 800 Plus
- Remove passMode, pass and buzzerSwitch from Hyper 2000

### 3.3.2 (2026-02-02)

- Fix another 'has no existing object' message bug on pvPower3 + 4
- Fix Battery identification of AB2000X and calculation of 'energyWhMax'
- Fix Battery identification of AB3000 and calculation of 'energyWhMax'

### 3.3.1 (2026-01-30)

- Fix calculation issue

### 3.3.0 (2026-01-30)

- Fix 'has no existing object' messages on pvPower3 + 4
- Fix AC input limit of SF 800 Pro

### 3.2.2 (2025-12-21)

- Fix reset of calculation states if PV3+4 (SF 800 Pro)

### 3.2.1 (2025-12-17)

- Fix setDeviceAutomation charging mode

### 3.2.0 (2025-12-17)

- Fix inputLimit on certain devices
- Fix calculation of PV3 & 4 again (hopefully now 100%)
- Add some more specific debug messages
- Remove misleading error message on adapter start
- Replace restart on checkStatesJob with a debug message (I think Zendure cloud is stable now)
- Update adapter to adapter-react-v5 (MUI v5)
- Fix commandbar in settings

### 3.1.1 (2025-12-01)

- Fix Uppercase 'a4ss5p' in helpers.ts

### 3.1.0 (2025-12-01)

- Fix setInputLimit (always use positive value!)
- Add calculation states for PV3 & PV4 (used by SF 800 Pro)

### 3.0.8 (2025-10-22)

- Fix missing smartMode state for SF 800 Pro

### 3.0.7 (2025-10-20)

- Fix creation of SF 800 Pro device

### 3.0.5 (2025-10-20)

- Add some more log information on device creation

### 3.0.4 (2025-10-09)

- Fix inputLimit issue
- Fix Wifi status not updating when packData changes

### 3.0.3 (2025-10-07)

- Optimize setting of wifiMode in local mode
- Optimize Debug option

### 3.0.2 (2025-10-06)

- Ignore 'wifiState' for last update value

### 3.0.1 (2025-10-02)

- Update 'lastUpdate' when a battery value changes
- Add deviceKey 'R3mn8U' for Solarflow 800 Pro

### 3.0.0 (2025-09-30)

- Breaking Change: Change authentication to "authentication cloud key". You can generate a key in the official zendure app
- Removed fallback server
- Add deviceKey 'a4ss5P' for Solarflow 800
- Refactor a lot of code

### 2.0.4 (2025-09-12)

- Fix creation of control states on new Hyper 2000 v3
- Updates dependencies

### 2.0.3 (2025-09-09)

- Added 'B3Dxda' as new Hyper 2000 productKey
- Removed parameter 'upTime' and 'pullTime' from 'setDeviceAutomationInOutLimit'
- TEST: Use 'setDeviceAutomationInOutLimit' to let HUB1200/HUB2000 charge with connected ACE 1500

### 2.0.1 (2025-07-22)

- Small fix MQTT service

### 2.0.0 (2025-07-21)

- Breaking Change: Add control parameter 'setDeviceAutomationInOutLimit' which emulates Zendure's Smart Matching mode. I recommend using this device automation instead of 'setInputLimit'/'setOutputLimit' from now on, as there were concerns that setting limits/modes would be stored in the flash memory. You can use negative values for charging and positive for feed in. On HUB 1200/2000 with ACE 1500 you can use "smartMode" to prevent switching AC mode trigger writing to the flash memory. Check you the readme for more details or participate in the ioBroker forum.

### 1.15.4 (2025-07-17)

- Add smart mode control parameter for more devices

### 1.15.3 (2025-07-17)

- Match case sensitive product key for SF 2400 AC and SF 800 in settings if local mode is used
- Add sensor and control of "SmartMode"

### 1.15.2 (2025-07-14)

- Fix missing SF 800 & 2400 AC in local mode settings

### 1.15.1 (2025-07-11)

- Fix missing Solar Input 3 & 4 on Solarflow 800 Pro
- Fix 'packPower' state did not set to 0 if no input/output

### 1.15.0 (2025-06-27)

- Add 'packPower' state, which shows combined power from (packInputPower and outputPackPower). Discharging will be shown with a negative value.
- Add 'hyperTmp' to Solarflow 800 devices in hope this will show the temperature of the Solarflow 800 (can not test it due to lack of test device).
