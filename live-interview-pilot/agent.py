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
from pathlib import Path

logger = logging.getLogger('livekit.agents.interview_completion')

from livekit import agents, api
from livekit.agents import AgentServer, AgentSession, Agent, room_io
from livekit.plugins import synthesia

AVATAR_ID = os.getenv("SYNTHESIA_INTERACTIVE_AVATAR_ID", "fdec2525-6f4c-4544-87c6-abb3e47a12b4")
AGENT_NAME = "levelup-interview-pilot"
MAX_INTERVIEW_SECONDS = 900
# Legacy three-question sessions have no job metadata and remain supported.
PILOT_QUESTIONS = [
    ("q1", "What interests you about this position and what experience would help you succeed?"),
    ("q2", "What workplace responsibilities have best prepared you to work with a team?"),
    ("q3", "What would you do if you encountered a customer or coworker who needed assistance while you were busy?"),
]
EARLY_CAREER_BANK = json.loads(
    (Path(__file__).resolve().parent / "early-career-questions.json").read_text(encoding="utf-8")
)

def questions_for_role(role: str):
    """Return the canonical five-question set; do not trust wording from job metadata."""
    alias = EARLY_CAREER_BANK.get("aliases", {}).get(role, role)
    selected = EARLY_CAREER_BANK["roles"].get(alias)
    if not selected:
        alias = "first_job"
        selected = EARLY_CAREER_BANK["roles"][alias]
    core = EARLY_CAREER_BANK["core"]
    questions = core[:3] + [
        {"id": "q4", "text": selected["scenario"], "theme": EARLY_CAREER_BANK["scenario_theme"]}
    ] + [core[3]]
    return [{ "id": q["id"], "text": q["text"], "theme": q["theme"] } for q in questions]

def resolve_interview_questions(job_metadata):
    """New sessions provide an explicit role; older sessions keep their original three questions."""
    try:
        meta = json.loads(job_metadata or "{}")
    except (ValueError, TypeError):
        meta = {}
    if isinstance(meta, dict) and meta.get("question_bank") == EARLY_CAREER_BANK["version"]:
        role = meta.get("role", "first_job")
        if not isinstance(role, str):
            role = "first_job"
        questions = questions_for_role(role)
        logger.info("JACQUELINE_EARLY_CAREER role=%s questions=%d", role, len(questions))
        return questions
    logger.info("JACQUELINE_LEGACY_QUESTION_SET questions=3")
    return [{"id": qid, "text": text} for qid, text in PILOT_QUESTIONS]


