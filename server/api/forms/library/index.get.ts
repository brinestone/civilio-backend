import { defineEventHandler } from "h3";
import { defineRouteMeta } from "nitro";
import { provideDb } from "~/utils/db";
import { getDeviceId, requireAuth } from "~/utils/helpers/auth";
import { getLibraryItems } from "~/utils/helpers/library";

export default defineEventHandler({
	onRequest: [requireAuth],
	handler: async event => {
		const deviceId = getDeviceId(event);
		const db = provideDb();
		return await getLibraryItems(db, deviceId);
	}
});

defineRouteMeta({
	openAPI: {
		operationId: 'findLibraryItems',
		tags: ['Forms'],
		summary: 'Lookup form items library',
		security: [{ ApiKeyAuth: [] }],
		$global: {
			components: {
				schemas: {
					// 1. SHARED BASE: Define the common fields here
					LibraryItemBase: {
						type: 'object',
						required: ['id', 'type'],
						properties: {
							id: { type: 'string', format: 'uuid' },
							type: { type: 'string' },
							tags: { type: 'array', items: { $ref: '#/components/schemas/Tag' } }
						}
					},

					// 2. CONCRETE TYPES: Combine the base with unique fields
					NoteLibraryItem: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/LibraryItemBase' },
							{
								type: 'object',
								properties: {
									type: { type: 'string', enum: ['note'] },
									config: { $ref: '#/components/schemas/NoteItemConfig' }
								}
							}
						]
					},
					FieldLibraryItem: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/LibraryItemBase' },
							{
								type: 'object',
								properties: {
									type: { type: 'string', enum: ['field'] },
									config: { $ref: '#/components/schemas/FieldItemConfig' }
								}
							}
						]
					},
					ImageLibraryItem: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/LibraryItemBase' },
							{
								type: 'object',
								properties: {
									type: { type: 'string', enum: ['image'] },
									config: { $ref: '#/components/schemas/ImageItemConfig' }
								}
							}
						]
					},
					GroupLibraryItem: {
						type: 'object',
						additionalProperties: false,
						allOf: [
							{ $ref: '#/components/schemas/LibraryItemBase' },
							{
								type: 'object',
								properties: {
									type: { type: 'string', enum: ['group'] },
									config: { $ref: '#/components/schemas/GroupItemConfig' }
								}
							}
						]
					},

					// 3. THE DISCRIMINATOR: The union type for the API response
					LibraryItem: {
						type: 'object',
						discriminator: {
							propertyName: 'type',
							mapping: {
								'note': '#/components/schemas/NoteLibraryItem',
								'field': '#/components/schemas/FieldLibraryItem',
								'image': '#/components/schemas/ImageLibraryItem',
								'group': '#/components/schemas/GroupLibraryItem'
							}
						},
						oneOf: [
							{ $ref: '#/components/schemas/NoteLibraryItem' },
							{ $ref: '#/components/schemas/FieldLibraryItem' },
							{ $ref: '#/components/schemas/ImageLibraryItem' },
							{ $ref: '#/components/schemas/GroupLibraryItem' }
						]
					}
				}
			}
		},
		responses: {
			200: {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: 'array',
							items: { $ref: '#/components/schemas/LibraryItem' }
						}
					}
				}
			}
		}
	}
});