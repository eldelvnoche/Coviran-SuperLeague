/* Avisos: notificaciones push en el móvil u ordenador cuando hay resultados, crónicas, golazos o comentarios.
   Funciona con el service worker (sw.js) y las funciones de Supabase (ver supabase.sql, parte AVISOS). */
(function(){
var LS="sl-avisos",SW="serviceWorker" in navigator&&"PushManager" in window&&"Notification" in window;
var PREFS={resultados:true,cronicas:true,comentarios:true},ENVIANDO=false;
var ETQ=[["resultados","Resultados, jornadas y Champions"],["cronicas","Crónicas nuevas y golazos"],["comentarios","Comentarios en mis crónicas (solo si has entrado con tu usuario)"]];

function ok(){return typeof dbOk==="function"&&dbOk()&&CFG.push&&typeof CFG.push.vapidPublic==="string"&&CFG.push.vapidPublic.length>60}
function ios(){return/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==="MacIntel"&&navigator.maxTouchPoints>1)}
function instalada(){return window.matchMedia&&matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}
function clave(b64){var p="=".repeat((4-b64.length%4)%4),s=atob((b64+p).replace(/-/g,"+").replace(/_/g,"/")),a=new Uint8Array(s.length);for(var i=0;i<s.length;i++)a[i]=s.charCodeAt(i);return a}
function b64u(buf){var s="",a=new Uint8Array(buf);for(var i=0;i<a.length;i++)s+=String.fromCharCode(a[i]);return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"")}
function guardar(){try{localStorage.setItem(LS,JSON.stringify(PREFS))}catch(e){}}
function leer(){try{var p=JSON.parse(localStorage.getItem(LS)||"null");if(p)for(var k in PREFS)if(typeof p[k]==="boolean")PREFS[k]=p[k]}catch(e){}}
function rpc(n,body){return window.Com&&Com.rpc?Com.rpc(n,body):fetch(CFG.supabase.url.replace(/\/+$/,"")+"/rest/v1/rpc/"+n,{method:"POST",headers:{apikey:CFG.supabase.anonKey,"Content-Type":"application/json"},body:JSON.stringify(body)}).then(function(r){if(!r.ok)throw new Error("rpc");return null})}
function reg(){return Promise.race([navigator.serviceWorker.ready,new Promise(function(_,ko){setTimeout(function(){ko(new Error("La app aún no está lista. Recarga la página e inténtalo de nuevo."))},5000)})])}
function suscripcion(){return reg().then(function(r){return r.pushManager.getSubscription()})}
function enviar(sub){var j=sub.toJSON(),k=j.keys||{};return rpc("suscribir",{p_endpoint:j.endpoint,p_p256dh:k.p256dh,p_auth:k.auth,p_prefs:PREFS})}

function di(t,c){var m=document.getElementById("avm");if(m){m.textContent=t;m.className="fmsg "+(c||"")}}
function checks(){return '<div class="frm" style="margin-top:10px">'+ETQ.map(function(e){return '<label class="ck"><input type="checkbox" data-av="'+e[0]+'"'+(PREFS[e[0]]?" checked":"")+'><span>'+e[1]+'</span></label>'}).join("")+'</div>'}
function hoja(){
var h='<div class="mj">Avisos</div><h3 class="fti">Notificaciones</h3>';
if(!ok())return h+'<p class="tt">Los avisos todavía no están activados en esta web.</p>';
if(!SW){
if(ios()&&!instalada())return h+'<p class="tt">En iPhone y iPad los avisos solo funcionan con la app instalada. Pulsa <b>Compartir</b> y luego <b>Añadir a pantalla de inicio</b>, abre la app desde ahí y vuelve a este botón.</p>';
return h+'<p class="tt">Este navegador no admite notificaciones.</p>'}
if(Notification.permission==="denied")return h+'<p class="tt">Has bloqueado las notificaciones de esta web. Actívalas desde los ajustes del navegador (icono del candado junto a la dirección) y vuelve aquí.</p>';
return h+'<p class="tt">Te avisamos al momento cuando se sube un resultado, un partido de la Champions, una crónica o un golazo.</p><div id="avbox"><p class="tt">Comprobando…</p></div><p class="fmsg" id="avm" role="status"></p>'}
function pintar(){var b=document.getElementById("avbox");if(!b)return;
suscripcion().then(function(sub){
b.innerHTML=sub?'<p class="fmsg ok">✓ Avisos activados en este dispositivo.</p>'+checks()+'<div class="s2b" style="margin-top:12px"><button class="cta" type="button" data-avc="guardar">Guardar</button><button class="lnk" type="button" data-avc="quitar">Desactivar</button></div>'
:checks()+'<div class="s2b" style="margin-top:12px"><button class="cta" type="button" data-avc="activar">Activar avisos</button></div>'}).catch(function(){b.innerHTML='<p class="fmsg bad">No se ha podido comprobar el estado.</p>'})}
function leerChecks(){document.querySelectorAll("[data-av]").forEach(function(c){PREFS[c.getAttribute("data-av")]=c.checked});guardar()}

