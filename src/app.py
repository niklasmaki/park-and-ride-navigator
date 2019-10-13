from flask import Flask, render_template, request
from Hsl_api import hsl_api
from Park_and_ride_api import park_and_ride_api
from Utils import tuple_to_str, datetime_to_date_and_time
from Routes import get_n_closest_routes
import json

app = Flask(__name__)

@app.route('/')
def main_page():
    return render_template("index.html")

@app.route('/api/route')
def get_route():
    start_address = request.args.get('startAddress')
    end_address = request.args.get('endAddress')
    start_coords = (request.args.get('startLat'), request.args.get('startLon'))
    end_coords = (request.args.get('endLat'), request.args.get('endLon'))
    start_time = request.args.get('startTime')
    res = get_n_closest_routes(start_coords, end_coords, start_time)

    return json.dumps(res)

if __name__ == '__main__':
    app.run(debug=True)