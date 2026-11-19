import { questions } from "./questions.ts";
import type { CandidateDetails } from "./candidate.ts";

export const storageKey = "python-hiring-assessment:v1";
export const maxAnswerBytes = 64 * 1024;
export const questionIndices = [0, 1] as const;

export type QuestionIndex = (typeof questionIndices)[number];
export type Stage = "setup" | "exam" | "submitted" | "expired";

export type Attempt = {
  startedAt: number;
  deadlineAt: number;
  selected: QuestionIndex;
  answers: [string, string];
  submittedAt: [number | null, number | null];
};

export function createAttempt(now: number, durationMinutes: number): Attempt {
  return {
    startedAt: now,
    deadlineAt: now + durationMinutes * 60_000,
    selected: 0,
    answers: [questions[0].starter, questions[1].starter],
    submittedAt: [null, null],
  };
}

export function restoreAttempt(json: string | null): Attempt | null {
  if (!json) return null;

  try {
    const value: unknown = JSON.parse(json);
    if (!value || typeof value !== "object") return null;

    const { startedAt, deadlineAt, selected, answers, submittedAt } =
      value as Partial<Attempt>;

    if (
      !isTimestamp(startedAt) ||
      !isTimestamp(deadlineAt) ||
      deadlineAt <= startedAt ||
      (selected !== 0 && selected !== 1) ||
      !Array.isArray(answers) ||
      answers.length !== 2 ||
      !answers.every((answer) => typeof answer === "string") ||
      !Array.isArray(submittedAt) ||
      submittedAt.length !== 2 ||
      !submittedAt.every((timestamp) =>
        timestamp === null ||
        (isTimestamp(timestamp) && timestamp >= startedAt && timestamp < deadlineAt),
      )
    ) {
      return null;
    }

    return { startedAt, deadlineAt, selected, answers, submittedAt };
  } catch {
    return null;
  }
}

function isTimestamp(value: unknown): value is number {
  return typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
}

export function submissionCount(attempt: Attempt): number {
  return attempt.submittedAt.filter((timestamp) => timestamp !== null).length;
}

export function stageFor(attempt: Attempt | null, now: number): Stage {
  if (!attempt) return "setup";
  if (submissionCount(attempt) === questions.length) return "submitted";
  return now >= attempt.deadlineAt ? "expired" : "exam";
}

export function hasDraft(answer: string, index: QuestionIndex): boolean {
  return answer.trim() !== "" && answer.trim() !== questions[index].starter.trim();
}

// This comparison only identifies empty answers and unchanged starters. The
// original text is always retained and is never parsed as a submission gate.
function codeWithoutCommentsOrSpacing(text: string): string {
  return text
    .split("\n")
    .map((line) => line.split("#", 1)[0].replace(/\s/g, ""))
    .join("");
}

export function answerIssue(
  answer: string,
  index: QuestionIndex,
): "empty" | "too-large" | null {
  if (new TextEncoder().encode(answer).byteLength > maxAnswerBytes) return "too-large";
  const code = codeWithoutCommentsOrSpacing(answer);
  if (
    !code ||
    code === codeWithoutCommentsOrSpacing(questions[index].signature) ||
    code === codeWithoutCommentsOrSpacing(questions[index].starter)
  ) {
    return "empty";
  }
  return null;
}

export function updateAnswer(
  attempt: Attempt,
  index: QuestionIndex,
  value: string,
  now: number,
): Attempt {
  if (
    attempt.submittedAt[index] !== null ||
    now >= attempt.deadlineAt ||
    attempt.answers[index] === value
  ) {
    return attempt;
  }

  const answers: Attempt["answers"] = [...attempt.answers];
  answers[index] = value;
  return { ...attempt, answers };
}

export type SubmissionResult =
  | { ok: true; attempt: Attempt }
  | { ok: false; reason: "expired" | "locked" | "empty" | "too-large" };

export function submitAnswer(
  attempt: Attempt,
  index: QuestionIndex,
  now: number,
): SubmissionResult {
  if (attempt.submittedAt[index] !== null) return { ok: false, reason: "locked" };
  if (now >= attempt.deadlineAt) return { ok: false, reason: "expired" };

  const issue = answerIssue(attempt.answers[index], index);
  if (issue) return { ok: false, reason: issue };

  const submittedAt: Attempt["submittedAt"] = [...attempt.submittedAt];
  submittedAt[index] = now;
  const otherIndex = index === 0 ? 1 : 0;

  return {
    ok: true,
    attempt: {
      ...attempt,
      submittedAt,
      selected: submittedAt[otherIndex] === null ? otherIndex : index,
    },
  };
}

export function formatClock(milliseconds: number): string {
  const seconds = Math.max(0, Math.ceil(milliseconds / 1000));
  return [Math.floor(seconds / 3600), Math.floor(seconds / 60) % 60, seconds % 60]
    .map((part) => String(part).padStart(2, "0"))
    .join(":");
}

export function exportAnswers(attempt: Attempt, companyName: string, candidate?: CandidateDetails): string {
  const completed = submissionCount(attempt) === questions.length;
  const finishedAt = completed
    ? Math.max(attempt.submittedAt[0] ?? 0, attempt.submittedAt[1] ?? 0)
    : attempt.deadlineAt;

  const sections = questionIndices.map((index) => {
    const hasText = hasDraft(attempt.answers[index], index);
    const status = attempt.submittedAt[index] !== null
      ? "Submitted"
      : hasText
        ? "Draft"
        : "Unanswered";
    return [
      `Question ${index + 1} – ${questions[index].title}`,
      status,
      "",
      hasText ? attempt.answers[index] : "",
    ].join("\n");
  });

  const header = [companyName];
  if (candidate) {
    header.push([
      `Full name: ${candidate.fullName}`,
      `Email address: ${candidate.email}`,
      `Mobile number: ${candidate.mobileNumber}`,
      `College name: ${candidate.collegeName}`,
    ].join("\n"));
  }

  return [
    ...header,
    completed ? "Assessment completed" : "Assessment time ended",
    `Finished at ${new Date(finishedAt).toISOString()}`,
    ...sections,
  ].join("\n\n");
}
