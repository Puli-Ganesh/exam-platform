import assert from "node:assert/strict";
import { test } from "node:test";
import { createAttempt, exportAnswers } from "../src/lib/attempt.ts";
import { restoreCandidateDetails, validateCandidateDetails } from "../src/lib/candidate.ts";

const candidate = {
  fullName: "Sample Candidate",
  email: "candidate@example.test",
  mobileNumber: "+91 90000 00000",
  collegeName: "Example College",
};

test("candidate details require all four fields", () => {
  const { errors } = validateCandidateDetails({
    fullName: " ",
    email: "",
    mobileNumber: "",
    collegeName: "",
  });
  assert.deepEqual(Object.keys(errors), ["fullName", "email", "mobileNumber", "collegeName"]);
});

test("valid international details are trimmed and can be restored", () => {
  const { details, errors } = validateCandidateDetails({
    ...candidate,
    fullName: "  Sample Candidate  ",
    collegeName: " Example College ",
  });
  assert.deepEqual(errors, {});
  assert.deepEqual(details, candidate);
  assert.deepEqual(restoreCandidateDetails(JSON.stringify(details)), candidate);
});

test("invalid contact values and malformed storage cannot advance registration", () => {
  const { errors } = validateCandidateDetails({
    ...candidate,
    email: "candidate@@example.test",
    mobileNumber: "call 1234",
  });
  assert.deepEqual(Object.keys(errors), ["email", "mobileNumber"]);
  assert.equal(restoreCandidateDetails(JSON.stringify({ ...candidate, email: "" })), null);
  assert.equal(restoreCandidateDetails("{invalid"), null);
});

test("the candidate's four details are included in the downloadable text file", () => {
  const attempt = createAttempt(1_800_000_000_000, 90);
  const text = exportAnswers(attempt, "Anthropic Hiring Assessment", candidate);
  assert.match(text, /^Anthropic Hiring Assessment/);
  assert.ok(text.includes(`Full name: ${candidate.fullName}`));
  assert.ok(text.includes(`Email address: ${candidate.email}`));
  assert.ok(text.includes(`Mobile number: ${candidate.mobileNumber}`));
  assert.ok(text.includes(`College name: ${candidate.collegeName}`));
});
