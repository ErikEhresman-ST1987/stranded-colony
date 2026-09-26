const CACHE_NAME="stranded-colony-shell-gameplay-16b";
const APP_SHELL=["./index.html","./styles.css?v=16","./app-v10e.js","./js/rendering/colony-board.js","./vendor/pixi.min.js","./manifest.json","./icon.svg","./assets/backgrounds/temperate-frontier-crash-site.webp","./assets/calypso-wreck-test.webp","./assets/emergency-shelter.PNG","./assets/survivors/survivor-field-suit.webp"];
self.addEventListener("install",event=>{event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()))});
self.addEventListener("activate",event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith("stranded-colony-shell-")&&key!==CACHE_NAME).map(key=>caches.delete(key)))).then(()=>self.clients.claim()))});
self.addEventListener("fetch",event=>{
  if(event.request.method!=="GET")return;
  const url=new URL(event.request.url);
  if(url.origin!==self.location.origin)return;
  const isNavigation=event.request.mode==="navigate";
  event.respondWith(
    fetch(event.request).then(response=>{
      if(response&&response.ok){const copy=response.clone();caches.open(CACHE_NAME).then(cache=>cache.put(isNavigation?"./index.html":event.request,copy))}
      return response
    }).catch(async()=>{
      if(isNavigation)return (await caches.match("./index.html"))||Response.error();
      return (await caches.match(event.request))||Response.error()
    })
  )
});