# Park & Ride Navigator

### Installation (Linux)

1. ```git clone https://github.com/niklasmaki/park-and-ride-navigator.git```
2. ```cd park-and-ride-navigator```
3. ```python3 -m venv env```
4. ```source env/bin/activate```
5. ```pip install -r requirements.txt```
6. create file "Gmaps_apikey.txt" in src folder and paste your googlemaps API key there

Or you can skip 3-4 if you don't want to use a virtual environment.

To start the server, run ```python src/app.py```. The server is available at ```localhost:5000```.