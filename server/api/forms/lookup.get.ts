defineRouteMeta({
  openAPI: {
    tags: ['Forms'],
    summary: 'Lookup form definitions',
    description: 'Lookup all form definitions',
  }
});

const handler = async () => {
	return await lookupForms();
};
export default defineEventHandler(handler);