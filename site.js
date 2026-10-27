/* Marahib Couture : affichage du site et fenêtre de commande */
(function(){
  var esc=MC.esc,wa=MC.wa,waNum=MC.waNum,safeUrl=MC.safeUrl,fullName=MC.fullName,link=MC.link,renderSite=MC.renderSite;
  var state=null;
  var order={model:0,fab:0};
  var FABS=['J\'apporte mon tissu','Je veux choisir le tissu avec le tailleur'];
  function orderMsg(){
    var g=function(id){var e=document.getElementById(id);return e?e.value.trim():'';};
    var m=state.models[order.model];
    var lines=['Bonjour '+fullName(state)+','];
    var n=g('o-name');lines.push((n?'Je m\'appelle '+n+'. ':'')+'Je voudrais commander : '+(m?m.name:'un autre modèle (je vous envoie une photo)')+'.');
    lines.push('Tissu : '+FABS[order.fab]+'.');
    var d=g('o-date');if(d){var p=d.split('-');lines.push('Pour le : '+p[2]+'/'+p[1]+'/'+p[0]+'.');}
    var o=g('o-occ');if(o)lines.push('Occasion : '+o+'.');
    var ms=g('o-mes');if(ms)lines.push('Mes mesures :\n'+ms);
    return lines.join('\n');
  }
  var sheet=null,lastFocus=null;
  function sheetHTML(){
    var s=state,h='<div class="sheet" role="dialog" aria-modal="true" aria-labelledby="o-title">';
    h+='<div class="sheet-head"><div><h2 id="o-title">Votre commande</h2><p>Le message WhatsApp se prépare tout seul.</p></div><button class="x" type="button" data-close aria-label="Fermer">×</button></div>';
    h+='<div class="sheet-body"><div><div class="step-t"><i>1</i>Choisissez le modèle</div><div class="tiles">';
    s.models.forEach(function(m,i){var u=safeUrl(m.photo);h+='<button type="button" class="tile" data-m="'+i+'" aria-pressed="'+(order.model===i)+'"><div class="pic'+(u?'':' s'+(i%5))+'">'+(u?'<img src="'+esc(u)+'" alt="">':'')+'</div><span>'+esc(m.name)+'</span></button>';});
    h+='<button type="button" class="tile" data-m="-1" aria-pressed="'+(order.model===-1)+'"><div class="pic" style="background:var(--line)"></div><span>Autre modèle</span></button></div></div>';
    h+='<div><div class="step-t"><i>2</i>Le tissu</div><div class="seg"><button type="button" data-fab="0" aria-pressed="'+(order.fab===0)+'">J\'apporte mon tissu</button><button type="button" data-fab="1" aria-pressed="'+(order.fab===1)+'">À choisir à l\'atelier</button></div></div>';
    h+='<div><div class="step-t"><i>3</i>Vos informations</div><div class="two-f">';
    h+='<div class="field"><label for="o-name">Votre nom</label><input id="o-name" autocomplete="name"></div>';
    h+='<div class="field"><label for="o-date">Pour quand ?</label><input id="o-date" type="date"></div>';
    h+='<div class="field"><label for="o-occ">Occasion (facultatif)</label><input id="o-occ" placeholder="Gamou, mariage, Tabaski…"></div></div>';
    h+='<div class="field" style="margin-top:12px"><label for="o-mes">Mes mesures (facultatif)</label><textarea id="o-mes" placeholder="Tour de cou : 40 cm&#10;Épaules : 46 cm…"></textarea></div></div>';
    h+='<div><div class="bubble-t">Votre message</div><p class="bubble" id="o-prev"></p></div></div>';
    h+='<div class="sheet-foot">'+link(wa(s.phone),'Envoyer sur WhatsApp','btn btn-wa" id="o-send')+'</div></div>';
    return h;
  }
  function updOrder(){
    if(!sheet)return;var msg=orderMsg();
    sheet.querySelector('#o-prev').textContent=msg;sheet.querySelector('#o-send').href=wa(state.phone,msg);
    sheet.querySelectorAll('[data-m]').forEach(function(t){t.setAttribute('aria-pressed',String(+t.getAttribute('data-m')===order.model));});
    sheet.querySelectorAll('[data-fab]').forEach(function(t){t.setAttribute('aria-pressed',String(+t.getAttribute('data-fab')===order.fab));});
  }
  function openOrder(i){
    lastFocus=document.activeElement;
    if(i!==''&&i!=null&&!isNaN(+i))order.model=+i;
    if(!sheet){
      sheet=document.createElement('div');sheet.className='sheet-wrap';sheet.innerHTML=sheetHTML();document.body.appendChild(sheet);
      sheet.addEventListener('click',function(e){
        if(e.target===sheet||e.target.closest('[data-close]')){closeOrder();return;}
        var t=e.target.closest('[data-m]');if(t){order.model=+t.getAttribute('data-m');updOrder();return;}
        var f=e.target.closest('[data-fab]');if(f){order.fab=+f.getAttribute('data-fab');updOrder();}
      });
      sheet.addEventListener('input',updOrder);sheet.addEventListener('change',updOrder);
      sheet.addEventListener('keydown',function(e){if(e.key==='Escape')closeOrder();});
    }
    sheet.hidden=false;document.body.style.overflow='hidden';updOrder();
    var sel=sheet.querySelector('[data-m][aria-pressed="true"]');if(sel&&sel.scrollIntoView)sel.scrollIntoView({block:'nearest'});
    sheet.querySelector('.x').focus();
  }
  function closeOrder(){if(sheet)sheet.hidden=true;document.body.style.overflow='';if(lastFocus&&lastFocus.focus)lastFocus.focus();}
  function mount(){
    document.getElementById('site').innerHTML=renderSite(state);
    document.title=fullName(state);
    var b=document.getElementById('copy');
    if(b)b.addEventListener('click',function(){
      var t=document.getElementById('toast');
      function sel(){var r=document.createRange();r.selectNodeContents(document.getElementById('num'));var s=getSelection();s.removeAllRanges();s.addRange(r);t.textContent='Numéro sélectionné, copiez-le.';}
      try{navigator.clipboard.writeText('+'+waNum(state.phone)).then(function(){t.textContent='Numéro copié.';},sel);}catch(e){sel();}
    });
    var chips=document.querySelectorAll('.chip');
    chips.forEach(function(c){c.addEventListener('click',function(){
      var v=c.getAttribute('data-cat');
      chips.forEach(function(x){x.setAttribute('aria-pressed',String(x===c));});
      document.querySelectorAll('#models .card').forEach(function(card){card.hidden=!!v&&card.getAttribute('data-cat')!==v;});
    });});
    document.getElementById('site').addEventListener('click',function(e){var b=e.target.closest('[data-order]');if(b)openOrder(b.getAttribute('data-order'));});
  }

  fetch('data.json?v='+Date.now(),{cache:'no-store'}).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .then(function(d){state=MC.normalize(d);mount();
      var taps=0,timer=null,ft=document.getElementById('foot');
      if(ft)ft.addEventListener('click',function(){taps++;clearTimeout(timer);timer=setTimeout(function(){taps=0;},1500);if(taps>=5)location.href='admin.html';});
    })
    .catch(function(){document.getElementById('site').innerHTML='<div class="wrap" style="padding-block:64px"><h2>Marahib Couture</h2><p class="sub">Le site n\'a pas pu se charger. Vérifiez votre connexion et rechargez la page.</p><p class="phone">77 703 19 34</p></div>';});
})();
