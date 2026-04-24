from abc import ABC, abstractmethod
from typing import Any

from services.events import EventBus


class AbstractAgent(ABC):
    def __init__(self, bus: EventBus, db: Any) -> None:
        self.bus = bus
        self.db = db

    @abstractmethod
    async def run(self, input: Any) -> Any:
        ...

    async def emit(self, event: str, data: dict) -> None:
        await self.bus.emit(event, data)
