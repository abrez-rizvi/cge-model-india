"""
CGE Model — Flask API Entry Point

Serves the JSON API for the CGE Model India.
The frontend is now a separate React application.
"""

from flask import Flask, jsonify
from flask_cors import CORS
from src.api import api
import os

app = Flask(__name__)

# Configure CORS to allow the frontend (Vite defaults to port 5173 or 3000)
CORS(app, resources={r"/api/*": {"origins": "*"}})

app.register_blueprint(api)


@app.route("/")
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "online",
        "service": "India CGE Model API",
        "version": "2.0.0"
    })


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    # In development, we use debug=True for hot reloading
    app.run(debug=True, port=port)

