import os
from random import choice
from flask import Flask, jsonify, send_from_directory
from flask_sse import sse

app = Flask(__name__, static_url_path='')

article_map = {}

drawn_key = ''


@app.route('/')
def root():
    if (not drawn_key in article_map):
        return "No article is currently drawn."
    return article_map[drawn_key]


@app.route('/players')
def players():
    return jsonify(list(article_map))


@app.route('/debug')
def debug():
    return jsonify(article_map)


@app.route('/reset')
def reset():
    global drawn_key
    global article_map
    drawn_key = ''
    article_map = {}
    return 'Reset'


@app.route('/pop/<string:name>')
def pop(name):
    global article_map
    if (name in article_map):
        del article_map[name]
        return "Deleted " + name
    else:
        return "Key not found"


@app.route('/draw')
def draw():
    global drawn_key
    drawn_key = choice(list(article_map))
    return 'Drawn!'


@app.route("/add/<string:name>/<string:article>")
def add(name, article):
    global article_map
    article_map[name] = article
    return 'Your article "' + article + '" is entered.'


if __name__ == "__main__":
    app.run()
