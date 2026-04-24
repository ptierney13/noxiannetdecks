import { z } from "zod";
import { sourceCaptureKindSchema, sourceSiteSchema, sourceUsePolicySchema } from "../data/schema.js";

export const auditSourceRoleSchema = z.enum(["backbone", "supplemental", "manual-reference", "watchlist"]);
export const auditTargetStatusSchema = z.enum(["pending", "captured", "failed", "skipped"]);

export const auditTargetSchema = z.object({
  id: z.string().min(1),
  sourceSite: sourceSiteSchema,
  label: z.string().min(1),
  url: z.string().url(),
  captureKind: sourceCaptureKindSchema,
  usePolicy: sourceUsePolicySchema,
  notes: z.array(z.string().min(1)),
  enabled: z.boolean(),
  status: auditTargetStatusSchema,
  relativePath: z.string().min(1).nullable(),
  capturedAt: z.string().datetime({ offset: true }).nullable(),
  lastError: z.string().min(1).nullable(),
  lastByteLength: z.number().int().nonnegative().nullable(),
  lastContentType: z.string().min(1).nullable()
}).superRefine((target, context) => {
  if (target.usePolicy !== "approved" && target.enabled) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["enabled"],
      message: "manual-review-only or disallowed targets must not be enabled for automated capture"
    });
  }
});

export const auditSourceSchema = z.object({
  sourceSite: sourceSiteSchema,
  role: auditSourceRoleSchema,
  usePolicy: sourceUsePolicySchema,
  summary: z.string().min(1),
  auditNotes: z.array(z.string().min(1)),
  targets: z.array(auditTargetSchema)
}).superRefine((source, context) => {
  if (source.usePolicy !== "approved" && source.targets.some((target) => target.enabled)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["targets"],
      message: "non-approved audit sources must not expose enabled automated targets"
    });
  }
});

export const sourceAuditPlanSchema = z.object({
  version: z.literal(1),
  generatedAt: z.string().datetime({ offset: true }),
  collectionPolicy: z.object({
    textOnly: z.literal(true),
    allowImages: z.literal(false),
    allowOtherMedia: z.literal(false),
    allowManualReviewReferences: z.literal(true),
    allowAutomatedManualReviewSources: z.literal(false),
    allowDisallowedSourceCapture: z.literal(false)
  }),
  sources: z.array(auditSourceSchema).min(1)
});

export type AuditSourceRole = z.infer<typeof auditSourceRoleSchema>;
export type AuditTargetStatus = z.infer<typeof auditTargetStatusSchema>;
export type AuditTarget = z.infer<typeof auditTargetSchema>;
export type AuditSource = z.infer<typeof auditSourceSchema>;
export type SourceAuditPlan = z.infer<typeof sourceAuditPlanSchema>;
