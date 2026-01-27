import dgram from 'node:dgram';

const CLIENT_CODES = {
  civilio: 'g8eULU5uY6u1ZQSuGTUeDQABLgArt2yOTDKJ0AB1Y13GYCHt6Hkj7Q0qsUGWtRqS'
} as const;

export default defineNitroPlugin((app) => {
  const PORT = 5534; // Shared port between client and server
  const server = dgram.createSocket('udp4');

  server.on('error', (err) => {
    console.error(`Discovery Server Error: ${err.stack}`);
    server.close();
  });

  server.on('message', (msg, rinfo) => {
    const json = msg.toString();
    const { c } = JSON.parse(json);

    // Check if the client is looking for this specific service
    if (c === `DISCOVER=${CLIENT_CODES.civilio}`) {
      Logger.info(`Discovery request from ${rinfo.address}:${rinfo.port}`);
      const { publicOrigin, compatibilityDate } = useRuntimeConfig();
      const response = JSON.stringify({
        baseUrl: `${publicOrigin}/api`,
        compatibilityDate,
        nodeName: 'Main-Backend',
      });

      server.send(response, rinfo.port, rinfo.address);
    }
  });

  server.on('listening', () => {
    const address = server.address();
    app.hooks.hook('close', () => {
      server.close(() => {
        Logger.info(`UDP Discovery stopped on ${address.address}:${address.port}`);
      });
    })
    Logger.info(`UDP Discovery listening on ${address.address}:${address.port}`);
  });

  // Bind to 0.0.0.0 to listen on all network interfaces
  server.bind(PORT);
});