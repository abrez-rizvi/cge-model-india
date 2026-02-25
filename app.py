"""
CGE Model — Flask Application Entry Point

Serves the API and static frontend files.
"""

from flask import Flask, send_from_directory
from flask_cors import CORS
from backend.api import api
import os

app = Flask(__name__,
            static_folder="static",
            static_url_path="/static")

CORS(app)
app.register_blueprint(api)


@app.route("/")
def index():
    """Serve the main dashboard page."""
    return send_from_directory("static", "index.html")


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port)
