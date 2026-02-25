import { z } from "zod";

export const LookupFormSubmissionsRequestSchema = z.object({
	page: z.coerce.number().min(0).default(0),
	limit: z.coerce.number().min(1).default(100),
	form: z.string().trim().optional(),
	fv: z.string().trim().optional().pipe(z.uuid('Invalid UUID').optional()),
	sort: z.record(z.string(), z.enum(['asc', 'desc'])).optional()
});

export const ToggleApprovalStatusRequestSchema = z.object({
	index: z.coerce.number(),
	form: z.string().nonempty(),
	formVersion: z.uuid().optional(),
	submissionVersion: z.uuid().optional()
})

export const DeleteSubmissionRequestSchema = z.object({
	index: z.coerce.number(),
	form: z.string().nonempty(),
	formVersion: z.string().optional(),
	submissionVersion: z.string().optional()
});

export type DeleteSubmissionRequest = z.output<typeof DeleteSubmissionRequestSchema>;
export type ToggleApprovalStatusRequestInput = z.input<typeof ToggleApprovalStatusRequestSchema>;
export type ToggleApprovalStatusRequest = z.output<typeof ToggleApprovalStatusRequestSchema>;
export type LookupFormSubmissionsRequest = z.output<typeof LookupFormSubmissionsRequestSchema>;