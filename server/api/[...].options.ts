import { defineRouteMeta, defineCachedEventHandler } from "nitropack/runtime"

defineRouteMeta({
  openAPI: {
    tags: ['Internal']
  }
})
export default defineCachedEventHandler(event => {
  // handleCors(event, {
  //   origin: '*',
  //   methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE',],
  //   allowHeaders: ['Content-Type', 'Authorization'],
  //   // credentials: true
  // })

  // if (event.method === 'OPTIONS') {
  //   return null;
  // }
})