import Logger from '~/utils/logger';
import { definePlugin } from 'nitro'
import { requestLogger } from '~/utils/logging';

export default definePlugin((nitroApp) => {
  // Add request logging middleware
  nitroApp.hooks.hook('request', (event) => {
    requestLogger(event.req, event.req);
  });

  // Add error logging
  nitroApp.hooks.hook('error', (error, { event }) => {
    Logger.error({
      message: error.message,
      url: event?.req.url,
      method: event?.req.method,
      stack: error.stack,
    });
  });

});