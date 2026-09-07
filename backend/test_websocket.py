import asyncio
import json
import websockets


USER_1_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxIiwiZXhwIjoxNzg4NzY3MTk3fQ.l4GEBEb5--WBwlP7qHnaZcTvvV_zdYw3KkwZnMkea3E"
USER_2_TOKEN = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIyIiwiZXhwIjoxNzg4NzY3ODEwfQ.tut27JBX_LwbnhbWjcz4UU9gLLfiCisGIK33OrK7kP8"


async def user_1():
    uri = f"ws://127.0.0.1:8000/ws/1?token={USER_1_TOKEN}"

    async with websockets.connect(uri) as websocket:
        print("User 1 connected")

        # Wait for User 2's typing event
        response = await websocket.recv()

        print("User 1 received:")
        print(response)


async def user_2():
    uri = f"ws://127.0.0.1:8000/ws/1?token={USER_2_TOKEN}"

    async with websockets.connect(uri) as websocket:
        print("User 2 connected")

        # Tell the server that User 2 is typing
        await websocket.send(
            json.dumps({
                "type": "typing",
                "is_typing": True
            })
        )

        print("User 2 sent typing event")


async def main():
    await asyncio.gather(
        user_1(),
        user_2()
    )


asyncio.run(main())