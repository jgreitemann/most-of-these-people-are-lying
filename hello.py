import os
from random import choice
from flask import Flask, jsonify, send_from_directory, request
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.sql import func
from flask_sse import sse

app = Flask(__name__, static_url_path='')
app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['REDIS_URL'] = os.environ.get('REDIS_URL')
app.register_blueprint(sse, url_prefix='/stream')

db = SQLAlchemy(app)


class Draw(db.Model):
    __tablename__ = "draw"
    draw_id = db.Column(db.Integer, primary_key=True)
    id = db.Column(db.Integer)

    def __init__(self, id):
        self.id = id


class Player(db.Model):
    __tablename__ = "players"
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(120), unique=True)
    article = db.Column(db.String(120))

    def __init__(self, name, article):
        self.name = name
        self.article = article

    def __repr__(self):
        return '{}: {}'.format(self.name, self.article)


@app.route('/')
def root():
    return load_static('index.html')


@app.route('/static/<string:file>')
def load_static(file):
    print('serving: {}'.format(file))
    return send_from_directory('static', file)


def players():
    return [p.name for p in Player.query.order_by(Player.id)]


@app.route('/players')
def players_json():
    return jsonify(players())


def publish_players():
    sse.publish(players(), type='player_update')


@app.route('/reset')
def reset():
    Player.query.delete()
    Draw.query.delete()
    db.session.commit()
    publish_players()
    publish_quest()
    return 'Reset'


@app.route('/add', methods=['POST'])
def add_post():
    data = request.form
    return add(data['name'], data['article'])


def add(name, article):
    Player.query.filter_by(name=name).delete()
    p = Player(name, article)
    db.session.add(p)
    db.session.commit()
    publish_players()
    return 'Your article "' + article + '" is entered.'


@app.route('/pop/<int:id>')
def pop(id):
    Player.query.filter_by(id=id).delete()
    Draw.query.filter_by(id=id).delete()
    db.session.commit()
    publish_players()
    return 'Done'


def quest():
    q = Draw.query.first()
    if q != None:
        p = Player.query.filter_by(id=q.id).first()
        return {'active': True, 'article': p.article}
    else:
        return {'active': False}


@app.route('/quest')
def quest_json():
    return jsonify(quest())


def publish_quest():
    sse.publish(quest(), type='quest_update')


@app.route('/draw')
def draw():
    chosen_one = Player.query.order_by(func.random()).first()
    q = Draw.query.first()
    if q != None:
        q.id = chosen_one.id
    else:
        db.session.add(Draw(chosen_one.id))
    db.session.commit()
    publish_quest()
    return 'Drawn: {}'.format(chosen_one.id)


if __name__ == "__main__":
    app.run()
