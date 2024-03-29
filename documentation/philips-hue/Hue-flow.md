# Flow of events within Solid Agent for Hue Use Case

## Flow 1: receive from bridge, persist in solid pod

### Receiver

message from bridge:
```json
{
"1": {
        "state": {
            "on": false,
            "bri": 1,
            "hue": 33761,
            "sat": 254,
            "effect": "none",
            "xy": [
                0.3171,
                0.3366
            ],
            "ct": 159,
            "alert": "none",
            "colormode": "xy",
            "mode": "homeautomation",
            "reachable": true
        },
        "swupdate": {
            "state": "noupdates",
            "lastinstall": "2018-01-02T19:24:20"
        },
        "type": "Extended color light",
        "name": "Hue color lamp 7",
        "modelid": "LCT007",
        "manufacturername": "Philips",
        "productname": "Hue color lamp",
        "capabilities": {
            "certified": true,
            "control": {
                "mindimlevel": 5000,
                "maxlumen": 600,
                "colorgamuttype": "B",
                "colorgamut": [
                    [
                        0.675,
                        0.322
                    ],
                    [
                        0.409,
                        0.518
                    ],
                    [
                        0.167,
                        0.04
                    ]
                ],
                "ct": {
                    "min": 153,
                    "max": 500
                }
            },
            "streaming": {
                "renderer": true,
                "proxy": false
            }
        },
        "config": {
            "archetype": "sultanbulb",
            "function": "mixed",
            "direction": "omnidirectional"
        },
        "uniqueid": "00:17:88:01:00:bd:c7:b9-0b",
        "swversion": "5.105.0.21169"
    }
}
```

Extra event data:
```json
{
  "timestamp": "2023-02-13T16:43:46+01:00",
  "applicationId":"solid-philips-hue",
  "sourceId":"https://developers.meethue.com/woutslabbinck/",
  "format":"application/json"
}
```

### Mapper

Transforms the input to RDF using RML rules.

Generated RDF (or something similar)
```ttl
<https://developers.meethue.com/woutslabbinck/lights/1> a <TODO:huelamp>;
  dct:title "Hue color lamp 7"; # the name of the light
  <TODO:state> <https://developers.meethue.com/woutslabbinck/lights/1/state>.

<https://developers.meethue.com/woutslabbinck/lights/1/state> a <TODO:huestate>;
  <TODO:on> true;
  <TODO:brightness> 1;
  <TODO:hue> 33761;
  <TODO:saturation> 254.
```

alternative RDF

```ttl
<https://developers.meethue.com/woutslabbinck/lights/1> a <TODO:huelamp>;
  dct:title "Hue color lamp 7"; # the name of the light
  <TODO:on> true;
  <TODO:brightness> 1;
  <TODO:hue> 33761;
  <TODO:saturation> 254.
```

current event data:
```json
{
  "timestamp": "2023-02-13T16:43:46+01:00",
  "applicationId":"solid-philips-hue",
  "sourceId":"https://developers.meethue.com/woutslabbinck/",
  "format":"RDF" // RDF/JS Dataset interface?
}
```
  
### Processor

Decides that the solid Pod resource must be updated. `http://localhost:3000/philips/` marks the solid pod.

current event data:
```json
{
  "timestamp": "2023-02-13T16:43:46+01:00",
  "applicationId":"solid-philips-hue",
  "sourceId":"https://developers.meethue.com/woutslabbinck/",
  "format":"RDF", // RDF/JS Dataset interface?
  "targets": ["http://localhost:3000/philips/"]
}
```

### InverseMapper

Does nothing here

### Transmitter

Serializes the data and sends it to the Solid Pod.

## Flow 2: receive update from Solid pod, persist in bridge

### Receiver

update from pod:

```ttl
<https://developers.meethue.com/woutslabbinck/lights/1> a <TODO:huelamp>;
  dct:title "Hue color lamp 7"; # the name of the light
  <TODO:on> false;
  <TODO:brightness> 1;
  <TODO:hue> 33761;
  <TODO:saturation> 254.
```

event data:
```json
{
  "timestamp": "2023-02-14T09:57:35+01:00",
  "applicationId":"solid-philips-hue",
  "sourceId": "http://localhost:3000/philips/",
  "format":"text/turtle"
}
```
### Mapper

No mapping required, only conversion to quads

even data: 
```json
{
  "timestamp": "2023-02-14T09:57:35+01:00",
  "applicationId":"solid-philips-hue",
  "sourceId": "http://localhost:3000/philips/",
  "format": "RDF" // RDF/JS Dataset interface?
}
```

### Processor

Decides that light 1 must be updated in the bridge resource must be updated. `"https://developers.meethue.com/woutslabbinck/"` marks the base api

current event data:
```json
{
  "timestamp": "2023-02-14T09:57:35+01:00",
  "applicationId":"solid-philips-hue",
  "sourceId": "http://localhost:3000/philips/",
  "format":"RDF", // RDF/JS Dataset interface?
  "targets": ["https://developers.meethue.com/woutslabbinck/"]
}
```

### InverseMapper

Converts RDF data to an update json body for the philips hue bridge.

Converted data:
```json
{
    "hue": 33761,
    "on": false,
    "bri": 1,
    "sat" : 254
}
```

Event data

```json
{
  "timestamp": "2023-02-14T09:57:35+01:00",
  "applicationId":"solid-philips-hue",
  "sourceId": "http://localhost:3000/philips/",
  "format":"JSON", 
  "targets": ["https://developers.meethue.com/woutslabbinck/"]
}
```

### Transmitter

Send the JSON to `https://developers.meethue.com/woutslabbinck/lights/1`.

## Remarks

* Is the exact target location calculated in the processor, can the transmitter take care of that