/* Service worker de la Superliga Covirán: permite instalar la web como app.
   Siempre intenta la red primero (para ver los resultados al momento)
   y solo usa la copia guardada si no hay conexión. */
var CACHE="superliga-v1";
var BASE=["./","index.html","logo.svg","favicon.png","icon-192.png","icon-app-192.png","icon-app-512.png","manifest.json"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(BASE)}).catch(function(){}));self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){
var r=e.request,u=new URL(r.url);
if(r.method!=="GET"||u.origin!==location.origin||/admin\.html$/.test(u.pathname)||/\.(mp4|mov|webm)$/i.test(u.pathname))return;
var key=u.origin+u.pathname;
e.respondWith(fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(key,cp)})}return res})
.catch(function(){return caches.match(key).then(function(m){return m||caches.match("index.html")})}))});
