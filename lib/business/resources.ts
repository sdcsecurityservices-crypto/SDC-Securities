import { z } from "zod";
import type { Field } from "@/lib/field/resources";
const text = z.string().trim().max(5000),
  uuid = z.string().uuid();
export const businessSchemas = {
  compliance: z.object({
    title: text.min(3),
    category: z.enum([
      "PSARA",
      "PF",
      "ESI",
      "Professional Tax",
      "LWF",
      "Shops & Establishment",
      "Contract labour",
      "Minimum wages",
      "Other",
    ]),
    state: text.min(2),
    due_on: z.string().date(),
    expires_on: z.string().date().nullable(),
    owner: text.min(2),
    reference: text,
    notes: text,
    status: z.enum(["pending", "submitted", "verified"]),
    document_id: uuid.nullable(),
  }),
  recruitment: z.object({
    full_name: text.min(3),
    phone: text.min(5).max(30),
    source: text.min(2),
    status: z.enum([
      "sourced",
      "screening",
      "documents",
      "verification",
      "ready",
      "rejected",
    ]),
    physical_standards: z.record(z.unknown()),
    screening_notes: text,
    verification_notes: text,
  }),
};
export const businessForms: Record<string, Field[]> = {
  compliance: [
    { key: "title", label: "Compliance obligation" },
    {
      key: "category",
      label: "Category",
      options: [
        "PSARA",
        "PF",
        "ESI",
        "Professional Tax",
        "LWF",
        "Shops & Establishment",
        "Contract labour",
        "Minimum wages",
        "Other",
      ],
    },
    { key: "state", label: "State" },
    { key: "due_on", label: "Due date", type: "date" },
    { key: "expires_on", label: "Expiry date", type: "date", optional: true },
    { key: "owner", label: "Responsible owner" },
    { key: "reference", label: "Reference / challan number" },
    { key: "notes", label: "Notes and policy source", type: "textarea" },
    {
      key: "status",
      label: "Status",
      options: ["pending", "submitted", "verified"],
    },
    { key: "document_id", label: "Supporting document ID", optional: true },
  ],
  recruitment: [
    { key: "full_name", label: "Candidate name" },
    { key: "phone", label: "Phone" },
    { key: "source", label: "Recruitment source" },
    {
      key: "status",
      label: "Pipeline stage",
      options: [
        "sourced",
        "screening",
        "documents",
        "verification",
        "ready",
        "rejected",
      ],
    },
    {
      key: "screening_notes",
      label: "Physical standards and screening notes",
      type: "textarea",
    },
    {
      key: "verification_notes",
      label: "Document and verification notes",
      type: "textarea",
    },
  ],
};
