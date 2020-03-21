import os
from flask import Flask, jsonify, send_from_directory
from flask_sse import sse

app = Flask(__name__, static_url_path='')
app.config["REDIS_URL"] = os.environ.get("REDIS_URL")
app.register_blueprint(sse, url_prefix='/stream')

names = []


@app.route('/')
def root():
    return send_from_directory('static', 'index.html')


@app.route('/hello')
def publish_hello():
    sse.publish({"message": "Hello!"}, type='greeting')
    return "Message sent!"


@app.route("/api/list")
def list():
    return jsonify(names)


@app.route("/api/add/<string:name>")
def add(name):
    names.append(name)
    return ''


if __name__ == "__main__":
    app.run()
