import { z } from "zod";
import type { CustomField } from "@/lib/types";

export const MAX_PAYMENT_PROOF_BYTES = 5 * 1024 * 1024;
export const ALLOWED_PAYMENT_PROOF_EXTENSIONS = ["jpg", "jpeg", "png", "heic", "heif"] as const;
export const ALLOWED_PAYMENT_PROOF_TYPES = ["image/jpeg", "image/png", "image/heic", "image/heif"] as const;

export type RegistrationFieldErrors = Record<string, string>;

const HEARD_FROM_OPTIONS = new Set([
  "Instagram",
  "Friend / Word of mouth",
  "Past De-escape event",
  "Google",
  "WhatsApp",
  "Other",
]);

const namePattern = new RegExp("^[\\p{L}\\p{M}][\\p{L}\\p{M} .'-]*$", "u");
const nonLetterPattern = new RegExp("[^A-Za-z\\p{L}]", "gu");

const stringField = (message: string, max = 120, min = 1) =>
  z.preprocess(
    (value) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value),
    z.string().min(min, message).max(max, `Must be ${max} characters or fewer`)
  );

export function normalizeIndianMobile(value: string) {
  const digits = value.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) return digits.slice(1);
  return digits;
}

export function normalizeInstagramHandle(value?: string) {
  const cleaned = value?.trim().replace(/^https?:\/\/(www\.)?instagram\.com\//i, "").replace(/^@/, "").replace(/\/+$/, "");
  return cleaned || undefined;
}

export function normalizeBaseEmail(value: string) {
  return value.trim().toLowerCase();
}

const indianMobileSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeIndianMobile(value) : value),
  z
    .string()
    .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number")
    .refine((value) => !/^(\d)\1{9}$/.test(value), "Enter a real mobile number")
);

const emailSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeBaseEmail(value) : value),
  z
    .string()
    .email("Enter a valid email address")
    .max(254, "Email must be 254 characters or fewer")
    .refine((value) => {
      const [local, domain] = value.split("@");
      return Boolean(local && domain && local.length <= 64 && domain.includes(".") && !domain.endsWith("."));
    }, "Enter a valid email address")
);

const fullNameSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value),
  z
    .string()
    .min(2, "Full name must be at least 2 characters")
    .max(80, "Full name must be 80 characters or fewer")
    .regex(namePattern, "Use a real name with letters, spaces, apostrophes, hyphens, or periods")
    .refine((value) => value.replace(nonLetterPattern, "").length >= 2, "Full name must include at least 2 letters")
);

const instagramSchema = z.preprocess(
  (value) => (typeof value === "string" ? normalizeInstagramHandle(value) : value),
  z
    .string({ error: "Instagram is required" })
    .min(1, "Instagram is required")
    .regex(/^[A-Za-z0-9._]{1,30}$/, "Enter a valid Instagram handle")
);

const heardFromSchema = z.preprocess(
  (value) => (typeof value === "string" ? value.trim().replace(/\s+/g, " ") : value),
  z
    .string()
    .max(80, "Must be 80 characters or fewer")
    .refine((value) => !value || HEARD_FROM_OPTIONS.has(value), "Choose a valid source")
    .optional()
    .default("")
);

export const registrationBaseSchema = z.object({
  eventId: z.string().uuid("Invalid event"),
  fullName: fullNameSchema,
  phone: indianMobileSchema,
  email: emailSchema,
  age: z.coerce.number().int("Age must be a whole number").min(13, "You must be at least 13").max(99, "Age must be 99 or below"),
  city: stringField("Area must be at least 2 characters", 80, 2),
  instagram: z.string().optional(),
  heardFrom: heardFromSchema,
  notes: z.string().optional(),
  consent: z.literal(true, { error: "Consent is required to proceed" }),
});

export const registrationActionSchema = registrationBaseSchema.extend({
  screenshotBase64: z.string().optional(),
  screenshotName: z.string().optional(),
  customAnswers: z.record(z.string(), z.unknown()).optional(),
});

export type RegistrationActionInput = z.infer<typeof registrationActionSchema>;

