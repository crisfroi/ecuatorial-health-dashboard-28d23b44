# database.py
from flask_sqlalchemy import SQLAlchemy
import os
from flask import Flask, request, jsonify, render_template

db = SQLAlchemy()

# Configure Flask environment
os.environ["FLASK_ENV"] = os.environ.get("FLASK_ENV", "production")
os.environ["FLASK_DEBUG"] = os.environ.get("FLASK_DEBUG", "0")

app = Flask(__name__)
app.debug = os.environ.get("FLASK_DEBUG", "0") == "1"

# Configure SQLAlchemy for PostgreSQL
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'pool_size': 10,
    'pool_recycle': 3600,
    'pool_pre_ping': True,
    'connect_args': {
        'connect_timeout': 10,
    }
}