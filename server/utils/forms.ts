import { eq, sql } from "drizzle-orm";

export async function formExistsByName(name: string) {
  const db = provideDb();
  const result = await db.execute<{ exists: boolean }>(sql`
    SELECT EXISTS(SELECT 1
                  FROM ${formDefinitions}
                  WHERE ${eq(formDefinitions.name, name)}) AS "exists"
  `);
  return result.rows[0].exists;
}

export async function findFormSubmissionData(index: number, form: string, version?: string) {
  const db = provideDb();

  let result = {} as Record<string, any>;
  let queryResult = await db.execute<{ t: string }>(sql`
    SELECT DISTINCT t.table_name::TEXT as t
    FROM information_schema.tables t
    WHERE t.table_schema = ${form};
  `);

  const tableNames = queryResult.rows.map(row => row.t);
  for (const tableName of tableNames) {
    // language=PostgreSQL
    const queryResult = await db.execute<{ data: Record<string, unknown> }>(sql`
      SELECT revisions.get_version_data(${form}, ${index}, ${tableName},
                                        ${version || null}, ${false}) as data
    `);
    const row = queryResult.rows[0]?.data;
    if (!row) continue;
    result = { ...result, ...row };
  }
  return result;
}

export async function findFormDefinitions() {
  const db = provideDb();
  return await db.query.formDefinitions.findMany({
    columns: {
      name: true,
    },
    with: {
      sections: {
        columns: {
          relevance: true,
          key: true
        },
        with: {
          fields: true
        }
      }
    }
  });
}