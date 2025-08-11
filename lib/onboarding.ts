// lib/onboarding.ts
export type QType = "text" | "single" | "number" | "date";

export interface OBQuestion {
  id: string;
  title: string;
  subtitle?: string;
  key: string;         // key inside onboarding_answers.data
  type: QType;
  options?: string[];  // for "single"
  placeholder?: string;
  required?: boolean;
}

export const quickStart: OBQuestion[] = [
  {
    id: "q1",
    title: "Which best describes you right now?",
    key: "persona",
    type: "single",
    options: ["Solopreneur","Small business owner","Executive/Manager","Creator","Parent","Student","Other"],
    required: true
  },
  {
    id: "q2",
    title: "If the next 90 days were a win, what would be true?",
    subtitle: "One sentence is enough.",
    key: "ninety_day_win",
    type: "text",
    placeholder: "e.g., Launch v1 and onboard 20 users",
    required: true
  },
  {
    id: "q3",
    title: "What’s the one thing you keep postponing but really want to finish?",
    key: "one_thing",
    type: "text",
    placeholder: "e.g., Finish onboarding flow",
    required: true
  },
  {
    id: "q4",
    title: "Why hasn’t it happened yet?",
    key: "blocker",
    type: "single",
    options: ["Scope too big","Not sure where to start","Too many priorities","Low energy/time","Fear of failing","No accountability","Other"],
    required: true
  },
  {
    id: "q5",
    title: "Pick your focus horizon",
    key: "timeframe",
    type: "single",
    options: ["1 week","1 month","3 months","1 year","5 years","10 years"],
    required: true
  },
  {
    id: "q6",
    title: "In one sentence, what’s your vision right now?",
    key: "vision",
    type: "text",
    placeholder: "e.g., Build tools that help people finish",
    required: true
  },
  {
    id: "q7",
    title: "How committed are you to finishing your #1 goal?",
    key: "commitment",
    type: "single",
    options: ["1","2","3","4","5"],
    required: true
  },
];
