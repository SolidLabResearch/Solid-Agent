# log about instruction for openhab on laptop

## Download and install

https://www.openhab.org/download/

```sh
curl -fsSL "https://openhab.jfrog.io/artifactory/api/gpg/key/public" | gpg --dearmor > openhab.gpg
# if keyrings do exist, otherwise make /usr/share/keyrings directory
sudo mv openhab.gpg /usr/share/keyrings
sudo chmod u=rw,g=r,o=r /usr/share/keyrings/openhab.gpg
```

```sh
sudo apt-get install apt-transport-https
```

```sh
echo 'deb [signed-by=/usr/share/keyrings/openhab.gpg] https://openhab.jfrog.io/artifactory/openhab-linuxpkg stable main' | sudo tee /etc/apt/sources.list.d/openhab.list
```

```sh
sudo apt-get update && sudo apt-get install openhab
```

start openHAB manually
```sh
sudo /bin/systemctl start openhab.service
```

stop openHAB manually
```sh
sudo systemctl stop openhab.service 
```

check status
```sh
sudo systemctl status openhab.service 
```
enable on startup
```sh
sudo systemctl enable openhab.service
```

## First steps

https://www.openhab.org/docs/tutorial/first_steps.html

go to http://localhost:8080/

create account and api token


## Adding Things

https://www.openhab.org/docs/tutorial/things_simple.html

Install Hue binding

Added Philips Hue bridge thing and a lamp thing

* All lights
* Philips Hue bridge
* custom light: (Bureau rechts)

## Adding items

### Add all lights

Thing type: `Hue Group`

1. click on thing `All lights`
2. click on channels
3. add power switch (add Link to Item)

### Add specific light

Thing type: `Extended Color Light`

1. click on thing `Bureau rechts`
2. click on channels
3. add Color and Color Temperature (add Link to Item)

## add security

1. Go to [settings](http://localhost:8080/settings/)
2. Select API explorer
3. Untick Implicit User Role

TADA rest api now secure


## Get status

```sh
curl http://localhost:8080/rest/items/Bureau_rechts_Color
```

## Test turning light item on and off


Turn off
```sh
curl -X POST --header "Content-Type: text/plain" --header "Accept: application/json" -d "OFF" "http://localhost:8080/rest/items/Bureau_rechts_Color"
```

Turn on
```sh
curl -X POST --header "Content-Type: text/plain" --header "Accept: application/json" -d "ON" "http://localhost:8080/rest/items/Bureau_rechts_Color"
```

## Set color to purple

Purple not that bright
```sh
curl -X POST --header "Content-Type: text/plain" --header "Accept: application/json" -d "269,30,11.5" "http://localhost:8080/rest/items/Bureau_rechts_Color"
```

Purple medium bright
```sh
curl -X POST --header "Content-Type: text/plain" --header "Accept: application/json" -d "269,30,50" "http://localhost:8080/rest/items/Bureau_rechts_Color"
```