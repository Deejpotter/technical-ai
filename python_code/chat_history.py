# Import the JSON library to handle JSON files
import json

MAX_TOKENS = 4096


# Define the ChatHistory class
class ChatHistory:

    # The __init__ method initializes the object, it's like a constructor in C#. It is called when an object of the class is created. It takes self as the first argument which
    # refers to the object itself so that we can access the object's properties and methods. You can also pass other arguments to the __init__ method, but they will be passed as
    # arguments to the object's constructor.
    def __init__(self, history_file="conversation_history.json"):
        self.history_file = history_file
        self.current_history = self.load_conversation_history()  # Load the conversation history from the JSON file
        self.token_count = 0  # Initialize token count
        self.clear_conversation_history()  # Initialize conversation history to an empty list

    def add_message(self, role, content):
        message = {"role": role, "content": content}
        message_tokens = self.estimate_tokens(content)
        self.token_count += message_tokens  # Update the running token count
        self.check_token_limit(self.current_history)  # Check if we're over the limit and remove messages if necessary
        self.current_history.append(message)  # Add the message to the conversation history

    # Method to clear the conversation history
    def clear_conversation_history(self):
        empty_history = []
        self.save_conversation_history(empty_history)

    # Method to load the conversation history from a JSON file
    def load_conversation_history(self):
        try:
            # Open the JSON file in read mode. Use with to ensure that the file is closed after reading.
            with open(self.history_file, 'r') as file:
                # Load and return the conversation history
                return json.load(file)
        except FileNotFoundError:
            # Return an empty list if the file is not found
            return []
        except Exception as e:
            # Print any other exceptions that occur
            print(f"An error occurred: {e}")
            return []

    # Method to save the conversation history to a JSON file
    def save_conversation_history(self, conversation_history):
        try:
            # Open the JSON file in write mode. Use with to ensure that the file is closed after writing.
            with open(self.history_file, 'w') as file:
                # Save the conversation history to the file
                json.dump(conversation_history, file)
        except Exception as e:
            # Print any exceptions that occur
            print(f"An error occurred: {e}")

    # Method to roughly estimate the token count for a message
    def estimate_tokens(self, message):
        # Roughly estimate the token count for a message
        return len(message.split()) + len(message)

    # Method to update the token count based on the entire conversation history
    def update_token_count(self, conversation_history):
        # Check the token count of the entire conversation history by summing the token count of each message
        self.token_count = sum(self.estimate_tokens(message['content']) for message in conversation_history)

    # Check if the token count is over the limit and remove messages until it's under the limit
    def check_token_limit(self, conversation_history):
        self.update_token_count(conversation_history)  # Update the token count
        while self.token_count > MAX_TOKENS:
            removed_message = conversation_history.pop(0)
            removed_tokens = self.estimate_tokens(removed_message['content'])
            self.token_count -= removed_tokens  # Update the token count
