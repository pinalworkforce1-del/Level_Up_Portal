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
import logging
import re
from difflib import SequenceMatcher

logger = logging.getLogger('livekit.agents.interview_completion')

from livekit import agents, api
from livekit.agents import AgentServer, AgentSession, Agent, function_tool, RunContext
from livekit.plugins import synthesia

AVATAR_ID = os.getenv("SYNTHESIA_INTERACTIVE_AVATAR_ID", "fdec2525-6f4c-4544-87c6-abb3e47a12b4")
AGENT_NAME = "levelup-interview-pilot"
MAX_INTERVIEW_SECONDS = 480
PILOT_QUESTIONS = [
    ("q1", "What interests you about this position and what experience would help you succeed?"),
    ("q2", "What workplace responsibilities have best prepared you to work with a team?"),
    ("q3", "What would you do if you encountered a customer or coworker who needed assistance while you were busy?"),
]


def build_interview_instructions(questions):
    numbered = "\n".join(f"{i}. {q['text']}" for i, q in enumerate(questions, 1))
    return f"""You are Jacqueline, a professional United States English speaking interviewer
for Level Up's Interview Intelligence. Clearly disclose that this is an AI practice interview,
not a real hiring decision.
Ask the following {len(questions)} required questions in order, one at a time.
Keep each required question recognizable; do not replace its central meaning.
{numbered}
Wait for the participant's response before moving on. One brief clarification is allowed.
A short, uncertain, or poor-quality answer still counts as an answer; Nova evaluates quality later.
Do not invent an answer if the participant refuses or does not respond.
After all required questions have participant responses, call finish_interview once.
Never say the participant has passed a real job interview or reveal grades.
"""


def question_match(spoken, expected):
    """Tolerance for natural lead-ins/paraphrases, without relying on a 30-char prefix."""
    def normalized(value):
        return re.sub(r"[^a-z0-9 ]", " ", value.lower()).split()
    a, b = normalized(spoken), normalized(expected)
    if not a or not b:
        return False
    sa, sb = " ".join(a), " ".join(b)
    if sb in sa:
        return True
    keywords = {w for w in b if len(w) > 4}
    overlap = len(keywords.intersection(a)) / max(len(keywords), 1)
    return overlap >= 0.72 and SequenceMatcher(None, sa, sb).ratio() >= 0.48


def extract_question_answers(turns, questions):
    """Only attribute verbatim participant turns to questions; never manufacture evidence."""
    answers = []
    cursor = 0
    for question in questions:
        first = next((i for i in range(cursor, len(turns))
                      if turns[i]["role"] == "assistant" and question_match(turns[i]["text"], question["text"])), None)
        if first is None:
            break
        next_question_text = questions[len(answers)+1]["text"] if len(answers)+1 < len(questions) else None
        next_index = next((i for i in range(first + 1, len(turns))
                           if next_question_text and turns[i]["role"] == "assistant"
                           and question_match(turns[i]["text"], next_question_text)), len(turns))
        replies = [x["text"].strip() for x in turns[first+1:next_index]
                   if x["role"] == "user" and len(x["text"].strip()) >= 3]
        if not replies:
            break
        # Supabase validates each extracted answer against a captured participant turn.
        answers.append({"question_id": question["id"], "response": replies[0][:5000]})
        cursor = next_index if next_index < len(turns) else len(turns)
    return answers


