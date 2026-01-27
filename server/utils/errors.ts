export type ErrorData = any;

export type ErrorCode = 'resource_conflict' | 'unprocessible' | 'resource_not_found';
export class ExecutionError extends Error {
	constructor(readonly code: ErrorCode, message?: string, readonly data?: ErrorData) {
		super(message);
	}
}
function extendExecutionError(code: ErrorCode) {
	return class extends ExecutionError {
		constructor(message?: string, data?: ErrorData) {
			super(code, message, data);
		}
	}
}
export class ConflictError extends extendExecutionError('resource_conflict') { }
export class UnprocessibleError extends extendExecutionError('unprocessible') { }
export class NotFoundError extends extendExecutionError('resource_not_found'){}

function toStatusCode(code: ErrorCode) {
	switch (code) {
		case 'resource_conflict': return 409;
		case 'unprocessible': return 422;
		case 'resource_not_found': return 404;
		default: return 500;
	};
}

export function fromExecutionError<TError extends ExecutionError>(e: TError) {
	return createError({
		statusCode: toStatusCode(e.code),
		data: e.data,
		message: e.message,
		cause: e
	});
}