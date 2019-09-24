from flask import Flask, render_template, request
app = Flask(__name__)


@app.route('/')
def main_page():
    return render_template("index.html")


@app.route('/api/route')
def get_route():
    start_address = request.args.get('startAddress')
    end_address = request.args.get('endAddress')
    return "Route data here"

if __name__ == '__main__':
    app.run(debug=True)