async def report_completion(room_name: str, answers: list, event: str = 'interview_completed', turns=None) -> bool:
    dedicated_key = os.getenv("INTERVIEW_CALLBACK_SECRET")
    key = dedicated_key or os.getenv("LIVEKIT_API_SECRET", "")
    logger.info("INTERVIEW_COMPLETION signing_source=%s", "dedicated_callback_secret" if dedicated_key else ("livekit_api_secret_fallback" if key else "missing"))
    if not key:
        logger.error("INTERVIEW_COMPLETION missing callback signing key")
        return False
    body = json.dumps({"event": event, "room_name": room_name, "answers": answers, "turns": turns or []}, separators=(",", ":")).encode()
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
            payload = response.read(300).decode("utf-8", errors="replace")
            if response.status != 200 or not ('"recorded":true' in payload.replace(" ", "") or '"ok":true' in payload.replace(" ", "")):
                logger.error("INTERVIEW_COMPLETION callback rejected: status=%s response=%s", response.status, payload[:200])
                return False
            return True
    logger.info("INTERVIEW_COMPLETION callback attempt")
    try:
        result = await asyncio.to_thread(send)
        logger.info("INTERVIEW_COMPLETION callback result=%s", result)
        return result
    except Exception as exc:
        logger.exception("INTERVIEW_COMPLETION callback failed")
        return False


class PracticeInterviewer(Agent):
    def __init__(self, room_name: str, questions):
        super().__init__(instructions=build_interview_instructions(questions))
        self.room_name = room_name
        self._finished = False
        self._answers = {}

    @function_tool()
    async def finish_interview(self, context: RunContext) -> str:
        """Use only after the participant has answered every configured required interview question.
        This delivers the final goodbye and officially completes the interview.
        """
        if self._finished:
            return "Interview already finished."
        self._finished = True
        logger.info("INTERVIEW_COMPLETION tool invoked")
        # Report completion without waiting on the active tool turn's playback.
        # Waiting for playout here can prevent the callback from executing.
        confirmed = False  # Transcript validator controls interview completion
        logger.info("INTERVIEW_COMPLETION callback confirmed=%s", confirmed)
        context.session.say(
            "Thank you for interviewing with me today. I appreciate the examples you shared. "
            "Your private developmental feedback will be available separately. "
            "I wish you the best in your job search!",
            allow_interruptions=False,
        )
        # Drain queued goodbye speech and prevent a second model response.
        context.session.shutdown(drain=True)
        async def close_room():
            await asyncio.sleep(5)
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
    questions = [{"id": qid, "text": wording} for qid, wording in PILOT_QUESTIONS]
    transcript_turns = []
    transcript_flush = None
    @session.on("conversation_item_added")
    def capture_turn(event):
        item = event.item
        if getattr(item, "role", None) not in ("user", "assistant"):
            return
        content = getattr(item, "text_content", None) or ""
        if content.strip():
            transcript_turns.append({"role": item.role, "text": content[:5000]})
            logger.info("INTERVIEW_TRANSCRIPT captured role=%s total=%d", item.role, len(transcript_turns))
            nonlocal transcript_flush
            if transcript_flush and not transcript_flush.done():
                transcript_flush.cancel()
            transcript_flush = asyncio.create_task(flush_when_quiet())

    async def upload_transcript():
        if not transcript_turns:
            logger.warning("INTERVIEW_TRANSCRIPT missing turns")
            return
        answers = extract_question_answers(transcript_turns, questions)
        logger.info("INTERVIEW_TRANSCRIPT upload turns=%d answers=%d",len(transcript_turns),len(answers))
        await report_completion(ctx.room.name,answers,event="interview_transcript",turns=transcript_turns)

    async def flush_when_quiet():
        try:
            await asyncio.sleep(2)
            await upload_transcript()
        except asyncio.CancelledError:
            return
        except Exception:
            logger.exception("INTERVIEW_TRANSCRIPT periodic upload failed")

    @session.on("close")
    def save_when_session_closes(event):
        asyncio.create_task(upload_transcript())

    ctx.add_shutdown_callback(upload_transcript)
    avatar = synthesia.AvatarSession(
        synthesia.AvatarConfig(avatar_ids=[AVATAR_ID]),
        join_timeout=60.0,
    )
    await avatar.start(session, room=ctx.room)
    await session.start(room=ctx.room, agent=PracticeInterviewer(ctx.room.name, questions))
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
