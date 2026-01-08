defineRouteMeta({
  openAPI: {
    tags: ['Forms'],
    summary: 'Get form definitions',
    description: 'Get all defined form definitions',
  }
});

const handler = async () => {
  return await findFormDefinitions();
};
export default defineEventHandler(handler);