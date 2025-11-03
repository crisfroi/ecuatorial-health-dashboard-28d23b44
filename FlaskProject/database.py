# database.py
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy.pool import NullPool
import os
from flask import Flask, request, jsonify, render_template

db = SQLAlchemy()

# Configure Flask environment
os.environ["FLASK_ENV"] = os.environ.get("FLASK_ENV", "production")
os.environ["FLASK_DEBUG"] = os.environ.get("FLASK_DEBUG", "0")

app = Flask(__name__)
app.debug = os.environ.get("FLASK_DEBUG", "0") == "1"

# Configure SQLAlchemy for PostgreSQL with Supabase Transaction Pooler
# When using Supabase Transaction Pooler, disable SQLAlchemy's client-side pooling
# to avoid conflicts with the external connection pool
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['SQLALCHEMY_ENGINE_OPTIONS'] = {
    'poolclass': NullPool,  # Disable SQLAlchemy pooling - let Supabase Pooler handle it
    'connect_args': {
        'connect_timeout': 10,
        'sslmode': 'require',  # Enforce SSL for security
    }
}
