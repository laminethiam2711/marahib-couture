/* Marahib Couture : données par défaut et rendu du site (partagé par le site et l'admin) */
var MC=(function(){
  var CATS=['Homme','Femme','Enfant','Mixte'];
  var DEFAULT_MEASURES=[
    {name:'Tour de cou',desc:'Autour de la base du cou, un doigt glissé sous le mètre.'},
    {name:'Largeur d\'épaules',desc:'D\'une pointe d\'épaule à l\'autre, en passant par le dos.'},
    {name:'Tour de poitrine',desc:'Sous les bras, à l\'endroit le plus fort, mètre bien horizontal.'},
    {name:'Tour de ventre',desc:'Au niveau du nombril, sans serrer.'},
    {name:'Tour de hanches',desc:'À l\'endroit le plus large du bassin.'},
    {name:'Longueur de manche',desc:'De la pointe de l\'épaule au poignet, bras légèrement plié.'},
    {name:'Longueur de la tenue',desc:'Du haut de l\'épaule jusqu\'où la tenue doit tomber.'},
    {name:'Longueur du pantalon',desc:'De la taille jusqu\'à la cheville, sur le côté.'},
    {name:'Tour de cuisse',desc:'Au plus large de la cuisse.'},
    {name:'Tour de bas',desc:'Largeur souhaitée en bas du pantalon.'}
  ];
  var DEFAULTS={name:'',sub:'',tagline:'',lead:'',wolof:'',heroPhoto:'',modelsTitle:'Faites votre choix',modelsSub:'',models:[],
    aboutTitle:'L\'atelier',aboutText:'',aboutPhoto:'',gallery:[],reviews:[],services:[],
    delay:'',festiveDelay:'',measuresIntro:'Vous ne pouvez pas passer à l\'atelier ? Prenez ces mesures avec un mètre ruban, en centimètres, et envoyez-les sur WhatsApp.',measures:DEFAULT_MEASURES,
    phone:'',place:'',city:'',hours:'',mapsUrl:'',facebook:'',instagram:'',tiktok:''};
  function normalize(s){
    var o={};Object.keys(DEFAULTS).forEach(function(k){o[k]=(s[k]===undefined)?JSON.parse(JSON.stringify(DEFAULTS[k])):s[k];});
    o.models=(o.models||[]).map(function(m){return {name:m.name||'',desc:m.desc||'',photo:m.photo||'',price:m.price||'',cat:m.cat||'Homme'};});
    o.reviews=(o.reviews||[]).map(function(r){return {name:r.name||'',text:r.text||''};});
    o.services=(o.services||[]).map(function(r){return {name:r.name||'',price:r.price||''};});
    o.measures=(o.measures||[]).map(function(r){return {name:r.name||'',desc:r.desc||''};});
    o.gallery=(o.gallery||[]).filter(function(u){return typeof u==='string'&&u;});
    return o;
  }
  function esc(s){return String(s==null?'':s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
  function digits(p){return String(p||'').replace(/\D/g,'');}
  function waNum(p){var d=digits(p);if(d.length===9)d='221'+d;return d;}
  function wa(p,msg){return 'https://wa.me/'+waNum(p)+(msg?'?text='+encodeURIComponent(msg):'');}
  function fmtPhone(p){var d=digits(p);return d.length===9?d.replace(/(\d{2})(\d{3})(\d{2})(\d{2})/,'$1 $2 $3 $4'):String(p||'');}
  function safeUrl(u){u=String(u||'').trim();return /^(https:\/\/|images\/[\w.-]+$)/.test(u)?u:'';}
  function webUrl(u){u=String(u||'').trim();if(!u)return '';if(!/^https?:\/\//.test(u))u='https://'+u;return /^https:\/\//.test(u)?u:u.replace(/^http:/,'https:');}
  function fullName(s){return (s.name+' '+s.sub).trim();}
  function priceTxt(p){p=String(p||'').trim();if(!p)return '';return /^\d[\d\s.]*$/.test(p)?Number(digits(p)).toLocaleString('fr-FR').replace(/ | /g,' ')+' F CFA':p;}
  function link(href,label,cls){return '<a class="'+cls+'" href="'+esc(href)+'" target="_blank" rel="noopener">'+label+'</a>';}

  function renderSite(s){
    var hp=safeUrl(s.heroPhoto), h='';
    var cats=[];s.models.forEach(function(m){if(m.cat&&cats.indexOf(m.cat)<0)cats.push(m.cat);});
    var hasAbout=s.aboutText||safeUrl(s.aboutPhoto), hasGal=s.gallery.length, hasRev=s.reviews.some(function(r){return r.text;}), hasSrv=s.services.some(function(r){return r.name;}), hasMes=s.measures.some(function(r){return r.name;});

    h+='<header class="hero'+(hp?' has-photo':'')+'"><div class="wrap"><div class="hero-text">';
    if(s.tagline)h+='<div class="loc">'+esc(s.tagline)+'</div>';
    h+='<h1>'+esc(s.name)+(s.sub?'<span>'+esc(s.sub)+'</span>':'')+'</h1>';
    if(s.lead)h+='<p class="lead">'+esc(s.lead)+'</p>';
    if(s.wolof)h+='<p class="wolof" lang="wo">'+esc(s.wolof)+'</p>';
    var facts=[];if(s.delay)facts.push('Prêt en '+s.delay);if(cats.length)facts.push(cats.join(' · '));if(s.place)facts.push(s.place);
    if(facts.length)h+='<ul class="facts">'+facts.map(function(f){return '<li>'+esc(f)+'</li>';}).join('')+'</ul>';
    h+='<div class="cta"><button class="btn btn-wa" type="button" data-order="">Commander</button>';
    h+='<a class="btn btn-ghost" href="#modeles">Voir les modèles</a></div></div>';
    if(hp)h+='<img class="hero-photo" src="'+esc(hp)+'" alt="'+esc(fullName(s))+'">';
    h+='</div></header>';

    h+='<nav class="nav" aria-label="Sections"><div class="wrap"><a href="#modeles">Modèles</a>';
    if(hasAbout)h+='<a href="#atelier">L\'atelier</a>';
    if(hasGal)h+='<a href="#realisations">Réalisations</a>';
    if(hasRev)h+='<a href="#avis">Avis</a>';
    if(hasSrv)h+='<a href="#services">Services</a>';
    if(hasMes)h+='<a href="#mesures">Mesures</a>';
    h+='<a href="#contact">Contact</a></div></nav><main>';

    h+='<section id="modeles"><div class="wrap"><h2>'+esc(s.modelsTitle)+'</h2>';
    if(s.modelsSub)h+='<p class="sub">'+esc(s.modelsSub)+'</p>';
    if(cats.length>1){h+='<div class="chips" role="group" aria-label="Filtrer les modèles"><button class="chip" type="button" data-cat="" aria-pressed="true">Tous</button>';
      cats.forEach(function(c){h+='<button class="chip" type="button" data-cat="'+esc(c)+'" aria-pressed="false">'+esc(c)+'</button>';});h+='</div>';}
    h+='<div class="grid" id="models">';
    s.models.forEach(function(m,i){
      var u=safeUrl(m.photo);
      h+='<article class="card" data-cat="'+esc(m.cat)+'"><div class="pic'+(u?'':' s'+(i%5))+'">'+(u?'<img src="'+esc(u)+'" alt="'+esc(m.name)+'" loading="lazy">':'')+(cats.length>1?'<span class="tag">'+esc(m.cat)+'</span>':'')+'</div>';
      h+='<div class="body"><h3>'+esc(m.name)+'</h3>'+(m.price?'<div class="price">'+esc(priceTxt(m.price))+'</div>':'')+(m.desc?'<p>'+esc(m.desc)+'</p>':'');
      h+='<button class="ask" type="button" data-order="'+i+'">Commander ce modèle →</button></div></article>';
    });
    h+='</div></div></section>';

    if(hasAbout){var ap=safeUrl(s.aboutPhoto);
      h+='<section class="alt" id="atelier"><div class="wrap about'+(ap?'':' no-photo')+'">'+(ap?'<img src="'+esc(ap)+'" alt="'+esc(s.aboutTitle)+'" loading="lazy">':'')
        +'<div><h2>'+esc(s.aboutTitle)+'</h2>'+(s.aboutText?'<p>'+esc(s.aboutText)+'</p>':'')+'</div></div></section>';}

    if(hasGal){h+='<section id="realisations"><div class="wrap"><h2>Nos réalisations</h2><p class="sub">Des tenues déjà livrées à nos clients.</p><div class="gallery">';
      s.gallery.forEach(function(u){u=safeUrl(u);if(u)h+='<img src="'+esc(u)+'" alt="Tenue réalisée par '+esc(fullName(s))+'" loading="lazy">';});h+='</div></div></section>';}

    if(hasRev){h+='<section class="alt" id="avis"><div class="wrap"><h2>Ils nous font confiance</h2><p class="sub">Ce que disent nos clients.</p><div class="reviews">';
      s.reviews.forEach(function(r){if(r.text)h+='<figure class="review"><blockquote>'+esc(r.text)+'</blockquote>'+(r.name?'<figcaption>'+esc(r.name)+'</figcaption>':'')+'</figure>';});h+='</div></div></section>';}

    if(hasSrv){h+='<section id="services"><div class="wrap"><h2>Autres services</h2><p class="sub">En plus de la confection sur mesure.</p><ul class="price-list">';
      s.services.forEach(function(r){if(r.name)h+='<li><span class="n">'+esc(r.name)+'</span><span class="dots"></span><span class="p">'+esc(priceTxt(r.price))+'</span></li>';});h+='</ul></div></section>';}

    h+='<section class="alt" id="comment"><div class="wrap"><h2>Comment commander</h2><p class="sub">De la prise de mesures à la tenue prête à porter.</p><ol class="steps">';
    h+='<li><strong>Choisissez le modèle</strong><span>Dans le catalogue ou d\'après une photo.</span></li>';
    h+='<li><strong>Prise de mesures</strong><span>À l\'atelier'+(s.place?' de '+esc(s.place):'')+', ou envoyez vos mesures.</span></li>';
    h+='<li><strong>Le tissu</strong><span>Apportez le vôtre, ou choisissez-le avec le tailleur.</span></li>';
    h+='<li><strong>Essayage et retrait</strong><span>On ajuste si besoin, puis vous récupérez votre tenue.</span></li></ol>';
    if(s.delay||s.festiveDelay){h+='<div class="delay">'+(s.delay?'<div><b>Délai habituel</b>'+esc(s.delay)+'</div>':'')+(s.festiveDelay?'<div><b>Période de fêtes</b>'+esc(s.festiveDelay)+'</div>':'')+'</div>';}
    h+='<div class="row" style="margin-top:24px"><button class="btn btn-wa" type="button" data-order="">Commander maintenant</button></div>';
    h+='</div></section>';

    if(hasMes){h+='<section class="alt" id="mesures"><div class="wrap"><h2>Guide des mesures</h2>'+(s.measuresIntro?'<p class="sub">'+esc(s.measuresIntro)+'</p>':'')+'<ol class="measures">';
      s.measures.forEach(function(r){if(r.name)h+='<li><div><strong>'+esc(r.name)+'</strong>'+(r.desc?'<span>'+esc(r.desc)+'</span>':'')+'</div></li>';});
      h+='</ol><p class="tip">Faites-vous aider : on se mesure mal tout seul. Gardez les vêtements légers et le mètre ni trop serré ni trop lâche.</p></div></section>';}

    var maps=webUrl(s.mapsUrl)||('https://www.google.com/maps/search/?api=1&query='+encodeURIComponent((s.name+' '+s.sub+' '+s.place+' '+s.city).trim()));
    h+='<section class="contact" id="contact"><div class="wrap cgrid"><div><div class="label">Téléphone et WhatsApp</div>';
    h+='<p class="phone" id="num">'+esc(fmtPhone(s.phone))+'</p><div class="row">'+link(wa(s.phone),'Écrire sur WhatsApp','btn btn-wa');
    h+='<button class="btn btn-line" id="copy" type="button">Copier le numéro</button></div><div class="toast" id="toast" aria-live="polite"></div></div>';
    h+='<div><div class="label">Atelier</div><p class="place">'+esc(s.place)+'</p><p style="color:var(--muted);margin:4px 0 12px">'+esc(s.city)+'</p>'+link(maps,'Voir sur la carte','btn btn-line')+'</div>';
    if(s.hours)h+='<div><div class="label">Horaires</div><p class="hours">'+esc(s.hours)+'</p></div>';
    var soc=[['Facebook',s.facebook],['Instagram',s.instagram],['TikTok',s.tiktok]].filter(function(x){return webUrl(x[1]);});
    if(soc.length)h+='<div><div class="label">Suivez-nous</div><div class="socials">'+soc.map(function(x){return link(webUrl(x[1]),x[0],'btn btn-line');}).join('')+'</div></div>';
    h+='</div></section></main><footer id="foot">© '+new Date().getFullYear()+' '+esc(fullName(s))+(s.place?' · '+esc(s.place):'')+'</footer>';
    return h;
  }

  return {CATS:CATS,normalize:normalize,esc:esc,digits:digits,waNum:waNum,wa:wa,safeUrl:safeUrl,fullName:fullName,link:link,renderSite:renderSite};
})();
