import asyncio
from typing import AsyncIterator

from schemas.agent import AgentEvent


class EventBus:
    """Simple in-process pub/sub for SSE streaming."""

    def __init__(self) -> None:
        self._queues: list[asyncio.Queue[AgentEvent | None]] = []

    async def emit(self, event: str, data: dict) -> None:
        msg = AgentEvent(event=event, data=data)
        for q in self._queues:
            await q.put(msg)

    async def subscribe(self) -> AsyncIterator[AgentEvent]:
        q: asyncio.Queue[AgentEvent | None] = asyncio.Queue()
        self._queues.append(q)
        try:
            while True:
                item = await q.get()
                if item is None:
                    break
                yield item
                if item.event in ("done", "error"):
                    break
        finally:
            self._queues.remove(q)

    async def close(self) -> None:
        for q in self._queues:
            await q.put(None)
