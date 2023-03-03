# OpenHAB SmartLab

## Things 

https://community.openhab.org/t/openhab-basics-tutorial-part-2-n-bindings-things/66345

Every thing has a **binding** (how to connect to the physical world) and a **channel** (how to interact with it).

Hue bulb has a channel to control the color of the light (here `hue:0210:001788214482:7:color`)
### Hue lamp 1
```
 curl http://10.10.147.88:8080/rest/things/hue:0210:001788214482:7 -u '{API}:'
```

Hue lamp 1

```json
    {
        "channels": [
            {
                "linkedItems": [],
                "uid": "hue:0210:001788214482:7:color",
                "id": "color",
                "channelTypeUID": "system:color",
                "itemType": "Color",
                "kind": "STATE",
                "label": "Color",
                "description": "Controls the color of the light",
                "defaultTags": [
                    "Control",
                    "Light"
                ],
                "properties": {},
                "configuration": {}
            },
            {
                "linkedItems": [],
                "uid": "hue:0210:001788214482:7:color_temperature",
                "id": "color_temperature",
                "channelTypeUID": "system:color-temperature",
                "itemType": "Dimmer",
                "kind": "STATE",
                "label": "Color Temperature",
                "description": "Controls the color temperature of the light from 0 (cold) to 100 (warm)",
                "defaultTags": [
                    "Control",
                    "ColorTemperature"
                ],
                "properties": {},
                "configuration": {}
            },
            {
                "linkedItems": [],
                "uid": "hue:0210:001788214482:7:color_temperature_abs",
                "id": "color_temperature_abs",
                "channelTypeUID": "system:color-temperature-abs",
                "itemType": "Number",
                "kind": "STATE",
                "label": "Color Temperature",
                "description": "Controls the color temperature of the light in Kelvin",
                "defaultTags": [
                    "Control",
                    "ColorTemperature"
                ],
                "properties": {},
                "configuration": {}
            },
            {
                "linkedItems": [],
                "uid": "hue:0210:001788214482:7:alert",
                "id": "alert",
                "channelTypeUID": "hue:alert",
                "itemType": "String",
                "kind": "STATE",
                "label": "Alert",
                "description": "The alert channel allows a temporary change to the bulb’s state.",
                "defaultTags": [
                    "Alarm"
                ],
                "properties": {},
                "configuration": {}
            },
            {
                "linkedItems": [],
                "uid": "hue:0210:001788214482:7:effect",
                "id": "effect",
                "channelTypeUID": "hue:effect",
                "itemType": "Switch",
                "kind": "STATE",
                "label": "Color Loop",
                "description": "The effect channel allows putting the bulb in a color looping mode.",
                "defaultTags": [],
                "properties": {},
                "configuration": {}
            }
        ],
        "statusInfo": {
            "status": "ONLINE",
            "statusDetail": "NONE"
        },
        "editable": true,
        "label": "Hue color lamp 1",
        "bridgeUID": "hue:bridge:001788214482",
        "configuration": {
            "fadetime": 400.0,
            "lightId": "7"
        },
        "properties": {
            "firmwareVersion": "1.19.0_r19755",
            "modelId": "LCT015",
            "vendor": "Signify Netherlands B.V.",
            "productName": "Hue color lamp",
            "uniqueId": "00:17:88:01:03:89:98:b9-0b"
        },
        "UID": "hue:0210:001788214482:7",
        "thingTypeUID": "hue:0210"
    }
```

All lights
```curl
 curl http://10.10.147.88:8080/rest/things/hue:0210:001788214482:0 -u '{API}:'
```

Light 1 to 6 are member of the group all Lights. 
This group has an item linked to it: `Alllights`.

We can control all lights by the members of this group -> next section
## Item about lights

https://www.openhab.org/docs/configuration/items.html#item-definition-and-syntax

### Power

http://10.10.147.88:8080/rest/items/Alllights_Power

Turn  lights on:
curl -X POST --header "Content-Type: text/plain" --header "Accept: application/json" -d "OFF" "http://{openHAB_IP}:8080/rest/items/My_Item"


### Color

```curl 
curl http://10.10.147.88:8080/rest/items/Alllights_Color 
```

Change color
curl -X POST --header "Content-Type: text/plain" --header "Accept: application/json" -d "{HUE},{saturation},{brightness}" "http://{openHAB_IP}:8080/rest/items/My_Item"

Hue: 0..359
saturation: 0..100
brightness: 0..100
https://community.openhab.org/t/rest-api-valid-item-commands/110512


```json
{
    "link": "http://10.10.147.88:8080/rest/items/Alllights_Color",
    "state": "0,0,100",
    "editable": true,
    "type": "Color",
    "name": "Alllights_Color",
    "label": "Color",
    "category": "ColorLight",
    "tags": [
        "Control",
        "Light"
    ],
    "groupNames": [
        "Alllights"
    ]
}
```

### Brightness

http://10.10.147.88:8080/rest/items/Alllights_Brightness

### Color Temperature

http://10.10.147.88:8080/rest/items/Alllights_Color_Temperature