export function zodIssuesToFieldErrors(error: z.ZodError): RegistrationFieldErrors {
  const errors: RegistrationFieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path[0]?.toString() || "submit";
    if (!errors[key]) errors[key] = issue.message;
  }
  return errors;
}

export function validateCustomAnswers(
  customFields: CustomField[] = [],
  rawAnswers: Record<string, unknown> = {},
  options: { requireAll?: boolean } = {}
) {
  const normalized: Record<string, string | number | boolean> = {};
  const errors: RegistrationFieldErrors = {};
  const allowedTypes = new Set(["text", "textarea", "select", "number", "checkbox"]);
  const requireAll = options.requireAll ?? true;

  for (const field of customFields) {
    if (!field.key || !field.label || !allowedTypes.has(field.type)) continue;
    const raw = rawAnswers[field.key];
    const isRequired = requireAll || field.required;

    if (field.type === "checkbox") {
      const value = raw === true;
      if (isRequired && !value) errors[field.key] = `${field.label} is required`;
      normalized[field.key] = value;
      continue;
    }

    if (field.type === "number") {
      const numberValue = typeof raw === "number" ? raw : typeof raw === "string" && raw.trim() ? Number(raw) : NaN;
      if (isRequired && !Number.isFinite(numberValue)) {
        errors[field.key] = `${field.label} is required`;
      } else if (raw !== undefined && raw !== null && raw !== "" && !Number.isFinite(numberValue)) {
        errors[field.key] = `${field.label} must be a number`;
      } else if (Number.isFinite(numberValue)) {
        normalized[field.key] = numberValue;
      }
      continue;
    }

    const value = typeof raw === "string" ? raw.trim().replace(/\s+/g, " ") : "";
    if (isRequired && !value) errors[field.key] = `${field.label} is required`;
    if (value.length > 500) errors[field.key] = `${field.label} must be 500 characters or fewer`;
    if (field.type === "select" && value) {
      const options = field.options ?? [];
      if (!options.includes(value)) errors[field.key] = `Choose a valid option for ${field.label}`;
    }
    if (value && !errors[field.key]) normalized[field.key] = value;
  }

  return {
    success: Object.keys(errors).length === 0,
    errors,
    data: normalized,
  };
}

export function validatePaymentProofFile(file: File | null): string {
  if (!file) return "Payment screenshot is required";
  const lowerName = file.name.toLowerCase();
  const hasAllowedExtension = ALLOWED_PAYMENT_PROOF_EXTENSIONS.some((ext) => lowerName.endsWith(`.${ext}`));
  if (!ALLOWED_PAYMENT_PROOF_TYPES.includes(file.type as (typeof ALLOWED_PAYMENT_PROOF_TYPES)[number]) && !hasAllowedExtension) {
    return "Upload a JPG, PNG, HEIC, or HEIF payment screenshot";
  }
  if (file.size > MAX_PAYMENT_PROOF_BYTES) {
    return `Payment screenshot must be 5 MB or smaller. This file is ${(file.size / 1024 / 1024).toFixed(2)} MB.`;
  }
  return "";
}

export function detectPaymentProofMime(buffer: Buffer): "image/jpeg" | "image/png" | "image/heic" | "image/heif" | null {
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "image/jpeg";
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    return "image/png";
  }
  if (buffer.length >= 12 && buffer.toString("ascii", 4, 8) === "ftyp") {
    const brand = buffer.toString("ascii", 8, 12);
    if (["heic", "heix", "hevc", "hevx"].includes(brand)) return "image/heic";
    if (["mif1", "msf1"].includes(brand)) return "image/heif";
  }
  return null;
}

export function extensionForPaymentProof(name: string, mime: string) {
  const ext = name.split(".").pop()?.toLowerCase();
  if (ext && ALLOWED_PAYMENT_PROOF_EXTENSIONS.includes(ext as (typeof ALLOWED_PAYMENT_PROOF_EXTENSIONS)[number])) {
    return ext === "jpg" ? "jpeg" : ext;
  }
  if (mime === "image/jpeg") return "jpeg";
  if (mime === "image/png") return "png";
  if (mime === "image/heic") return "heic";
  if (mime === "image/heif") return "heif";
  return null;
}
