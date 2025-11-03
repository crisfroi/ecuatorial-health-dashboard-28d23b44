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

# Initialize Supabase client for bidirectional sync
# Environment variables for Supabase credentials
SUPABASE_URL = os.environ.get("SUPABASE_URL", "https://wdieynendfjbkbhfovrx.supabase.co")
SUPABASE_KEY = os.environ.get("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndkaWV5bmVuZGZqYmtiaGZvdnJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTA3ODI5MjEsImV4cCI6MjA2NjM1ODkyMX0.yFnLHavy8wzVjlg3sAI2mEG-XGDCV5FSr7OQsMefxL8")

# Initialize Supabase client
supabase_client = None
try:
    from supabase import create_client
    if SUPABASE_URL and SUPABASE_KEY:
        supabase_client = create_client(SUPABASE_URL, SUPABASE_KEY)
        print(f"✅ Supabase client initialized: {SUPABASE_URL}")
    else:
        print("⚠️  Supabase credentials not configured. Sync will be disabled.")
except ImportError:
    print("⚠️  Supabase SDK not installed. Run: pip install supabase")
