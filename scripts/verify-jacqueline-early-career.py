"""Offline compatibility tests for Jacqueline's role bank and evidence extraction.

No LiveKit server, Supabase credentials, microphone, or paid session required.
"""
from pathlib import Path
import ast
import json
import logging
import re
from difflib import SequenceMatcher

root = Path(__file__).resolve().parents[1]
worker = (root/"live-interview-pilot"/"agent.py").read_text()
bank = json.loads((root/"live-interview-pilot"/"early-career-questions.json").read_text())
edge_bank = json.loads((root/"supabase"/"functions"/"levelup-live-interview-token"/"early-career-questions.json").read_text())
assert bank == edge_bank, "Backend and LiveKit banks must match exactly"
assert bank["version"] == "early-career-v1"
assert len(bank["roles"]) >= 9
assert "first_job" in bank["roles"]
assert "food_service" in bank["roles"]
assert "wex" in bank["roles"]

tree = ast.parse(worker)
symbols = {}
for node in tree.body:
    if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)) and node.name in {
        "questions_for_role", "resolve_interview_questions", "question_match",
        "extract_question_answers"
    }:
        symbols[node.name] = node
assert len(symbols) == 4
source = ast.fix_missing_locations(ast.Module(body=list(symbols.values()),type_ignores=[]))
scope = {
    "json":json,"re":re,"SequenceMatcher":SequenceMatcher,"logger":logging.getLogger("test"),
    "EARLY_CAREER_BANK":bank,
    "PILOT_QUESTIONS":[
        ("q1","What interests you about this position and what experience would help you succeed?"),
        ("q2","What workplace responsibilities have best prepared you to work with a team?"),
        ("q3","What would you do if you encountered a customer or coworker who needed assistance while you were busy?")
    ],
}
exec(compile(source,"jacqueline_functions","exec"),scope)
resolve = scope["resolve_interview_questions"]
extract = scope["extract_question_answers"]
for role in list(bank["roles"])+["general"]:
    questions = resolve(json.dumps({"question_bank":bank["version"],"role":role}))
    assert len(questions)==5,(role,len(questions))
    assert [q["id"] for q in questions] == ["q1","q2","q3","q4","q5"]
    assert questions[0]["text"] == "Tell me about yourself."
    assert all(len(q["text"])>=20 for q in questions)
    assert "paid employment" not in " ".join(q["text"]).lower()
    scenario = bank["roles"].get(role,bank["roles"]["first_job"])["scenario"]
    assert questions[3]["text"] == scenario
    turns=[]
    for q in questions:
        turns += [
            {"role":"assistant","text":q["text"]},
            {"role":"user","text":"I haven't had a job yet, but I have an example from school."},
            {"role":"assistant","text":"Can you explain a little more?"},
            {"role":"user","text":"I worked with my classmates, divided tasks, and checked in so everyone could finish on time."},
        ]
    evidence=extract(turns,questions)
    assert len(evidence)==5
    assert evidence[0]["question_id"]=="q1"
    assert "classmates" in evidence[0]["response"],"Strongest actual follow-up answer should be retained"
    assert len(extract(turns[:6], questions)) < 5,"Premature exit must not count as complete"

legacy=resolve(None)
assert len(legacy)==3
assert legacy[0]["text"].startswith("What interests you about")
assert len(resolve("{invalid-json"))==3
assert "early-career-questions.json" in (root/"live-interview-pilot"/"Dockerfile").read_text()
edge=(root/"supabase"/"functions"/"levelup-live-interview-token"/"index.ts").read_text()
assert "required_questions:questions" in edge
assert "metadata:JSON.stringify({question_bank:EARLY_CAREER_BANK.version,role:occupation})" in edge
assert "unsupported_interview_role" in edge
assert "required_questions:PILOT_QUESTIONS" not in edge
assert "session_status" in edge and 'mode==="end"' in edge
ui=(root/"public"/"career-tree-next"/"ready-2-work"/"live-interview-pilot.html").read_text()
for role in ["first_job","food_service","retail","customer_service","wex"]:
    assert f'value="{role}"' in ui
assert "data.question_count||5" in ui
assert "status.status!=='completed'" in ui
feedback=(root/"supabase"/"functions"/"levelup-interview-feedback-lab"/"index.ts").read_text()
assert "lack of paid employment" in feedback
assert "required.length !== answers.length" in feedback
print("PASS: nine roles, five questions, legacy compatibility, student examples, transcript evidence, UI, and feedback.")
