import { defineNitroPlugin } from 'nitropack/runtime';

export default defineNitroPlugin((nitroApp) => {
  // Add request logging middleware
  nitroApp.hooks.hook('request', (event) => {
    requestLogger(event.node.req, event.node.res);
  });

  // Add error logging
  nitroApp.hooks.hook('error', (error, { event }) => {
    Logger.error({
      message: error.message,
      url: event?.node.req.url,
      method: event?.node.req.method,
      stack: error.stack,
    });
  });

});