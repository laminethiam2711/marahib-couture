/* Marahib Couture : administration. Les changements sont enregistrés dans le dépôt GitHub (data.json et images/). */
(function(){
  var esc=MC.esc,digits=MC.digits,safeUrl=MC.safeUrl,CATS=MC.CATS;
  var host=location.hostname.match(/^([\w-]+)\.github\.io$/);
  var OWNER=host?host[1]:'laminethiam2711';
  var REPO=(host&&location.pathname.split('/')[1])||'marahib-couture';
  var BRANCH='main', KEY='mc-gh-token';
  var token=null, state=null, draft=null, overlay=null, previews={};

  function b64text(t){return btoa(unescape(encodeURIComponent(t)));}
  function b64blob(blob){return new Promise(function(res,rej){var r=new FileReader();r.onload=function(){res(String(r.result).split(',')[1]);};r.onerror=rej;r.readAsDataURL(blob);});}
  async function api(method,path,body){
    var r=await fetch('https://api.github.com/repos/'+OWNER+'/'+REPO+'/'+path,{method:method,headers:{'Authorization':'Bearer '+token,'Accept':'application/vnd.github+json'},body:body?JSON.stringify(body):undefined});
    if(!r.ok){var e=new Error('HTTP '+r.status);e.status=r.status;throw e;}
    return r.json();
  }
  function errMsg(err){
    var s=err&&err.status;
    if(s===401)return 'Le jeton n\'est plus valide. Déconnectez-vous et collez un nouveau jeton.';
    if(s===403||s===404)return 'Ce jeton n\'a pas le droit de modifier le dépôt '+REPO+'. Vérifiez ses autorisations (Contents : Read and write).';
    if(s===409)return 'Le site a été modifié ailleurs entre-temps. Rechargez la page et recommencez.';
    if(s===422)return 'GitHub a refusé le fichier. Essayez une image plus petite.';
    return 'L\'enregistrement a échoué. Vérifiez votre connexion et réessayez.';
  }
  async function uploadImage(blob){
    var name='images/'+Date.now()+'-'+Math.random().toString(36).slice(2,7)+'.jpg';
    await api('PUT','contents/'+name,{message:'Ajout d\'une photo depuis l\'admin',branch:BRANCH,content:await b64blob(blob)});
    return name;
  }
  function clone(o){return JSON.parse(JSON.stringify(o));}
  function getP(o,p){return p.split('.').reduce(function(a,k){return a==null?a:a[k];},o);}
  function setP(o,p,v){var ks=p.split('.'),last=ks.pop(),t=ks.reduce(function(a,k){return a[k];},o);t[last]=v;}
  var NEW={models:function(){return {name:'Nouveau modèle',desc:'',photo:'',price:'',cat:'Homme'};},reviews:function(){return {name:'',text:''};},services:function(){return {name:'',price:''};},measures:function(){return {name:'',desc:''};}};

  async function shrink(file){
    try{
      var bmp=await createImageBitmap(file);
      var k=Math.min(1,1400/Math.max(bmp.width,bmp.height));
      var c=document.createElement('canvas');c.width=Math.round(bmp.width*k);c.height=Math.round(bmp.height*k);
      c.getContext('2d').drawImage(bmp,0,0,c.width,c.height);
      return await new Promise(function(r){c.toBlob(function(b){r(b||file);},'image/jpeg',0.85);});
    }catch(e){return file;}
  }
  function setStatus(msg,kind){var el=document.getElementById('adm-status');if(el){el.textContent=msg;el.className='status'+(kind?' '+kind:'');}}

  function fld(path,label,type,ph){var v=getP(draft,path);return '<div class="field"><label for="f-'+path+'">'+esc(label)+'</label><input id="f-'+path+'" data-f="'+path+'" type="'+(type||'text')+'" value="'+esc(v)+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+'></div>';}
  function area(path,label,ph){return '<div class="field"><label for="f-'+path+'">'+esc(label)+'</label><textarea id="f-'+path+'" data-f="'+path+'"'+(ph?' placeholder="'+esc(ph)+'"':'')+'>'+esc(getP(draft,path))+'</textarea></div>';}
  function sel(path,label,opts){var v=getP(draft,path);return '<div class="field"><label for="f-'+path+'">'+esc(label)+'</label><select id="f-'+path+'" data-f="'+path+'">'+opts.map(function(o){return '<option'+(o===v?' selected':'')+'>'+esc(o)+'</option>';}).join('')+'</select></div>';}
  function photo(path,cls,label){
    var raw=getP(draft,path),u=safeUrl(raw),src=previews[raw]||u;
    return '<div class="field"><label>'+esc(label||'Photo')+'</label><div class="thumb '+(cls||'')+'">'+(src?'<img src="'+esc(src)+'" alt="">':'')+'</div><div class="mini">'
      +(true?'<label class="btn btn-line file-btn">'+(u?'Changer':'Choisir')+'<input type="file" accept="image/*" data-up="'+path+'"></label>':'')
      +(u?'<button class="btn btn-danger" type="button" data-act="rmphoto" data-k="'+path+'">Retirer</button>':'')+'</div></div>';
  }
  function itemTools(list,i,n){
    return '<div class="mini"><button class="btn btn-line" type="button" data-act="up" data-l="'+list+'" data-k="'+i+'"'+(i===0?' disabled':'')+'>Monter</button>'
      +'<button class="btn btn-line" type="button" data-act="down" data-l="'+list+'" data-k="'+i+'"'+(i===n-1?' disabled':'')+'>Descendre</button>'
      +'<button class="btn btn-danger" type="button" data-act="del" data-l="'+list+'" data-k="'+i+'">Supprimer</button></div>';
  }

  function renderAdmin(){
    var d=draft,h='';
    h+='<div class="admin-bar"><div class="wrap"><strong>Administration</strong><div class="row">'
      +'<button class="btn btn-line" type="button" data-act="logout">Déconnexion</button><button class="btn btn-line" type="button" data-act="close">Voir le site</button>'
      +'<button class="btn btn-wa" type="button" data-act="save">Enregistrer</button></div></div></div>';
    h+='<div class="wrap"><nav class="admin-tabs"><a href="#a-entete">En-tête</a><a href="#a-modeles">Modèles et prix</a><a href="#a-delais">Délais</a><a href="#a-atelier">Atelier</a><a href="#a-galerie">Réalisations</a><a href="#a-avis">Avis</a><a href="#a-services">Services</a><a href="#a-mesures">Mesures</a><a href="#a-contact">Contact</a></nav><div class="admin-body">';
    h+='<p class="note">Rien ne change sur le site avant « Enregistrer ». Une section vide est cachée aux visiteurs. Les photos sont réduites automatiquement.</p>';
    h+='<div class="status" id="adm-status" aria-live="polite"></div>';
    
    h+='<div class="panel" id="a-entete"><h3>En-tête</h3><div class="two">'+fld('name','Nom de l\'atelier')+fld('sub','Sous-titre')+'</div>'
      +fld('tagline','Petite ligne au-dessus du nom')+area('lead','Texte d\'accueil')
      +area('wolof','Phrase en wolof (facultatif)','Écrite par vous, elle s\'affiche sous le texte d\'accueil')
      +photo('heroPhoto','hthumb','Photo d\'accueil')+'</div>';

    h+='<div class="panel" id="a-modeles"><h3>Modèles et prix</h3>'+fld('modelsTitle','Titre de la section')+area('modelsSub','Texte sous le titre')
      +'<p class="note">Prix : écrivez un nombre (25000) ou un texte (« À partir de 25 000 F »). Laissez vide pour ne rien afficher. Si plusieurs catégories sont utilisées, des filtres apparaissent.</p>';
    d.models.forEach(function(m,i){
      h+='<div class="mrow">'+photo('models.'+i+'.photo','')+'<div style="display:grid;gap:10px;min-width:0">'
        +fld('models.'+i+'.name','Nom du modèle')+'<div class="two">'+fld('models.'+i+'.price','Prix','text','Ex. 25000')+sel('models.'+i+'.cat','Catégorie',CATS)+'</div>'
        +area('models.'+i+'.desc','Description')+itemTools('models',i,d.models.length)+'</div></div>';
    });
    h+='<div><button class="btn btn-main" type="button" data-act="add" data-l="models">Ajouter un modèle</button></div></div>';

    h+='<div class="panel" id="a-delais"><h3>Délais de confection</h3><div class="two">'+fld('delay','Délai habituel','text','Ex. 5 à 7 jours')+fld('festiveDelay','Délai en période de fêtes','text','Ex. Commandez 3 semaines avant')+'</div></div>';

    h+='<div class="panel" id="a-atelier"><h3>L\'atelier</h3>'+fld('aboutTitle','Titre')+area('aboutText','Présentation du tailleur et de l\'atelier','Depuis quand, son savoir-faire, ce qui le distingue…')+photo('aboutPhoto','sq','Photo du tailleur ou de l\'atelier')+'</div>';

    h+='<div class="panel" id="a-galerie"><h3>Réalisations</h3><p class="note">Photos de tenues déjà livrées.</p><div class="gal-admin">';
    d.gallery.forEach(function(u,i){h+='<div class="field"><div class="thumb sq"><img src="'+esc(previews[u]||safeUrl(u))+'" alt=""></div><div class="mini"><button class="btn btn-danger" type="button" data-act="del" data-l="gallery" data-k="'+i+'">Retirer</button></div></div>';});
    h+='</div>'+(true?'<div><label class="btn btn-main file-btn">Ajouter des photos<input type="file" accept="image/*" multiple data-up="gallery.+"></label></div>':'')+'</div>';

    h+='<div class="panel" id="a-avis"><h3>Avis de clients</h3><p class="note">Seulement de vrais avis, avec l\'accord du client.</p>';
    d.reviews.forEach(function(r,i){h+='<div class="mrow nophoto"><div style="display:grid;gap:10px;min-width:0">'+fld('reviews.'+i+'.name','Nom du client')+area('reviews.'+i+'.text','Son avis')+itemTools('reviews',i,d.reviews.length)+'</div></div>';});
    h+='<div><button class="btn btn-main" type="button" data-act="add" data-l="reviews">Ajouter un avis</button></div></div>';

    h+='<div class="panel" id="a-services"><h3>Autres services</h3><p class="note">Retouches, couture femme ou enfant, etc.</p>';
    d.services.forEach(function(r,i){h+='<div class="mrow nophoto"><div style="display:grid;gap:10px;min-width:0"><div class="two">'+fld('services.'+i+'.name','Service','text','Ex. Retouche')+fld('services.'+i+'.price','Prix','text','Ex. 2000')+'</div>'+itemTools('services',i,d.services.length)+'</div></div>';});
    h+='<div><button class="btn btn-main" type="button" data-act="add" data-l="services">Ajouter un service</button></div></div>';

    h+='<div class="panel" id="a-mesures"><h3>Guide des mesures</h3>'+area('measuresIntro','Introduction');
    d.measures.forEach(function(r,i){h+='<div class="mrow nophoto"><div style="display:grid;gap:10px;min-width:0">'+fld('measures.'+i+'.name','Mesure')+fld('measures.'+i+'.desc','Comment la prendre')+itemTools('measures',i,d.measures.length)+'</div></div>';});
    h+='<div><button class="btn btn-main" type="button" data-act="add" data-l="measures">Ajouter une mesure</button></div></div>';

    h+='<div class="panel" id="a-contact"><h3>Contact</h3><div class="two">'+fld('phone','Téléphone / WhatsApp','tel')+fld('place','Quartier')+'</div>'+fld('city','Ville')
      +fld('mapsUrl','Lien Google Maps de l\'atelier (facultatif)','url','Collez le lien « Partager » de Google Maps')
      +area('hours','Horaires (une ligne par jour)','Lundi – Samedi : 9h – 20h')
      +'<div class="two">'+fld('facebook','Facebook (lien)','url')+fld('instagram','Instagram (lien)','url')+'</div>'+fld('tiktok','TikTok (lien)','url')+'</div>';
    h+='</div></div>';
    var y=window.scrollY;overlay.innerHTML=h;window.scrollTo(0,y);
  }

  function onInput(e){var f=e.target.getAttribute('data-f');if(f)setP(draft,f,e.target.value);}
  async function onChange(e){
    if(e.target.getAttribute('data-f')){onInput(e);return;}
    var path=e.target.getAttribute('data-up');if(!path||!e.target.files||!e.target.files.length)return;
    var files=Array.prototype.slice.call(e.target.files);
    try{
      for(var i=0;i<files.length;i++){
        setStatus('Envoi de la photo'+(files.length>1?' '+(i+1)+'/'+files.length:'')+'…');
        var blob=await shrink(files[i]);var url=await uploadImage(blob);previews[url]=URL.createObjectURL(blob);
        if(path==='gallery.+')draft.gallery.push(url);else setP(draft,path,url);
      }
      renderAdmin();setStatus('Photo ajoutée. Pensez à enregistrer.','ok');
    }catch(err){renderAdmin();setStatus('La photo n\'a pas pu être envoyée ('+(err&&err.message||'erreur')+'). Essayez une image plus petite.','err');}
  }
  function onClick(e){
    var a=e.target.closest('.admin-tabs a');
    if(a){e.preventDefault();var t=document.getElementById(a.getAttribute('href').slice(1));if(t)t.scrollIntoView({block:'start'});return;}
    var b=e.target.closest('[data-act]');if(!b)return;
    var act=b.getAttribute('data-act'),l=b.getAttribute('data-l'),k=b.getAttribute('data-k'),i=+k,arr=l?draft[l]:null;
    if(act==='close'){location.href='./';return;}
    if(act==='logout'){try{localStorage.removeItem(KEY);}catch(x){}location.reload();return;}
    if(act==='save'){save(b);return;}
    if(act==='add'){arr.push(NEW[l]());renderAdmin();return;}
    if(act==='del'){if(b.getAttribute('data-confirm')){arr.splice(i,1);renderAdmin();}else{b.setAttribute('data-confirm','1');b.textContent='Confirmer';}return;}
    if(act==='up'&&i>0){var t1=arr[i];arr[i]=arr[i-1];arr[i-1]=t1;renderAdmin();return;}
    if(act==='down'&&i<arr.length-1){var t2=arr[i];arr[i]=arr[i+1];arr[i+1]=t2;renderAdmin();return;}
    if(act==='rmphoto'){setP(draft,k,'');renderAdmin();return;}
  }
  async function save(b){
    if(!digits(draft.phone)){setStatus('Indiquez un numéro de téléphone.','err');return;}
    b.disabled=true;setStatus('Enregistrement…');
    try{
      var clean=MC.normalize(draft);
      var cur=await api('GET','contents/data.json?ref='+BRANCH);
      await api('PUT','contents/data.json',{message:'Mise à jour du site depuis l\'admin',branch:BRANCH,sha:cur.sha,content:b64text(JSON.stringify(clean,null,2))});
      state=clean;b.disabled=false;
      setStatus('Enregistré. Le site sera à jour dans 1 à 2 minutes.','ok');
    }catch(err){b.disabled=false;setStatus(errMsg(err),'err');}
  }
  function openAdmin(){
    draft=clone(state);
    overlay=document.getElementById('admin');overlay.className='admin page';
    overlay.addEventListener('input',onInput);overlay.addEventListener('change',onChange);overlay.addEventListener('click',onClick);
    renderAdmin();
  }

  function loginScreen(msg){
    var el=document.getElementById('admin');el.className='wrap';
    el.innerHTML='<form class="login" id="login"><h1>Administration</h1><p class="note">Marahib Couture · dépôt '+esc(OWNER+'/'+REPO)+'</p>'
      +'<div class="field"><label for="tok">Jeton GitHub</label><input id="tok" type="password" autocomplete="current-password" placeholder="github_pat_…"></div>'
      +'<button class="btn btn-main" type="submit">Se connecter</button><div class="status'+(msg?' err':'')+'" id="adm-status">'+esc(msg||'')+'</div>'
      +'<ol><li>Sur github.com : Settings, Developer settings, Personal access tokens, Fine-grained tokens.</li><li>Choisissez seulement le dépôt '+esc(REPO)+'.</li><li>Permission « Contents » : Read and write.</li><li>Copiez le jeton et collez-le ici. Il reste enregistré sur ce téléphone.</li></ol></form>';
    document.getElementById('login').addEventListener('submit',function(e){e.preventDefault();var v=document.getElementById('tok').value.trim();if(v)start(v);});
  }
  async function start(t){
    token=t;setStatus('Connexion…');
    try{
      var f=await api('GET','contents/data.json?ref='+BRANCH);
      state=MC.normalize(JSON.parse(decodeURIComponent(escape(atob(f.content.replace(/\n/g,''))))));
      try{localStorage.setItem(KEY,t);}catch(x){}
      openAdmin();
    }catch(err){try{localStorage.removeItem(KEY);}catch(x){}loginScreen(errMsg(err));}
  }
  var saved=null;try{saved=localStorage.getItem(KEY);}catch(x){}
  if(saved)start(saved);else loginScreen('');
})();
