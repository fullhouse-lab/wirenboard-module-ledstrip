Ledstrip manager

This module allows to create RGBW virtual devices automatically, and supports the following features:
- Wirenboard: Control ledstrip RGB channels
- Wirenboard: Control ledstrip white channel
- Wall switch: Single click - On/Off white channel
- Wall switch: Long click   - Change brightness of white or RGB channels
- Wall switch: Double click - Select RGB channel mode / change color
- Separate modes: Select white or RGB channels
- Homebridge: Control white channel - On/Off, Brightness
- Homebridge: Control RGB channel   - On/Off, Brightness, Color, Temperature

##  Preparation

Please connect your device to the internet

Install [NodeJS](https://nodejs.org), if it is not yet
```
curl -sL https://deb.nodesource.com/setup_12.x | bash -
apt-get install -y nodejs git make g++ gcc build-essential
```

##  Install

To install this packet use [wirenboard-module](https://www.npmjs.com/package/wirenboard-module) command. Install it if necessary
```
npm i -g wirenboard-module
```

Add ledstrip module and rule
```
wirenboard-module ledstrip
```

##  Usage

###  Wirenboard Rule

`wirenboard-module` automatically creates wirenboard rule, where declared two ledstrips

```javascript
var ledstrip_manager = require("ledstrip");

//  ledledstrip 1  //
ledstrip_manager.start({
	id:     "ledstrip_1",
	title:  "Ledstrip 1",
	button: { device: "wb-gpio",        control: "EXT1_IN1" },
	rgb:    { device: "wb-mrgbw-d_152", control: "RGB" },
	white:  { device: "wb-mrgbw-d_152", control: "White" }
});

//  ledledstrip 2  //
ledstrip_manager.start({
	id:     "ledstrip_2",
	title:  "Ledstrip 2",
	button: { device: "wb-gpio",        control: "EXT1_IN2" },
	rgb:    { device: "wb-mrgbw-d_198", control: "RGB" },
	white:  { device: "wb-mrgbw-d_198", control: "White", default_level: 80 }
});
```

- `id` - Wirenboard id
- `title` - Wirenboard title, what we will see in UI
- `button` - wall switch device and control names, where the value readings will be from
- `rgb` - RGB channel device and control names, which runs the ledstrip
- `white` - white channel device and control names, which runs the ledstrip
- `white.default_level` - default brightness level of white channel, when using wall switch

After that we will see virtual device, where we can control RGB and White channels manually. Also we can emulate button click, long click and double click

<img src="https://github.com/fullhouse-lab/wirenboard-module-ledstrip/blob/master/img/rgb_device.png" width=30% height=30%>

- `button_click` - emulate wall switch click
- `button_doubleClick` - emulate wall switch double click
- `button_longClick` - emulate wall switch long click

- `hb_rgb` - homebridge RGB channel (using `"R,G,B"`)
- `hb_rgb_state` - homebridge RGB channel state (On/Off)

- `hb_white_level` - homebridge white channel
- `hb_white_state` - homebridge white channel state (On/Off)

- `rgb` - control ledstrip RGB channels manually (using `"R;G;B"`)
- `white` - control ledstrip white channel manually

###  Homebridge configuration
```json
{
    "comment": "-------------------------  RGBW 1  -------------------------",
    "type": "lightbulb",
    "name": "Лента 1",
    "topics": {
        "getOn": "/devices/ledstrip_1/controls/hb_white_state",
        "setOn": "/devices/ledstrip_1/controls/hb_white_state/on",
        "getBrightness": "/devices/ledstrip_1/controls/hb_white_level",
        "setBrightness": "/devices/ledstrip_1/controls/hb_white_level/on"
    },
    "integerValue": true,
    "accessory": "mqttthing"
},
{
    "type": "lightbulb",
    "name": "Лента 1 RGB",
    "topics": {
        "getOn": "/devices/ledstrip_1/controls/hb_rgb_state",
        "setOn": "/devices/ledstrip_1/controls/hb_rgb_state/on",
        "getRGB": "/devices/ledstrip_1/controls/hb_rgb",
        "setRGB": "/devices/ledstrip_1/controls/hb_rgb/on"
    },
    "integerValue": true,
    "accessory": "mqttthing"
},
{
    "comment": "-------------------------  RGBW 2  -------------------------",
    "type": "lightbulb",
    "name": "Лента 2",
    "topics": {
        "getOn": "/devices/ledstrip_2/controls/hb_white_state",
        "setOn": "/devices/ledstrip_2/controls/hb_white_state/on",
        "getBrightness": "/devices/ledstrip_2/controls/hb_white_level",
        "setBrightness": "/devices/ledstrip_2/controls/hb_white_level/on"
    },
    "integerValue": true,
    "accessory": "mqttthing"
},
{
    "type": "lightbulb",
    "name": "Лента 2 RGB",
    "topics": {
        "getOn": "/devices/ledstrip_2/controls/hb_rgb_state",
        "setOn": "/devices/ledstrip_2/controls/hb_rgb_state/on",
        "getRGB": "/devices/ledstrip_2/controls/hb_rgb",
        "setRGB": "/devices/ledstrip_2/controls/hb_rgb/on"
    },
    "integerValue": true,
    "accessory": "mqttthing"
}
```

----

Best regards
- **FullHouse team**
- https://fullhouse-online.ru
- support@fullhouse-online.ru
