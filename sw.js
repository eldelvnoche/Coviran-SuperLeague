/* Service worker de la Superliga Covirán: permite instalar la web como app.
   Siempre intenta la red primero (para ver los resultados al momento)
   y solo usa la copia guardada si no hay conexión. */
var CACHE="superliga-v6";
var BASE=["./","index.html","styles.css","app.js","comunidad.js","avisos.js","logo.svg","favicon.png","icon-192.png","icon-app-192.png","icon-app-512.png","manifest.json"];
self.addEventListener("install",function(e){e.waitUntil(caches.open(CACHE).then(function(c){return c.addAll(BASE)}).catch(function(){}));self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(caches.keys().then(function(ks){return Promise.all(ks.filter(function(k){return k!==CACHE}).map(function(k){return caches.delete(k)}))}).then(function(){return self.clients.claim()}))});
self.addEventListener("fetch",function(e){
var r=e.request,u=new URL(r.url);
if(r.method!=="GET"||u.origin!==location.origin||/admin\.html$/.test(u.pathname)||/\.(mp4|mov|webm)$/i.test(u.pathname))return;
var key=u.origin+u.pathname;
e.respondWith(fetch(r).then(function(res){if(res&&res.ok){var cp=res.clone();caches.open(CACHE).then(function(c){c.put(key,cp)})}return res})
.catch(function(){return caches.match(key).then(function(m){return m||caches.match("index.html")})}))});
/* notificaciones push: las envía la función "enviar-push" de Supabase */
self.addEventListener("push",function(e){var d={};try{d=e.data?e.data.json():{}}catch(x){}
var t=String(d.titulo||"Superliga Covirán").slice(0,80);
e.waitUntil(self.registration.showNotification(t,{body:String(d.cuerpo||"").slice(0,200),icon:"icon-192.png",badge:"favicon.png",tag:String(d.tag||"sl").slice(0,40),data:{url:String(d.url||"./").slice(0,80)}}))});
self.addEventListener("notificationclick",function(e){e.notification.close();
var sc=self.registration.scope,u=new URL((e.notification.data&&e.notification.data.url)||"./",sc).href;
if(u.indexOf(sc)!==0)u=sc;
e.waitUntil(clients.matchAll({type:"window",includeUncontrolled:true}).then(function(L){
for(var i=0;i<L.length;i++){if(L[i].url.indexOf(sc)===0&&"focus" in L[i]){if(L[i].navigate)L[i].navigate(u);return L[i].focus()}}
return clients.openWindow(u)}))});
