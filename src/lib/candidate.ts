export const candidateStorageKey = "python-hiring-assessment:candidate:v1";

export type CandidateDetails = {
  fullName: string;
  email: string;
  mobileNumber: string;
  collegeName: string;
};

export type CandidateField = keyof CandidateDetails;
type DetailsErrors = Partial<Record<CandidateField, string>>;

export const candidateLimits: Record<CandidateField, number> = {
  fullName: 100,
  email: 254,
  mobileNumber: 32,
  collegeName: 160,
};

function validText(value: string, limit: number) {
  return value.length > 0 && value.length <= limit && !/[\u0000-\u001f\u007f]/.test(value);
}

export function validateCandidateDetails(input: CandidateDetails): {
  details: CandidateDetails;
  errors: DetailsErrors;
} {
  const details = {
    fullName: input.fullName.trim(),
    email: input.email.trim(),
    mobileNumber: input.mobileNumber.trim(),
    collegeName: input.collegeName.trim(),
  };
  const errors: DetailsErrors = {};

  if (!validText(details.fullName, candidateLimits.fullName)) {
    errors.fullName = "Enter your full name.";
  }

  if (
    !validText(details.email, candidateLimits.email) ||
    !/^[^\s@]+@[^.\s@]+(?:\.[^.\s@]+)+$/.test(details.email)
  ) {
    errors.email = "Enter a valid email address.";
  }

  const digits = details.mobileNumber.replace(/\D/g, "");
  if (
    !validText(details.mobileNumber, candidateLimits.mobileNumber) ||
    !/^\+?[\d ()-]+$/.test(details.mobileNumber) ||
    digits.length < 7 ||
    digits.length > 15
  ) {
    errors.mobileNumber = "Enter a valid mobile number with an optional country code.";
  }

  if (!validText(details.collegeName, candidateLimits.collegeName)) {
    errors.collegeName = "Enter your college name.";
  }

  return { details, errors };
}

export function restoreCandidateDetails(json: string | null): CandidateDetails | null {
  if (!json) return null;

  try {
    const value: unknown = JSON.parse(json);
    if (!value || typeof value !== "object") return null;
    const { fullName, email, mobileNumber, collegeName } = value as Partial<CandidateDetails>;
    if (
      typeof fullName !== "string" ||
      typeof email !== "string" ||
      typeof mobileNumber !== "string" ||
      typeof collegeName !== "string"
    ) {
      return null;
    }

    const { details, errors } = validateCandidateDetails({
      fullName, email, mobileNumber, collegeName,
    });
    return Object.keys(errors).length ? null : details;
  } catch {
    return null;
  }
}
