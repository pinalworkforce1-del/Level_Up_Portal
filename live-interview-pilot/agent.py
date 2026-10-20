"""Isolated Level Up / Synthesia Interactive Avatar voice interview pilot.

Run as a LiveKit worker after configuring secrets in the worker environment.
Does not alter the production Rosie mock-interview module.
"""
import os
import asyncio
import hashlib
import hmac
import json
import time
import urllib.request

from livekit import agents, api
from livekit.agents import AgentServer, AgentSession, Agent, function_tool, RunContext
from livekit.plugins import synthesia

AVATAR_ID = os.getenv("SYNTHESIA_INTERACTIVE_AVATAR_ID", "fdec2525-6f4c-4544-87c6-abb3e47a12b4")
AGENT_NAME = "levelup-interview-pilot"
MAX_INTERVIEW_SECONDS = 480

INTERVIEW_INSTRUCTIONS = """
You are a realistic, professional United States English speaking interviewer for
Level Up's Interview Intelligence training experience.
Disclose clearly that you are an AI practice interviewer.
This is an employment-practice simulation, not a real hiring decision.
Conduct exactly three interview questions, one at a time:
1. What interests you about this position and what experience would help you succeed?
2. What workplace responsibilities have best prepared you to work with a team?
3. What would you do if you encountered a customer or coworker who needed assistance while you were busy?
Wait for each response. Ask no more than one brief clarification when necessary.
Use short spoken sentences, do not interrupt, and do not disclose grades in the interview.
Never assume certifications, diagnoses, or personal background.
After the participant has answered the third interview question and any brief clarification,
call the finish_interview tool exactly once. Do not give feedback during the interview.
Do not independently deliver a farewell before using the tool.
Never say the participant has passed a real job interview.
"""

async def report_completion(room_name: str) -> bool:
    key = os.getenv("LIVEKIT_API_SECRET", "")
    if not key:
        return False
    body = json.dumps({"event": "interview_completed", "room_name": room_name}, separators=(",", ":")).encode()
    timestamp = str(int(time.time()))
    signature = hmac.new(key.encode(), timestamp.encode() + b"." + body, hashlib.sha256).hexdigest()
    url = "https://dnijrzotfyvmmnmueknk.supabase.co/functions/v1/levelup-interview-agent-complete"
    def send():
        request = urllib.request.Request(url, data=body, method="POST", headers={
            "content-type": "application/json",
            "x-agent-timestamp": timestamp,
            "x-agent-signature": signature,
        })
        with urllib.request.urlopen(request, timeout=8) as response:
            return response.status == 200
    try:
        return await asyncio.to_thread(send)
    except Exception as exc:
        print("Interview completion callback failed:", type(exc).__name__)
        return False


class PracticeInterviewer(Agent):
    def __init__(self, room_name: str):
        super().__init__(instructions=INTERVIEW_INSTRUCTIONS)
        self.room_name = room_name
        self._finished = False

    @function_tool()
    async def finish_interview(self, context: RunContext) -> str:
        """Use once after the participant has finished answering all three interview questions.
        This delivers the final goodbye and officially completes the interview.
        """
        if self._finished:
            return "Interview already finished."
        self._finished = True
        await context.session.say(
            "Thank you for interviewing with me today. I appreciate the examples you shared. "
            "Your private developmental feedback will be available separately. "
            "I wish you the best in your job search!",
            allow_interruptions=False,
        )
        await report_completion(self.room_name)
        async def close_room():
            await asyncio.sleep(3)
            try:
                async with api.LiveKitAPI() as lk:
                    await lk.room.delete_room(api.DeleteRoomRequest(room=self.room_name))
            except Exception as exc:
                print("Interview room close failed:", type(exc).__name__)
        asyncio.create_task(close_room())
        return "Interview closed. Do not ask any further questions."

server = AgentServer()

@server.rtc_session(agent_name=AGENT_NAME)
async def interview(ctx: agents.JobContext):
    session = AgentSession(
        stt="cartesia/ink-2",
        llm="openai/gpt-4.1-mini",
        tts=f"cartesia/sonic-3:{os.getenv('INTERVIEW_TTS_VOICE_ID', '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc')}",
    )
    avatar = synthesia.AvatarSession(
        synthesia.AvatarConfig(avatar_ids=[AVATAR_ID]),
        join_timeout=60.0,
    )
    await avatar.start(session, room=ctx.room)
    await session.start(room=ctx.room, agent=PracticeInterviewer(ctx.room.name))
    # Give the browser a short window to enable microphone/audio before the greeting.
    await asyncio.sleep(3)
    await session.generate_reply(instructions="Introduce yourself as the AI practice interviewer and ask the first interview question.")
    # Server-side upper bound: close the whole LiveKit room, not merely the browser UI.
    async def enforce_deadline():
        await asyncio.sleep(MAX_INTERVIEW_SECONDS)
        try:
            async with api.LiveKitAPI() as lk:
                await lk.room.delete_room(api.DeleteRoomRequest(room=ctx.room.name))
        except Exception as exc:
            print(f"Interview deadline room shutdown failed: {type(exc).__name__}")
    asyncio.create_task(enforce_deadline())

if __name__ == "__main__":
    agents.cli.run_app(server)