function activar(){if(ENVIANDO)return;ENVIANDO=true;leerChecks();di("Pidiendo permiso…");
Notification.requestPermission().then(function(p){if(p!=="granted")throw new Error("No has dado permiso para las notificaciones.");return reg()})
.then(function(r){return r.pushManager.subscribe({userVisibleOnly:true,applicationServerKey:clave(CFG.push.vapidPublic)})})
.then(function(sub){return enviar(sub)}).then(function(){di("¡Listo! Ya recibirás los avisos.","ok");pintar()})
.catch(function(e){di(e&&e.message&&!/rpc/.test(e.message)?e.message:"No se ha podido activar. Inténtalo otra vez.","bad")}).then(function(){ENVIANDO=false})}
function guardarPrefs(){if(ENVIANDO)return;ENVIANDO=true;leerChecks();di("Guardando…");
suscripcion().then(function(sub){if(!sub)throw new Error("Primero activa los avisos.");return enviar(sub)}).then(function(){di("Guardado.","ok")}).catch(function(e){di(e.message||"No se ha podido guardar.","bad")}).then(function(){ENVIANDO=false})}
function quitar(){if(ENVIANDO)return;ENVIANDO=true;
suscripcion().then(function(sub){if(!sub)return;var ep=sub.endpoint;return sub.unsubscribe().then(function(){return rpc("desuscribir",{p_endpoint:ep}).catch(function(){})})}).then(function(){di("Avisos desactivados.","ok");pintar()}).catch(function(){di("No se ha podido desactivar.","bad")}).then(function(){ENVIANDO=false})}

document.addEventListener("click",function(e){var b=e.target.closest?e.target.closest("[data-avc],#avisos"):null;if(!b)return;
if(b.id==="avisos"){openSheet({type:"b"},false);setTimeout(pintar,0);return}
var a=b.getAttribute("data-avc");if(a==="activar")activar();else if(a==="guardar")guardarPrefs();else if(a==="quitar")quitar()});

function boton(){var b=document.getElementById("avisos");if(!b)return;
b.hidden=!ok();
b.innerHTML='<svg viewBox="0 0 24 24"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 20a2 2 0 0 0 4 0"/></svg><span>Avisos</span>';
b.setAttribute("aria-label","Notificaciones")}

window.Avisos={
init:function(){leer();boton()},
sheet:hoja,
/* al entrar con tu usuario, el dispositivo ya suscrito se asocia a tu jugador para avisarte de los comentarios */
sync:function(){if(!SW||!ok()||Notification.permission!=="granted")return;suscripcion().then(function(sub){if(sub)enviar(sub)}).catch(function(){})}};
if(window.CFGOK)Avisos.init();else document.addEventListener("sl:config",function(){Avisos.init()},{once:true});
})();
