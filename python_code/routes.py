import csv
from flask import Blueprint, jsonify, request
from chat_engine import ChatEngine
from qa_manager import QAManager
import logging

bp = Blueprint("main", __name__)

# The DataManager class is responsible for managing the  pairs in the database.
# It should be initialized with the MongoDB URI then used by other classes to perform CRUD operations on the database.
data_manager = QAManager()
# Create an instance of the ChatEngine class for chat functionalities and pass the DataManager instance to it.
chat_engine = ChatEngine()


# Route to handle user input and bot responses
@bp.route("/ask", methods=["POST"])
def ask():
    """
    This endpoint is for asking questions to the chatbot.
    ---
    parameters:
      - name: user_message
        in: body
        schema:
          type: object
          required:
            - user_message
          properties:
            user_message:
              type: string
    responses:
      200:
        description: Returns the bot's response
    """
    try:
        # Retrieve user message from the form
        user_message = request.json["user_message"]
        # Process user message and get bot response
        bot_response = chat_engine.process_user_input(user_message)
        # Return bot response with HTTP 200 OK
        return {"bot_response": bot_response}, 200

    except KeyError as e:
        # Log KeyError
        logging.error(f"KeyError occurred: {str(e)}")
        # Return error with HTTP 400 Bad Request
        return {"error": "KeyError: Invalid key in request"}, 400

    except ValueError as e:
        # Log ValueError
        logging.error(f"ValueError occurred: {str(e)}")
        # Return error with HTTP 400 Bad Request
        return {"error": "ValueError: Invalid value in request"}, 400

    except Exception as e:
        # Log unexpected errors
        logging.error(f"An unexpected error occurred: {str(e)}")
        # Return error with HTTP 500 Internal Server Error
        return {"error": str(e)}, 500


# Route to add a new question-answer pair
@bp.route("/add_qa", methods=["POST"])
def add_qa():
    # Extract the question and answer from the request body
    question = request.json.get("question", "")
    answer = request.json.get("answer", "")
    # Add the question-answer pair to the data manager

    # Generate the dictionary to store the question-answer pair
    data = {"question": question, "answer": answer}

    # Add the question-answer pair to the data manager
    data_manager.create(data)
    # Return a success status
    return jsonify({"status": "success"})


# Route to get a question-answer pair by ID
@bp.route("/get_qa/<question_id>", methods=["GET"])
def get_qa(question_id):
    # Get the question-answer pair from the data manager
    qa_pair = data_manager.get_qa_pair(question_id)
    # Return the question-answer pair
    return jsonify(qa_pair)


# Route to update a question-answer pair by ID
@bp.route("/update_qa/<question_id>", methods=["PUT"])
def update_qa(question_id):
    # Extract the new question and answer from the request body
    new_question = request.json.get("question", "")
    new_answer = request.json.get("answer", "")
    # Update the question-answer pair in the data manager
    data_manager.update_qa_pair(question_id, new_question, new_answer)
    # Return a success status
    return jsonify({"status": "success"})


# Route to delete a question-answer pair by ID
@bp.route("/delete_qa/<question_id>", methods=["DELETE"])
def delete_qa(question_id):
    # Delete the question-answer pair from the data manager
    data_manager.delete(question_id)
    # Return a success status
    return jsonify({"status": "success"})


@bp.route("/upload", methods=["POST"])
def upload_file():
    """
    Endpoint to upload a CSV file containing question-answer pairs.
    """
    file = request.files["file"]  # Assuming 'file' is the key for the uploaded file

    # Read the content of the file
    file_content = file.stream.read()

    # Decode the file content
    decoded_content = file_content.decode("utf-8")

    # Split the decoded content into lines
    csv_lines = decoded_content.splitlines()

    # Create a CSV reader
    reader = csv.reader(csv_lines)

    # Iterate over the CSV reader and add the question-answer pairs to the database
    for row in reader:
        question, answer = row
        # Validate question and answer
        if question and answer:
            data_manager.create(question, answer)
    return "File uploaded successfully", 200


@bp.route("/reinitialize", methods=["POST"])
def reinitialize_collection():
    """
    Endpoint to reinitialize the qa collection.
    """
    try:
        data_manager.reinitialize_collection()
        return (
            jsonify(
                {
                    "status": "success",
                    "message": "Collection reinitialized successfully.",
                }
            ),
            200,
        )
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)}), 500
