"""EventBus — the SSE pub/sub backbone."""
import asyncio

import pytest

from services.events import EventBus


@pytest.mark.asyncio
async def test_subscribe_receives_emitted_events_in_order():
    bus = EventBus()

    async def producer():
        # let the subscriber attach first
        await asyncio.sleep(0)
        await bus.emit("scanner.done", {"product_count": 3})
        await bus.emit("profile_reasoner.done", {"flagged_count": 7})
        await bus.emit("done", {"analysis_id": "abc"})

    received: list[tuple[str, dict]] = []

    async def consumer():
        async for ev in bus.subscribe():
            received.append((ev.event, ev.data))

    await asyncio.gather(producer(), consumer())

    assert received == [
        ("scanner.done", {"product_count": 3}),
        ("profile_reasoner.done", {"flagged_count": 7}),
        ("done", {"analysis_id": "abc"}),
    ]


@pytest.mark.asyncio
async def test_subscribe_terminates_on_done_event():
    bus = EventBus()

    async def producer():
        await asyncio.sleep(0)
        await bus.emit("done", {"analysis_id": "x"})
        # Anything emitted after `done` should not reach the subscriber, since
        # the subscription generator has already returned.
        await bus.emit("scanner.done", {"product_count": 1})

    received = []

    async def consumer():
        async for ev in bus.subscribe():
            received.append(ev.event)

    await asyncio.gather(producer(), consumer())
    assert received == ["done"]


@pytest.mark.asyncio
async def test_subscribe_terminates_on_error_event():
    bus = EventBus()

    async def producer():
        await asyncio.sleep(0)
        await bus.emit("error", {"detail": "oops"})

    received = []

    async def consumer():
        async for ev in bus.subscribe():
            received.append(ev.event)

    await asyncio.gather(producer(), consumer())
    assert received == ["error"]


@pytest.mark.asyncio
async def test_close_unblocks_pending_subscribers():
    bus = EventBus()
    saw_close = asyncio.Event()

    async def consumer():
        async for _ev in bus.subscribe():
            pass
        saw_close.set()

    task = asyncio.create_task(consumer())
    await asyncio.sleep(0)        # let the subscriber attach
    await bus.close()
    await asyncio.wait_for(saw_close.wait(), timeout=1.0)
    task.cancel()


@pytest.mark.asyncio
async def test_multiple_subscribers_each_receive_events():
    bus = EventBus()

    async def producer():
        await asyncio.sleep(0)
        await bus.emit("scanner.done", {"product_count": 1})
        await bus.emit("done", {"analysis_id": "y"})

    received_a: list[str] = []
    received_b: list[str] = []

    async def consumer(out: list[str]):
        async for ev in bus.subscribe():
            out.append(ev.event)

    await asyncio.gather(
        producer(),
        consumer(received_a),
        consumer(received_b),
    )

    assert received_a == ["scanner.done", "done"]
    assert received_b == ["scanner.done", "done"]
