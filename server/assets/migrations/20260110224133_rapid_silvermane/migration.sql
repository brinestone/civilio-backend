CREATE VIEW "civilio"."vw_db_columns" AS (SELECT c.column_name,
                   c.data_type,
                   c.table_name,
                   CAST(c.table_schema as text) as form
            FROM information_schema.columns c
        );