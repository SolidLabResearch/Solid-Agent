# Configuration

* router (linksys): knows_lights (wifi password: Stretch!Unbent!Playoff8)
  * bridge connected to router
  * phone connected to knows_lights
  * laptop connected to knows_lights

## Connect to bridge

https://developers.meethue.com/develop/get-started-2/

### On network

Bridge has certain ip (which is local)

Go to http://192.168.1.100/debug/clip.html

Follow this to make an account.

#### get credentials

press link button (on bridge), then:
```sh
curl -X POST http://192.168.1.100/api -H 'content-type: application/json' -d '{"devicetype":"solidAgent#account"}'
```

result: 
```json
[{"success":{"username":"dvYmo0CHXkcpG24NyPoo3wXo3NIpPa2A7z5mDD0i"}}]
```

```sh
curl http://192.168.1.100/api/dvYmo0CHXkcpG24NyPoo3wXo3NIpPa2A7z5mDD0i/lights
```

For some reason light 3 is the one I am using.
```sh
curl http://192.168.1.100/api/dvYmo0CHXkcpG24NyPoo3wXo3NIpPa2A7z5mDD0i/lights/1/state
```

Turn light on
```sh
curl http://192.168.1.100/api/dvYmo0CHXkcpG24NyPoo3wXo3NIpPa2A7z5mDD0i/lights/3/state -X PUT -H 'content-type: application/json' -d '{"on":true}'
```
Turn light off
```sh
curl http://192.168.1.100/api/dvYmo0CHXkcpG24NyPoo3wXo3NIpPa2A7z5mDD0i/lights/3/state -X PUT -H 'content-type: application/json' -d '{"on":false}'
```