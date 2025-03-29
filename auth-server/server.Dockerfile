FROM oven/bun:1

WORKDIR /server
COPY bun.lock package.json /server/
RUN bun install --production --frozen-lockfile
COPY . .

ENV DB_URL=
ENV PORT=9000
ENV BETTER_AUTH_URL=http://localhost:${PORT}/api
ENV BETTER_AUTH_SECRET=1znoE0PRS6jIO0m6oDBkes0zGfLskVNZ

USER bun
EXPOSE ${PORT}/tcp

ENTRYPOINT [ "bun", "run", "index.ts" ]