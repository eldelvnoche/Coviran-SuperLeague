/* Directos: los jugadores emiten su partido con su móvil (Twitch, Kick o YouTube) y la web lo muestra dentro de la liga.
   Datos en Supabase (tabla directos, ver supabase.sql, parte DIRECTOS). */
(function(){
var URLOK=[/^https:\/\/(?:www\.|m\.)?youtube\.com\/(?:watch\?v=|live\/)([A-Za-z0-9_-]{11})(?:[&?][A-Za-z0-9_=&.%-]*)?$/,/^https:\/\/youtu\.be\/([A-Za-z0-9_-]{11})(?:[?&][A-Za-z0-9_=&.%-]*)?$/];
var LISTA=false,DIR=[],SUB=0,ABIERTO={},ENVIANDO=false,TIMER=null,CANAL="";
var HORAS=4;

function on(){return typeof dbOk==="function"&&dbOk()}
function yo(){return window.Com&&Com.yo?Com.yo():null}
function api(m,p,b,o){return window.Com&&Com.api?Com.api(m,p,b,o):Promise.reject(new Error("sin conexión"))}

/* de un enlace saca la plataforma y la dirección del reproductor; null si no es de una plataforma admitida */
function embed(u){u=String(u||"");var m;
for(var i=0;i<URLOK.length;i++){if((m=u.match(URLOK[i])))return{p:"YouTube",src:"https://www.youtube-nocookie.com/embed/"+m[1]+"?autoplay=1&rel=0"}}
if((m=u.match(/^https:\/\/(?:www\.)?twitch\.tv\/([A-Za-z0-9_-]{3,25})\/?$/)))return{p:"Twitch",src:"https://player.twitch.tv/?channel="+encodeURIComponent(m[1])+"&parent="+encodeURIComponent(location.hostname)+"&autoplay=true&muted=false"};
if((m=u.match(/^https:\/\/(?:www\.)?kick\.com\/([A-Za-z0-9_-]{3,25})\/?$/)))return{p:"Kick",src:"https://player.kick.com/"+encodeURIComponent(m[1])};
return null}
function hace(iso){var s=Math.max(0,(Date.now()-Date.parse(iso))/1000);if(s<90)return"ahora mismo";if(s<3600)return"hace "+Math.round(s/60)+" min";return"hace "+Math.floor(s/3600)+" h"}

function cargar(){if(!on()||!window.Com)return Promise.resolve();
var desde=new Date(Date.now()-HORAS*3600*1000).toISOString();
return api("GET","/rest/v1/directos?select=id,creado,autor,titulo,url&estado=eq.en_directo&creado=gte."+encodeURIComponent(desde)+"&order=creado.desc&limit=20",null,{tok:null}).then(function(r){
DIR=(Array.isArray(r)?r:[]).filter(function(d){return T[d.autor]&&embed(d.url)});LISTA=true;var c=$("vch");if(c)c.hidden=false}).catch(function(){})}
function refrescar(){return cargar().then(function(){portada();if(!$("v6").hidden)pintar();var b=$("vlive");if(b)b.textContent=DIR.length?"🔴 "+DIR.length:""})}

/* ---------- aviso en la portada ---------- */
function portada(){var el=$("live");if(!el)return;
if(!DIR.length||(typeof ARCH!=="undefined"&&ARCH)){el.innerHTML="";return}
el.innerHTML=DIR.slice(0,3).map(function(d){var e=embed(d.url);
return '<button class="livb" type="button" data-dir-go="'+(+d.id)+'"><span class="live-dot"></span><span><b>EN DIRECTO · '+esc(T[d.autor].p)+'</b><em>'+esc(d.titulo)+' · '+esc(e.p)+'</em></span><span class="livv">Ver ▶</span></button>'}).join("")}

/* ---------- pestaña Vídeo: Golazos | Directos ---------- */
function sub(n){SUB=n;var g=$("vg"),d=$("dir");if(!g||!d)return;g.hidden=n!==0;d.hidden=n!==1;
document.querySelectorAll("#vch [data-vs]").forEach(function(b){b.setAttribute("aria-pressed",String(+b.getAttribute("data-vs")===n))});
if(n===1){pintar();refrescar()}}
function tarjeta(d){var e=embed(d.url),abierto=!!ABIERTO[d.id],mio=yo()===d.autor;
return '<article class="dcard" id="d-'+(+d.id)+'"><div class="dh"><span class="live-dot"></span><b>'+esc(T[d.autor].p)+'</b><span class="tt">'+esc(T[d.autor].t)+' · '+esc(e.p)+' · '+hace(d.creado)+'</span></div><h3>'+esc(d.titulo)+'</h3>'+
(abierto?'<div class="dplay"><iframe src="'+e.src+'" title="Directo de '+esc(T[d.autor].p)+'" loading="lazy" allow="autoplay; encrypted-media; picture-in-picture; fullscreen" allowfullscreen referrerpolicy="strict-origin-when-cross-origin"></iframe></div>':'<button class="cta" type="button" data-dir-ver="'+(+d.id)+'">▶ Ver directo</button>')+
'<div class="dact"><a class="lnk" href="'+esc(d.url)+'" target="_blank" rel="noopener noreferrer">Abrir en '+esc(e.p)+' ↗</a>'+(mio?'<button class="lnk" type="button" data-dir-fin="'+(+d.id)+'">Terminar mi directo</button>':'')+'</div></article>'}
var GUIA=[
["Antes de empezar (solo la primera vez)","<ol><li>Crea tu cuenta gratis en <b>Twitch</b> (twitch.tv). Elige un nombre de usuario corto, será tu canal.</li><li>Instala la app <b>Streamlabs</b> (gratis) en tu móvil, Android o iPhone, e inicia sesión con tu cuenta de Twitch.</li><li>En esta web, pulsa <b>Emitir mi partido</b> y guarda tu canal una vez. Ya no tendrás que pegar nada más.</li></ol>"],
["Cada partido: emitir en 4 pasos","<ol><li>Abre <b>Streamlabs</b> y elige la opción de emitir un <b>juego</b> (suele llamarse «Stream your game»). Acepta el permiso para <b>capturar la pantalla</b> y empieza.</li><li>Abre <b>eFootball</b> y juega: la emisión sigue en segundo plano.</li><li>Vuelve a esta web, pulsa <b>Emitir mi partido</b>, elige tu partido y toca <b>Estoy en directo</b>. Los demás reciben un aviso.</li><li>Cuando acabes, termina la emisión en Streamlabs y pulsa <b>Terminar mi directo</b> aquí.</li></ol><p class=\"tt\">Los nombres de los menús pueden cambiar según la versión de la app. Si no ves una opción, busca «Emitir», «Stream» o «Go live».</p>"],
["En iPhone","<p>iOS pide un paso extra: al emitir, aparece una ventana de <b>Grabación de pantalla</b>. Elige <b>Streamlabs</b> y pulsa <b>Iniciar emisión</b>. Después abre eFootball. Para parar, toca la barra roja de arriba o vuelve a Streamlabs.</p>"],
["Consejos para que salga bien","<ul><li>Usa <b>wifi</b> si puedes: emitir gasta bastantes datos móviles.</li><li>Activa <b>No molestar</b> para que no salgan notificaciones tuyas (mensajes, llamadas) en pantalla.</li><li>En Android 10 o superior se puede emitir el sonido del juego; en otros móviles puede no oírse.</li><li>Calidad: 720p y 30 fps es suficiente para ver el partido y gasta menos.</li><li>Tu emisión es pública en Twitch: no enseñes datos personales.</li><li>También vale <b>Kick</b> (kick.com) o <b>YouTube</b>: en YouTube hay que pegar el enlace del directo cada vez.</li></ul>"]];
function pintar(){var el=$("dir");if(!el||SUB!==1)return;
if(!on()||!LISTA){el.innerHTML='<div class="card soft"><div class="empty">Los directos todavía no están activados en esta web.</div></div>';return}
var mi=yo(),miDir=DIR.filter(function(d){return d.autor===mi})[0];
var h='<div class="compb"><div><b>'+(DIR.length?DIR.length+' en directo ahora':'Nadie en directo ahora')+'</b><span class="tt">'+(DIR.length?'Toca «Ver directo» para entrar.':'Cuando un jugador emita su partido aparecerá aquí.')+'</span></div>'+
(mi?(miDir?'<button class="cta" type="button" data-dir-fin="'+(+miDir.id)+'">■ Terminar mi directo</button>':'<button class="cta" type="button" data-dir="emitir">📡 Emitir mi partido</button>'):'<button class="cta" type="button" data-com="login">Entrar para emitir</button>')+'</div>';
h+=DIR.map(tarjeta).join("");
h+='<h2 class="sec-h">Cómo emitir tu partido <small>desde el móvil, gratis</small></h2><div class="guia">'+GUIA.map(function(g,i){return '<details'+(i===0?' open':'')+'><summary>'+g[0]+'</summary>'+g[1]+'</details>'}).join("")+'</div>';
el.innerHTML=h}

/* ---------- hoja: emitir mi partido ---------- */
function misPartidos(){var id=yo(),o=[];if(!id||!T[id])return o;
allM().filter(function(x){return(x.h===id||x.a===id)&&!x.v}).slice(0,6).forEach(function(x){o.push("Jornada "+(x.j+1)+" · "+T[x.h].t+" vs "+T[x.a].t)});
try{var X=uclTies(table());["po1","po2","sf1","sf2","final"].forEach(function(k){var t=X[k];if(t&&T[t.a]&&T[t.b]&&(t.a===id||t.b===id)&&!t.g)o.push("Champions · "+uclLbl(k)+" ("+(t.i?"vuelta":"ida")+") · "+T[t.a].t+" vs "+T[t.b].t)})}catch(e){}
return o}
function hoja(){var id=yo();if(!id)return window.Com?Com.sheet("l"):"";
var ps=misPartidos(),op=ps.map(function(p,i){return '<option value="'+i+'">'+esc(p)+'</option>'}).join("");
return '<div class="mj">Directos</div><h3 class="fti">Emitir mi partido</h3><p class="tt">Antes de pulsar el botón, <b>empieza la emisión en la app del móvil</b> (mira la guía en la pestaña Directos).</p>'+
'<form id="dirf" class="frm" novalidate><label>Partido<select name="p"><option value="">Otro evento (lo escribo abajo)</option>'+op+'</select></label>'+
'<label>Título del directo<input name="t" maxlength="90" placeholder="Ej.: Amistoso contra Husam" required></label>'+
'<label>Tu canal o el enlace del directo<input name="u" type="url" inputmode="url" maxlength="120" placeholder="https://www.twitch.tv/tunombre" value="'+esc(CANAL)+'" required></label>'+
'<label class="ck"><input type="checkbox" name="g" checked><span>Guardar este canal (solo Twitch o Kick) para no escribirlo la próxima vez.</span></label>'+
'<button class="cta" type="submit">📡 Estoy en directo</button><p class="fmsg" id="dm" role="status"></p></form>'}
function di(t,c){var m=$("dm");if(m){m.textContent=t;m.className="fmsg "+(c||"")}}

document.addEventListener("change",function(e){var s=e.target;if(!s.form||s.form.id!=="dirf"||s.name!=="p")return;var i=s.value,ps=misPartidos();if(i!==""&&ps[+i])s.form.elements.t.value=ps[+i].slice(0,90)});
document.addEventListener("submit",function(e){var f=e.target;if(f.id!=="dirf")return;e.preventDefault();if(ENVIANDO||!yo())return;
var t=f.elements.t.value.trim(),u=f.elements.u.value.trim();
if(t.length<3){di("Escribe un título (mínimo 3 letras).","bad");return}
if(!embed(u)){di("Usa el enlace de tu canal de Twitch (twitch.tv/tunombre) o Kick (kick.com/tunombre), o el enlace del directo de YouTube.","bad");return}
ENVIANDO=true;di("Publicando…");
api("POST","/rest/v1/directos",{autor:yo(),titulo:t,url:u},{h:{"Content-Type":"application/json","Prefer":"return=minimal"}})
.then(function(){if(f.elements.g.checked&&/(twitch\.tv|kick\.com)\//.test(u)){CANAL=u;return window.Com.rpc("guardar_canal",{p_url:u}).catch(function(){})}})
.then(refrescar).then(function(){closeSheet();tab(6);sub(1)}).catch(function(er){di(er.message||"No se ha podido publicar.","bad")}).then(function(){ENVIANDO=false})});

document.addEventListener("click",function(e){var b=e.target.closest?e.target.closest("[data-vs],[data-dir],[data-dir-ver],[data-dir-fin],[data-dir-go]"):null;if(!b)return;
if(b.hasAttribute("data-vs")){sub(+b.getAttribute("data-vs"));return}
if(b.getAttribute("data-dir")==="emitir"){openSheet({type:"s"},false);return}
if(b.hasAttribute("data-dir-ver")){ABIERTO[+b.getAttribute("data-dir-ver")]=true;pintar();return}
if(b.hasAttribute("data-dir-go")){var id=+b.getAttribute("data-dir-go");ABIERTO[id]=true;tab(6);sub(1);setTimeout(function(){var c=$("d-"+id);if(c&&c.scrollIntoView)c.scrollIntoView({block:"center"})},150);return}
if(b.hasAttribute("data-dir-fin")){var i=+b.getAttribute("data-dir-fin");
window.Com.rpc("finalizar_directo",{p_id:i}).then(refrescar).catch(function(er){window.alert(er.message)})}});

function hash(){if((location.hash||"")==="#directos"){tab(6,true);sub(1)}}
window.addEventListener("hashchange",hash);

window.Dir={
init:function(){if(!on())return;
if(window.Com&&Com.rpc){/* canal guardado */
var id=yo();if(id)api("GET","/rest/v1/jugadores?select=canal&id=eq."+id,null,{}).then(function(r){if(r&&r[0]&&r[0].canal)CANAL=r[0].canal}).catch(function(){})}
refrescar();if(location.hash==="#directos")hash();
clearInterval(TIMER);TIMER=setInterval(function(){if(!document.hidden)refrescar()},60000)},
sheet:hoja,
onTab:function(){},
refrescar:refrescar};
if(window.CFGOK)setTimeout(Dir.init,0);else document.addEventListener("sl:config",function(){setTimeout(Dir.init,50)},{once:true});
})();
