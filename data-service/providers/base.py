from abc import ABC, abstractmethod
from typing import Dict, Any

class BaseProvider(ABC):
    @abstractmethod
    def get_stock(self, symbol: str) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_market_status(self) -> Dict[str, Any]:
        pass
