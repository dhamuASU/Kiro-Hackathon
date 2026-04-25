import asyncio
from typing import AsyncIterator

from schemas.agent import AgentEvent


class EventBus:
    """In-process pub/sub for SSE streaming.

    Buffers all emitted events so a subscriber that connects after the first
    events are emitted (e.g. SSE stream opening a beat after a BackgroundTask
    starts) still gets the full history before live events.
    """

    def __init__(self) -> None:
        self._queues: list[asyncio.Queue[AgentEvent | None]] = []
        self._backlog: list[AgentEvent] = []
        self._closed = False

    async def emit(self, event: str, data: dict) -> None:
        msg = AgentEvent(event=event, data=data)
        self._backlog.append(msg)
        for q in self._queues:
            await q.put(msg)
        if event in ("done", "error"):
            self._closed = True
            for q in self._queues:
                await q.put(None)

    async def subscribe(self) -> AsyncIterator[AgentEvent]:
        q: asyncio.Queue[AgentEvent | None] = asyncio.Queue()
        # Replay backlog first so late subscribers don't miss events.
        for msg in self._backlog:
            await q.put(msg)
        if self._closed:
            await q.put(None)
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
            if q in self._queues:
                self._queues.remove(q)

    async def close(self) -> None:
        self._closed = True
        for q in self._queues:
            await q.put(None)
