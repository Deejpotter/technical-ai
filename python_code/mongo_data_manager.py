import os
from bson import BSON
import pymongo
from typing import Any, Dict, List
from pymongo.collection import Collection
from bson.objectid import ObjectId
from IDataManager import IDataManager

vector_index_name = "vector_search_index"


class MongoDataManager(IDataManager):
    """
    MongoDataManager class handles the interaction with a MongoDB collection for storing and retrieving QA pairs.
    It also manages the creation of vector embeddings and vector search functionality.
    """

    def __init__(self, db_name, collection_name):
        """
        Initialize the DataManager with the MongoDB URI and get a reference to the QA collection.
        """
        self.mongo_client = pymongo.MongoClient(os.environ["MONGO_URI"])
        self.collection: Collection = self.mongo_client[db_name][collection_name]

    def create(self, data: Dict[str, Any]) -> None:
        """
        Add the passed in document to the MongoDB collection.

        Args:
            data (Dict[str, Any]): The data containing the question and answer.
        """
        self.collection.insert_one(data)

    def get(self, id: BSON) -> Dict[str, Any]:
        """
        Retrieve a QA pair from the database by its ID.

        Args:
            id (BSON): The MongoDB ObjectId of the QA pair.

        Returns:
            Dict[str, Any]: The retrieved QA pair.
        """
        return self.collection.find_one({"_id": ObjectId(id)})

    def find(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        """
        Perform a search in the MongoDB collection based on a query text.

        Args:
            query Dict[str, Any]: The query dictionary containing the search parameters.

        Returns:
            List[Dict[str, Any]]: The list of mongoDB documents that match the query.
        """
        return self.collection.find(query)

    def update(self, id: Any, data: str) -> None:
        """
        Update the document with the given ID with the passed in data.

        Args:
            id (Any): The MongoDB ObjectId of the document to be updated.
            data (Dict[str, Any]): The updated data for the document.
        """
        self.collection.update_one(id, {"$set": data})

    def delete(self, id: Any) -> None:
        """
        Delete a document from the database by its ID.

        Args:
            id (Any): The MongoDB ObjectId of the document to be deleted.
        """
        self.collection.delete_one({"_id": ObjectId(id)})

    def vector_search(self, query_vector):
        """
        Perform a vector search in the MongoDB collection using the vector search index.
        Uses mongoDB's $vectorSearch aggregation pipeline stage: https://www.mongodb.com/docs/atlas/atlas-vector-search/vector-search-stage/

        Args:
            query_vector (list): The vector representation of the query.

        Returns:
            List[Dict[str, Any]]: The search results.
        """
        search_query = [
            {
                "$vectorSearch": {
                    "index": vector_index_name,
                    "path": "question_vector",
                    "queryVector": query_vector,
                    "numCandidates": 150,
                    "limit": 10,
                }
            },
            {
                "$project": {
                    "question": 1,
                    "answer": 1,
                    "score": {"$meta": "vectorSearchScore"},
                }
            },
        ]
        return list(self.collection.aggregate([search_query]))

    def create_vector_search_index(self):
        """
        Create a vector search index in the MongoDB collection.
        This method should be run separately to set up the index initially.
        """
        existing_indexes = self.collection.list_indexes()
        if any(index["name"] == vector_index_name for index in existing_indexes):
            print("Index already exists.")
            return

        index_definition = {
            "name": vector_index_name,
            "type": "vectorSearch",
            "fields": [
                {
                    "type": "vector",
                    "path": "question_vector",
                    "numDimensions": 768,
                    "similarity": "cosine",
                }
            ],
        }
        index_model = pymongo.IndexModel(
            [("question_vector", pymongo.TEXT)], **index_definition
        )

        self.collection.create_indexes([index_model])
        print(f"Index {vector_index_name} created.")

    def reinitialize_collection(self):
        """
        Reinitialize the qa collection by ensuring all documents are valid
        and creating the necessary vector search index.
        """
        # Validate documents
        # (Implement any document validation logic if necessary)

        # Create vector search index
        self.create_vector_search_index()
