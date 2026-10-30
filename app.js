var IMG={"ch":"fotos/base/ch.jpg","dm":"fotos/base/dm.jpg","rb":"fotos/base/rb.jpg","th":"fotos/base/th.jpg","md":"fotos/base/md.jpg","hs":"fotos/base/hs.jpg","zk":"fotos/base/zk.jpg","bd":"fotos/base/bd.jpg","ej":"fotos/base/ej.jpg","fd":"fotos/base/fd.jpg","hi":"fotos/base/hi.jpg"};
var T={
dm:{p:"Demian",t:"R. Madrid"},rb:{p:"Reda",t:"Barça"},
th:{p:"Taha",t:"Arsenal"},md:{p:"Mouad",t:"Inter Milan"},
hs:{p:"Husam",t:"PSG"},zk:{p:"Zaka",t:"AS FAR"},
bd:{p:"Badr",t:"Boca Juniors"},ej:{p:"Elouejdi",t:"Japón"},
fd:{p:"Fahd",t:"IRT"},hi:{p:"Hicham",t:"España"},ch:{p:"El Niño",t:"Real Betis"}};
var V1=["bd-dm,hs-rb,ej-md,fd-th,hi-zk|ch",
"rb-ch,bd-md,th-hs,ej-zk,hi-fd|dm",
"dm-md,th-ch,bd-zk,hi-hs,ej-fd|rb",
"th-rb,dm-zk,hi-ch,bd-fd,ej-hs|md",
"md-zk,hi-rb,dm-fd,ej-ch,bd-hs|th",
"hi-th,md-fd,ej-rb,dm-hs,bd-ch|zk",
"zk-fd,ej-th,md-hs,bd-rb,dm-ch|hi",
"ej-hi,zk-hs,bd-th,md-ch,dm-rb|fd",
"fd-hs,bd-hi,zk-ch,dm-th,md-rb|ej",
"bd-ej,fd-ch,dm-hi,zk-rb,md-th|hs",
"hs-ch,dm-ej,fd-rb,md-hi,zk-th|bd"];
var J=[];
function parse(s,flip){var a=s.split("|");return{rest:a[1],ms:a[0].split(",").map(function(x){var p=x.split("-");return flip?[p[1],p[0]]:[p[0],p[1]]})}}
V1.forEach(function(s){J.push(parse(s,false))});
V1.forEach(function(s){J.push(parse(s,true))});
var NMATCH=J.reduce(function(s,r){return s+r.ms.length},0);
/* Estadísticas que da eFootball al acabar el partido, en el mismo orden que su pantalla */
var SK=[["pos","Posesión"],["tir","Tiros"],["tpu","Tiros a puerta"],["fal","Faltas"],["fdj","Fueras de juego"],["cor","Córners"],["tli","Tiros libres"],["pas","Pases"],["pac","Pases completados"],["cen","Centros"],["int","Intercepciones"],["ent","Entradas"],["par","Paradas"]];
var R={},ST={},MVP={},UCL={},PL={},PO=[],GO=[],CD={ganador:null,nominados:[]},cur=0,fecha="";
function $(i){return document.getElementById(i)}
/* escudo de reserva si falla el subido desde el admin (el evento "error" no sube, por eso se escucha en captura) */
document.addEventListener("error",function(e){var t=e.target;if(t&&t.tagName==="IMG"&&t.dataset.fb&&!t.dataset.done){t.dataset.done="1";t.src=IMG[t.dataset.fb]||"logo.svg"}},true);
function k(j,h,a){return(j+1)+":"+h+":"+a}
function esc(t){return String(t==null?"":t).replace(/[&<>"']/g,function(c){return{"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function okFoto(f){return typeof f==="string"&&/^fotos\/([A-Za-z0-9_-]+\/)?[A-Za-z0-9_.-]+(\?v=\d+)?$/.test(f)}
function n0(x){x=+x;return isFinite(x)&&x>=0?x:0}
function fx(v,d){return(+v).toFixed(d).replace(".",",")}
function lsGet(n){try{return localStorage.getItem(n)}catch(e){return null}}
function lsSet(n,v){try{localStorage.setItem(n,v)}catch(e){}}
function crest(id){var e=(PL[id]||{}).escudo;return okFoto(e)?e:IMG[id]||"logo.svg"}
/* "esc": escudo subido desde el admin (PNG transparente, casi cuadrado): se enseña entero, sin placa */
function logo(id,c){return '<img class="lg'+(c?" "+c:"")+(okFoto((PL[id]||{}).escudo)?" esc":"")+'" alt="" aria-hidden="true" src="'+crest(id)+'" data-fb="'+id+'" decoding="async">'}
function nmp(id){return '<span class="nm">'+T[id].t+'</span><span class="tt">'+T[id].p+'</span>'}

/* ---------- datos ---------- */
function allM(){var o=[];J.forEach(function(r,j){r.ms.forEach(function(m){var key=k(j,m[0],m[1]);o.push({j:j,h:m[0],a:m[1],key:key,v:R[key],st:ST[key]})})});return o}
function mByKey(key){return allM().filter(function(x){return x.key===key})[0]}
function persp(x,id){var me=x.h===id,gf=me?x.v[0]:x.v[1],gc=me?x.v[1]:x.v[0];return{gf:gf,gc:gc,r:gf>gc?"w":gf<gc?"l":"d",op:me?x.a:x.h,home:me}}
function doneJ(j){return J[j].ms.every(function(m){return R[k(j,m[0],m[1])]})}
function lastDone(){var n=0;for(var j=0;j<J.length;j++){if(doneJ(j))n=j+1;else break}return n}
function nPlayed(){return Object.keys(R).length}
/* maxJ (opcional): clasificación contando solo hasta esa jornada (0 = la primera) */
function table(maxJ){
var S={};Object.keys(T).forEach(function(i){S[i]={id:i,pj:0,pg:0,pe:0,pp:0,gf:0,gc:0,f:[]}});
allM().forEach(function(x){var v=x.v;if(!v||(maxJ!=null&&x.j>maxJ))return;
var H=S[x.h],A=S[x.a];H.pj++;A.pj++;H.gf+=v[0];H.gc+=v[1];A.gf+=v[1];A.gc+=v[0];
if(v[0]>v[1]){H.pg++;A.pp++;H.f.push("w");A.f.push("l")}else if(v[0]<v[1]){A.pg++;H.pp++;H.f.push("l");A.f.push("w")}else{H.pe++;A.pe++;H.f.push("d");A.f.push("d")}});
var L=Object.keys(S).map(function(i){var r=S[i];r.dg=r.gf-r.gc;r.pts=r.pg*3+r.pe;r.best=bestW(r.f);r.now=nowS(r.f);return r});
L.sort(function(a,b){return b.pts-a.pts||b.dg-a.dg||b.gf-a.gf||T[a.id].t.localeCompare(T[b.id].t)});
return L}
function bestW(f){var b=0,c=0;f.forEach(function(x){c=x==="w"?c+1:0;if(c>b)b=c});return b}
function nowS(f){if(!f.length)return{t:"",n:0};var l=f[f.length-1],n=0;for(var i=f.length-1;i>=0&&f[i]===l;i--)n++;return{t:l,n:n}}
function nowTxt(s){if(!s.n)return"Aún no ha jugado";
if(s.n===1)return"Viene de "+{w:"ganar",d:"empatar",l:"perder"}[s.t];
return s.n+" "+{w:"victorias seguidas",d:"empates seguidos",l:"derrotas seguidas"}[s.t]}
function agg(){var A={};Object.keys(T).forEach(function(i){A[i]={n:0,s:{}};SK.forEach(function(q){A[i].s[q[0]]=0})});
allM().forEach(function(x){if(!x.v||!x.st)return;[["l",x.h],["v",x.a]].forEach(function(p){var d=x.st[p[0]];if(!d)return;var a=A[p[1]];a.n++;SK.forEach(function(q){a.s[q[0]]+=n0(d[q[0]])})})});
return A}
function dgt(r){return r.dg>0?"+"+r.dg:""+r.dg}
function dots(f){return f.slice(-5).map(function(x){return '<i class="'+x+'"></i>'}).join("")||'<span class="tt">Sin partidos</span>'}
function sc(x){return T[x.h].t+" "+x.v[0]+"-"+x.v[1]+" "+T[x.a].t}

/* ---------- insignias ---------- */
function badges(L,A){
var B=[],P=L.filter(function(r){return r.pj>0});if(!P.length)return B;
function top(arr,f,low){var best=null,ids=[];arr.forEach(function(r){var v=f(r);if(v==null||!isFinite(v))return;if(best===null||(low?v<best:v>best)){best=v;ids=[r.id]}else if(v===best)ids.push(r.id)});return{v:best,ids:ids}}
B.push(nPlayed()>=NMATCH?{e:"🏆",t:"Campeón",d:"Ganador de la liga",ids:[L[0].id]}:{e:"👑",t:"Líder",d:"Primero en la clasificación",ids:[L[0].id]});
var t=top(P,function(r){return r.gf/r.pj});B.push({e:"⚽",t:"Mejor ataque",d:fx(t.v,1)+" goles por partido",ids:t.ids});
t=top(P,function(r){return r.gc/r.pj},true);B.push({e:"🧱",t:"Mejor defensa",d:fx(t.v,1)+" goles encajados por partido",ids:t.ids});
var big=null;allM().forEach(function(x){if(!x.v)return;var m=Math.abs(x.v[0]-x.v[1]);if(m>0&&(!big||m>big.m))big={m:m,x:x}});
if(big)B.push({e:"💥",t:"Mayor goleada",d:sc(big.x)+" (jornada "+(big.x.j+1)+")",ids:[big.x.v[0]>big.x.v[1]?big.x.h:big.x.a]});
var hot=P.filter(function(r){return r.now.t==="w"&&r.now.n>=3}).map(function(r){return r.id});
B.push({e:"🔥",t:"En racha",d:"3 o más victorias seguidas",ids:hot});
var inv=P.filter(function(r){return r.pj>=3&&r.pp===0}).map(function(r){return r.id});
B.push({e:"🛡️",t:"Invicto",d:"Sin perder tras 3 o más partidos",ids:inv});
var S=P.filter(function(r){return A[r.id].n>0});
t=top(S,function(r){return A[r.id].s.par||null});B.push({e:"🧤",t:"Manos de oro",d:t.v?t.v+" paradas en total":"Más paradas en total",ids:t.ids});
t=top(S,function(r){return A[r.id].s.tpu/A[r.id].n});B.push({e:"🎯",t:"Francotirador",d:t.v!=null?fx(t.v,1)+" tiros a puerta por partido":"Más tiros a puerta por partido",ids:t.ids});
t=top(S,function(r){return A[r.id].s.pas?A[r.id].s.pac/A[r.id].s.pas:null});B.push({e:"🎼",t:"Tiki-taka",d:t.v!=null?Math.round(t.v*100)+"% de pases completados":"Mejor precisión de pase",ids:t.ids});
t=top(S,function(r){return A[r.id].s.int/A[r.id].n||null});B.push({e:"🕵️",t:"Ladrón de balones",d:t.v!=null?fx(t.v,1)+" intercepciones por partido":"Más intercepciones por partido",ids:t.ids});
return B}
function mvpCount(id){return Object.keys(MVP).filter(function(j){return MVP[j]===id}).length}

/* ---------- portada ---------- */
function renderProg(){
var n=nPlayed(),p=$("prog");p.hidden=false;
var c=cur+1;$("progt").textContent=(n>=NMATCH?"Liga terminada":"Jornada "+c+" de "+J.length)+" · "+n+"/"+NMATCH+" partidos";
$("progb").style.width=Math.round(n/NMATCH*100)+"%"}
function renderAviso(L){
var n=lastDone(),el=$("aviso");
if(!n||+(lsGet("sl-aviso")||0)>=n){el.innerHTML="";return}
var ms=J[n-1].ms.map(function(m){var key=k(n-1,m[0],m[1]);return{h:m[0],a:m[1],v:R[key],j:n-1}});
var big=ms.slice().sort(function(a,b){return Math.abs(b.v[0]-b.v[1])-Math.abs(a.v[0]-a.v[1])})[0];
var li=['<li>👑 Líder: '+T[L[0].id].t+' ('+T[L[0].id].p+'), '+L[0].pts+' pts</li>'];
if(big&&big.v[0]!==big.v[1])li.push('<li>💥 Mayor goleada: '+sc(big)+'</li>');
if(MVP[n]&&T[MVP[n]])li.push('<li>⭐ MVP: '+T[MVP[n]].p+' ('+T[MVP[n]].t+')</li>');
li.push(n<J.length?'<li>➡️ Ya se puede jugar la jornada '+(n+1)+'</li>':'<li>🏆 ¡Liga terminada! Turno de la Mercadona Champions League</li>');
el.innerHTML='<div class="aviso" role="status"><span class="k">Novedad</span><b>Jornada '+n+' completada</b><ul>'+li.join("")+'</ul><button class="x" id="avx" aria-label="Cerrar aviso">✕</button></div>';
$("avx").addEventListener("click",function(){lsSet("sl-aviso",String(n));el.innerHTML=""})}
function renderNext(){
var el=$("next");if(nPlayed()>=NMATCH){el.innerHTML="";return}
var r=J[cur],pend=r.ms.filter(function(m){return!R[k(cur,m[0],m[1])]}),done=r.ms.length-pend.length;
var h='<div class="card"><div class="nh">Próximos partidos<span>Jornada '+(cur+1)+' · '+done+'/'+r.ms.length+' jugados</span></div>'+
pend.map(function(m){return '<div class="nx"><span class="tm h">'+logo(m[0],"sm")+'<span>'+nmp(m[0])+'</span></span><span class="vs">vs</span><span class="tm a">'+logo(m[1],"sm")+'<span>'+nmp(m[1])+'</span></span></div>'}).join("")+
'<div class="nf">'+(r.rest?'Descansa: <b>'+T[r.rest].t+'</b> ('+T[r.rest].p+'). ':'')+'Sin fecha fija: se juegan cuando estéis disponibles.</div></div>';
el.innerHTML=h}
function renderTable(L){
var played=L.some(function(r){return r.pj>0}),pod=$("pod");
if(played){pod.hidden=false;
pod.innerHTML=[1,0,2].map(function(i){var r=L[i];
return '<button class="pc art p'+(i+1)+'" data-t="'+r.id+'"'+artA(r.id)+'><span class="pn">'+(i+1)+'º</span>'+logo(r.id)+'<span><span class="nm">'+T[r.id].t+'</span><span class="tt">'+T[r.id].p+'</span></span><span class="big"><span class="cu">'+r.pts+'</span><small>pts</small></span></button>'}).join("");
if(nPlayed()){if(!CUT)CUT=performance.now();if(performance.now()-CUT<1200)countUp(pod)}}
else pod.hidden=true;
$("tb").innerHTML=L.map(function(r,i){var c=r.dg>0?"up":r.dg<0?"dn":"";
var ic=(r.now.t==="w"&&r.now.n>=3?"🔥":"")+(mvpCount(r.id)?"⭐":"");
return '<div class="row'+(i<2?" q":i<6?" qp":"")+'"><button class="main art" data-t="'+r.id+'"'+artA(r.id)+' aria-label="Ficha de '+T[r.id].t+'"><span class="ps">'+(i+1)+'</span><span class="tc">'+logo(r.id)+'<span class="tn"><span class="nm">'+T[r.id].t+(ic?'<span class="ic">'+ic+'</span>':'')+'</span><span class="tt">'+T[r.id].p+'</span></span></span><span class="n">'+r.pj+'</span><span class="n">'+r.pg+'</span><span class="n '+c+'">'+dgt(r)+'</span><span class="n pt">'+r.pts+'</span></button></div>'}).join("");}
var STARS='<svg class="stars" viewBox="0 0 64 64" aria-hidden="true"><g fill="none" stroke="#b4b4bf" stroke-width="2"><circle cx="32" cy="32" r="26"/><circle cx="32" cy="32" r="18" stroke-dasharray="3 4"/></g><g fill="#ffe29a"><path d="M32 18l2.4 5 5.4.6-4 3.7 1.1 5.3-4.9-2.7-4.9 2.7 1.1-5.3-4-3.7 5.4-.6z"/><path d="M18 36l1.4 2.9 3.2.4-2.4 2.2.7 3.1-2.9-1.6-2.9 1.6.7-3.1-2.4-2.2 3.2-.4z"/><path d="M46 36l1.4 2.9 3.2.4-2.4 2.2.7 3.1-2.9-1.6-2.9 1.6.7-3.1-2.4-2.2 3.2-.4z"/></g></svg>';
function uclWin(t){if(!t||!t.g||t.a==null||t.b==null)return null;if(t.g[0]>t.g[1])return t.a;if(t.g[1]>t.g[0])return t.b;return t.pen===t.a||t.pen===t.b?t.pen:null}
/* ---------- Mercadona Champions League ----------
   Cada eliminatoria se guarda en resultados.json > champions: {a, b, g:[goles a, goles b], pen, fecha, st} */
function legG(x){return Array.isArray(x)&&x.length===2?[n0(x[0]),n0(x[1])]:null}
function okSt(x){return x&&x.l&&x.v?x:null}
/* cada cruce es de ida y vuelta: goles siempre en orden a-b; la ida se juega en casa de "a" y la vuelta en casa de "b". g = global */
function uTie(key,a,b){var t=UCL[key]||{},i=legG(t.i),v=legG(t.v);
return{key:key,a:T[t.a]?t.a:a,b:T[t.b]?t.b:b,i:i,v:v,g:i&&v?[i[0]+v[0],i[1]+v[1]]:null,pen:t.pen,fi:t.fi,fv:t.fv,si:okSt(t.si),sv:okSt(t.sv)}}
function nLegs(t){return(t.i?1:0)+(t.v?1:0)}
var UCR=[["final","Final"],["sf1","Semifinal 1"],["sf2","Semifinal 2"],["po1","Eliminatoria de acceso · 3º contra 6º"],["po2","Eliminatoria de acceso · 4º contra 5º"]];
function uclTies(L){
var any=L.some(function(r){return r.pj>0}),q=L.slice(0,6).map(function(r){return r.id});
var tie=uTie;
var X={};X.po1=tie("po1",any?q[2]:null,any?q[5]:null);X.po2=tie("po2",any?q[3]:null,any?q[4]:null);
X.sf1=tie("sf1",any?q[0]:null,uclWin(X.po2));X.sf2=tie("sf2",any?q[1]:null,uclWin(X.po1));
X.final=tie("final",uclWin(X.sf1),uclWin(X.sf2));X.champ=uclWin(X.final);X.any=any;X.q=q;
X.played=UCR.filter(function(r){return X[r[0]].g}).length;
X.legs=UCR.reduce(function(n,r){return n+nLegs(X[r[0]])},0);return X}
/* el siguiente cruce que falta por jugar, en orden de rondas */
function uclNext(X){var o=["po1","po2","sf1","sf2","final"];for(var i=0;i<o.length;i++){var t=X[o[i]];if(!t.g)return t}return null}
function uclNextLeg(t){return t.i?"vuelta":"ida"}
function uclLbl(k){for(var i=0;i<UCR.length;i++)if(UCR[i][0]===k)return UCR[i][1];return""}
function renderUCL(L){
var X=uclTies(L),done=nPlayed()>=NMATCH,p1=X.po1,p2=X.po2,s1=X.sf1,s2=X.sf2,f=X.final,champ=X.champ,any=X.any,q=X.q;
function side(id,seed,cls){if(!id||!T[id])return '<span class="t '+cls+'"><span class="tbd">?</span><span>Por decidir<em>'+(seed||"")+'</em></span></span>';
var em=seed&&seed.length<=3?seed+" · "+T[id].p:T[id].p;
return '<button class="t '+cls+'" data-t="'+id+'" style="background:none;border:0;padding:0;color:inherit;cursor:pointer">'+logo(id)+'<span>'+T[id].t+'<em>'+em+'</em></span></button>'}
function row(t,s1l,s2l){var w=uclWin(t);
var g=t.g?'<button class="g" data-u="'+t.key+'" style="background:none;border:0;color:inherit;cursor:pointer">'+t.g[0]+'-'+t.g[1]+'<small>'+(t.g[0]===t.g[1]&&w?'pen. '+esc(T[w].t):'global')+'</small></button>':
t.i?'<button class="g" data-u="'+t.key+'" style="background:none;border:0;color:inherit;cursor:pointer">'+t.i[0]+'-'+t.i[1]+'<small>ida</small></button>':'<span class="g" style="color:#b4b4bf;font-size:18px">VS</span>';
var det=t.i?'<span class="det">Ida '+t.i[0]+'-'+t.i[1]+(t.v?' · Vuelta '+t.v[0]+'-'+t.v[1]:' · vuelta pendiente')+'</span>':'';
return '<div class="bm">'+side(t.a,s1l,"h"+(w&&w!==t.a?" lose":""))+g+side(t.b,s2l,"a"+(w&&w!==t.b?" lose":""))+det+'</div>'}
var sub="Todos los cruces se juegan a ida y vuelta y gana el que suma más goles en el global. Los dos primeros de la liga pasan directos a semifinales; del 3º al 6º juegan una eliminatoria de acceso."+(done?"":" Cruces provisionales según la tabla actual.");
var dq=any?'<div class="bl">Clasificados directos</div><div class="dq">'+[q[0],q[1]].map(function(id,i){return '<button data-t="'+id+'">'+logo(id)+'<span>'+T[id].t+'<em>'+(i+1)+'º · '+T[id].p+'</em></span></button>'}).join("")+'</div>':'';
$("ucl").innerHTML='<div class="ucl"><div class="uh">'+STARS+'<span>Cuadro del torneo</span><b>Mercadona<br>Champions League</b><p>'+sub+'</p></div><div class="br">'+dq+
'<div class="bl">Eliminatoria de acceso · 3º contra 6º</div>'+row(p1,"3º","6º")+
'<div class="bl">Eliminatoria de acceso · 4º contra 5º</div>'+row(p2,"4º","5º")+
'<div class="bl">Semifinal 1 · 1º contra ganador 4º-5º</div>'+row(s1,"1º","Ganador 4º-5º")+
'<div class="bl">Semifinal 2 · 2º contra ganador 3º-6º</div>'+row(s2,"2º","Ganador 3º-6º")+
'<div class="bl">Final</div>'+row(f,"Ganador SF1","Ganador SF2")+
(champ?'<div class="champ">'+logo(champ,"sm")+'<span>Campeón: '+T[champ].t+' ('+T[champ].p+')</span></div>':'')+
'</div></div>';
renderUclTab(X);renderUclTeaser(X)}
/* pestaña Champions: campeón, resultados y cuadro */
function renderUclTab(X){
var h='';
if(X.champ){var c=X.champ,lose=X.final.a===c?X.final.b:X.final.a;
h+='<button class="champ1 ucc art" data-t="'+c+'"'+artA(c)+'><span class="k">⭐ Campeón de la Mercadona Champions League</span>'+logo(c)+'<b>'+esc(T[c].p)+'</b><span class="tm2">'+T[c].t+'</span><span class="rec">Final: '+T[X.final.a].t+' '+X.final.g[0]+'-'+X.final.g[1]+' '+T[X.final.b].t+(X.final.g[0]===X.final.g[1]?' (pen.)':'')+'</span></button>'}
var pl=UCR.filter(function(r){return nLegs(X[r[0]])>0});
h+='<h2 class="sec-h">Resultados <small>'+(X.legs?X.legs+' de 10 partidos':'aún sin jugar')+'</small></h2>';
if(pl.length){h+='<div class="card">'+pl.map(function(r){var t=X[r[0]],w=uclWin(t),cl=w?(w===t.a?" w1":" w2"):"",G=t.g||t.i;
return '<button class="mc ucm'+cl+'" data-u="'+t.key+'"><span class="ucr">'+r[1]+(t.g?' · ida y vuelta':' · solo la ida')+'</span><span class="tm h">'+logo(t.a)+nmp(t.a)+'</span><span class="sb"><span class="sc"><b>'+G[0]+'</b><i>:</i><b>'+G[1]+'</b></span><small>'+(t.g?(t.g[0]===t.g[1]&&w?'Pen.: '+esc(T[w].t):'Global'):'Ida')+'</small>'+(t.g?'<em class="tt">'+t.i[0]+'-'+t.i[1]+' · '+t.v[0]+'-'+t.v[1]+'</em>':'')+'</span><span class="tm a">'+logo(t.b)+nmp(t.b)+'</span></button>'}).join("")+'</div>'}
else{var nx=uclNext(X);h+='<div class="card soft"><div class="empty">Todavía no se ha jugado ningún cruce.'+(nx&&T[nx.a]&&T[nx.b]?' Abre el torneo <b>'+T[nx.a].t+' – '+T[nx.b].t+'</b> ('+uclLbl(nx.key).toLowerCase()+', partido de ida).':'')+'</div></div>'}
var nx2=uclNext(X);if(pl.length&&nx2&&T[nx2.a]&&T[nx2.b])h+='<p class="hint">Próximo partido: <b>'+T[nx2.a].t+' – '+T[nx2.b].t+'</b> ('+uclLbl(nx2.key).toLowerCase()+', '+uclNextLeg(nx2)+').</p>';
$("uclr").innerHTML=h}
/* resumen en la portada con enlace a la pestaña */
function renderUclTeaser(X){
var el=$("uclt");if(!X.any){el.innerHTML="";return}
var nx=uclNext(X),tx=X.champ?'Campeón: <b>'+T[X.champ].t+'</b> ('+T[X.champ].p+')':nx&&T[nx.a]&&T[nx.b]?'Próximo partido: <b>'+T[nx.a].t+' – '+T[nx.b].t+'</b><br><span class="tt">'+uclLbl(nx.key)+' · '+uclNextLeg(nx)+'</span>':'Cruces por decidir';
el.innerHTML='<div class="uclt"><div class="uh">'+STARS+'<span>Torneo de final de temporada</span><b>Mercadona Champions League</b><p>'+tx+'</p><p class="tt">'+X.legs+' de 10 partidos jugados</p></div><button class="cta" type="button" data-go="8">Ver la Champions</button></div>'}
/* ficha de un cruce de la Champions */
function stBars(st){return '<div class="fbox">'+SK.map(function(q){var l=n0(st.l[q[0]]),v=n0(st.v[q[0]]),mx=Math.max(l,v)||1,u=q[0]==="pos"?"%":"";
return '<div class="ms"><div class="l3"><b class="'+(l>v?"hi":"")+'">'+l+u+'</b><span>'+q[1]+'</span><b class="'+(v>l?"hi":"")+'">'+v+u+'</b></div><div class="sbar"><div><i class="'+(l>=v&&l?"on":"")+'" style="width:'+(l/mx*100)+'%"></i></div><div><i class="'+(v>=l&&v?"on":"")+'" style="width:'+(v/mx*100)+'%"></i></div></div></div>'}).join("")+'</div>'}
function ucSheet(key){
var X=uclTies(table()),t=X[key];if(!t||!nLegs(t)||!T[t.a]||!T[t.b])return '<p class="empty">Cruce no encontrado.</p>';
var w=uclWin(t),G=t.g||t.i;
var h='<div class="mj">⭐ Mercadona Champions League · '+uclLbl(key)+'</div><div class="mh"><button class="tm" data-t="'+t.a+'">'+logo(t.a)+nmp(t.a)+'</button><span class="sc">'+G[0]+'<i>-</i>'+G[1]+'</span><button class="tm" data-t="'+t.b+'">'+logo(t.b)+nmp(t.b)+'</button></div>';
h+='<p class="note" style="text-align:center;margin-top:0">'+(t.g?'Resultado global.':'Solo se ha jugado la ida; falta la vuelta.')+'</p>';
if(w)h+='<p class="note" style="text-align:center;margin-top:0">'+(t.g[0]===t.g[1]?'Empate global y penaltis: pasa ':'Pasa ')+'<b>'+T[w].t+'</b>'+(key==="final"?' y es el campeón':'')+'.</p>';
[["Ida",t.i,t.fi,t.si,t.a],["Vuelta",t.v,t.fv,t.sv,t.b]].forEach(function(L){if(!L[1])return;
h+='<h2 class="sec-h" style="margin-top:18px">'+L[0]+' <small>'+(L[2]?esc(fmt(L[2]))+' · ':'')+'en casa de '+esc(T[L[4]].t)+'</small></h2><div class="mh" style="padding-bottom:4px"><span class="tt">'+esc(T[t.a].t)+'</span><span class="sc" style="font-size:38px">'+L[1][0]+'<i>-</i>'+L[1][1]+'</span><span class="tt">'+esc(T[t.b].t)+'</span></div>';
h+=L[3]?stBars(L[3])+'<p class="note">Datos de la pantalla final de eFootball.</p>':'<div class="fbox"><p style="margin:0" class="tt">Este partido no tiene las estadísticas de eFootball apuntadas.</p></div>'});
return h}
/* campeón de la liga cuando se han jugado todos los partidos */
function renderChamp(L){
var el=$("champ");if(nPlayed()<NMATCH||!L.length||!L[0].pj){el.innerHTML="";return}
var r=L[0],id=r.id,n=ARCH?ARCH.n:curN();
el.innerHTML='<button class="champ1 art" data-t="'+id+'"'+artA(id)+'><span class="k">🏆 Campeón de la Superliga Covirán · Temporada '+n+'</span>'+logo(id)+'<b>'+esc(T[id].p)+'</b><span class="tm2">'+T[id].t+(PL[id]&&PL[id].apodo?' · «'+esc(PL[id].apodo)+'»':'')+'</span><span class="rec">'+r.pts+' puntos · '+r.pg+' victorias · '+r.pe+' empates · '+r.pp+' derrotas · '+dgt(r)+' goles</span></button>'}
/* instalar como app */
var dp=null;
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();dp=e;renderInstall()});
window.addEventListener("appinstalled",function(){lsSet("sl-ins","1");renderInstall()});
function standalone(){try{return matchMedia("(display-mode: standalone)").matches||navigator.standalone===true}catch(e){return false}}
function renderInstall(){
var el=$("ins");if(standalone()||lsGet("sl-ins")){el.innerHTML="";return}
var ios=/iphone|ipad|ipod/i.test(navigator.userAgent);
var tx=dp?"Instálala como una app: se abre a pantalla completa y con el logo de la liga.":ios?"En Safari, pulsa el botón Compartir y elige «Añadir a pantalla de inicio».":"En el menú del navegador (⋮) elige «Instalar aplicación» o «Añadir a pantalla de inicio».";
el.innerHTML='<div class="ins"><img src="icon-192.png" alt=""><div><b>Llévate la liga en el móvil</b><p>'+tx+'</p>'+(dp?'<button class="cta" id="insb">Instalar app</button>':'')+'</div><button class="x" id="insx" aria-label="No mostrar más">✕</button></div>';
if(dp)$("insb").addEventListener("click",function(){dp.prompt();dp.userChoice.then(function(){dp=null;renderInstall()})});
$("insx").addEventListener("click",function(){lsSet("sl-ins","1");el.innerHTML=""})}

/* ---------- jornadas ---------- */
function renderChips(){
$("chips").innerHTML=J.map(function(_,j){
return '<button data-j="'+j+'" aria-pressed="'+(j===cur)+'" class="'+(doneJ(j)?"done":"")+'" aria-label="Jornada '+(j+1)+'">'+(j+1)+'</button>'}).join("");
var b=$("chips").querySelector('[aria-pressed="true"]');if(b&&b.scrollIntoView&&!$("v2").hidden){try{b.scrollIntoView({block:"nearest",inline:"center"})}catch(e){}}}
function renderJ(){
$("jt").textContent="Jornada "+(cur+1);
$("jv").textContent=cur<11?"Primera vuelta":"Segunda vuelta";
var r=J[cur];
$("jm").innerHTML=r.ms.map(function(m){
var key=k(cur,m[0],m[1]),v=R[key];
var w=!v?"":v[0]>v[1]?" w1":v[0]<v[1]?" w2":"";
var inner='<span class="tm h">'+logo(m[0])+nmp(m[0])+'</span><span class="sb">'+(v?'<span class="sc"><b>'+v[0]+'</b><i>:</i><b>'+v[1]+'</b></span>'+(ST[key]?'<small>Ver stats</small>':''):'<em>vs</em>')+'</span><span class="tm a">'+logo(m[1])+nmp(m[1])+'</span>';
return v?'<button class="mc'+w+'" data-m="'+key+'">'+inner+'</button>':'<div class="mc">'+inner+'</div>'}).join("")+
(r.rest?'<div class="rest">Descansa: <b>'+T[r.rest].t+'</b> ('+T[r.rest].p+')</div>':'')+
(MVP[cur+1]&&T[MVP[cur+1]]?'<div class="mvp"><span style="font-size:24px">⭐</span><span><span class="tt">MVP de la jornada</span><b>'+T[MVP[cur+1]].p+' · '+T[MVP[cur+1]].t+'</b></span></div>':'')}
$("chips").addEventListener("click",function(e){
var j=e.target.getAttribute("data-j");if(j===null)return;cur=+j;renderChips();renderJ()});

/* ---------- estadísticas ---------- */
var MET=[
{t:"Puntos por partido",f:function(r){return r.pj?r.pts/r.pj:null},d:2},
{t:"Goles a favor por partido",f:function(r){return r.pj?r.gf/r.pj:null},d:1},
{t:"Goles en contra por partido",f:function(r){return r.pj?r.gc/r.pj:null},d:1,low:1},
{t:"Posesión media",s:1,f:function(r,a){return a.n?a.s.pos/a.n:null},d:0,u:"%"},
{t:"Tiros por partido",s:1,f:function(r,a){return a.n?a.s.tir/a.n:null},d:1},
{t:"Tiros a puerta por partido",s:1,f:function(r,a){return a.n?a.s.tpu/a.n:null},d:1},
{t:"Precisión de tiro",s:1,f:function(r,a){return a.s.tir?a.s.tpu/a.s.tir*100:null},d:0,u:"%",x:"Tiros a puerta entre tiros totales."},
{t:"Precisión de pase",s:1,f:function(r,a){return a.s.pas?a.s.pac/a.s.pas*100:null},d:0,u:"%",x:"Pases completados entre pases totales."},
{t:"Paradas por partido",s:1,f:function(r,a){return a.n?a.s.par/a.n:null},d:1},
{t:"Intercepciones por partido",s:1,f:function(r,a){return a.n?a.s.int/a.n:null},d:1},
{t:"Entradas por partido",s:1,f:function(r,a){return a.n?a.s.ent/a.n:null},d:1},
{t:"Córners por partido",s:1,f:function(r,a){return a.n?a.s.cor/a.n:null},d:1},
{t:"Faltas por partido",s:1,f:function(r,a){return a.n?a.s.fal/a.n:null},d:1,x:"Quién juega más duro."}];
var met=0;
function renderStats(L){
var A=agg(),P=allM().filter(function(x){return x.v}),goals=P.reduce(function(s,x){return s+x.v[0]+x.v[1]},0);
var big=null,most=null;P.forEach(function(x){var m=Math.abs(x.v[0]-x.v[1]),g=x.v[0]+x.v[1];if(!big||m>Math.abs(big.v[0]-big.v[1]))big=x;if(!most||g>most.v[0]+most.v[1])most=x});
var bw=L.slice().sort(function(a,b){return b.best-a.best})[0];
var nst=P.filter(function(x){return x.st}).length;
function mini(x){return '<i>'+logo(x.h,"xs")+logo(x.a,"xs")+'<span>'+T[x.h].t+' – '+T[x.a].t+' · J'+(x.j+1)+'</span></i>'}
$("rec").innerHTML=!P.length?'<div class="rc wide"><span>Sin datos</span><i>Las estadísticas aparecerán con los primeros resultados.</i></div>':
'<div class="rc"><span>Goles marcados</span><b>'+goals+'</b><i>'+fx(goals/P.length,1)+' por partido</i></div>'+
'<div class="rc"><span>Partidos jugados</span><b>'+P.length+'<small style="font-size:18px;color:var(--mute)">/'+NMATCH+'</small></b><i>'+nst+' con estadísticas de eFootball</i></div>'+
'<div class="rc"><span>Mayor goleada</span><b>'+Math.max(big.v[0],big.v[1])+'-'+Math.min(big.v[0],big.v[1])+'</b>'+mini(big)+'</div>'+
'<div class="rc"><span>Partido con más goles</span><b>'+(most.v[0]+most.v[1])+' goles</b>'+mini(most)+'</div>'+
(bw&&bw.best?'<div class="rc wide"><span>Mejor racha de victorias</span><b>'+bw.best+(bw.best>1?' seguidas':' victoria')+'</b><i>'+logo(bw.id,"xs")+'<span>'+T[bw.id].t+' ('+T[bw.id].p+')</span></i></div>':'');
$("mch").innerHTML=MET.map(function(m,i){return '<button data-i="'+i+'" aria-pressed="'+(i===met)+'">'+m.t+'</button>'}).join("");
var m=MET[met],rows=L.map(function(r){return{id:r.id,v:m.f(r,A[r.id])}}).filter(function(x){return x.v!=null&&isFinite(x.v)});
rows.sort(function(a,b){return m.low?a.v-b.v:b.v-a.v});
var mx=rows.reduce(function(s,x){return Math.max(s,x.v)},0)||1;
$("rk").innerHTML=rows.length?rows.map(function(x,i){return '<button class="it" data-t="'+x.id+'"><span class="ps">'+(i+1)+'</span>'+logo(x.id,"sm")+'<span><span class="nm">'+T[x.id].t+'</span><span class="bar"><i style="width:'+Math.max(4,x.v/mx*100)+'%"></i></span></span><span class="v">'+fx(x.v,m.d)+(m.u||"")+'</span></button>'}).join(""):
'<div class="empty">'+(m.s?'Todavía no hay partidos con estadísticas de eFootball.':'Aún no hay partidos jugados.')+'</div>';
$("rkn").textContent=(m.x?m.x+" ":"")+(m.s?"Solo cuentan los partidos con estadísticas de eFootball apuntadas.":"")+(m.low?" Cuanto menos, mejor.":"");
var B=badges(L,A);
$("bgs").innerHTML=B.length?B.map(function(b){return '<div class="bc"><span class="e">'+b.e+'</span><b>'+b.t+'</b><p>'+esc(b.d)+'</p><div class="who">'+(b.ids.length?b.ids.map(function(id){return '<button data-t="'+id+'">'+logo(id,"xs")+T[id].t+'</button>'}).join(""):'<span class="tt">Nadie todavía</span>')+'</div></div>'}).join(""):'<div class="rc wide"><i>Las insignias se reparten cuando haya resultados.</i></div>';
var mv=Object.keys(MVP).filter(function(j){return T[MVP[j]]}).sort(function(a,b){return a-b});
$("mvps").innerHTML=mv.length?'<h2 class="sec-h">MVP de cada jornada <small>votado en el grupo</small></h2><div class="card soft">'+mv.map(function(j){var id=MVP[j];return '<button class="it" data-t="'+id+'" style="grid-template-columns:44px 40px minmax(0,1fr)"><span class="ps" style="font-size:16px">J'+j+'</span>'+logo(id,"sm")+'<span><span class="nm">⭐ '+T[id].p+'</span><span class="tt">'+T[id].t+'</span></span></button>'}).join("")+'</div>':''}
$("mch").addEventListener("click",function(e){var i=e.target.getAttribute("data-i");if(i===null)return;met=+i;renderStats(table())});

/* ---------- jugadores, crónicas, goles ---------- */
function condisDe(id){var w=cdWin();return!!(w&&w.jugador===id)}
function renderPlayers(L){
var B=badges(L,agg());
$("pl").innerHTML=L.map(function(r,i){
var d=PL[r.id]||{};
var av=okFoto(d.foto)?'<img class="av" alt="Foto de '+esc(T[r.id].p)+'" src="'+d.foto+'">':'<div class="av avc">'+logo(r.id)+'</div>';
var ap=d.apodo?'<span class="tt">'+esc(d.apodo)+'</span>':'';
var bio=d.bio?'<p class="bio">'+esc(d.bio).replace(/\n/g,"<br>")+'</p>':'<p class="bio no">Sin presentación todavía.</p>';
var mb=B.filter(function(b){return b.ids.indexOf(r.id)>=0}).map(function(b){return '<span class="bdg">'+b.e+' '+b.t+'</span>'}).join("")+(mvpCount(r.id)?'<span class="bdg">⭐ MVP ×'+mvpCount(r.id)+'</span>':'')+(condisDe(r.id)?'<span class="bdg cdt">🏆 Premio Condis</span>':'');
return '<article class="pj art"'+artA(r.id)+'><div class="pjh">'+av+'<div class="pi"><span class="pnm">'+esc(T[r.id].p)+'</span>'+ap+'<span class="tc">'+logo(r.id)+'<span class="nm">'+T[r.id].t+'</span></span></div><span class="rk">'+(i+1)+'º</span></div>'+bio+(mb?'<div>'+mb+'</div>':'')+
'<div class="sg"><div class="st"><b>'+r.pj+'</b><span>PJ</span></div><div class="st"><b>'+r.pg+'</b><span>G</span></div><div class="st"><b>'+r.pe+'</b><span>E</span></div><div class="st"><b>'+r.pp+'</b><span>P</span></div><div class="st"><b>'+r.gf+'</b><span title="Goles a favor">GF</span></div><div class="st"><b>'+r.gc+'</b><span title="Goles en contra">GC</span></div></div><div class="fm">'+dots(r.f)+'</div><button class="lnk" data-t="'+r.id+'">Ver ficha completa</button></article>'}).join("")}
function fmt(f){var p=(f||"").split("-");if(p.length!==3)return "";
return new Date(+p[0],+p[1]-1,+p[2]).toLocaleDateString("es-ES",{day:"numeric",month:"long",year:"numeric"})}
function renderPosts(){
var L=PO.slice().sort(function(a,b){return(+b.id||0)-(+a.id||0)});
$("po").innerHTML=L.map(function(p){
var meta=(p.jornada?"Jornada "+(+p.jornada):"")+(p.jornada&&p.fecha?", ":"")+(p.fecha?fmt(p.fecha):"");
var body=String(p.texto||"").split(/\n{2,}/).map(function(x){return '<p>'+esc(x).replace(/\n/g,"<br>")+'</p>'}).join("");
var im=okFoto(p.foto)?'<img class="pf" alt="" loading="lazy" src="'+p.foto+'">':'';
return '<article class="po"><div class="mt">'+esc(meta)+'</div><h3>'+esc(p.titulo)+'</h3>'+im+body+'</article>'}).join("")||'<div class="empty">Aún no hay crónicas.</div>'}
function ytId(u){var m=String(u||"").match(/^https:\/\/(?:www\.|m\.)?(?:youtube\.com\/(?:watch\?(?:.*&)?v=|shorts\/|embed\/|live\/)|youtu\.be\/)([A-Za-z0-9_-]{11})/);return m?m[1]:null}
function okUrl(u){return typeof u==="string"&&/^https:\/\/[^\s"'<>]+$/.test(u)}
function gMedia(g){
var yt=ytId(g.enlace);
return okFoto(g.video)?'<video controls playsinline preload="none" src="'+g.video+'"></video>':
yt?'<iframe src="https://www.youtube-nocookie.com/embed/'+yt+'" title="'+esc(g.titulo)+'" loading="lazy" allow="encrypted-media; picture-in-picture" allowfullscreen></iframe>':
okUrl(g.enlace)?'<a class="lnk" href="'+esc(g.enlace)+'" target="_blank" rel="noopener">Ver el gol ↗</a>':''}
function gBy(g){return T[g.jugador]?'<div class="by">'+logo(g.jugador,"sm")+'<span>'+T[g.jugador].p+' · '+T[g.jugador].t+'</span></div>':''}
/* Premio Condis: mejor gol de la temporada. El ganador y los nominados se eligen en el admin */
function cdWin(){var id=CD&&CD.ganador;if(id==null||id==="")return null;return GO.filter(function(g){return String(g.id)===String(id)})[0]||null}
function cdNom(){var ids=CD&&Array.isArray(CD.nominados)?CD.nominados.map(String):[];return GO.filter(function(g){return ids.indexOf(String(g.id))>=0})}
var CUP='<svg class="cup" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="cg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff09a"/><stop offset=".55" stop-color="#ffd23f"/><stop offset="1" stop-color="#ff9d2e"/></linearGradient></defs><path d="M18 8h28v15a14 14 0 0 1-28 0z" fill="url(#cg)" stroke="#05071a" stroke-width="3" stroke-linejoin="round"/><path d="M18 14h-7c0 9 3 14 9 15M46 14h7c0 9-3 14-9 15" fill="none" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/><path d="M32 37v8" stroke="#05071a" stroke-width="9" stroke-linecap="round"/><path d="M32 37v8" stroke="#ffd23f" stroke-width="4" stroke-linecap="round"/><rect x="20" y="47" width="24" height="9" rx="3" fill="url(#cg)" stroke="#05071a" stroke-width="3"/><path d="M26 14l1.5 3.2 3.5.4-2.6 2.4.7 3.5-3.1-1.8-3.1 1.8.7-3.5-2.6-2.4 3.5-.4z" fill="#fff6c8" transform="translate(5 -1)"/></svg>';
function renderCondis(){
var w=cdWin(),nom=cdNom(),lista=nom.length?nom:GO,tit=nom.length?"Nominados":"Candidatos";
var h='<div class="cd"><div class="cdh">'+CUP+'<span>Mejor gol de la temporada</span><b>Premio Condis</b></div>';
if(w){h+='<div class="cdw"><span class="cdk">🏆 Ganador</span><h3>'+esc(w.titulo)+'</h3>'+gBy(w)+gMedia(w)+(w.texto?'<p>'+esc(w.texto)+'</p>':'')+'</div>'}
else{h+='<p class="cdp">'+(GO.length?'Todavía no hay ganador. El Premio Condis se entrega al mejor gol de toda la temporada, elegido entre los golazos publicados.':'Todavía no hay golazos. Sube el tuyo y opta al Premio Condis al mejor gol de la temporada.')+'</p>'}
if(lista.length&&!(w&&lista.length===1&&String(lista[0].id)===String(w.id))){
h+='<div class="bl cdl">'+(w?"Otros nominados":tit)+'</div><div class="cdn">'+lista.filter(function(g){return!w||String(g.id)!==String(w.id)}).sort(function(a,b){return(+b.id||0)-(+a.id||0)}).map(function(g){
return '<button data-g="'+(+g.id)+'">'+(T[g.jugador]?logo(g.jugador,"sm"):'')+'<span><b>'+esc(g.titulo)+'</b><em>'+(T[g.jugador]?T[g.jugador].p+' · ':'')+(g.jornada?'Jornada '+(+g.jornada):'Sin jornada')+'</em></span></button>'}).join("")+'</div>'}
h+='</div>';$("condis").innerHTML=h}
$("condis").addEventListener("click",function(e){var b=e.target.closest?e.target.closest("[data-g]"):null;if(!b)return;var el=$("g-"+b.getAttribute("data-g"));if(el&&el.scrollIntoView)el.scrollIntoView({behavior:"smooth",block:"start"})});
function renderGoals(){
renderCondis();
var L=GO.slice().sort(function(a,b){return(+b.id||0)-(+a.id||0)}),w=cdWin(),nomIds=cdNom().map(function(g){return String(g.id)});
$("go").innerHTML=L.map(function(g){
var meta=(g.jornada?"Jornada "+(+g.jornada):"")+(g.jornada&&g.fecha?", ":"")+(g.fecha?fmt(g.fecha):"");
var tag=w&&String(w.id)===String(g.id)?'<span class="bdg cdt">🏆 Premio Condis</span>':nomIds.indexOf(String(g.id))>=0?'<span class="bdg">Nominado al Premio Condis</span>':'';
return '<article class="gl" id="g-'+(+g.id)+'"><div class="mt">'+esc(meta)+'</div><h3>'+esc(g.titulo)+'</h3>'+(tag?'<div>'+tag+'</div>':'')+gBy(g)+gMedia(g)+(g.texto?'<p>'+esc(g.texto)+'</p>':'')+'</article>'}).join("")||
'<div class="gempty"><b>Aún no hay golazos</b>Aquí irán los mejores goles de la temporada. Pasad los clips para que se suban.</div>'}

/* ---------- ficha de equipo y partido ---------- */
var stack=[],curSheet=null;
function openSheet(s,push){
var d=$("sh");if(push&&curSheet&&d.open)stack.push(curSheet);else if(!push)stack=[];
curSheet=s;$("shb").innerHTML=sheetHtml(s);
$("shback").hidden=!stack.length;
if(!d.open){if(d.showModal)d.showModal();else d.setAttribute("open","")}
d.scrollTop=0}
function closeSheet(){var d=$("sh");stack=[];curSheet=null;if(d.close)d.close();else d.removeAttribute("open")}
$("shx").addEventListener("click",closeSheet);
$("shback").addEventListener("click",function(){var s=stack.pop();if(s){curSheet=null;openSheet(s,true);stack.pop();$("shback").hidden=!stack.length}});
$("sh").addEventListener("click",function(e){if(e.target===this)closeSheet()});
document.addEventListener("click",function(e){
var x2=e.target.closest?e.target.closest("[data-ins],[data-cmp],[data-arch],[data-ev],[data-u],[data-go],#archx,#tema"):null;
if(x2){
if(x2.hasAttribute("data-u")){openSheet({type:"u",id:x2.getAttribute("data-u")},$("sh").contains(x2));return}
if(x2.hasAttribute("data-go")){tab(+x2.getAttribute("data-go"));return}
if(x2.hasAttribute("data-ins")){openSheet({type:"i"},false);return}
if(x2.hasAttribute("data-cmp")){closeSheet();cmpA=x2.getAttribute("data-cmp");if(cmpB===cmpA)cmpB=null;tab(3);renderCmp(table());var ch=$("cmph");if(ch.scrollIntoView)ch.scrollIntoView({block:"start"});return}
if(x2.hasAttribute("data-arch")){verTemporada(+x2.getAttribute("data-arch"));return}
if(x2.hasAttribute("data-ev")){toggleEvo(x2.getAttribute("data-ev"));return}
if(x2.id==="archx"){volverActual();return}
if(x2.id==="tema"){TEMA={auto:"claro",claro:"oscuro",oscuro:"auto"}[TEMA]||"auto";lsSet("sl-tema",TEMA);
var go=function(){aplicarTema();renderTema()},rb2=x2.getBoundingClientRect(),de2=document.documentElement;
/* el tema nuevo se abre en círculo desde el botón (en los navegadores que lo permiten) */
if(document.startViewTransition&&!(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)){de2.style.setProperty("--vx",(rb2.left+rb2.width/2)+"px");de2.style.setProperty("--vy",(rb2.top+rb2.height/2)+"px");document.startViewTransition(go)}else go();return}}
var t=e.target.closest?e.target.closest("[data-t],[data-m]"):null;if(!t)return;
var inSheet=$("sh").contains(t);
if(t.hasAttribute("data-t")&&T[t.getAttribute("data-t")])openSheet({type:"t",id:t.getAttribute("data-t")},inSheet);
else if(t.hasAttribute("data-m")&&R[t.getAttribute("data-m")])openSheet({type:"m",id:t.getAttribute("data-m")},inSheet)});
function ficha(id){
var L=table(),pos=0;L.forEach(function(r,i){if(r.id===id)pos=i});var r=L[pos],a=agg()[id],d=PL[id]||{};
var B=badges(L,agg()).filter(function(b){return b.ids.indexOf(id)>=0});
var mv=mvpCount(id);
var ms=allM().filter(function(x){return x.h===id||x.a===id});
var pl=ms.filter(function(x){return x.v}),nx=ms.filter(function(x){return!x.v})[0];
var h='<div class="fh art"'+artA(id)+'>'+logo(id,"xl")+'<div class="pi"><span class="pnm">'+T[id].t+'</span><span class="tt" style="font-size:15px">'+esc(T[id].p)+(d.apodo?' · «'+esc(d.apodo)+'»':'')+'</span></div><span class="rk">'+(pos+1)+'º</span></div>';
h+='<div class="fbox"><div class="sg s7"><div class="st"><b>'+r.pts+'</b><span>Pts</span></div><div class="st"><b>'+r.pj+'</b><span>PJ</span></div><div class="st"><b>'+r.pg+'</b><span>G</span></div><div class="st"><b>'+r.pe+'</b><span>E</span></div><div class="st"><b>'+r.pp+'</b><span>P</span></div><div class="st"><b>'+r.gf+'</b><span>GF</span></div><div class="st"><b>'+r.gc+'</b><span>GC</span></div></div></div>';
var E=evo();if(E.n>1)h+='<div class="fbox"><h4>Evolución en la tabla</h4>'+evoSvg(E,[id],true)+'</div>';
h+='<p style="margin:10px 0 0"><button class="lnk" data-cmp="'+id+'" style="margin:0">Comparar con otro equipo</button></p>';
h+=palBox(id);h+='<div class="fbox"><h4>Racha</h4><div class="fm" style="justify-content:flex-start">'+dots(r.f)+'</div><p style="margin:8px 0 0">'+nowTxt(r.now)+(r.best?' · Mejor racha: '+r.best+' victoria'+(r.best>1?'s':'')+' seguida'+(r.best>1?'s':''):'')+'</p>'+
(B.length||mv||condisDe(id)?'<div>'+B.map(function(b){return '<span class="bdg">'+b.e+' '+b.t+'</span>'}).join("")+(mv?'<span class="bdg">⭐ MVP ×'+mv+'</span>':'')+(condisDe(id)?'<span class="bdg cdt">🏆 Premio Condis</span>':'')+'</div>':'')+'</div>';
if(nx){var o=nx.h===id?nx.a:nx.h;h+='<div class="fbox"><h4>Próximo partido</h4><div class="o" style="display:flex;align-items:center;gap:10px">'+logo(o,"sm")+'<span><span class="nm" style="font-size:18px">'+(nx.h===id?'vs ':'en casa de ')+T[o].t+'</span><span class="tt">Jornada '+(nx.j+1)+' · '+T[o].p+'</span></span></div></div>'}
if(a.n){var pp=a.s.pas?Math.round(a.s.pac/a.s.pas*100)+"%":"–";
h+='<div class="fbox"><h4>Promedios eFootball <span class="tt" style="display:inline;font-family:Barlow,sans-serif;text-transform:none">('+a.n+' partido'+(a.n>1?'s':'')+')</span></h4><div class="av2"><div class="st"><b>'+Math.round(a.s.pos/a.n)+'%</b><span>Posesión</span></div><div class="st"><b>'+fx(a.s.tir/a.n,1)+'</b><span>Tiros</span></div><div class="st"><b>'+pp+'</b><span>Pase</span></div><div class="st"><b>'+fx(a.s.par/a.n,1)+'</b><span>Paradas</span></div></div></div>'}
h+='<div class="fbox"><h4>Historial</h4>'+(pl.length?pl.map(function(x){var p=persp(x,id);return '<button class="hl" data-m="'+x.key+'"><span class="j">J'+(x.j+1)+'</span><span class="o">'+logo(p.op,"xs")+'<span>'+(p.home?'vs ':'en ')+T[p.op].t+'</span></span><span class="s">'+p.gf+'-'+p.gc+'</span><span class="wl '+p.r+'">'+{w:"V",d:"E",l:"D"}[p.r]+'</span></button>'}).join(""):'<p class="tt">Todavía no ha jugado.</p>')+'</div>';
var rv=Object.keys(T).filter(function(o){return o!==id});
h+='<div class="fbox"><h4>Cara a cara</h4>'+rv.map(function(o){
var legs=ms.filter(function(x){return x.h===o||x.a===o});
return '<div class="h2"><span class="o">'+logo(o,"xs")+'<span>'+T[o].t+'</span></span><span class="r">'+legs.map(function(x){if(!x.v)return '<span class="p">J'+(x.j+1)+' –</span>';var p=persp(x,id);return '<span class="'+(p.r==="d"?"p":p.r)+'">'+p.gf+'-'+p.gc+'</span>'}).join("")+'</span></div>'}).join("")+'</div>';
return h}
function matchSheet(key){
var x=mByKey(key);if(!x||!x.v)return '<p class="empty">Partido no encontrado.</p>';
var h='<div class="mj">Jornada '+(x.j+1)+' · '+(x.j<11?'Primera':'Segunda')+' vuelta</div><div class="mh"><button class="tm" data-t="'+x.h+'">'+logo(x.h)+nmp(x.h)+'</button><span class="sc">'+x.v[0]+'<i>-</i>'+x.v[1]+'</span><button class="tm" data-t="'+x.a+'">'+logo(x.a)+nmp(x.a)+'</button></div>';
if(x.st&&x.st.l&&x.st.v){h+='<div class="fbox">'+SK.map(function(q){var l=n0(x.st.l[q[0]]),v=n0(x.st.v[q[0]]),mx=Math.max(l,v)||1,u=q[0]==="pos"?"%":"";
return '<div class="ms"><div class="l3"><b class="'+(l>v?"hi":"")+'">'+l+u+'</b><span>'+q[1]+'</span><b class="'+(v>l?"hi":"")+'">'+v+u+'</b></div><div class="sbar"><div><i class="'+(l>=v&&l?"on":"")+'" style="width:'+(l/mx*100)+'%"></i></div><div><i class="'+(v>=l&&v?"on":"")+'" style="width:'+(v/mx*100)+'%"></i></div></div></div>'}).join("")+'</div><p class="note">Datos de la pantalla final de eFootball.</p>'}
else h+='<div class="fbox"><p style="margin:0" class="tt">Este partido aún no tiene las estadísticas de eFootball apuntadas.</p></div>';
return h}


/* ---------- títulos, palmarés y ranking general ---------- */
var TI={lidl:{base:null,torneos:[]},temporadas:[]},tsub=0;
var DEFB={bd:10,th:7,hs:5,md:4,zk:2};
function lBase(){var b=TI.lidl&&TI.lidl.base&&typeof TI.lidl.base==="object"?TI.lidl.base:DEFB,o={};Object.keys(T).forEach(function(i){o[i]=Math.floor(n0(b[i]))});return o}
function lTor(){return(TI.lidl&&Array.isArray(TI.lidl.torneos)?TI.lidl.torneos:[]).filter(function(x){return x&&T[x.campeon]})}
function sTem(){return(Array.isArray(TI.temporadas)?TI.temporadas:[]).filter(function(x){return x&&x.liga&&Array.isArray(x.liga.orden)&&x.liga.orden.length>1}).sort(function(a,b){return(+a.n||0)-(+b.n||0)})}
function pal(){
var P={};Object.keys(T).forEach(function(i){P[i]={liga:0,ucl:0,lidl:0,sL:0,sU:0,sLi:0}});
var b=lBase();Object.keys(b).forEach(function(i){P[i].lidl+=b[i]});
lTor().forEach(function(x){P[x.campeon].lidl++;if(P[x.subcampeon])P[x.subcampeon].sLi++});
sTem().forEach(function(x){var o=x.liga.orden;if(P[o[0]])P[o[0]].liga++;if(P[o[1]])P[o[1]].sL++;var c=x.champions;if(c&&P[c.campeon])P[c.campeon].ucl++;if(c&&P[c.sub])P[c.sub].sU++});
/* la temporada actual cuenta en cuanto se acaba, aunque aún no se haya cerrado desde el admin */
var C=curTit();if(C){P[C.liga].liga++;if(P[C.sub])P[C.sub].sL++;if(C.ucl){P[C.ucl.campeon].ucl++;if(P[C.ucl.sub])P[C.ucl.sub].sU++}}
return P}
function curTit(){var L=table();if(nPlayed()<NMATCH||curClosed(L))return null;return{n:curN(),liga:L[0].id,sub:L[1]&&L[1].id,ucl:uclRes(L)}}
function curClosed(L){var S=sTem(),l=S[S.length-1];if(!l||!nPlayed())return false;return+l.partidos===nPlayed()&&l.liga.orden.join()===L.map(function(r){return r.id}).join()}
function uclRes(L){
var any=L.some(function(r){return r.pj>0}),q=L.slice(0,6).map(function(r){return r.id}),tie=uTie;
var p1=tie("po1",any?q[2]:null,any?q[5]:null),p2=tie("po2",any?q[3]:null,any?q[4]:null);
var s1=tie("sf1",any?q[0]:null,uclWin(p2)),s2=tie("sf2",any?q[1]:null,uclWin(p1));
var f=tie("final",uclWin(s1),uclWin(s2)),c=uclWin(f);
if(!c)return null;
function lose(t){var w=uclWin(t);return w?(w===t.a?t.b:t.a):null}
return{campeon:c,sub:lose(f),semis:[lose(s1),lose(s2)].filter(Boolean),acceso:[lose(p1),lose(p2)].filter(Boolean)}}
/* ---------- Coviran Rating: ranking general de 0 a 1000 ----------
   Cada competición da una nota de 0 a 100 y pesa un porcentaje de la nota final. */
var RW=[["liga","Superliga Covirán",50,"#e0b13c"],["ucl","Mercadona Champions League",30,"#a07bff"],["lidl","Torneo Lidl",15,"#e5173f"],["ami","Amistosos",5,"#38bdf8"]];
var TIERS=[[800,"Leyenda"],[650,"Élite"],[500,"Pro"],[350,"Titular"],[0,"Promesa"]];
function tier(sc){for(var i=0;i<TIERS.length;i++)if(sc>=TIERS[i][0])return TIERS[i][1];return"Promesa"}
/* amistosos: nota de 0 a 100 (la rellena el sistema de amistosos). Sin partidos jugados la nota es neutra (50) y no mueve a nadie */
function amiNotas(){return window.AMI_NOTAS&&typeof window.AMI_NOTAS==="object"?window.AMI_NOTAS:{}}
function rank(L){
var ids=Object.keys(T),cl=curClosed(L);
/* liga: posición final de cada temporada (100 el campeón, 0 el último). La temporada en curso pesa lo que lleva jugado */
var seasons=sTem().map(function(x){return{o:x.liga.orden,w:1}});
if(!cl&&nPlayed()>0)seasons.push({o:L.map(function(r){return r.id}),w:Math.min(1,nPlayed()/NMATCH)});
var lg={};ids.forEach(function(i){var sum=0,n=0;seasons.forEach(function(z){var p=z.o.indexOf(i);if(p>=0){sum+=(z.o.length-1-p)/(z.o.length-1)*100*z.w;n+=z.w}});lg[i]=n?sum/n:0});
/* champions: campeón 100, finalista 70, semifinalista 45, ronda de acceso 20 */
var uc=sTem().filter(function(x){return x.champions&&x.champions.campeon}).map(function(x){return x.champions});
var cu=cl?null:uclRes(L);if(cu)uc.push(cu);
var ul={};ids.forEach(function(i){var sum=0;uc.forEach(function(c){sum+=c.campeon===i?100:c.sub===i?70:(c.semis||[]).indexOf(i)>=0?45:(c.acceso||[]).indexOf(i)>=0?20:0});ul[i]=uc.length?sum/uc.length:0});
/* lidl: puntos por torneo respecto al que más suma */
var lp={},b=lBase();ids.forEach(function(i){lp[i]=b[i]*100});
lTor().forEach(function(x){lp[x.campeon]+=100;if(lp[x.subcampeon]!=null)lp[x.subcampeon]+=60;(x.semis||[]).forEach(function(z){if(lp[z]!=null)lp[z]+=30})});
var mx=Math.max.apply(null,ids.map(function(i){return lp[i]}))||1,am=amiNotas();
var rows=ids.map(function(i){var n={liga:lg[i],ucl:ul[i],lidl:lp[i]/mx*100,ami:am[i]!=null?am[i]:50};
var tot=0;RW.forEach(function(w){tot+=n[w[0]]*w[2]/100});
return{id:i,liga:n.liga,ucl:n.ucl,lidl:n.lidl,ami:n.ami,tot:tot,score:Math.round(tot*10),tier:tier(Math.round(tot*10))}});
rows.sort(function(a,c){return c.score-a.score||c.liga-a.liga||c.lidl-a.lidl||T[a.id].t.localeCompare(T[c.id].t)});
return{rows:rows,seasons:seasons.length,uclN:uc.length}}
function tmn(id,c){return T[id]?logo(id,c||"xs")+'<span>'+T[id].t+'</span>':'<span>–</span>'}
function palBox(id){
var P=pal()[id],S=sTem(),b=lBase()[id],reg=lTor().filter(function(x){return x.campeon===id}).length;
var lg=S.filter(function(x){return x.liga.orden[0]===id}).map(function(x){return"T"+x.n});
var uc=S.filter(function(x){return x.champions&&x.champions.campeon===id}).map(function(x){return"T"+x.n});
var C=curTit();if(C&&C.liga===id)lg.push("T"+C.n);if(C&&C.ucl&&C.ucl.campeon===id)uc.push("T"+C.n);
function row(ic,t,n,det){return '<div class="pr"><span class="pi2">'+ic+'</span><span><b>'+t+'</b>'+(det?'<em>'+det+'</em>':'')+'</span><span class="pn2">'+n+'</span></div>'}
var ld=b?(b+" anterior"+(b>1?"es":"")+" a la web"+(reg?" + "+reg+" registrado"+(reg>1?"s":""):"")):(reg?reg+" registrado"+(reg>1?"s":""):"");
return '<div class="fbox"><h4>Palmarés</h4>'+row("🏆","Superliga Covirán",P.liga,lg.length?"Temporadas: "+lg.join(", "):"")+row("⭐","Mercadona Champions League",P.ucl,uc.length?"Ediciones: "+uc.join(", "):"")+row("🥇","Torneo Lidl",P.lidl,ld)+
((P.sL+P.sU+P.sLi)?'<p class="tt" style="margin:8px 0 0">Subcampeonatos: Liga '+P.sL+' · Champions '+P.sU+' · Lidl '+P.sLi+'</p>':'')+'</div>'}
var TSUB=["Ranking","Palmarés","Torneo Lidl","Temporadas"];
function tvRank(L){
var r=rank(L);
var h='<div class="rkh"><span>Coviran Rating</span><b>Ranking general</b><p>Nota de 0 a 1000 que mezcla todas las competiciones. Se actualiza sola con cada resultado.</p></div>';
h+='<div class="card soft rrl">'+r.rows.map(function(x,i){
var seg=RW.map(function(w){return '<i class="sg-'+w[0]+'" style="width:'+(x[w[0]]*w[2]/1000*100)+'%" title="'+w[1]+': '+fx(x[w[0]],0)+' / 100"></i>'}).join("");
return '<button class="rr'+(i<3?' top'+(i+1):'')+'" data-t="'+x.id+'"><span class="ps">'+(i+1)+'</span>'+logo(x.id,"sm")+'<span class="rrm"><span class="nm">'+T[x.id].t+'</span><span class="tt">'+esc(T[x.id].p)+' · <b class="tier t-'+x.tier.toLowerCase().replace("é","e")+'">'+x.tier+'</b></span><span class="stk" aria-hidden="true">'+seg+'</span><span class="rrd">'+RW.map(function(w){return '<span><i style="background:'+w[3]+'"></i>'+fx(x[w[0]],0)+'</span>'}).join("")+'</span></span><span class="v">'+x.score+'<small>pts</small></span></button>'}).join("")+'</div>';
h+='<div class="rkw">'+RW.map(function(w){return '<div style="--c:'+w[3]+'"><b>'+w[2]+'%</b><span>'+w[1]+'</span></div>'}).join("")+'</div>';
h+='<div class="tinfo"><b>Cómo se calcula</b>'+
'<p><b>Superliga Covirán (50%)</b>: posición final en cada liga, de 100 el campeón a 0 el último. La temporada en curso cuenta en proporción a lo que se lleva jugado.</p>'+
'<p><b>Mercadona Champions League (30%)</b>: campeón 100, finalista 70, semifinalista 45 y ronda de acceso 20, promediado por edición.'+(r.uclN?'':' Todavía no se ha jugado ninguna: vale 0 para todos.')+'</p>'+
'<p><b>Torneo Lidl (15%)</b>: campeón 100, finalista 60 y semifinalista 30 por torneo, comparado con quien más suma.</p>'+
'<p><b>Amistosos (5%)</b>: nota tipo Elo con poco peso. Mientras no haya amistosos jugados todos tienen 50 y no cambia nada.</p>'+
'<p><b>Rangos</b>: Leyenda desde 800, Élite 650, Pro 500, Titular 350 y Promesa por debajo.</p></div>';
return h}
function tvPal(){
var P=pal(),ids=Object.keys(T).sort(function(a,b){var x=P[a],y=P[b];return(y.liga+y.ucl+y.lidl)-(x.liga+x.ucl+x.lidl)||y.lidl-x.lidl||T[a].t.localeCompare(T[b].t)});
return '<div class="card"><div class="pmh"><span>#</span><span>Equipo</span><span title="Superliga Covirán">Liga</span><span title="Mercadona Champions League">Champ.</span><span title="Torneo Lidl">Lidl</span><span>Total</span></div>'+ids.map(function(id,i){var p=P[id],t=p.liga+p.ucl+p.lidl;
return '<button class="pm'+(t?"":" z")+'" data-t="'+id+'"><span class="ps">'+(i+1)+'</span><span class="tc">'+logo(id,"sm")+'<span class="tn"><span class="nm">'+T[id].t+'</span><span class="tt">'+esc(T[id].p)+'</span></span></span><span class="n">'+p.liga+'</span><span class="n">'+p.ucl+'</span><span class="n">'+p.lidl+'</span><span class="n pt">'+t+'</span></button>'}).join("")+'</div><p class="note">Solo cuentan los títulos. Toca un equipo para ver su palmarés completo con los subcampeonatos.</p>'}
function tvLidl(){
var P=pal(),b=lBase(),tor=lTor().slice().sort(function(a,c){return String(c.fecha||"").localeCompare(String(a.fecha||""))||(+c.id||0)-(+a.id||0)});
var ex=Object.keys(T).filter(function(i){return P[i].lidl>0}).sort(function(a,c){return P[c].lidl-P[a].lidl||T[a].t.localeCompare(T[c].t)});
var prev=Object.keys(b).reduce(function(s2,i){return s2+b[i]},0),mx=ex.length?P[ex[0]].lidl:1;
var h='<div class="tinfo" style="margin-top:0"><b>Torneo Lidl</b><p>Torneo de 4 u 8 jugadores que se juega cuando hay ganas, sin fecha fija. Para que sea oficial tiene que jugar al menos un excampeón, es decir, alguien que ya haya ganado un Lidl.</p></div>';
h+='<h2 class="sec-h">Excampeones</h2><div class="card soft">'+(ex.length?ex.map(function(id,i){return '<button class="it" data-t="'+id+'"><span class="ps">'+(i+1)+'</span>'+logo(id,"sm")+'<span><span class="nm">'+T[id].t+'</span><span class="bar"><i style="width:'+Math.max(4,P[id].lidl/mx*100)+'%"></i></span></span><span class="v">'+P[id].lidl+'</span></button>'}).join(""):'<div class="empty">Todavía no hay ningún campeón.</div>')+'</div>';
if(prev)h+='<p class="note">Antes de esta sección se jugaron <b>'+prev+'</b> torneos Lidl. De esos solo se guarda quién los ganó.</p>';
h+='<h2 class="sec-h">Torneos registrados</h2><div class="card soft">'+(tor.length?tor.map(function(x){
var ex2=(x.excampeones||[]).filter(function(i){return T[i]}).map(function(i){return T[i].p}).join(", ");
return '<div class="tl"><div class="mt">'+(x.fecha?esc(fmt(x.fecha)):"Sin fecha")+(x.formato?" · Torneo de "+(+x.formato):"")+'</div><div class="tlr"><span>🥇 '+tmn(x.campeon,"sm")+'</span>'+(T[x.subcampeon]?'<span>🥈 '+tmn(x.subcampeon,"sm")+'</span>':'')+'</div>'+
((x.semis||[]).filter(function(i){return T[i]}).length?'<div class="tt">Semifinalistas: '+x.semis.filter(function(i){return T[i]}).map(function(i){return T[i].t}).join(", ")+'</div>':'')+
(ex2?'<div class="tt">Excampeones presentes: '+esc(ex2)+'</div>':'')+(x.nota?'<div class="tt">'+esc(x.nota)+'</div>':'')+'</div>'}).join(""):'<div class="empty">Aún no hay torneos con todo el detalle. Los próximos aparecerán aquí.</div>')+'</div>';
return h}
function tvTem(L){
var S=sTem().slice().reverse(),cl=curClosed(L),maxN=S.reduce(function(m,x){return Math.max(m,+x.n||0)},0);
var h='<div class="card">';
if(!cl){var n=nPlayed();
var fin=n>=NMATCH,uc0=fin?uclRes(L):null;
h+='<div class="ts live"><div class="tsh"><b>Temporada '+(maxN+1)+'</b><span>'+(fin?'Liga terminada'+(uc0?'':' · Champions en juego'):n?'En juego · '+n+'/'+NMATCH+' partidos':'Por empezar')+'</span></div>'+
(fin?'<div class="tsl"><div><i>🏆 Campeón</i>'+tmn(L[0].id,"sm")+'<span class="tt">'+L[0].pts+' pts</span></div><div><i>2º</i>'+tmn(L[1].id)+'</div><div><i>3º</i>'+tmn(L[2].id)+'</div>'+(uc0?'<div><i>⭐ Champions</i>'+tmn(uc0.campeon,"sm")+'</div>':'')+'</div>':
n?'<div class="tsl"><div><i>Líder</i>'+tmn(L[0].id)+'<span class="tt">'+L[0].pts+' pts</span></div></div>':'<p class="tt" style="margin:8px 0 0">Cuando acabe la liga se guardará aquí con su campeón.</p>')+'</div>'}
h+=S.map(function(x){var o=x.liga.orden,c=x.champions;
return '<div class="ts"><div class="tsh"><b>Temporada '+esc(x.n)+'</b><span>'+(x.fecha?esc(fmt(x.fecha)):"")+'</span></div><div class="tsl">'+
'<div><i>🏆 Campeón</i>'+tmn(o[0],"sm")+'</div><div><i>2º</i>'+tmn(o[1])+'</div>'+(o[2]?'<div><i>3º</i>'+tmn(o[2])+'</div>':'')+
(c&&c.campeon?'<div><i>⭐ Champions</i>'+tmn(c.campeon,"sm")+'</div>'+(c.sub?'<div><i>Finalista</i>'+tmn(c.sub)+'</div>':''):'')+'</div>'+
(archOk(x)?'<button class="lnk" data-arch="'+(+x.n)+'">Ver temporada completa</button>':'')+'</div>'}).join("");
if(!S.length)h+='<div class="empty">Todavía no hay temporadas terminadas. Aquí quedará el campeón de cada Superliga Covirán y de cada Mercadona Champions League.</div>';
return h+'</div>'}
function renderTitulos(L){
$("tch").innerHTML=TSUB.map(function(t,i){return '<button data-ts="'+i+'" aria-pressed="'+(i===tsub)+'">'+t+'</button>'}).join("");
$("tv").innerHTML=[tvRank,tvPal,tvLidl,tvTem][tsub](L)}
$("tch").addEventListener("click",function(e){var i=e.target.getAttribute("data-ts");if(i===null)return;tsub=+i;renderTitulos(table())});

/* ---------- personajes: la ilustración de cada jugador como fondo transparente ---------- */
var CUT=0;
function artUrl(id){var f=(PL[id]||{}).foto;return okFoto(f)?'url("'+f+'")':""}
function artA(id){var u=artUrl(id);return ' data-art="'+id+'"'+(u?' style=\'--art:'+u+'\'':'')}
/* los puntos del podio cuentan hacia arriba al cargar */
function countUp(box){if(window.matchMedia&&matchMedia("(prefers-reduced-motion: reduce)").matches)return;
box.querySelectorAll(".cu").forEach(function(el){var to=+el.textContent;
function st(t){var k=Math.min(1,Math.max(0,(t-CUT)/1200)),e=1-Math.pow(1-k,3);el.textContent=Math.round(to*e);if(k<1)requestAnimationFrame(st)}requestAnimationFrame(st)})}
/* ---------- evolución: puesto de cada equipo jornada a jornada ---------- */
var EVC=["var(--acc)","#3d8bff","var(--trophy)","var(--win)"],evoSel=null,EVO=null;
function evo(){if(EVO)return EVO;var n=0;allM().forEach(function(x){if(x.v&&x.j+1>n)n=x.j+1});
var P={};Object.keys(T).forEach(function(i){P[i]=[]});
for(var j=0;j<n;j++)table(j).forEach(function(r,i){P[r.id].push(i+1)});
return EVO={n:n,P:P}}
function evoSvg(E,sel,small){
var ids=Object.keys(T),nT=ids.length,W=400,H=small?190:290,l=24,r=small?12:44,t=10,b=22,iw=W-l-r,ih=H-t-b,g='';
function X(j){return l+(E.n>1?j/(E.n-1)*iw:iw/2)}
function Y(p){return t+(nT>1?(p-1)/(nT-1)*ih:ih/2)}
function path(id){return E.P[id].map(function(p,j){return(j?"L":"M")+X(j).toFixed(1)+" "+Y(p).toFixed(1)}).join("")}
for(var p=1;p<=nT;p++){g+='<line class="eg" x1="'+l+'" x2="'+(W-r)+'" y1="'+Y(p).toFixed(1)+'" y2="'+Y(p).toFixed(1)+'"/>';if(!small||p===1||p===nT)g+='<text class="ey" x="'+(l-5)+'" y="'+(Y(p)+4).toFixed(1)+'">'+p+'º</text>'}
for(var j=0;j<E.n;j++)if(E.n<=12||j%2===0)g+='<text class="ex" x="'+X(j).toFixed(1)+'" y="'+(H-6)+'">'+(j+1)+'</text>';
if(!small)ids.forEach(function(id){if(sel.indexOf(id)<0)g+='<path class="eo" d="'+path(id)+'"/>'});
sel.forEach(function(id,i){if(!E.P[id])return;var c=EVC[i%EVC.length],pts=E.P[id];
g+='<path class="es" style="stroke:'+c+'" d="'+path(id)+'"/>';
pts.forEach(function(p,j){var tx=T[id].t+' · jornada '+(j+1)+': '+p+'º';g+='<circle cx="'+X(j).toFixed(1)+'" cy="'+Y(p).toFixed(1)+'" r="'+(small?2.5:3.2)+'" style="fill:'+c+';stroke:transparent;stroke-width:10" data-pt="'+esc(tx)+'"><title>'+esc(tx)+'</title></circle>'});
if(!small&&pts.length)g+='<image href="'+esc(crest(id))+'" x="'+(X(E.n-1)+7).toFixed(1)+'" y="'+(Y(pts[pts.length-1])-8.5).toFixed(1)+'" width="28" height="17" preserveAspectRatio="xMidYMid slice"/>'});
return '<svg class="evo" viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Evolución del puesto en la tabla por jornada">'+g+'</svg>'}
/* sin elección del usuario se siguen los 3 primeros de la tabla */
function evoCur(L){return(evoSel||L.slice(0,3).map(function(r){return r.id})).filter(function(i){return T[i]})}
function renderEvo(L){L=L||table();var E=evo(),sel=evoCur(L);
$("evch").innerHTML=L.map(function(r){var i=sel.indexOf(r.id),c=i>=0?EVC[i%EVC.length]:"";return '<button type="button" data-ev="'+r.id+'" aria-pressed="'+(i>=0)+'"'+(c?' style="border-color:'+c+'"':'')+'>'+logo(r.id,"xs")+T[r.id].t+'</button>'}).join("");
$("evo").innerHTML=E.n>1?evoSvg(E,sel,false)+'<p class="note" id="evoi" style="margin:4px 6px;min-height:1.3em"></p>':'<div class="empty">La gráfica aparece cuando haya al menos dos jornadas con resultados.</div>'}
function toggleEvo(id){evoSel=evoCur(table());var i=evoSel.indexOf(id);if(i>=0)evoSel.splice(i,1);else{evoSel.push(id);if(evoSel.length>4)evoSel.shift()}renderEvo()}
$("evo").addEventListener("click",function(e){var c=e.target.closest?e.target.closest("[data-pt]"):null;if(c&&$("evoi"))$("evoi").textContent=c.getAttribute("data-pt")});

/* ---------- comparador cara a cara ---------- */
var cmpA=null,cmpB=null;
function renderCmp(L){
var ids=Object.keys(T);if(ids.length<2){$("cmp").innerHTML="";return}
/* sin elección del usuario: 1º contra 2º de la tabla actual */
var a=T[cmpA]?cmpA:L[0].id,b=T[cmpB]&&cmpB!==a?cmpB:(L[0].id===a?L[1].id:L[0].id),A=agg(),P=pal(),pos={},row={};L.forEach(function(r,i){pos[r.id]=i+1;row[r.id]=r});
var ra=row[a],rb=row[b],aa=A[a],ab=A[b];
var legs=allM().filter(function(x){return(x.h===a&&x.a===b)||(x.h===b&&x.a===a)}),jug=legs.filter(function(x){return x.v});
var wa=0,wb=0,de=0;jug.forEach(function(x){var p=persp(x,a);if(p.r==="w")wa++;else if(p.r==="l")wb++;else de++});
function av(s,q){return s.n?s.s[q]/s.n:null}
function pp(s){return s.s.pas?s.s.pac/s.s.pas*100:null}
/* [nombre, valor 1, valor 2, decimales, 0 más es mejor | 1 menos es mejor | 2 neutro, unidad] */
var M=[["Posición",pos[a],pos[b],0,1,"º"],["Puntos",ra.pts,rb.pts],["Victorias",ra.pg,rb.pg],["Empates",ra.pe,rb.pe,0,2],["Derrotas",ra.pp,rb.pp,0,1],["Goles a favor",ra.gf,rb.gf],["Goles en contra",ra.gc,rb.gc,0,1],["Puntos por partido",ra.pj?ra.pts/ra.pj:null,rb.pj?rb.pts/rb.pj:null,2],["Mejor racha",ra.best,rb.best],["MVP de jornada",mvpCount(a),mvpCount(b)]];
var S=[["Posesión media",av(aa,"pos"),av(ab,"pos"),0,0,"%"],["Tiros por partido",av(aa,"tir"),av(ab,"tir"),1],["Tiros a puerta",av(aa,"tpu"),av(ab,"tpu"),1],["Precisión de pase",pp(aa),pp(ab),0,0,"%"],["Paradas por partido",av(aa,"par"),av(ab,"par"),1],["Intercepciones",av(aa,"int"),av(ab,"int"),1],["Entradas",av(aa,"ent"),av(ab,"ent"),1]];
var Tt=[["Superliga",P[a].liga,P[b].liga],["Champions",P[a].ucl,P[b].ucl],["Torneos Lidl",P[a].lidl,P[b].lidl]];
function w(v,o,m){if(v==null)return 0;if(m===1){var mn=Math.min(v,o==null?v:o);return v===0?100:Math.max(6,mn/v*100)}var mx=Math.max(v,o||0);return mx?v/mx*100:0}
function bars(rows){return rows.filter(function(q){return q[1]!=null||q[2]!=null}).map(function(q){
var l=q[1],v=q[2],d=q[3]||0,m=q[4]||0,u=q[5]||"",tie=m===2||l==null||v==null||l===v,bl=!tie&&(m===1?l<v:l>v),bv=!tie&&!bl;
function f(x){return x==null?"–":fx(x,d)+u}
return '<div class="ms"><div class="l3"><b class="'+(bl?"hi":"")+'">'+f(l)+'</b><span>'+q[0]+'</span><b class="'+(bv?"hi":"")+'">'+f(v)+'</b></div><div class="sbar"><div><i class="'+(bl?"on":"")+'" style="width:'+w(l,v,m)+'%"></i></div><div><i class="'+(bv?"on":"")+'" style="width:'+w(v,l,m)+'%"></i></div></div></div>'}).join("")}
function o(sel){return ids.map(function(i){return '<option value="'+i+'"'+(i===sel?" selected":"")+'>'+esc(T[i].t)+' · '+esc(T[i].p)+'</option>'}).join("")}
var h='<div class="cmpsel"><select id="cmpa" aria-label="Primer equipo">'+o(a)+'</select><span>vs</span><select id="cmpb" aria-label="Segundo equipo">'+o(b)+'</select></div>';
h+='<div class="cmph"><button class="tm art" data-t="'+a+'"'+artA(a)+'>'+logo(a)+nmp(a)+'</button><span class="bal">'+wa+'-'+wb+'<small>'+(jug.length?'Victorias'+(de?' · '+de+' empate'+(de>1?'s':''):''):'Aún no se han enfrentado')+'</small></span><button class="tm art" data-t="'+b+'"'+artA(b)+'>'+logo(b)+nmp(b)+'</button></div>';
h+='<div class="fbox"><h4>Partidos entre ellos</h4>'+legs.map(function(x){
if(!x.v)return '<div class="hl"><span class="j">J'+(x.j+1)+'</span><span class="o"><span>'+T[x.h].t+' – '+T[x.a].t+'</span></span><span class="s">–</span><span></span></div>';
var p=persp(x,a);return '<button class="hl" data-m="'+x.key+'"><span class="j">J'+(x.j+1)+'</span><span class="o">'+logo(x.h,"xs")+'<span>'+T[x.h].t+' – '+T[x.a].t+'</span></span><span class="s">'+x.v[0]+'-'+x.v[1]+'</span><span class="wl '+p.r+'">'+{w:"V",d:"E",l:"D"}[p.r]+'</span></button>'}).join("")+
'<p class="note" style="margin:6px 0 0">V, E y D desde el punto de vista de '+T[a].t+'.</p></div>';
h+='<div class="fbox"><h4>Temporada</h4>'+bars(M)+'</div>';
if(aa.n||ab.n)h+='<div class="fbox"><h4>Promedios eFootball</h4>'+bars(S)+'</div>';
h+='<div class="fbox"><h4>Títulos</h4>'+bars(Tt)+'</div>';
var E=evo();if(E.n>1)h+='<div class="fbox"><h4>Evolución</h4>'+evoSvg(E,[a,b],true)+'<p class="note" style="margin:4px 0 0"><span style="color:'+EVC[0]+'">■</span> '+T[a].t+' &nbsp; <span style="color:'+EVC[1]+'">■</span> '+T[b].t+'</p></div>';
$("cmp").innerHTML=h}
$("cmp").addEventListener("change",function(e){if(e.target.id!=="cmpa"&&e.target.id!=="cmpb")return;cmpA=$("cmpa").value;cmpB=$("cmpb").value;renderCmp(table())});

/* ---------- archivo de temporadas: ver una temporada pasada entera ---------- */
var T0=T,V0=V1,ARCH=null,CUR={res:null,po:null,go:null,cd:null};
function setCal(eq,cal){T=eq&&typeof eq==="object"&&Object.keys(eq).length>1?eq:T0;var v=Array.isArray(cal)&&cal.length?cal:V0;
J=[];v.forEach(function(s){J.push(parse(s,false))});v.forEach(function(s){J.push(parse(s,true))});
NMATCH=J.reduce(function(s,r){return s+r.ms.length},0);cur=0;EVO=null}
function useRes(d){d=d||{};fecha=d.actualizado||"";R={};ST={};
(d.resultados||[]).forEach(function(x){if(!T[x.local]||!T[x.visitante])return;var key=k(x.j-1,x.local,x.visitante);R[key]=[n0(x.gl),n0(x.gv)];if(x.st&&x.st.l&&x.st.v)ST[key]=x.st});
MVP=d.mvp&&typeof d.mvp==="object"?d.mvp:{};UCL=d.champions&&typeof d.champions==="object"?d.champions:{};EVO=null}
function archOk(x){return!!x&&typeof x.archivo==="string"&&/^temporadas\/[A-Za-z0-9_-]+\.json$/.test(x.archivo)}
function verTemporada(n){var s=sTem().filter(function(x){return+x.n===n&&archOk(x)})[0];if(!s)return;closeSheet();
getJ(s.archivo).then(function(d){ARCH={n:n};setCal(d.equipos,d.calendario);useRes(d.resultados);
PO=Array.isArray(d.cronicas)?d.cronicas:[];GO=Array.isArray(d.goles)?d.goles:[];CD=d.condis&&typeof d.condis==="object"?d.condis:{ganador:null,nominados:[]};
evoSel=null;cmpA=cmpB=null;document.body.classList.add("arch");$("err").hidden=true;renderAll();tab(1)})
.catch(function(){var e=$("err");e.hidden=false;e.textContent="No se ha podido abrir el archivo de la temporada "+n+"."})}
function volverActual(){ARCH=null;setCal(null,null);useRes(CUR.res);PO=CUR.po||[];GO=CUR.go||[];CD=CUR.cd||{ganador:null,nominados:[]};
evoSel=null;cmpA=cmpB=null;document.body.classList.remove("arch");$("err").hidden=true;renderAll();tab(1)}
function curN(){var mx=0;sTem().forEach(function(x){mx=Math.max(mx,+x.n||0)});return curClosed(table())?mx:mx+1}
$("tsel").addEventListener("change",function(){var v=this.value;if(v)verTemporada(+v);else volverActual()});

/* ---------- configuración, base de datos (Supabase), inscripciones y donaciones ---------- */
var CFG={},VIS=null;
function dbOk(){var s=CFG.supabase||{};return okUrl(s.url)&&typeof s.anonKey==="string"&&s.anonKey.length>20}
function db(path,body,minimal){var s=CFG.supabase,h={"apikey":s.anonKey,"Content-Type":"application/json"};
if(/^eyJ/.test(s.anonKey))h.Authorization="Bearer "+s.anonKey;if(minimal)h.Prefer="return=minimal";
return fetch(s.url.replace(/\/+$/,"")+path,{method:"POST",headers:h,body:JSON.stringify(body||{})}).then(function(r){if(!r.ok)throw new Error(r.status);return r.text().then(function(t){return t?JSON.parse(t):null})})}
/* cuenta una visita por navegador y día; el resto de veces solo lee el total */
function contarVisita(){if(!dbOk())return;var d=new Date(),hoy=d.getFullYear()+"-"+(d.getMonth()+1)+"-"+d.getDate(),nueva=lsGet("sl-vis")!==hoy;
db(nueva?"/rest/v1/rpc/sumar_visita":"/rest/v1/rpc/total_visitas").then(function(n){if(nueva)lsSet("sl-vis",hoy);VIS=+n||0;renderFootLinks()}).catch(function(){})}
function donUrl(){var u=CFG.donaciones&&CFG.donaciones.url;return okUrl(u)?u:""}
function renderDon(){var u=donUrl(),d=CFG.donaciones||{};
$("don").innerHTML=u?'<div class="don"><span class="k">Apoya la liga</span><b>'+esc(d.titulo||"Invita a un café ☕")+'</b><p>'+esc(d.texto||"La web, los premios y los torneos los montamos entre colegas. Si te mola la liga, cualquier ayuda suma.")+'</p><a class="lnk" href="'+esc(u)+'" target="_blank" rel="noopener">Donar ↗</a></div>':''}
function renderFootLinks(){var u=donUrl();
$("ftl").innerHTML='<button type="button" data-ins>Apúntate</button>'+(u?'<a href="'+esc(u)+'" target="_blank" rel="noopener">Donar</a>':'')+(VIS!=null?'<span>👀 '+VIS.toLocaleString("es-ES")+(VIS===1?' visita':' visitas')+'</span>':'')}
function formIns(){var c=CFG.inscripciones||{};
if(c.abiertas===false)return '<h3 class="fti">Inscripciones cerradas</h3><p class="tt">Ahora mismo no buscamos jugadores. Vuelve a mirar cuando acabe la temporada.</p>';
return '<div class="mj">Inscripciones abiertas</div><h3 class="fti">Apúntate a '+esc(c.titulo||"la próxima temporada")+'</h3><p class="tt">Rellena el formulario y los organizadores te escriben para confirmar tu plaza.</p>'+
'<form id="insf" class="frm" novalidate>'+
'<label>Nombre<input name="nombre" maxlength="60" required autocomplete="name"></label>'+
'<label>Usuario de eFootball<input name="usuario" maxlength="40" required autocomplete="off"></label>'+
'<label>Equipo que te gustaría llevar (opcional)<input name="equipo" maxlength="40"></label>'+
'<label>Contacto: WhatsApp, Instagram o correo<input name="contacto" maxlength="80" required></label>'+
'<label>¿Algo más? (opcional)<textarea name="mensaje" maxlength="400"></textarea></label>'+
'<input class="hp" name="web" tabindex="-1" autocomplete="off" aria-hidden="true">'+
'<label class="ck"><input type="checkbox" name="ok" required><span>Acepto que los organizadores guarden estos datos solo para gestionar la liga y contactarme.</span></label>'+
'<button class="cta" type="submit">Enviar inscripción</button><p class="fmsg" id="insm" role="status"></p></form>'}
document.addEventListener("submit",function(e){if(e.target.id!=="insf")return;e.preventDefault();
var f=e.target,m=$("insm");function v(n){return(f.elements[n].value||"").trim()}
function say(t,c){m.textContent=t;m.className="fmsg "+(c||"")}
if(v("web")){say("¡Hecho! Tu inscripción ha llegado.","ok");f.reset();return}
if(v("nombre").length<2||v("usuario").length<2||v("contacto").length<3){say("Rellena nombre, usuario y contacto.","bad");return}
if(!f.elements.ok.checked){say("Marca la casilla para poder guardar tus datos.","bad");return}
if(!dbOk()){say("Las inscripciones aún no están conectadas. Avisa a los organizadores por el grupo.","bad");return}
var b=f.querySelector("button[type=submit]");b.disabled=true;say("Enviando…");
db("/rest/v1/inscripciones",{nombre:v("nombre"),usuario:v("usuario"),equipo:v("equipo")||null,contacto:v("contacto"),mensaje:v("mensaje")||null},true)
.then(function(){f.reset();say("¡Hecho! Tu inscripción ha llegado. Te escribiremos pronto.","ok")})
.catch(function(){say("No se ha podido enviar. Inténtalo otra vez en un rato.","bad")}).then(function(){b.disabled=false})});
function sheetHtml(s){return s.type==="t"?ficha(s.id):s.type==="i"?formIns():s.type==="u"?ucSheet(s.id):/^[lan]$/.test(s.type)?(window.Com?Com.sheet(s.type):""):matchSheet(s.id)}

/* ---------- tema, banda de archivo y pie ---------- */
var TEMI={auto:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 0 0 16z" fill="currentColor"/></svg>',
claro:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
oscuro:'<svg viewBox="0 0 24 24"><path d="M20 14.5A8 8 0 0 1 9.5 4a8 8 0 1 0 10.5 10.5z"/></svg>'};
var TEMN={auto:"automático",claro:"claro",oscuro:"oscuro"};
function renderTema(){var b=$("tema"),nx={auto:"claro",claro:"oscuro",oscuro:"auto"}[TEMA];
b.innerHTML=TEMI[TEMA]+'<span>'+{auto:"Auto",claro:"Claro",oscuro:"Oscuro"}[TEMA]+'</span>';
b.setAttribute("aria-label","Tema "+TEMN[TEMA]+". Pulsa para cambiar a "+TEMN[nx]);b.title=b.getAttribute("aria-label")}
function renderExtras(){var S=sTem().filter(archOk);
$("archb").innerHTML=ARCH?'<div class="archb" role="status"><span>📚 Estás viendo el archivo de la <b>Temporada '+ARCH.n+'</b></span><button class="cta" id="archx" type="button">Volver a la actual</button></div>':'';
$("tsw").hidden=!S.length;
if(S.length)$("tsel").innerHTML='<option value="">Temporada actual</option>'+S.slice().reverse().map(function(x){return '<option value="'+(+x.n)+'"'+(ARCH&&ARCH.n===+x.n?" selected":"")+'>Temporada '+esc(x.n)+'</option>'}).join("");
$("ft").textContent="Superliga Covirán · "+(ARCH?"Temporada "+ARCH.n+" (archivo)":"Temporada "+curN());
renderDon();renderTema();renderFootLinks()}

/* ---------- navegación y carga ---------- */
function renderAll(){
for(var q=0;q<J.length;q++){if(!doneJ(q)){cur=q;break}}
EVO=null;var L=table();
$("upd").textContent=fecha?"Actualizado el "+fmt(fecha)+".":"";
renderProg();renderAviso(L);renderNext();renderChamp(L);renderTable(L);renderUCL(L);renderInstall();
renderChips();renderJ();renderStats(L);renderPlayers(L);renderPosts();renderGoals();renderTitulos(L);
renderEvo();renderCmp(L);renderExtras();
if(curSheet&&curSheet.type!=="i"&&$("sh").open)$("shb").innerHTML=sheetHtml(curSheet)}
var NAMES=["tabla","jornadas","stats","jugadores","cronicas","golazos","titulos","champions"],NT=NAMES.length,OLD={calendario:2,resultados:2};
function tab(n,keep){
for(var i=1;i<=NT;i++){$("v"+i).hidden=n!==i;$("t"+i).setAttribute("aria-selected",n===i)}
if(n===2)renderChips();
if(n===6||n===1)document.querySelectorAll("#v6 video,#v1 video").forEach(function(v){if(v.preload==="none")v.preload="metadata"});
if(!keep){try{history.replaceState(null,"","#"+NAMES[n-1])}catch(e){}window.scrollTo(0,0)}}
for(var q2=1;q2<=NT;q2++){(function(i){$("t"+i).addEventListener("click",function(){tab(i)})})(q2)}
var hs=(location.hash||"").slice(1),h0=NAMES.indexOf(hs);
if(h0>0)tab(h0+1,true);else if(OLD[hs])tab(OLD[hs],true);
function getJ(u){return fetch(u,{cache:"no-cache"}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json()})}
/* los datos de la temporada actual se guardan en CUR para poder volver desde el archivo */
var pJug=getJ("jugadores.json").then(function(d){PL=d||{}}).catch(function(){});
getJ("resultados.json").then(function(d){CUR.res=d;return pJug.then(function(){if(ARCH)return;useRes(d);renderAll()})}).catch(function(){
var e=$("err");e.hidden=false;e.textContent="No se han podido cargar los resultados. Recarga la página en un momento."});
pJug.then(function(){return getJ("cronicas.json")}).then(function(d){CUR.po=(d&&d.cronicas)||[];if(!ARCH){PO=CUR.po;renderPosts()}}).catch(function(){});
pJug.then(function(){return getJ("goles.json")}).then(function(d){CUR.go=(d&&d.goles)||[];if(!ARCH){GO=CUR.go;renderAll()}}).catch(function(){});
pJug.then(function(){return getJ("titulos.json")}).then(function(d){if(d&&typeof d==="object"){TI=d;renderAll()}}).catch(function(){});
pJug.then(function(){return getJ("condis.json")}).then(function(d){if(d&&typeof d==="object"){CUR.cd=d;if(!ARCH){CD=d;renderAll()}}}).catch(function(){});
getJ("config.json").then(function(d){CFG=d&&typeof d==="object"?d:{};renderExtras();contarVisita();if(window.Com)Com.init()}).catch(function(){});
if("serviceWorker" in navigator&&location.protocol==="https:"){window.addEventListener("load",function(){navigator.serviceWorker.register("sw.js").catch(function(){})})}
