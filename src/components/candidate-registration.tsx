"use client";

import { ArrowRight, Clock3, CodeXml, Layers2, LockKeyhole, UserRound } from "lucide-react";
import { type FormEvent, useState } from "react";
import {
  candidateLimits,
  validateCandidateDetails,
  type CandidateDetails,
  type CandidateField,
} from "../lib/candidate";
import { assessmentConfig } from "../lib/config";

const fields = [
  { key: "fullName", label: "Full name", type: "text", autoComplete: "name" },
  { key: "email", label: "Email address", type: "email", autoComplete: "email" },
  { key: "mobileNumber", label: "Mobile number", type: "tel", autoComplete: "tel" },
  { key: "collegeName", label: "College name", type: "text", autoComplete: "organization" },
] as const;

export function CandidateRegistration({ initialDetails, onSubmit }: {
  initialDetails: CandidateDetails | null;
  onSubmit: (details: CandidateDetails) => void;
}) {
  const [errors, setErrors] = useState<Partial<Record<CandidateField, string>>>({});

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const controls = event.currentTarget.elements;
    const input = (key: CandidateField) => controls.namedItem(key) as HTMLInputElement;
    const { details, errors: validationErrors } = validateCandidateDetails({
      fullName: input("fullName").value,
      email: input("email").value,
      mobileNumber: input("mobileNumber").value,
      collegeName: input("collegeName").value,
    });
    setErrors(validationErrors);
    const firstInvalid = fields.find(({ key }) => validationErrors[key]);
    if (firstInvalid) {
      input(firstInvalid.key).focus();
      return;
    }
    onSubmit(details);
  }

  return (
    <main className="registration-content">
      <div className="intro registration-intro">
        <h1 id="registration-title" tabIndex={-1}>{assessmentConfig.companyName}</h1>
        <p>Enter your details to begin the Python coding assessment.</p>
        <ul className="exam-facts" aria-label="Assessment format">
          <li><Clock3 size={17} aria-hidden="true" />{assessmentConfig.durationMinutes} minutes</li>
          <li><Layers2 size={17} aria-hidden="true" />2 questions</li>
          <li><CodeXml size={18} aria-hidden="true" />Python 3</li>
        </ul>
      </div>

      <section className="setup-card registration-card" aria-labelledby="candidate-details-heading">
        <div className="section-heading">
          <span className="section-icon"><UserRound size={21} aria-hidden="true" /></span>
          <h2 id="candidate-details-heading">Candidate details</h2>
        </div>
        <form onSubmit={submit} noValidate>
          <div className="registration-fields">
            {fields.map(({ key, label, type, autoComplete }) => (
              <div className="registration-field" key={key}>
                <label htmlFor={key}>{label}</label>
                <input
                  id={key}
                  type={type}
                  autoComplete={autoComplete}
                  defaultValue={initialDetails?.[key]}
                  maxLength={candidateLimits[key]}
                  aria-invalid={Boolean(errors[key])}
                  aria-describedby={errors[key] ? `${key}-error` : undefined}
                  onChange={() => {
                    if (errors[key]) setErrors((previous) => ({ ...previous, [key]: undefined }));
                  }}
                  required
                />
                {errors[key] && <p className="field-error" id={`${key}-error`}>{errors[key]}</p>}
              </div>
            ))}
          </div>
          <div className="privacy-notice">
            <LockKeyhole size={17} aria-hidden="true" />
            <p>Your details and answers stay in this browser tab. You can download them together and send the file to your recruiter when you finish.</p>
          </div>
          <div className="registration-actions">
            <button className="button primary" type="submit">
              Submit details <ArrowRight size={17} aria-hidden="true" />
            </button>
          </div>
        </form>
      </section>
    </main>
  );
}
