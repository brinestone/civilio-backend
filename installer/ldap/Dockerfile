FROM osixia/openldap:latest

COPY ./startup.sh /docker-entrypoint-initdb.d/01-setup-overlays.sh

RUN chmod +x /docker-entrypoint-initdb.d/01-setup-overlays.sh