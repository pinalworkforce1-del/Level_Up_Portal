/**
 * Coach-only, deterministic planning prompts from non-sensitive My Path Forward fields.
 * No AI inference, eligibility decisions, participant grading, or persistence.
 * All participant input is escaped by the Coach View renderer.
 */
type PlanningFields = Record<string, unknown>;
type Measure = { key: string; value: number | null };
type Priority = { id: string; title: string; detail: string; based_on: string[] };

const clean = (value: unknown, limit = 125) =>
  String(value ?? "").replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, limit).trim();
const quote = (value: string) => "“" + value.replace(/[“”]/g, "") + "”";
const useful = (value: unknown) => clean(value).length > 0;

function specificFirstStep(text: string): boolean {
  const step = clean(text, 300).toLowerCase().replace(/[.!?]+$/g, "").trim();
  if (!step) return false;
  if (/^(complete|do|start|finish|work on|research|look into|figure out|complete this|do this|take the next step)(\s+(this|it|my plan|things|more|later))?$/.test(step)) return false;
  if (step.split(/\s+/).length <= 3 && !/\b(call|email|contact|apply|register|enroll|visit|schedule|compare|attend|meet)\b/.test(step)) return false;
  // Avoid penalizing spelling, grammar, short but actionable steps, or language variation.
  return true;
}

export function buildCoachingGuidance(
  data: { fields?: PlanningFields; options?: unknown; readinessSupports?: unknown; coachConversation?: unknown },
  score: number | null,
  self: number | null,
  measures: Measure[],
) {
  const f = (data?.fields && typeof data.fields === "object") ? data.fields : {};
  const goal = clean(f.goal, 130);
  const step = clean(f.nextStep, 130);
  const target = clean(f.target, 90);
  const vision = clean(f.futureVision, 125);
  const motivation = clean(f.motivations, 115);
  const strengths = clean(f.strengths, 110);
  const options = Array.isArray(data?.options) ? data.options.filter((x): x is string => typeof x === "string") : [];
  const supports = Array.isArray(data?.readinessSupports) ? data.readinessSupports : [];
  const privateRequest = data?.coachConversation === true;
  const hasStep = useful(step);
  const vagueStep = !specificFirstStep(step);
  const priorities: Priority[] = [];
  const questions: string[] = [];

  const addPriority = (id: string, title: string, detail: string, based_on: string[]) => {
    if (priorities.length < 3 && !priorities.some(p => p.id === id)) {
      priorities.push({ id, title, detail, based_on });
    }
  };
  const addQuestion = (question: string) => {
    if (questions.length < 4 && !questions.includes(question)) questions.push(question);
  };

  if (privateRequest) {
    addQuestion("You requested a private conversation. What would you like to discuss today?");
  }
  if (vision) {
    addQuestion("You described your future vision as " + quote(vision) + ". Which part of that direction would you like to explore first?");
  } else if (motivation) {
    addQuestion("You said " + quote(motivation) + " motivates you. What kind of work might let you build on that?");
  }

  if (goal) {
    addQuestion("You chose " + quote(goal) + " as a goal." +
      (target ? " You mentioned " + quote(target) + " as your time frame." : "") +
      " What would be one specific first action?");
  } else if (step) {
    addQuestion("You wrote " + quote(step) + " as a next step. What result would you like that step to lead to?");
  }

  if (strengths) {
    addQuestion("You identified " + quote(strengths) + " as strengths. Which one could help you with your next step?");
  }
  if (questions.length < 3 && motivation && vision) {
    addQuestion("You mentioned " + quote(motivation) + " as a motivation. How does it connect to your future vision?");
  }
  if (questions.length < 3 && supports.includes("coach")) {
    addQuestion("You selected Career Coach support. What would you like help with first?");
  }
  for (const m of measures.filter(m => m.value === null || m.value < 2)) {
    if (questions.length >= 3) break;
    const defaults: Record<string,string> = {
      direction:"Which type of work would you like to learn more about?",
      strengths:"What is one skill or interest you enjoy using?",
      goal:"What could be a manageable goal to explore together?",
      action:"What is one small action that feels realistic?",
      timeframe:"When might you like to begin?",
    };
    if (defaults[m.key]) addQuestion(defaults[m.key]);
  }
  if (!questions.length) addQuestion("What would you like to work toward next?");

  // Priorities are suggestions for the coach, not commitments, case notes, or service referrals.
  if (vagueStep || !target) {
    const detail = vagueStep ?
      (goal ? "Turn the participant's goal " + quote(goal) + " into a concrete first action" :
        "Work together to name one concrete, manageable first action") +
      (target ? " for " + quote(target) : " and identify a realistic starting time") +
      ". Ask what they would do, who they might contact, and when." :
      "Confirm a realistic time frame for the first action " + quote(step) + ".";
    addPriority("make-action-specific","Clarify the first step",detail,
      [goal?"goal":"",hasStep?"nextStep":"",target?"target":""].filter(Boolean));
  } else if (goal) {
    addPriority("confirm-action","Confirm an achievable first step",
      "Check whether " + quote(step) + " moves the participant toward " + quote(goal) +
      (target ? " within " + quote(target) : "") + ".",
      ["goal","nextStep",...(target?["target"]:[])]);
  }

  if (vision || motivation || options.length) {
    const direction = vision || motivation;
    const optionLabels: Record<string,string> = {
      diploma:"GED or diploma",wex:"work experience",training:"training or a credential",
      apprenticeship:"apprenticeship",college:"college",business:"starting a business"
    };
    const choice = options.map(v => optionLabels[v]).filter(Boolean).slice(0,2).join(" or ");
    const detail = (direction ? "Discuss the participant's interest in " + quote(direction) + "." :
      "Discuss the participant's selected career or learning options.") +
      (choice ? " They also selected " + choice + " to explore." : "") +
      " Identify one practical question to research or one occupation to compare.";
    addPriority("explore-career-direction","Explore a career or learning pathway",detail,
      [vision?"futureVision":motivation?"motivations":"",choice?"options":""].filter(Boolean));
  }

  if (privateRequest) {
    addPriority("private-conversation","Honor the private conversation request",
      "Offer a private opportunity to talk. Let the participant decide what to share; do not infer a reason or document sensitive details in this report.",
      ["coachConversation"]);
  } else if (supports.includes("coach") || supports.includes("action_plan")) {
    addPriority("identify-support","Agree on useful coaching support",
      "Ask which support would make the next step easier and agree together on a follow-up.",
      ["readinessSupports"]);
  } else if (score !== null && self !== null && Math.abs(score-self) >= 2) {
    addPriority("discuss-readiness","Explore the two readiness ratings",
      "Ask how the participant interprets their own readiness. The plan rating reflects answers to planning questions, not confidence or ability.",
      ["readiness","planResponses"]);
  }

  if (priorities.length < 3) {
    addPriority("agree-on-next-step","Agree on a next check-in",
      "Ask what the participant would like to revisit after taking a step or learning more.",
      ["planResponses"]);
  }
  return {
    talking_points: questions.slice(0,4),
    suggested_coaching_priorities: priorities.slice(0,3),
    action_specificity: {
      needs_clarification: vagueStep,
      suggested_prompt: goal ?
        "You identified " + quote(goal) + " as a goal. What is one concrete action you can take first" +
          (target ? " around " + quote(target) : "") + "?" :
        "What is one concrete action you could take, who might you contact, and when?"
    }
  };
}
