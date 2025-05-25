# Import the ABC (Abstract Base Class) and abstractmethod from the abc module.
# These are used to create abstract classes and abstract methods in Python.
from abc import ABC, abstractmethod

# Import the Any, Dict, and List types from the typing module.
# These are used to add type hints to the methods.
from typing import Any, Dict, List


# Define an abstract base class named IVectorDataManager.
# An abstract base class is a class that cannot be instantiated and is meant to be subclassed by other classes.
class IVectorDataManager(ABC):
    # The create method: You provide a dictionary of data you want to store.
    # The dictionary keys and values will depend on the specific data you're working with.
    @abstractmethod
    def create(self, data: Dict[str, Any]) -> None:
        pass

    # The get method: You provide an id of the item you want to retrieve.
    # The id's type will depend on how you choose to identify your items.
    @abstractmethod
    def get(self, id: Any) -> Dict[str, Any]:
        pass

    # The find method: You provide a query as a dictionary.
    # The query should specify the criteria for the items you want to find.
    @abstractmethod
    def find(self, query: Dict[str, Any]) -> List[Dict[str, Any]]:
        pass

    # The update method: You provide an id of the item you want to update and a dictionary with the new data.
    @abstractmethod
    def update(self, id: Any, data: Dict[str, Any]) -> None:
        pass

    # The delete method: You provide an id of the item you want to delete.
    @abstractmethod
    def delete(self, id: Any) -> None:
        pass
