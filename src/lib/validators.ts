import { z } from "zod";
import { isValidBDPhone } from "./phone";

const bdPhoneSchema = z
  .string()
  .refine((v) => isValidBDPhone(v), { message: "Enter a valid Bangladesh phone number (e.g. 01XXXXXXXXX or +8801XXXXXXXXX)" });

export const registerSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(120),
  phone: bdPhoneSchema,
  email: z.string().email("Enter a valid email").optional().or(z.literal("")),
  password: z.string().min(8, "Password must be at least 8 characters"),
  role: z.enum(["FAMILY_USER", "REGISTERED_PERSON", "AUTHORITY", "ADMIN"]),
});

export const loginSchema = z.object({
  phone: bdPhoneSchema,
  password: z.string().min(1, "Password is required"),
});

export const missingPersonReportSchema = z.object({
  fullName: z.string().min(2, "Full name is required").max(120),
  nickname: z.string().max(80).optional().or(z.literal("")),
  age: z.coerce.number().int().min(0).max(130),
  gender: z.enum(["Female", "Male", "Other"]),
  phone: bdPhoneSchema.optional().or(z.literal("")),
  alternatePhone: z.string().optional().or(z.literal("")),
  lastSeenLocation: z.string().min(3, "Last seen location is required"),
  lastSeenDate: z.string().min(1, "Last seen date is required"),
  lastSeenTime: z.string().optional().or(z.literal("")),
  clothingDescription: z.string().max(500).optional().or(z.literal("")),
  physicalDescription: z.string().max(500).optional().or(z.literal("")),
  medicalNotes: z.string().max(500).optional().or(z.literal("")),
  additionalInfo: z.string().max(1000).optional().or(z.literal("")),
  reporterRelationship: z.string().min(2, "Relationship is required"),
  reporterPhone: bdPhoneSchema,
  reporterEmail: z.string().email().optional().or(z.literal("")),
});

export const gdUploadSchema = z.object({
  gdNumber: z.string().min(1, "GD number is required"),
  policeStation: z.string().min(1, "Police station is required"),
  gdFilingDate: z.string().min(1, "GD filing date is required"),
  gdFilingTime: z.string().optional().or(z.literal("")),
  reporterName: z.string().min(1, "Reporter name is required"),
  officerName: z.string().optional().or(z.literal("")),
});

export const trustedContactSchema = z.object({
  name: z.string().min(2, "Name is required"),
  phone: bdPhoneSchema,
  relationship: z.string().min(2, "Relationship is required"),
});

export const locationRequestSchema = z.object({
  reason: z.string().min(5, "Please provide a reason for the request"),
});

export const subscribeSchema = z.object({
  planCode: z.string().min(1),
  cardNumber: z.string().min(12).max(19),
  cardName: z.string().min(2),
  expiry: z.string().min(4),
  cvc: z.string().min(3).max(4),
});

export const ALLOWED_GD_MIME_TYPES = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
export const MAX_GD_FILE_SIZE_BYTES = 10 * 1024 * 1024;
