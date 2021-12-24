# ifc2

A Javascript client for the Infinite Flight simulator Connect API version 2

## Limitations

This version of `ifc2` can get/set aircraft/flight states as well as run Infinite Flight commands available through the Infinite Flight Connect v2 API.

## Installing `ifc2`

`ifc2` is available as a Node module on [npmjs.com](https://www.npmjs.com/) and can simply be installed with:

```
npm install ifc2
```

## Using the API

### Connecting to the Infinite Flight Connect v2 API

[Infinite Flight Connect v2](https://infiniteflight.com/guide/developer-reference/connect-api/version-2) is a built-in API that allows you to send command to Infinite Flight. You must enable it in Infinite Flight Settings > General > "Enable Infinite Flight Connect".

> An older Connect v1 API still exists and is available in Infinite Flight -- however it is less efficient for many use cases that need to retrieve and/or set states in Infinite Flight at high speed. The [`ifc` JavaScript client](https://github.com/likeablegeek/ifc) offers an interface to the Connect v1 API.

### Including `ifc2` in your scripts/applications

To use `ifc2` you need to include it in your scripts:

```
let IFC2 = require("ifc2");
```

Or, if you aren't installing with `npm` then you can simply clone this repository and directly reference `ifc2.js`:

```
let IFC2 = require("/path/to/ifc2.js);
```

### Initialization

To initialise `ifc2` and connect to an Infinite Flight device you use the `init` function. The `init` function takes the following arguments:

`init(successCallback, {params})`

* `successCallback` is the function to be executed after the connection has been established with Infinite Flight
* `params` is an optional parameter which allows you to configure and control various aspects of the module, including:
  * `enableLog` is a boolean value to enable/disable logging in the Module; default is `false`
  * `loggingLevel` is an integer value for logging level in the module (2: INFO, 1: WARN, 0: ERROR); default is 0 (ERROR)
  * `host` is the IP address of a device running Infinite Flight to which you want to connect without polling for UDP broadcasts from Infinite Flight; if not set the module will wait for a UDP broadcast to determine which device to connect to
  * `port` is the port to use when manually connecting to a device running Infinite Flight without polling for UDP broadcasts from Infinite Flight; if not set the module will wait for a UDP broadcast to determine which device to connect to

Example :

```
IFC2.init(
  function() {
    console.log("IFC connected");
    IFC2.get("aircraft/0/pitch");
  },
  {
    "enableLog": true,
    "loggingLevel": 1,
    "host": "192.168.2.123",
    "port": 10112
  }
)
```

If you do not include a host and port, `ifc2` will search your local network for an active Infinite Flight device and connect to the first device to respond.

## Using the Infinite Flight Connect API through `ifc2`

### Using the Manifest

Version 2 of the Infinite Flight Connect API uses a manifest to specify what statuses and commands are available for any specific aircraft. After connecting to Infinite Flight, `ifc2` will fetch the manifest for your aircraft before becoming ready for use.

Once the manifest is successfully retrieved, `ifc2` will emit and `IFC2manifest` event which you can use in your script to respond to the manifest being fetched. The even will return an object containing the manifest. The manifest object will contain a series of objects where the key is the commnd name. Each of these object will contain two properties:

* `command`: The numeric command used when invoking the command through the API
* `type`: An integer specifying the data type used by the command when you data is sent/received to/from the API

The data types are:

* `0`: Boolean
* `1`: Four-byte integer
* `2`: Floating point number
* `3`: Double-length floating point number
* `4`: String
* `5`: Long string

An example of the manifest looks like this:

```
{
  'infiniteflight/cameras/14/roll': { command: 891, type: 3 },
  'aircraft/0/systems/nav_sources/adf/2/distance_to_glide_path': { command: 515, type: 2 },
  'infiniteflight/cameras/2/z_angle': { command: 782, type: 3 },
  'infiniteflight/cameras/4/x_angle': { command: 804, type: 3 },
  'api_joystick/buttons/8/name': { command: 81, type: 4 },
  'api_joystick/buttons/47/name': { command: 159, type: 4 },
  'aircraft/0/systems/nav_sources/nav/4/distance_to_glide_path': { command: 461, type: 2 },
  'api_joystick/buttons/30/value': { command: 126, type: 1 },
  'aircraft/0/systems/nav_sources/nav/2/location/longitude': { command: 389, type: 3 },
  ...
}
```

You can handle the `IFC2manifest` event by using the `on` method of your `ifc2` object. For example:

```
IFC2.on("IFC2manifest", function(manifest) {
  // You can respond to the IFC2manifest event here -- the manifest object will be in the "manifest" variab;e
});
```

### Getting states from Infinite Flight

The majority of the commands in the manifest allow you to retrieve state information from various aircraft information and systems.

Some examples of this are:

* `aircraft/0/heading_magnetic`: Returns the (magnetic) heading in radians as a floating point number
* `aircraft/0/altitude_msl`: Returns the altitude relative to sea level in feet as an integer
* `aircraft/0/bank`: Returns the bank angle in radians as a floating point number
* `aircraft/0/flightplan`: Returns the current flight plan (if any) as a string

You can fetch states by using the `get` function and passing the command name from the manifest as a parameter to the function. For instance, to fetch the bank angle, you would use:

```
IFC2.get("aircraft/0/bank");
```

When fetching states, the `ifc2` module treats this as an asynchronous activity to avoid blocking while waiting for a response from Infinite Flight. When `ifc2` receives a response, it will emit an `IFC2data` event and return a data object containing two properties:

* `command`: The name of the command being returned
* `data`: The value returned by Infinite Flight for the command

In this case, we could simply log the data returned by the event like this:

```
IFC2.on("IFC2data", function(data) {
  console.log(data);
});
```

If we had sent the `aircraft/0/bank` command as in the example above, the resulting console output displayed when we receive the associated `IFC2data` event would look like this:

```
{ command: 'aircraft/0/bank', data: 0.0004447073442861438 }
```

Additionally, all state values fetched from Infinite Flight are stored in the `ifData` property of the `ifc2` object. At any time, this object will have one entry for each state ever fetched since `ifc2` was instantiated and will contain the last fetched value for that state along with a timestamp. The timestamp will be represented as a [UNIX-style time stamp](https://www.unixtimestamp.com/).

This allows you to get a list of all states you have ever requested and their most recent fetched values. For instance, the following code snip requests the bank and pitch and outputs the `ifData` object each time the `IFC2data` event is triggered:

```
IFC2.on("IFC2data", function(data) {
  console.log(IFC2.ifData);
});

IFC2.get("aircraft/0/bank");
IFC2.get("aircraft/0/pitch");
```

The output would look like this:

```
{
  'aircraft/0/bank': { data: 0.0004445366212166846, ts: 1640273977393 }
}
{
  'aircraft/0/bank': { data: 0.0004445366212166846, ts: 1640273977393 },
  'aircraft/0/pitch': { data: 0.004999594762921333, ts: 1640273977399 }
}
```

### Setting states in Infinite Flight

Many of the state commands in a manifest can also be used to set a state such as changing the position of flaps.

You can set states by using the `set` function and passing the command name from the manifest and a new values for the state as aparameters to the function. For instance, to fetch the flap position to `3` you could use the following:

```
IFC2.set("aircraft/0/systems/flaps/state",3);
```

> Not all states can be set but there is no indication in the manifest of which states can be set nor is the set of states which can be set consistent for each aircraft. Also, Infinite Flight doesn't return any confirmation after a state is set so the only way to determine if a state is successfully set is to fetch the state after setting it and seeing if is updated/changed.

### Running commands in Infinite Flight

In addition to the state commands used by the `get` and `set` functions in `ifc2`, the API offers a set of special commands which can been issued to Infinite Flight to perform tasks commonly performed through the user interface of Infinite Flight -- tasks such as toggling the parking brakes or the autopilot state.

These are distringuished in the manifest by two attributes:

* The command names start with `commands/`
* The data type is `-1` indicating there is no data to send or receive

A representative list of these commands is:

* `commands/ElevatorTrimUp`
* `commands/ElevatorTrimDown`
* `commands/ThrottleUpCommand`
* `commands/ThrottleDownCommand`
* `commands/SetThrottleCommand`
* `commands/SetCockpitCamera`
* `commands/SetVirtualCockpitCameraCommand`
* `commands/SetFollowCameraCommand`
* `commands/SetFlyByCamera`
* `commands/SetOnboardCameraCommand`
* `commands/SetTowerCameraCommand`
* `commands/NextCamera`
* `commands/PrevCamera`
* `commands/CameraMoveLeft`
* `commands/CameraMoveRight`
* `commands/CameraMoveDown`
* `commands/CameraMoveUp`
* `commands/CameraMoveHorizontal`
* `commands/CameraMoveVertical`
* `commands/CameraZoomIn`
* `commands/CameraZoomOut`
* `commands/Reset`
* `commands/ShowATCWindowCommand`
* `commands/ATCEntry1`
* `commands/ATCEntry2`
* `commands/ATCEntry3`
* `commands/ATCEntry4`
* `commands/ATCEntry5`
* `commands/ATCEntry6`
* `commands/ATCEntry7`
* `commands/ATCEntry8`
* `commands/ATCEntry9`
* `commands/ATCEntry10`
* `commands/Live.SetCOMFrequencies`
* `commands/FlightPlan.AddWaypoints`
* `commands/FlightPlan.Clear`
* `commands/FlightPlan.ActivateLeg`
* `commands/Brakes`
* `commands/ParkingBrakes`
* `commands/FlapsDown`
* `commands/FlapsUp`
* `commands/FlapsFullDown`
* `commands/FlapsFullUp`
* `commands/Aircraft.SetFlapState`
* `commands/Spoilers`
* `commands/LandingGear`
* `commands/Pushback`
* `commands/FuelDump`
* `commands/ReverseThrust`
* `commands/LandingLights`
* `commands/TaxiLights`
* `commands/StrobeLights`
* `commands/BeaconLights`
* `commands/NavLights`
* `commands/SetLandingLightsState`
* `commands/SetTaxiLightsState`
* `commands/SetStrobeLightsState`
* `commands/SetBeaconLightsState`
* `commands/SetNavLightsState`
* `commands/Autopilot.Toggle`
* `commands/Autopilot.SetState`
* `commands/Autopilot.SetHeading`
* `commands/Autopilot.SetAltitude`
* `commands/Autopilot.SetVS`
* `commands/Autopilot.SetSpeed`
* `commands/Autopilot.SetHeadingState`
* `commands/Autopilot.SetAltitudeState`
* `commands/Autopilot.SetVSState`
* `commands/Autopilot.SetSpeedState`
* `commands/Autopilot.SetApproachModeState`
* `commands/Autopilot.SetLNavApproachModeState`
* `commands/ToggleHUD`
* `commands/ToggleFlightPathVector`
* `commands/AutoStart`
* `commands/TogglePause`
* `commands/Selection Mode`
* `commands/Rotation Mode`
* `commands/Translation Mode`
* `commands/Delete Selected`
* `commands/Engine.Start`
* `commands/Engine.Stop`

In `ifc2` you can use these commands with the `run` function as in this example to toggle the parking brakes:

```
IFC2.run("commands/ParkingBrakes");
```

### Events

The module emits the following events:

* `IFC2data`: Emitted when data is returned by the API; the event returns the results from the API to listeners as a JSON object.
* `IFC2manifest`: Emitted after the manifest is retrieved; the event returns the manifest to the listener as a JSON object.
* `IFC2msg`: Emmitted when the `ifc2` module needs to send a log message to the calling script; the event returns a JSON object containing the message and the log level of the message to the listener.

The following is an example of binding an event to the `IFC2Data` events in a calling scripts:

```
var IFC2 = require("ifc2");

IFC2.eventEmitter.addListener('IFC2data', function(data) {
  // perform actions on the data
  console.log(data);
});
```

### Polling

Some applications will need to regularly retrieve state information from Infinite Flight.

To enable this, `ifc2` offers a polling mechanism which allows you to register a list of states to retrieve on rolling, sequential basis.

The polling mechanism simply works through the list of states in order they are registered -- when it receives the value of a state, it requests the next in the list and moves to the next when that state is returned by Infinite Flight. When it gets to the end of the list it returns to the start of the list and continues.

To register a state in the polling list, use the `pollRegister` function:

```
IFC2.pollRegister("aircraft/0/heading_magnetic");
IFC2.pollRegister("aircraft/0/bank");
```

As with the `get` function, each time a value is returned by Infinite Flight during the polling, an `IFC2data` event will be emitted. Also, the last retrieved value for each state will be stored and retained in the `ifData` data object for future reference.

`ifc2` will continue to poll for the states in the polling list until either they are deregistered or `ifc2` disconnects from Infinite Flight`.

You can register a command from the polling list with the `pollDeregister` function:

```
IFC2.pollRegister("aircraft/0/heading_magnetic");
```

Although this means `ifc2` will stop polling the state, the last retrieved value for the state will persist in the `ifData` data objects.

## Copyright and License

This version is `ifc2` Copyright 2021, @likeablegeek. Distributed by [FlightSim Ninja](https://flightsim.ninja/).

You may not use this work/module/file except in compliance with the License. Unless required by applicable law or agreed to in writing, software distributed under the License is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
