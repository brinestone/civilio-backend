FROM postgis/postgis:17-3.5-alpine

COPY migrations/*.sql /docker-entrypoint-initdb.d