import { defineRouteMeta } from "nitro"
import { defineCachedHandler } from 'nitro/cache'

defineRouteMeta({
  openAPI: {
    tags: ['Internal']
  }
})
export default defineCachedHandler(event => {
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