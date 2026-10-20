"""Isolated Level Up / Synthesia Interactive Avatar voice interview pilot.

Run as a LiveKit worker after configuring secrets in the worker environment.
Does not alter the production Rosie mock-interview module.
"""
import os

from livekit import agents
from livekit.agents import AgentServer, AgentSession, Agent
from livekit.plugins import synthesia

AVATAR_ID = os.getenv("SYNTHESIA_INTERACTIVE_AVATAR_ID", "fdec2525-6f4c-4544-87c6-abb3e47a12b4")
AGENT_NAME = "levelup-interview-pilot"

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
At the end, thank the participant and explain that private feedback will be provided
separately. Never say the participant has passed a real job interview.
"""

class PracticeInterviewer(Agent):
    def __init__(self):
        super().__init__(instructions=INTERVIEW_INSTRUCTIONS)

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
    await session.start(room=ctx.room, agent=PracticeInterviewer())
    await session.generate_reply(instructions="Introduce yourself as the AI practice interviewer and ask the first interview question.")

if __name__ == "__main__":
    agents.cli.run_app(server)
