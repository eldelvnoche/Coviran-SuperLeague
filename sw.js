var C="superliga-v1";
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(x){return x!==C}).map(function(x){return caches.delete(x)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){
var q=e.request;if(q.method!=="GET")return;
var u=new URL(q.url);if(u.origin!==location.origin||/admin\.html$/.test(u.pathname))return;
var key=u.origin+u.pathname;
e.respondWith(fetch(q).then(function(r){if(r&&r.ok){var c=r.clone();caches.open(C).then(function(x){x.put(key,c)})}return r}).catch(function(){return caches.match(key).then(function(m){return m||caches.match(u.origin+u.pathname.replace(/[^\/]*$/,""))})}))});
