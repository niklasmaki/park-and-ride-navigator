from flask import Flask, render_template, request
from Hsl_api import hsl_api
from Park_and_ride_api import park_and_ride_api

app = Flask(__name__)


@app.route('/')
def main_page():
    return render_template("index.html")


@app.route('/api/route')
def get_route():
    start_address = request.args.get('startAddress')
    end_address = request.args.get('endAddress')
    return hsl_api(start_address, end_address, 0,0)

if __name__ == '__main__':
    app.run(debug=True)