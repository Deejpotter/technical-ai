import os
import sys
from openai import OpenAI
from chat_history import ChatHistory
from qa_manager import QAManager
from templates import system_prompt

# Load environment variables
from dotenv import load_dotenv

load_dotenv()


class ChatEngine:
    """
    ChatEngine class handles the core functionality of the chat system.
    It uses OpenAI's language model for generating responses based on the input message and best practices fetched from the database.
    """

    def __init__(self):
        """
        Initializes the ChatEngine with necessary components and configurations.
        """
        # Set OpenAI API key
        try:
            self.client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
        except KeyError:
            sys.stderr.write("API key not found.")
            sys.exit(1)

        # Initialize ChatHistory for managing conversation history
        self.chat_history = ChatHistory()

        # Initialize DataManager for database interactions
        self.data_manager = QAManager()

        # Store the system prompt template
        self.system_template = system_prompt

    def process_user_input(self, message):
        """
        Processes the user input, retrieves best practices based on the input, and generates a bot response.
        Args:
            message (str): The user input message.
        Returns:
            str: The bot's response.
        """
        # Add user message to conversation history
        self.chat_history.add_message("user", message)

        # Generate best practices based on user input
        best_practices = self.generate_best_practice(message)

        # Ensure the response strictly adheres to best practices
        if best_practices:
            bot_response = self.generate_response(message, best_practices)
        else:
            # If no best practice is found, inform the user
            bot_response = "I'm sorry, I don't have information on that topic."

        self.chat_history.add_message("bot", bot_response)

        return bot_response

    def generate_best_practice(self, user_message):
        """
        Generates best practices from the database based on the user message using vector search.
        Args:
            user_message (str): The user input message.
        Returns:
            List[str]: A list of best practices or similar responses.
        """
        try:
            # Create vector embeddings for the user message.
            query_vector = self.data_manager.create_vector_embeddings(user_message)

            # It returns a list of embeddings, so it needs to be converted to a string for the find method.
            query_vector = " ".join(map(str, query_vector))

            # Find similar responses in the database
            similar_responses = self.data_manager.find(query_vector)

            # Extracting answers from the query response
            best_practices = [
                match["metadata"]["answer"] for match in similar_responses["matches"]
            ]

            return best_practices
        except Exception as e:
            print(f"Error in generating best practices: {e}")
            return []

    def generate_response(self, message, best_practices):
        """
        Generates a response using the OpenAI API based on the user message and best practices.
        Args:
            message (str): The user input message.
            best_practices (List[str]): A list of best practices.
        Returns:
            str: The generated response.
        """
        try:
            # Prepare the messages for the API call
            messages = [
                {"role": "system", "content": self.system_template.format(best_practice="\n".join(best_practices))},
                {"role": "user", "content": message}
            ]

            # Make the API call
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0
            )

            # Extract and return the generated response
            return response.choices[0].message.content
        except Exception as e:
            print(f"Error in generating response: {e}")
            return "I'm sorry, I encountered an error while processing your request."
