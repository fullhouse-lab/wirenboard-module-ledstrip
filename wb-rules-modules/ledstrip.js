var MODULE_NAME 		= "ledstrip";
var MODULE_VERSION  = "1.3.1";

var HSV_BRIGHTNESS_BOTTOM = 10;
var HSV_BRIGHTNESS_TOP    = 255;
var HSV_BRIGHTNESS_STEP   = 22;
var HSV_HUE_STEP          = 60;

var WHITE_BRIGHTNESS_BOTTOM = 5;
var WHITE_BRIGHTNESS_TOP    = 100;
var WHITE_BRIGHTNESS_STEP   = 22;

var BUTTON_LONGCLICK_TIMEOUT_MS 	= 500;
var BUTTON_DOUBLECLICK_TIMEOUT_MS = 400;

var data = {};

exports.start = function(config) {
	if (!validateConfig(config)) return;

	//  data  //
	data[config.id] = {};
	data[config.id].button_timerLongClick = null;
	data[config.id].button_isLong = false;
	data[config.id].button_timerDoubleClick = null;
	data[config.id].brightness_direction = 1;
	data[config.id].brightnessTimer = null;

	//  device  //
	createDevice(config);

	//  rules  //
	createRule_buttonHandler(
		config.id,
		config.button.device,
		config.button.control,
		(config.button.activationValue) ? config.button.activationValue : 1
	);
	createRule_buttonClick(
		config.id,
		(config.white.default_level) ? config.white.default_level : null
	);
	createRule_buttonLongClick(config.id);
	createRule_buttonDoubleClick(config.id);
	createRule_RGB(config.id);
	createRule_White(config.id);
	createRule_toRGB_device(config.id, config.rgb.device,	config.rgb.control);
	createRule_toWhite_device(config.id, config.white.device,	config.white.control);

  log(config.id + ": Started (" + MODULE_NAME + " ver. " + MODULE_VERSION + ")");
};

//  Validate config  //

var validateConfig = function(_config) {
  if (!_config) {
    log("Error: " + MODULE_NAME + ": No config");
    return false;
  }

  if (!_config.id || !_config.id.length) {
    log("Error: " + MODULE_NAME + ": Config: Bad id");
    return false;
  }

  if (!_config.title || !_config.title.length) {
    log("Error: " + MODULE_NAME + ": Config: Bad title");
    return false;
  }

  return true;
}

//
//  Device  //
//

function createDevice(config) {
	var cells = {
		button_click:       { type: "pushbutton", readonly: false },
	  button_longClick:   { type: "switch", value: false, readonly: false },
	  button_doubleClick: { type: "pushbutton", readonly: false },

	  rgb: 				{ type: "rgb",  value: "0;0;0", readonly: false },
	  white: 			{ type: "range", value: 0, max: 255, readonly: false },

	  hb_white_state: 	{ type: "value", value: 0, readonly: false },
	  hb_white_level:   { type: "value", value: 0, readonly: false },

	  hb_rgb_state: 	{ type: "value", value: 0, 			readonly: false },
	  hb_rgb:     		{ type: "text",  value: "0,0,0", 	readonly: false },
	}

	defineVirtualDevice(config.id, {
	  title: config.title,
	  cells: cells
	});
}

//
//  Button handler  //
//

function createRule_buttonHandler(
	device_id,
	button_device,
	button_control,
	button_activationValue
) {
	defineRule({
	  whenChanged: button_device + "/" + button_control,
	  then: function (newValue, devName, cellName) {
	    //  pressed  //
	    if (newValue == button_activationValue) {
	      data[device_id].button_isLong = false;
	      data[device_id].button_timerLongClick = setInterval(function() {
	        data[device_id].button_isLong = true;
	        //  long started  //
	        dev[device_id]["button_longClick"] = true;
	        //  stop timer  //
	        if (data[device_id].button_timerLongClick) {
						clearInterval(data[device_id].button_timerLongClick);
					}
	        data[device_id].button_timerLongClick = null;
	      }, BUTTON_LONGCLICK_TIMEOUT_MS);
	    }

	    //  released  //
	    else {
	      //  stop timer  //
	      if (data[device_id].button_timerLongClick) {
					clearInterval(data[device_id].button_timerLongClick);
				}
	      data[device_id].button_timerLongClick = null;

				//  check long  //
	      if (data[device_id].button_isLong) {
	        //  long finished  //
	        dev[device_id]["button_longClick"] = false;
	      } else {
	        //  check second click  //
	        if (data[device_id].button_timerDoubleClick) {
	          dev[device_id]["button_doubleClick"] = true;
	          //  stop timer  //
	          if (data[device_id].button_timerDoubleClick) {
							clearInterval(data[device_id].button_timerDoubleClick);
						}
	          data[device_id].button_timerDoubleClick = null;
	        }

	        //  the first click  //
	        else {
	          //  start timer to wait double click  //
	          data[device_id].button_timerDoubleClick = setInterval(function () {
	            //  clicked  //
	            dev[device_id]["button_click"] = true;
	            //  stop timer  //
	            if (data[device_id].button_timerDoubleClick) {
								clearInterval(data[device_id].button_timerDoubleClick);
							}
	            data[device_id].button_timerDoubleClick = null;
	          }, BUTTON_DOUBLECLICK_TIMEOUT_MS);
	        }
	      }
	    }
	  }
	});
}

