import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { createError, defineEventHandler, readMultipartFormData, setResponseStatus } from 'h3';
import { defineRouteMeta, useRuntimeConfig } from 'nitropack/runtime';
import path from 'path';
import { hashTheseMd5 } from '~/utils/helpers';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'];
const UPLOAD_DIR = path.join(process.cwd(), 'server/public/uploads');

export default defineEventHandler(async (event) => {
	const files = await readMultipartFormData(event);
	if (!files || files.length == 0) {
		throw createError({ statusCode: 400, statusMessage: 'No file uploaded' });
	}
	const { uploadsBase } = useRuntimeConfig(event);

	const uploadedFiles = [];
	for (const field of files) {
		if (field.name === 'files' && field.filename) {
			if (field.data.length > MAX_FILE_SIZE) {
				throw createError({
					statusCode: 400,
					message: `File: ${field.filename} exceeds the maximum size of ${MAX_FILE_SIZE / 1024 / 1024}MB`
				});
			}
			if (field.type && !ALLOWED_TYPES.includes(field.type)) {
				throw createError({
					statusCode: 400,
					message: `File type ${field.type} is not allowed.`,
					data: {
						file: field.filename
					}
				});
			}

			const fileExt = path.extname(field.filename);
			const fileName = hashTheseMd5(path.basename(field.filename, fileExt), '' + Date.now());
			const safeFilename = `${fileName}-${Date.now()}-${Math.random().toString(36).substring(7)}${fileExt}`;
			const filePath = path.join(UPLOAD_DIR, safeFilename);
			const fileDir = path.dirname(filePath);
			if (!existsSync(fileDir)) {
				await mkdir(fileDir, { recursive: true });
			}
			await writeFile(filePath, field.data);
			uploadedFiles.push({
				originalName: field.filename,
				filename: safeFilename,
				size: field.data.length,
				type: field.type,
				urlPath: `${uploadsBase}/${safeFilename}`
			})
		}
	}

	setResponseStatus(event, 202);
	return {
		statusCode: 202,
		body: {
			message: `${uploadedFiles.length} file(s) uploaded successfully`,
			files: uploadedFiles
		}
	}
})


defineRouteMeta({
	openAPI: {
		summary: 'File uploads',
		description: 'Dedicated endpoint for handling file uploads',
		tags: ['Miscellaneous', 'Upload'],
		requestBody: {
			required: true,
			content: {
				'multipart/form-data': {
					schema: {
						type: 'object',
						additionalProperties: false,
						properties: {
							files: {
								type: 'array',
								items: {
									type: 'string',
									format: 'binary',
								},
								description: 'Files to upload (supports multiple)'
							}
						},
						required: ['files']
					}
				}
			}
		},
		$global: {
			components: {
				schemas: {
					UploadedFileInfo: {
						type: 'object',
						additionalProperties: false,
						required: ['originalName', 'filename', 'size', 'type', 'urlPath'],
						properties: {
							originalName: {
								type: 'string',
								example: 'profile-pic.jpg'
							},
							filename: {
								type: 'string',
								example: 'profile-pic-1234567890abc.jpg'
							},
							size: {
								type: 'number',
								example: 1024576
							},
							type: {
								type: 'string',
								example: 'image/jpeg'
							},
							urlPath: { type: 'string', example: '/uploads/profile-pic-1234567890abc.jpg' }
						}
					},
					FileUploadResponseBody: {
						type: 'object',
						additionalProperties: false,
						properties: {
							message: {
								type: 'string',
								example: '2 file(s) uploaded successfully'
							},
							files: {
								type: 'array',
								items: { $ref: '#/components/schemas/UploadedFileInfo' }
							}
						}
					},
					FileUploadResponse: {
						type: 'object',
						additionalProperties: false,
						properties: {
							statusCode: {
								type: 'number',
								example: 200
							},
							body: { $ref: '#/components/schemas/FileUploadResponseBody' }
						}
					}
				}
			}
		},
		responses: {
			202: {
				description: 'Files uploaded successfully',
				content: {
					'application/json': {
						schema: { $ref: '#/components/schemas/FileUploadResponse' }
					}
				}
			},
			400: {
				description: 'Bad request - invalid file or no file uploaded',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								statusCode: {
									type: 'number',
									example: 400
								},
								statusMessage: {
									type: 'string',
									example: 'File exceeds maximum size of 5MB'
								}
							}
						}
					}
				}
			},
			413: {
				description: 'File too large',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								statusCode: {
									type: 'number',
									example: 413
								},
								statusMessage: {
									type: 'string',
									example: 'File size exceeds limit'
								}
							}
						}
					}
				}
			},
			500: {
				description: 'Server error during upload',
				content: {
					'application/json': {
						schema: {
							type: 'object',
							properties: {
								statusCode: {
									type: 'number',
									example: 500
								},
								statusMessage: {
									type: 'string',
									example: 'Failed to upload file'
								}
							}
						}
					}
				}
			}
		}
	}
});