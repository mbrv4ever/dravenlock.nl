const CACHE = "dravetable-v1";
const ASSETS = ["./", "./index.html", "./manifest.webmanifest",
                "./icons/icon-192.png", "./icons/icon-512.png"];
self.addEventListener("install", function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(ASSETS); }));
  self.skipWaiting();
});
self.addEventListener("activate", function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.map(function(k){ return k===CACHE ? null : caches.delete(k); }));
  }));
  self.clients.claim();
});
self.addEventListener("fetch", function(e){
  if(e.request.method !== "GET") return;
  e.respondWith(
    caches.match(e.request).then(function(r){
      return r || fetch(e.request).then(function(resp){
        var cp = resp.clone();
        caches.open(CACHE).then(function(c){ try{ c.put(e.request, cp); }catch(_){} });
        return resp;
      }).catch(function(){ return r; });
    })
  );
});