//
//  Buttons  //
//

function createRule_buttonClick(device_id, defaultWhiteBrightness_percent) {
	defineRule({
	  whenChanged: device_id + "/button_click",
	  then: function (newValue, devName, cellName) {
	    //  disable rgb  //
	    if (dev[device_id]["hb_rgb_state"] != 0) {
	      dev[device_id]["hb_rgb_state"] = 0;
	      return;
	    }

	    //  need to turn off  //
	    if (dev[device_id]["hb_white_state"]) {
	      dev[device_id]["hb_white_state"] = 0;
	    }

	    //  need to turn on (brightness: default %)  //
	    else {
				if (defaultWhiteBrightness_percent) {
					dev[device_id]["hb_white_level"] = defaultWhiteBrightness_percent;
				}
	      dev[device_id]["hb_white_state"] = 1;
	    }
	  }
	});
}

function createRule_buttonLongClick(device_id) {
	defineRule({
	  whenChanged: device_id + "/button_longClick",
	  then: function (newValue, devName, cellName) {
	    //  pressed  //
	    if (newValue) {
	      //  change white brightness  //
	      if (dev[device_id]["hb_white_state"]) {
	        //  toggle direction  //
	        data[device_id].brightness_direction *= -1;

	        //  start timer  //
	        if (data[device_id].brightnessTimer) {
						clearInterval(data[device_id].brightnessTimer);
					}
	        data[device_id].brightnessTimer = setInterval(function () {
	          //  calc brightness  //
	          var b = dev[device_id]["hb_white_level"]
						+ data[device_id].brightness_direction * WHITE_BRIGHTNESS_STEP;

	          //  check top limit  //
	          if (b >= WHITE_BRIGHTNESS_TOP) {
	            b = WHITE_BRIGHTNESS_TOP;
	            //  stop timer  //
	            if (data[device_id].brightnessTimer) {
								clearInterval(data[device_id].brightnessTimer);
							}
							data[device_id].brightnessTimer = null;
	          }

	          //  check bottom limit  //
	          else if (b <= WHITE_BRIGHTNESS_BOTTOM) {
	            b = WHITE_BRIGHTNESS_BOTTOM;
	            //  stop timer  //
	            if (data[device_id].brightnessTimer) {
								clearInterval(data[device_id].brightnessTimer);
							}
							data[device_id].brightnessTimer = null;
	          }

	          //  set value  //
	          dev[device_id]["hb_white_level"] = b;
	        }, 500);
	      }

	      //  change rgb brightness  //
	      if (dev[device_id]["hb_rgb_state"]) {
	        //  toggle direction  //
	        data[device_id].brightness_direction *= -1;

	        //  start timer  //
	        if (data[device_id].brightnessTimer) { clearInterval(data[device_id].brightnessTimer); }
	        data[device_id].brightnessTimer = setInterval(function () {
	          //  get rgb  //
	          var vals = dev[device_id]["hb_rgb"].split(",");

	          //  convert to hsv  //
	          var hsv = rgb2hsv(vals[0], vals[1], vals[2]);
	          var h = hsv[0];
	          var s = hsv[1];
	          var v = hsv[2];

	          //  calc new  //
	          v += data[device_id].brightness_direction * HSV_BRIGHTNESS_STEP;

	          //  check top limit  //
	          if (v >= HSV_BRIGHTNESS_TOP) {
	            v = HSV_BRIGHTNESS_TOP;
	            //  stop timer  //
	            if (data[device_id].brightnessTimer) {
								clearInterval(data[device_id].brightnessTimer);
							}
	          }

	          //  check bottom limit  //
	          else if (v <= HSV_BRIGHTNESS_BOTTOM) {
	            v = HSV_BRIGHTNESS_BOTTOM;
	            //  stop timer  //
	            if (data[device_id].brightnessTimer) {
								clearInterval(data[device_id].brightnessTimer);
							}
	          }

	          //  set value  //
	          var newRGB = hsv2rgb(h, s, v);
	          dev[device_id]["hb_rgb"] = Math.round(newRGB[0]).toString() + ","
						+ Math.round(newRGB[1]).toString() + "," + Math.round(newRGB[2]).toString();
	        }, 500);
	      }
	    }

	    //  released  //
	    else {
	      //  stop timer, if is exists  //
	      if (data[device_id].brightnessTimer) { clearInterval(data[device_id].brightnessTimer); }
				data[device_id].brightnessTimer = null;
	    }
	  }
	});
}

