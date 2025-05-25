# Import necessary modules
from flask import (
    Flask,
    jsonify,
    request,
    redirect,
)  # Added redirect for URL redirection
from flask_swagger import swagger
from flask_swagger_ui import get_swaggerui_blueprint
from flask_cors import CORS
from flask_limiter import Limiter
import logging
import os

from routes import bp

# Initialize Flask app
app = Flask(__name__)

# Read allowed origins from environment variables
allowed_origins = os.environ.get("ALLOWED_ORIGINS", "").split(",")
# Enable CORS
CORS(app, resources={r"/*": {"origins": allowed_origins}})
# Initialize Flask-Limiter to limit the number of requests that can be made to the API
limiter = Limiter(app)

# Configure logging to log into app.log file with debug level
logging.basicConfig(filename="app.log", level=logging.DEBUG)

# Swagger UI Configuration
# URL for exposing Swagger UI (without trailing '/')
SWAGGER_URL = "/swagger"
# Our API url (can use a URL or relative path)
API_URL = "/spec"

# Call factory function to create our blueprint
swaggerui_blueprint = get_swaggerui_blueprint(
    SWAGGER_URL,
    API_URL,
    config={  # Swagger UI config overrides
        "app_name": "CNC Technical Support Chatbot API"
    },
)

# Register the blueprint with the main Flask app, making the Swagger UI available at SWAGGER_URL
app.register_blueprint(swaggerui_blueprint, url_prefix=SWAGGER_URL)

# Register the main blueprint with the Flask app so that the routes are exposed
app.register_blueprint(bp)


# Redirect root to Swagger UI
@app.route("/")
def index():
    # Redirect to Swagger UI
    return redirect("/swagger")


# Route to serve Swagger specification
@app.route("/spec")
def spec():
    # Generate Swagger spec
    swag = swagger(app)
    # API version
    swag["info"]["version"] = "1.0"
    # API title
    swag["info"]["title"] = "CNC Technical Support Chatbot API"
    # Return Swagger spec as JSON
    return jsonify(swag)


# Run the Flask app in debug mode
if __name__ == "__main__":
    app.run(debug=True)
