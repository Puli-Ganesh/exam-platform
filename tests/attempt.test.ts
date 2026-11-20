import assert from "node:assert/strict";
import { test } from "node:test";
import {
  answerIssue,
  createAttempt,
  exportAnswers,
  formatClock,
  maxAnswerBytes,
  restoreAttempt,
  stageFor,
  submissionCount,
  submitAnswer,
  updateAnswer,
  type Attempt,
  type QuestionIndex,
} from "../src/lib/attempt.ts";
import { questions } from "../src/lib/questions.ts";

const start = 1_800_000_000_000;
const answerOne = `${questions[0].signature}\n    return []\n\n# Review fixture\n`;
const answerTwo = `${questions[1].signature}\n    return -1\n\n# Review fixture\n`;

function saveAnswer(attempt: Attempt, index: QuestionIndex, text: string, now: number) {
  const draft = updateAnswer(attempt, index, text, now);
  const result = submitAnswer(draft, index, now);
  assert.ok(result.ok);
  return result.attempt;
}

test("the fixed pack has both starters and all five public examples", () => {
  assert.deepEqual(questions.map((question) => question.examples.length), [2, 3]);
  for (const question of questions) {
    assert.equal(question.starter, `${question.signature}\n    pass\n`);
  }
});

test("submitting one answer advances to the remaining question; both are required for completion", () => {
  const attempt = createAttempt(start, 90);
  assert.equal(stageFor(null, start), "setup");
  assert.equal(stageFor(attempt, start), "exam");

  const first = saveAnswer(attempt, 0, answerOne, start + 100);
  assert.equal(stageFor(first, start + 100), "exam");
  assert.equal(submissionCount(first), 1);
  assert.equal(first.selected, 1);

  const both = saveAnswer(first, 1, answerTwo, start + 200);
  assert.equal(stageFor(both, start + 200), "submitted");
  assert.equal(submissionCount(both), 2);
});

test("submitting question two first still requires question one", () => {
  const first = saveAnswer(createAttempt(start, 90), 1, answerTwo, start + 10);
  assert.equal(stageFor(first, start + 10), "exam");
  assert.equal(first.selected, 0);
  assert.equal(stageFor(saveAnswer(first, 0, answerOne, start + 20), start + 20), "submitted");
});

test("empty text, starter stubs and comment-only edits cannot be submitted", () => {
  const attempt = createAttempt(start, 90);
  assert.deepEqual(submitAnswer(attempt, 0, start + 5), { ok: false, reason: "empty" });
  for (const text of ["", "  \n  ", "# Only comments", questions[0].signature, `${questions[0].starter}# explanation`]) {
    assert.equal(answerIssue(text, 0), "empty");
  }
  assert.equal(answerIssue(answerOne, 0), null);
  assert.equal(answerIssue("def incomplete(", 0), null);
});

test("the answer size limit counts encoded UTF-8 bytes and keeps an oversize draft intact", () => {
  const limit = "é".repeat(maxAnswerBytes / 2);
  assert.equal(answerIssue(limit, 0), null);
  const draft = updateAnswer(createAttempt(start, 90), 0, limit + "é", start + 1);
  assert.deepEqual(submitAnswer(draft, 0, start + 2), { ok: false, reason: "too-large" });
  assert.equal(draft.answers[0], limit + "é");
});

test("a submitted answer remains locked and duplicate submission does not change the attempt", () => {
  const first = saveAnswer(createAttempt(start, 90), 0, answerOne, start + 5);
  assert.equal(updateAnswer(first, 0, "changed", start + 6), first);
  assert.deepEqual(submitAnswer(first, 0, start + 6), { ok: false, reason: "locked" });
  assert.equal(first.answers[0], answerOne);
});

test("restoring preserves both answers, the deadline and the completion state", () => {
  const first = saveAnswer(createAttempt(start, 90), 0, answerOne, start + 10);
  const draft = updateAnswer(first, 1, answerTwo, start + 30);
  const resumed = restoreAttempt(JSON.stringify(draft));
  assert.deepEqual(resumed, draft);
  assert.ok(resumed);

  const completed = saveAnswer(resumed, 1, answerTwo, start + 100);
  const result = restoreAttempt(JSON.stringify(completed));
  assert.deepEqual(result, completed);
  assert.equal(stageFor(result, completed.deadlineAt + 1_000), "submitted");
  assert.equal(result?.deadlineAt, start + 90 * 60_000);
});

test("invalid persisted data is ignored", () => {
  assert.equal(restoreAttempt("{malformed"), null);
  assert.equal(restoreAttempt(JSON.stringify({ ...createAttempt(start, 90), selected: 2 })), null);
});

test("expiry retains earlier work without displaying a completed assessment", () => {
  const first = saveAnswer(createAttempt(start, 90), 0, answerOne, start + 100);
  const draft = updateAnswer(first, 1, answerTwo, start + 120);
  assert.equal(stageFor(draft, draft.deadlineAt), "expired");
  assert.equal(updateAnswer(draft, 1, "changed", draft.deadlineAt), draft);
  assert.deepEqual(submitAnswer(draft, 1, draft.deadlineAt), { ok: false, reason: "expired" });
  assert.match(exportAnswers(draft, "Company"), /Assessment time ended[\s\S]+Submitted[\s\S]+Draft/);
});

test("the download preserves exact text, comments and question order", () => {
  const first = saveAnswer(createAttempt(start, 90), 0, answerOne, start + 100);
  const second = saveAnswer(first, 1, answerTwo, start + 200);
  const output = exportAnswers(second, "Company");
  assert.ok(output.includes(answerOne));
  assert.ok(output.includes(answerTwo));
  assert.ok(output.indexOf(answerOne) < output.indexOf(answerTwo));
  assert.match(output, /Assessment completed/);
});

test("the displayed clock counts down through the final second", () => {
  assert.equal(formatClock(90 * 60_000), "01:30:00");
  assert.equal(formatClock(1), "00:00:01");
  assert.equal(formatClock(-1), "00:00:00");
});