function createRule_buttonDoubleClick(device_id) {
	defineRule({
	  whenChanged: device_id + "/button_doubleClick",
	  then: function (newValue, devName, cellName) {
	    //  activate rgb  //
	    if (dev[device_id]["hb_rgb_state"] != 1) {
	      dev[device_id]["hb_rgb_state"] = 1;
	      return;
	    }

	    //  get rgb  //
	    var vals = dev[device_id]["hb_rgb"].split(",");

	    //  convert to hsv  //
	    var hsv = rgb2hsv(vals[0], vals[1], vals[2]);
	    var h = hsv[0];
	    var s = hsv[1];
	    var v = hsv[2];

	    //  calc new  //
	    h += HSV_HUE_STEP;

			//  check bottom limits  //
			// log(s);
			if (s < 0.5) { s = 0.5; }
			if (v < 30) { v = 30; }
			// log(s);

	    //  set value  //
	    var newRGB = hsv2rgb(h, s, v);
	    dev[device_id]["hb_rgb"] = Math.round(newRGB[0]).toString() + ","
			+ Math.round(newRGB[1]).toString() + "," + Math.round(newRGB[2]).toString();
	  }
	});
}

//
//  RGB  //
//

function createRule_RGB(device_id) {
	defineRule({
	  whenChanged: device_id + "/hb_rgb",
	  then: function (newValue, devName, cellName) {
			//  check rgb mode  //
	    if (!dev[device_id]["hb_rgb_state"]) return;

	    //  set rgb  //
	    var formattedRGB = newValue.split(",").join(";");
	    if (dev[device_id]["rgb"] != formattedRGB) { dev[device_id]["rgb"] = formattedRGB; }
	  }
	});

	defineRule({
	  whenChanged: device_id + "/hb_rgb_state",
	  then: function (newValue, devName, cellName) {
	  	//  check rgb mode  //
	    if (newValue) {
	      //  set rgb  //
	      var formattedRGB = dev[device_id]["hb_rgb"].split(",").join(";");
	      if (dev[device_id]["rgb"] != formattedRGB) { dev[device_id]["rgb"] = formattedRGB; }

	      //  disable white  //
	      if (dev[device_id]["hb_white_state"] != 0) { dev[device_id]["hb_white_state"] = 0; }
	    }

	    else {
	      //  set rgb - black  //
	      var RGB_black = "0;0;0";
	      if (dev[device_id]["rgb"] != RGB_black) { dev[device_id]["rgb"] = RGB_black; }
	    }
	  }
	});
}

//
//  White  //
//

function createRule_White(device_id) {
	defineRule({
	  whenChanged: device_id + "/hb_white_level",
	  then: function (newValue, devName, cellName) {
		  //  check white mode  //
	    if (!dev[device_id]["hb_white_state"]) return;

	    //  set white  //
	    var transformedWhite = newValue * 255.0 / 100.0;
	    if (dev[device_id]["white"] != transformedWhite) {
					dev[device_id]["white"] = transformedWhite;
			}
	  }
	});

	defineRule({
	  whenChanged: device_id + "/hb_white_state",
	  then: function (newValue, devName, cellName) {
		  //  check white mode  //
	    if (newValue) {
	      //  set white  //
	      var transformedWhite = dev[device_id]["hb_white_level"] * 255.0 / 100.0;
	      if (dev[device_id]["white"] != transformedWhite) {
						dev[device_id]["white"] = transformedWhite;
				}

	      //  disable rgb  //
	      if (dev[device_id]["hb_rgb_state"] != 0) { dev[device_id]["hb_rgb_state"] = 0; }
	    }

	    //  set white zero  //
	    else {
	      if (dev[device_id]["white"] != 0) { dev[device_id]["white"] = 0; }
	    }
	  }
	});
}

//
//  To device  //
//

function createRule_toRGB_device(
	device_id,
	rgb_device,
	rgb_control
) {
	defineRule({
	  whenChanged: device_id + "/rgb",
	  then: function (newValue, devName, cellName) {
	    if (dev[rgb_device][rgb_control] != newValue) {
					dev[rgb_device][rgb_control] = newValue;
			}
	  }
	});
}

function createRule_toWhite_device(
	device_id,
	white_device,
	white_control
) {
	defineRule({
	  whenChanged: device_id + "/white",
	  then: function (newValue, devName, cellName) {
	    if (dev[white_device][white_control] != newValue) {
					dev[white_device][white_control] = newValue;
			}
	  }
	});
}

//
//  Helpers  //
//

function rgb2hsv(r, g, b) {
  var v = Math.max(r,g,b);
  var n = v - Math.min(r,g,b);
  var h = n && ((v == r) ? (g - b) / n : ((v == g) ? 2 + (b - r) / n : 4 + (r - g) / n));
  return [ 60 * (h < 0 ? h + 6 : h), v && n / v, v ];
}

function hsv2rgb(h, s, v) {
  var f = function (n, k) {
    if (k === undefined || k === null) { k = (n + h / 60) % 6; }
    return v - v * s * Math.max( Math.min(k, 4 - k, 1), 0);
  }
  return [ f(5), f(3), f(1) ];
}
