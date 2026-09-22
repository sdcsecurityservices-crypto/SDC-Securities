import { z } from "zod";
const uuid = z.string().uuid(),
  text = z.string().trim().max(8000),
  date = z.string().datetime({ offset: true });
export const trainingSchemas = {
  courses: z.object({
    code: text.min(2).max(30),
    title: text.min(3).max(180),
    category: z.enum(["induction", "specialist", "refresher", "leadership"]),
    mandatory_for: z
      .array(z.enum(["trainee", "full_time", "reliever", "contract"]))
      .max(4)
      .default([]),
    duration_hours: z.number().int().min(1).max(5000),
    field_hours: z.number().int().min(0).max(5000).default(0),
    working_days: z.number().int().min(1).max(365).default(1),
    condensed_hours: z.number().int().min(0).max(5000).default(0),
    mode: z.enum(["classroom", "field", "e_learning", "on_site"]),
    validity_months: z.number().int().min(0).max(120),
    pass_mark: z.number().int().min(1).max(100),
    practical_pass: z.number().int().min(0).max(100),
    question_count: z.number().int().min(1).max(100),
    max_attempts: z.number().int().min(1).max(20),
    language: z.enum(["English", "Kannada", "Hindi"]),
    syllabus: text,
    prerequisites: z.array(uuid).max(50).default([]),
    reviewed: z.boolean(),
  }),
  sessions: z.object({
    course_id: uuid,
    title: text.min(3).max(180),
    trainer_id: uuid,
    site_id: uuid.nullable().default(null),
    venue: text.min(2).max(300),
    starts_at: date,
    ends_at: date,
    capacity: z.number().int().min(1).max(1000),
    status: z.enum(["scheduled", "completed", "cancelled"]),
  }),
  enrollments: z.object({
    employee_id: uuid,
    session_id: uuid,
    attendance: z.enum(["pending", "present", "absent"]),
    hours_completed: z.number().min(0).max(5000),
    practical_score: z.number().int().min(0).max(100).nullable(),
    practical_notes: text,
  }),
  questions: z
    .object({
      course_id: uuid,
      prompt: text.min(5).max(1500),
      options: z.array(text.min(1).max(500)).min(2).max(6),
      correct_index: z.number().int().min(0).max(5),
      explanation: text,
    })
    .refine(
      (x) => x.correct_index < x.options.length,
      "Choose an existing option as the correct answer",
    ),
  requirements: z.object({
    post_id: uuid,
    course_id: uuid,
    enforcement: z.enum(["block", "warn"]),
  }),
};
export type TrainingResource = keyof typeof trainingSchemas;
