/* Comunidad: cuentas de jugador, publicaciones en Crónicas, comentarios y fotos.
   Todo va contra Supabase (ver supabase.sql, parte FASE 3). Sin conexión o sin sesión, la web se ve igual, solo en lectura. */
(function(){
var KEY="sl-sesion",DOM="liga.example.com",PATH=/^[a-z]{2}\/[A-Za-z0-9_.-]{1,80}$/;
var S=null,POSTS=[],CM={},OPEN={},LISTO=false,ENVIANDO=false;

function on(){return typeof dbOk==="function"&&dbOk()}
function base(){return CFG.supabase.url.replace(/\/+$/,"")}
function cab(tok,extra){var h={apikey:CFG.supabase.anonKey};if(tok)h.Authorization="Bearer "+tok;else if(/^eyJ/.test(CFG.supabase.anonKey))h.Authorization="Bearer "+CFG.supabase.anonKey;
for(var k in extra)h[k]=extra[k];return h}
function msg(r,t){var m="";try{var j=JSON.parse(t);m=j.message||j.msg||j.error_description||""}catch(e){}
if(/Demasiad/.test(m))return m;
if(r.status===400&&/invalid|credentials/i.test(m))return"Usuario o contraseña incorrectos.";
if(r.status===401||r.status===403)return"Tu sesión ha caducado. Vuelve a entrar.";
if(r.status===422&&/password/i.test(m))return"La contraseña nueva no es válida (mínimo 8 caracteres y distinta de la anterior).";
if(r.status===429)return"Demasiados intentos. Espera un minuto.";
return"No se ha podido completar. Inténtalo otra vez."}
function api(method,path,body,o){o=o||{};
return fetch(base()+path,{method:method,headers:cab(o.tok===undefined?(S&&S.tk):o.tok,o.h||{"Content-Type":"application/json"}),body:o.raw?body:(body==null?undefined:JSON.stringify(body))}).then(function(r){
return r.text().then(function(t){if(!r.ok){var e=new Error(msg(r,t));e.status=r.status;throw e}return t?JSON.parse(t):null})})}

/* ---------- sesión ---------- */
function guardar(){try{if(S)localStorage.setItem(KEY,JSON.stringify(S));else localStorage.removeItem(KEY)}catch(e){}}
function leer(){try{var s=JSON.parse(localStorage.getItem(KEY)||"null");if(s&&s.tk&&s.rt&&T[s.id])S=s}catch(e){S=null}}
function refrescar(){if(!S)return Promise.resolve();
return api("POST","/auth/v1/token?grant_type=refresh_token",{refresh_token:S.rt},{tok:null}).then(function(d){S.tk=d.access_token;S.rt=d.refresh_token;S.exp=Date.now()+d.expires_in*1000;guardar()}).catch(function(){S=null;guardar()})}
function vigente(){if(!S)return Promise.resolve();return S.exp-Date.now()<90000?refrescar():Promise.resolve()}
function entrar(usuario,pass){var u=String(usuario||"").toLowerCase().replace(/[^a-z0-9]/g,"");
return api("POST","/auth/v1/token?grant_type=password",{email:u+"@"+DOM,password:pass},{tok:null}).then(function(d){
var tk=d.access_token;
return api("GET","/rest/v1/jugadores?select=id,usuario,pass_cambiada&user_id=eq."+encodeURIComponent(d.user.id),null,{tok:tk}).then(function(a){
if(!a||!a[0]||!T[a[0].id])throw new Error("Esta cuenta no está unida a ningún jugador. Avisa al organizador.");
S={tk:tk,rt:d.refresh_token,exp:Date.now()+d.expires_in*1000,id:a[0].id,usuario:a[0].usuario,pc:!!a[0].pass_cambiada};guardar()})})}
function salir(){var tk=S&&S.tk;S=null;guardar();if(tk)api("POST","/auth/v1/logout",{},{tok:tk}).catch(function(){})}

/* ---------- datos ---------- */
function cargar(){if(!on())return Promise.resolve();
var a=api("GET","/rest/v1/publicaciones?select=id,creado,autor,titulo,texto,foto,video,jornada&order=creado.desc&limit=60",null,{tok:null}).then(function(r){POSTS=Array.isArray(r)?r.filter(function(x){return T[x.autor]}):[]});
var b=api("GET","/rest/v1/comentarios?select=id,creado,autor,ref,texto,foto,video&order=creado.asc&limit=1000",null,{tok:null}).then(function(r){CM={};(Array.isArray(r)?r:[]).forEach(function(c){if(!T[c.autor])return;(CM[c.ref]=CM[c.ref]||[]).push(c)})});
return Promise.all([a,b]).then(function(){LISTO=true}).catch(function(){LISTO=false})}
function fotoUrl(p){return typeof p==="string"&&PATH.test(p)?base()+"/storage/v1/object/public/fotos-liga/"+p:""}
function videoUrl(p){return typeof p==="string"&&PATH.test(p)?base()+"/storage/v1/object/public/videos-liga/"+p:""}
function cuando(iso){var d=new Date(iso);if(isNaN(d))return"";return d.toLocaleDateString("es-ES",{day:"numeric",month:"short"})+" · "+d.toLocaleTimeString("es-ES",{hour:"2-digit",minute:"2-digit"})}

/* reduce la foto a 1600 px y la pasa a JPEG antes de subirla (menos datos y sin metadatos del móvil) */
function preparar(file){return new Promise(function(ok,ko){
if(!file||!/^image\/(jpeg|png|webp)$/.test(file.type))return ko(new Error("La foto debe ser JPG, PNG o WebP."));
if(window.createImageBitmap){createImageBitmap(file).then(function(bm){dibujar(bm,bm.width,bm.height,ok,ko)}).catch(function(){viaImagen(file,ok,ko)});return}
viaImagen(file,ok,ko)})}
function dibujar(src,w,h,ok,ko){var m=1600,k=Math.min(1,m/Math.max(w,h)),c=document.createElement("canvas");
c.width=Math.max(1,Math.round(w*k));c.height=Math.max(1,Math.round(h*k));
var x=c.getContext("2d");x.fillStyle="#000";x.fillRect(0,0,c.width,c.height);x.drawImage(src,0,0,c.width,c.height);
c.toBlob(function(b){b&&b.size<=3000000?ok(b):ko(new Error("La foto es demasiado grande."))},"image/jpeg",.82)}
function viaImagen(file,ok,ko){var im=new Image(),u=URL.createObjectURL(file);
im.onload=function(){URL.revokeObjectURL(u);var m=1600,k=Math.min(1,m/Math.max(im.width,im.height)),c=document.createElement("canvas");
c.width=Math.max(1,Math.round(im.width*k));c.height=Math.max(1,Math.round(im.height*k));
var x=c.getContext("2d");x.fillStyle="#000";x.fillRect(0,0,c.width,c.height);x.drawImage(im,0,0,c.width,c.height);
c.toBlob(function(b){b&&b.size<=3000000?ok(b):ko(new Error("La foto es demasiado grande."))},"image/jpeg",.82)};
im.onerror=function(){URL.revokeObjectURL(u);ko(new Error("No se ha podido leer la foto."))};im.src=u}
function subir(file){if(!file)return Promise.resolve(null);
return preparar(file).then(function(b){var p=S.id+"/"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)+".jpg";
return api("POST","/storage/v1/object/fotos-liga/"+p,b,{raw:true,h:{"Content-Type":"image/jpeg","x-upsert":"false"}}).then(function(){return p})})}
/* el vídeo se sube tal cual (recortarlo en el móvil ya lo hace el jugador): solo se valida el tipo y el tamaño */
var EXTV={"video/mp4":"mp4","video/webm":"webm","video/quicktime":"mov"};
function subirVideo(file){if(!file)return Promise.resolve(null);
var ext=EXTV[file.type];
if(!ext)return Promise.reject(new Error("El vídeo debe ser MP4, WebM o MOV."));
if(file.size>52428800)return Promise.reject(new Error("El vídeo no puede pasar de 50 MB (es el máximo del plan gratis de Supabase). Recorta el clip o bájale la calidad de grabación en el móvil."));
var p=S.id+"/"+Date.now().toString(36)+Math.random().toString(36).slice(2,7)+"."+ext;
return api("POST","/storage/v1/object/videos-liga/"+p,file,{raw:true,h:{"Content-Type":file.type,"x-upsert":"false"}}).then(function(){return p})}
/* una publicación o comentario lleva foto O vídeo, nunca los dos */
function subirMedia(file){if(!file)return Promise.resolve({foto:null,video:null});
return /^video\//.test(file.type)?subirVideo(file).then(function(p){return{foto:null,video:p}}):subir(file).then(function(p){return{foto:p,video:null}})}

/* ---------- pintar Crónicas (junta las del admin y las de los jugadores) ---------- */
function persona(id){return T[id]?'<span class="by">'+logo(id,"xs")+'<span>'+esc(T[id].p)+' · '+esc(T[id].t)+'</span></span>':''}
function comentarios(ref){
var L=CM[ref]||[],ab=!!OPEN[ref];
var h='<div class="cm"><button class="cmb" type="button" data-com="cmt" data-ref="'+ref+'" aria-expanded="'+ab+'">💬 Comentarios <b>'+L.length+'</b></button>';
if(ab){h+='<div class="cml">'+(L.length?L.map(function(c){var f=fotoUrl(c.foto),v=videoUrl(c.video),mio=S&&S.id===c.autor;
return '<div class="cmi"><div class="cmh">'+persona(c.autor)+'<span class="cmt">'+esc(cuando(c.creado))+'</span>'+(mio?'<button class="cmx" type="button" data-com="delc" data-id="'+(+c.id)+'" aria-label="Borrar mi comentario">✕</button>':'')+'</div><p>'+esc(c.texto).replace(/\n/g,"<br>")+'</p>'+(f?'<img class="cmf" loading="lazy" decoding="async" alt="Foto de '+esc(T[c.autor].p)+'" src="'+f+'">':'')+(v?'<video class="cmf" controls preload="metadata" src="'+v+'"></video>':'')+'</div>'}).join(""):'<p class="tt">Todavía no hay comentarios.</p>');
h+=S?'<form class="cmform" data-ref="'+ref+'"><textarea name="t" maxlength="600" rows="2" required placeholder="Escribe un comentario…" aria-label="Comentario"></textarea><div class="cmact"><label class="fbtn">📷🎥 Foto o vídeo<input type="file" name="f" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" hidden></label><span class="tt" data-fn></span><button class="cta" type="submit">Comentar</button></div><p class="fmsg" role="status"></p></form>':'<p class="tt">Los jugadores pueden <button class="lk" type="button" data-com="login">entrar</button> para comentar.</p>';
h+='</div>'}
return h+'</div>'}
function cronicas(){
var it=[];
PO.forEach(function(p){var ts=+p.id||Date.parse(p.fecha)||0;it.push({ts:ts,k:"c",p:p})});
if(!ARCH)POSTS.forEach(function(p){it.push({ts:Date.parse(p.creado)||0,k:"p",p:p})});
it.sort(function(a,b){return b.ts-a.ts});
return it}
function pintar(){
var el=$("comp");
if(el){if(ARCH||!on())el.innerHTML="";else el.innerHTML=S?'<div class="compb"><div><b>Hola, '+esc(T[S.id].p)+'</b><span class="tt">Cuéntanos tu jornada o comenta las crónicas de los demás.</span></div><button class="cta" type="button" data-com="nueva">✍️ Escribir crónica</button></div>':'<div class="compb"><div><b>¿Eres jugador de la liga?</b><span class="tt">Entra con tu usuario para publicar crónicas con fotos y comentar.</span></div><button class="cta" type="button" data-com="login">Entrar</button></div>'}
var box=$("po"),L=cronicas();
box.innerHTML=L.map(function(x){var p=x.p;
if(x.k==="c"){var meta=(p.jornada?"Jornada "+(+p.jornada):"")+(p.jornada&&p.fecha?", ":"")+(p.fecha?fmt(p.fecha):"");
var im=okFoto(p.foto)?'<img class="pf" alt="" loading="lazy" decoding="async" src="'+p.foto+'">':'';
var body=String(p.texto||"").split(/\n{2,}/).map(function(z){return '<p>'+esc(z).replace(/\n/g,"<br>")+'</p>'}).join("");
return '<article class="po"><div class="mt">'+esc(meta)+'</div><h3>'+esc(p.titulo)+'</h3>'+im+body+(/^[0-9]{1,16}$/.test(String(p.id))?comentarios("c:"+p.id):'')+'</article>'}
var f=fotoUrl(p.foto),v=videoUrl(p.video),mio=S&&S.id===p.autor;
return '<article class="po comu"><div class="mt">Comunidad'+(p.jornada?" · Jornada "+(+p.jornada):"")+' · '+esc(cuando(p.creado))+'</div><h3>'+esc(p.titulo)+'</h3><div class="pau">'+persona(p.autor)+(mio?'<button class="cmx" type="button" data-com="delp" data-id="'+(+p.id)+'">Borrar</button>':'')+'</div>'+
(f?'<img class="pf" alt="Foto de la crónica de '+esc(T[p.autor].p)+'" loading="lazy" decoding="async" src="'+f+'">':'')+
(v?'<video class="pf" controls preload="metadata" src="'+v+'"></video>':'')+
String(p.texto).split(/\n{2,}/).map(function(z){return '<p>'+esc(z).replace(/\n/g,"<br>")+'</p>'}).join("")+comentarios("p:"+p.id)+'</article>'}).join("")||'<div class="empty">Aún no hay crónicas.</div>'}

/* ---------- cabecera ---------- */
function cuenta(){var b=$("cuenta");if(!b)return;
if(!on()||!(LISTO||S)){b.hidden=true;return}
b.hidden=false;
b.innerHTML=S?'<svg viewBox="0 0 24 24"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-7 8-7s8 3 8 7"/></svg><span>'+esc(T[S.id].p)+'</span>':'<svg viewBox="0 0 24 24"><path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4M10 17l5-5-5-5M15 12H3"/></svg><span>Entrar</span>';
b.setAttribute("aria-label",S?"Mi cuenta, "+T[S.id].p:"Entrar con tu usuario de jugador")}

/* ---------- hojas: entrar, mi cuenta, nueva crónica ---------- */
function hoja(tipo){
if(tipo==="l")return '<div class="mj">Zona de jugadores</div><h3 class="fti">Entrar</h3><p class="tt">Usa el usuario y la contraseña que te pasó el organizador.</p><form id="loginf" class="frm" novalidate><label>Usuario<input name="u" autocomplete="username" autocapitalize="none" spellcheck="false" maxlength="20" required></label><label>Contraseña<input name="p" type="password" autocomplete="current-password" maxlength="72" required></label><button class="cta" type="submit">Entrar</button><p class="fmsg" id="lm" role="status"></p></form>';
if(!S)return hoja("l");
if(tipo==="a")return '<div class="mj">Mi cuenta</div><h3 class="fti">'+esc(T[S.id].p)+' · '+esc(T[S.id].t)+'</h3>'+(S.pc?'':'<p class="fmsg bad">Por seguridad, cambia ahora la contraseña temporal.</p>')+'<p class="tt">Usuario: <b>'+esc(S.usuario)+'</b></p><form id="passf" class="frm" novalidate><label>Contraseña nueva (mínimo 8 caracteres)<input name="n" type="password" autocomplete="new-password" minlength="8" maxlength="72" required></label><label>Repite la contraseña nueva<input name="n2" type="password" autocomplete="new-password" minlength="8" maxlength="72" required></label><button class="cta" type="submit">Cambiar contraseña</button><p class="fmsg" id="pm" role="status"></p></form><p><button class="lnk" type="button" data-com="logout">Cerrar sesión</button></p>';
if(tipo==="n"){var o='<option value="">Sin jornada</option>';for(var i=1;i<=J.length;i++)o+='<option value="'+i+'">Jornada '+i+'</option>';
return '<div class="mj">Nueva crónica</div><h3 class="fti">Cuenta tu jornada</h3><form id="postf" class="frm" novalidate><label>Título<input name="t" maxlength="90" required></label><label>Jornada (opcional)<select name="j">'+o+'</select></label><label>Texto<textarea name="x" maxlength="4000" rows="7" required></textarea></label><label class="fbtn">📷🎥 Añadir una foto o un vídeo<input type="file" name="f" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" hidden></label><span class="tt" data-fn></span><p class="tt">El vídeo, hasta 50 MB (MP4, WebM o MOV). Si no entra, graba con menos calidad o recorta el clip.</p><button class="cta" type="submit">Publicar</button><p class="fmsg" id="nm" role="status"></p></form>'}
return""}
function di(id,t,c){var m=$(id);if(m){m.textContent=t;m.className="fmsg "+(c||"")}}
function fin(){ENVIANDO=false}

document.addEventListener("click",function(e){var b=e.target.closest?e.target.closest("[data-com]"):null;if(!b)return;var a=b.getAttribute("data-com");
if(a==="login")openSheet({type:"l"},false);
else if(a==="cuenta"||a==="micuenta")openSheet({type:S?"a":"l"},false);
else if(a==="nueva")openSheet({type:"n"},false);
else if(a==="logout"){salir();closeSheet();cuenta();pintar()}
else if(a==="cmt"){var r=b.getAttribute("data-ref");OPEN[r]=!OPEN[r];pintar()}
else if(a==="delp"||a==="delc"){if(!window.confirm("¿Borrar esto?"))return;var id=+b.getAttribute("data-id");
vigente().then(function(){return api("DELETE","/rest/v1/"+(a==="delp"?"publicaciones":"comentarios")+"?id=eq."+id,null,{h:{"Prefer":"return=minimal"}})}).then(cargar).then(pintar).catch(function(er){window.alert(er.message)})}});
$("cuenta")&&$("cuenta").addEventListener("click",function(){openSheet({type:S?"a":"l"},false)});
document.addEventListener("change",function(e){var i=e.target;if(i.type!=="file")return;var f=i.files&&i.files[0],s=i.closest("form").querySelector("[data-fn]");if(s)s.textContent=f?"📎 "+f.name:""});

document.addEventListener("submit",function(e){var f=e.target;
if(f.id==="loginf"){e.preventDefault();if(ENVIANDO)return;var u=f.elements.u.value,p=f.elements.p.value;if(!u||!p){di("lm","Escribe usuario y contraseña.","bad");return}
ENVIANDO=true;di("lm","Entrando…");
entrar(u,p).then(function(){cuenta();pintar();if(window.Avisos)Avisos.sync();if(!S.pc){openSheet({type:"a"},false)}else closeSheet()}).catch(function(er){di("lm",er.message,"bad")}).then(fin)}
else if(f.id==="passf"){e.preventDefault();if(ENVIANDO)return;var n=f.elements.n.value;
if(n.length<8){di("pm","Mínimo 8 caracteres.","bad");return}if(n!==f.elements.n2.value){di("pm","Las dos contraseñas no coinciden.","bad");return}
ENVIANDO=true;di("pm","Guardando…");
vigente().then(function(){return api("PUT","/auth/v1/user",{password:n})}).then(function(){return api("POST","/rest/v1/rpc/marcar_pass_cambiada",{})}).then(function(){S.pc=true;guardar();di("pm","Contraseña cambiada.","ok");f.reset();setTimeout(closeSheet,900)}).catch(function(er){di("pm",er.message,"bad")}).then(fin)}
else if(f.id==="postf"){e.preventDefault();if(ENVIANDO||!S)return;var t=f.elements.t.value.trim(),x=f.elements.x.value.trim(),j=f.elements.j.value;
if(t.length<3||!x){di("nm","Escribe un título (mínimo 3 letras) y el texto.","bad");return}
ENVIANDO=true;di("nm","Publicando…");var file=f.elements.f.files[0];
vigente().then(function(){return subirMedia(file)}).then(function(m){return api("POST","/rest/v1/publicaciones",{autor:S.id,titulo:t,texto:x,foto:m.foto,video:m.video,jornada:j?+j:null},{h:{"Content-Type":"application/json","Prefer":"return=minimal"}})})
.then(cargar).then(function(){pintar();closeSheet()}).catch(function(er){di("nm",er.message,"bad")}).then(fin)}
else if(f.classList&&f.classList.contains("cmform")){e.preventDefault();if(ENVIANDO||!S)return;var ref=f.getAttribute("data-ref"),tx=f.elements.t.value.trim(),m=f.querySelector(".fmsg");
if(!tx)return;ENVIANDO=true;m.textContent="Enviando…";m.className="fmsg";var fl=f.elements.f.files[0];
vigente().then(function(){return subirMedia(fl)}).then(function(md){return api("POST","/rest/v1/comentarios",{autor:S.id,ref:ref,texto:tx,foto:md.foto,video:md.video},{h:{"Content-Type":"application/json","Prefer":"return=minimal"}})})
.then(cargar).then(pintar).catch(function(er){m.textContent=er.message;m.className="fmsg bad"}).then(fin)}});

/* ---------- arranque ---------- */
window.Com={
init:function(){if(!on()){cuenta();return}leer();cuenta();cargar().then(function(){cuenta();pintar()});if(S&&S.exp-Date.now()<90000)refrescar().then(cuenta)},
sheet:hoja,
yo:function(){return S&&S.id},
api:function(m,p,b,o){return vigente().then(function(){return api(m,p,b,o)})},
rpc:function(n,b){return vigente().then(function(){return api("POST","/rest/v1/rpc/"+n,b)})},
preparar:preparar,
render:pintar,
activo:function(){return on()}};
/* arranca cuando la configuración ya está cargada (sin depender del orden en que lleguen los archivos) */
if(window.CFGOK)Com.init();else document.addEventListener("sl:config",function(){Com.init()},{once:true});
window.renderPosts=function(){if(window.Com&&on()&&(LISTO||S)&&!ARCH)pintar();else pintarBase()};
/* respaldo sin conexión: solo las crónicas del admin */
function pintarBase(){var el=$("comp");if(el)el.innerHTML="";var L=cronicas().filter(function(x){return x.k==="c"});
$("po").innerHTML=L.map(function(x){var p=x.p,meta=(p.jornada?"Jornada "+(+p.jornada):"")+(p.jornada&&p.fecha?", ":"")+(p.fecha?fmt(p.fecha):"");
var im=okFoto(p.foto)?'<img class="pf" alt="" loading="lazy" decoding="async" src="'+p.foto+'">':'';
return '<article class="po"><div class="mt">'+esc(meta)+'</div><h3>'+esc(p.titulo)+'</h3>'+im+String(p.texto||"").split(/\n{2,}/).map(function(z){return '<p>'+esc(z).replace(/\n/g,"<br>")+'</p>'}).join("")+'</article>'}).join("")||'<div class="empty">Aún no hay crónicas.</div>'}
})();