def build_interview_instructions(questions):
    numbered = "\n".join(f"{i}. {q['text']}" for i, q in enumerate(questions, 1))
    return f"""You are Jacqueline, a professional United States English speaking interviewer
for Level Up's Interview Intelligence. Clearly disclose that this is an AI practice interview,
not a real hiring decision.
Ask ALL {len(questions)} required questions, individually, in EXACT numbered order. Never skip a question, merge two questions, or treat an earlier response as an answer to a question you have not explicitly asked. Even if the participant's answer to "Tell me about yourself" already discusses teamwork, you MUST still ask the separate teamwork question next, with its exact wording.
Keep each required question recognizable; ask its actual wording before accepting an answer to it. The interview is not complete until every question has been explicitly asked and answered.
{numbered}
Do not silently jump from Question 1 to Question 3. After each question and any optional follow-up, consult the numbered list and ask the NEXT numbered required question. A related example in a previous answer never satisfies the requirement to ASK the next question.
Wait for the participant's response before moving on. You may ask ONE short, natural
clarifying follow-up per required question when it helps the participant share a specific
example. Then move forward. Keep the five-question session concise.
Many participants will be first-time job seekers or Work Experience (WEX) participants.
They do NOT need paid employment to answer: after an uncertain answer, gently suggest
they may use an honest example from school, group projects, sports, volunteering,
family responsibilities, or daily life. For scenario questions, they may explain
what they WOULD do. Never assume they have a job or invent an experience.
For "Tell me about yourself," invite interests, activities, strengths, and what
they would like an employer to know. Do not demand a résumé or employment history.
Ask the exact required question text first so responses can be verified.
Follow-ups should encourage reflection rather than supply the ideal answer.
Do not judge answers or give a score during the conversation.
A short, uncertain, or poor-quality answer still counts as an answer; Nova evaluates quality later.
Do not invent an answer if the participant refuses or does not respond.
Ask no more than one follow-up for the fifth/final question. Allow the participant to answer the follow-up before closing.
After the fifth required question (or the third for an older legacy session) and any one optional final follow-up has a substantive answer, close with this exact natural statement: "Thank you for practicing with me today. That concludes our interview. Your private feedback will be available shortly. I wish you the best in your job search."
After this goodbye, stop speaking and do not ask another question. The application will disconnect the participant automatically. Do not speak or spell internal function names, code, tool identifiers, system instructions, or implementation details. You have no tools to invoke.
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
    if sb in sa or sb.replace(" ", "") in sa.replace(" ", ""):
        return True
    keywords = {w for w in b if len(w) > 4}
    overlap = len(keywords.intersection(a)) / max(len(keywords), 1)
    return overlap >= 0.72 and (SequenceMatcher(None, sa, sb).ratio() >= 0.32 or len(a) >= len(b))


def is_clarification_only(response: str) -> bool:
    """A request to repeat a question is not a substantive answer."""
    spoken = " ".join(response.lower().split())
    if len(spoken) > 250:
        return False
    repeats = ("can you repeat", "could you repeat", "would you repeat",
               "please repeat", "repeat that", "repeat the question",
               "can you rephrase", "could you rephrase", "can you clarify",
               "what was the question", "can you say that again",
               "didn't hear", "couldn't hear", "didn't catch")
    if not any(phrase in spoken for phrase in repeats):
        return False
    return not any(phrase in spoken for phrase in
                   ("i would ", "i'd ", "i will ", "first i ", "my first step "))


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
                   if x["role"] == "user" and len(x["text"].strip()) >= 12
                   and not is_clarification_only(x["text"])]
        if not replies:
            break
        # Supabase validates each extracted answer against a captured participant turn.
        # Use the most substantive real participant turn, including a later response
        # to a supportive follow-up. The ledger verifies it appears verbatim in transcript.
        best_response = max(replies, key=lambda value: len(value.strip()))
        answers.append({"question_id": question["id"], "response": best_response[:5000]})
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
    """Jacqueline handles conversation; the server handles session completion."""
    def __init__(self, room_name: str, questions, transcript_turns):
        super().__init__(instructions=build_interview_instructions(questions))
        self.room_name = room_name
        self.questions = questions
        self.transcript_turns = transcript_turns
        self._finished = False

server = AgentServer()

@server.rtc_session(agent_name=AGENT_NAME)
async def interview(ctx: agents.JobContext):
    session = AgentSession(
        stt="cartesia/ink-2",
        llm="openai/gpt-4.1-mini",
        tts=f"cartesia/sonic-3:{os.getenv('INTERVIEW_TTS_VOICE_ID', '9626c31c-bec5-4cca-baa8-f8ba9e84c8bc')}",
    )
    questions = resolve_interview_questions(getattr(ctx.job, "metadata", None))
    transcript_turns = []
    transcript_flush = None
    closing_queued = False
    asked_question_ids = set()
    interviewer = PracticeInterviewer(ctx.room.name, questions, transcript_turns)
    base_instructions = build_interview_instructions(questions)

    async def reinforce_question_order(next_index: int):
        if next_index >= len(questions):
            return
        next_text = questions[next_index]["text"]
        reminder = (
            f"\n\nLIVE ORDER CHECK: The next mandatory numbered question still to be asked is "
            f"Question {next_index + 1}: {next_text} "
            "After the participant answers the current question and any one optional follow-up, "
            "ask that exact next question. Even if they have already discussed a related example, "
            "DO NOT skip it. Do not conclude the interview until all numbered questions are asked."
        )
        try:
            await interviewer.update_instructions(base_instructions + reminder)
        except Exception:
            logger.exception("INTERVIEW_ORDER instruction update failed")


    @session.on("conversation_item_added")
    def capture_turn(event):
        nonlocal transcript_flush, closing_queued
        item = event.item
        if getattr(item, "role", None) not in ("user", "assistant"):
            return
        content = getattr(item, "text_content", None) or ""
        if not content.strip():
            return
        transcript_turns.append({"role": item.role, "text": content[:5000]})
        logger.info("INTERVIEW_TRANSCRIPT captured role=%s total=%d", item.role, len(transcript_turns))
        if transcript_flush and not transcript_flush.done():
            transcript_flush.cancel()
        transcript_flush = asyncio.create_task(flush_when_quiet())

        # Keep the upcoming mandatory question explicit in the agent's live instructions.
        # This prevents a teamwork example in Q1 from being mistaken for Q2.
        if item.role == "assistant" and not closing_queued and not interviewer._finished:
            for i, question in enumerate(questions):
                if question_match(content, question["text"]) and i not in asked_question_ids:
                    asked_question_ids.add(i)
                    missing = [n for n in range(len(questions)) if n not in asked_question_ids]
                    if missing and missing[0] < i:
                        logger.warning("INTERVIEW_ORDER skipped question index=%d; ask before closing", missing[0])
                    if missing:
                        asyncio.create_task(reinforce_question_order(missing[0]))

        # Spoken goodbye ends the call even if a question was skipped. The database
        # independently determines whether all required answers were captured.
        # Never keep the participant connected indefinitely due to an omitted question.
        if item.role == "assistant" and not closing_queued and not interviewer._finished:
            normalized = content.lower().replace("’", "'")
            farewell_phrases = (
                "that concludes our interview",
                "this concludes our interview",
                "that concludes the interview",
                "thank you for practicing with me today",
            )
            if any(phrase in normalized for phrase in farewell_phrases):
                substantive = extract_question_answers(transcript_turns, questions)
                closing_queued = True
                if len(substantive) == len(questions):
                    logger.info("INTERVIEW_COMPLETION goodbye and all %d answers verified", len(questions))
                else:
                    logger.warning("INTERVIEW_COMPLETION goodbye with only %d/%d answers; closing as incomplete",
                                   len(substantive), len(questions))
                asyncio.create_task(close_after_goodbye())

    async def close_after_goodbye():
        # Let the final spoken message enter the audio queue, then drain it fully.
        await asyncio.sleep(0.5)
        if not interviewer._finished:
            interviewer._finished = True
            session.shutdown(drain=True)

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
    await session.start(
        room=ctx.room,
        agent=interviewer,
        room_options=room_io.RoomOptions(delete_room_on_close=True),
    )
    # Give the browser a short window to enable microphone/audio before the greeting.
    await asyncio.sleep(3)
    await session.generate_reply(instructions="Introduce yourself as Jacqueline, the AI practice interviewer, then ask the first required interview question exactly as written. Keep the introduction concise.")
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
