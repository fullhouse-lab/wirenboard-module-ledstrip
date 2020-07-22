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
