defineRouteMeta({
	openAPI: {
		tags: ['Forms'],
		summary: 'Lookup form definitions',
		description: 'Lookup all form definitions',
		$global: {
			components: {
				schemas: {
					FormLookup: {
						type: "object",
						required: ["slug", "label", "createdAt", "updatedAt"],
						properties: {
							slug: { type: "string" },
							logo: { type: "string", nullable: true },
							label: { type: "string" },
							description: { type: "string", nullable: true },
							createdBy: { type: "string", nullable: true },
							createdAt: { type: "string", format: "date-time" },
							updatedAt: { type: "string", format: "date-time" }
						}
					}
				}
			}
		},
		operationId: 'lookupFormDefinitions',
		responses: {
			'200': {
				description: 'OK',
				content: {
					'application/json': {
						schema: {
							type: "array",
							items: {
								$ref: '#/components/schemas/FormLookup'
							}
						}
					}
				}
			}
		}
	}
});

const handler = async () => {
	return await lookupForms();
};
export default defineEventHandler(handler);