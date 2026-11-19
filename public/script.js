const fallbackProducts = [
 {id:1,name:"Sculpted wool coat",price:420,category:"outerwear",color:"Midnight",image:"https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=900&q=85",description:"A strong silhouette, softened by fluid tailoring. Made for the in-between moments."},
 {id:2,name:"The form blazer",price:360,category:"outerwear",color:"Ink black",image:"https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=85",description:"A precise shoulder and an oversized line. A new classic with a little attitude."},
 {id:3,name:"Second skin knit",price:145,category:"tops",color:"Stone",image:"https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=900&q=85",description:"Soft, close-fitting knitwear with a clean architectural finish."},
 {id:4,name:"Volume shirt",price:180,category:"tops",color:"Cloud",image:"https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=85",description:"An everyday shirt reworked with generous proportions and crisp cotton."},
 {id:5,name:"Wide line trousers",price:230,category:"bottoms",color:"Charcoal",image:"https://images.unsplash.com/photo-1506629905607-d9c297d3c5f3?auto=format&fit=crop&w=900&q=85",description:"Long lines, easy movement. Tailoring that does not stand still."},
 {id:6,name:"Arc shoulder bag",price:275,category:"objects",color:"Black",image:"https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=900&q=85",description:"A compact sculptural object designed to live beyond one season."}
];
const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
let products = [...fallbackProducts];
let cart = loadCart();
let activeFilter = 'all';
let activeProduct = null;

function loadCart(){ try { return JSON.parse(localStorage.getItem('juunj-cart') || '[]'); } catch { return []; } }
function saveCart(){ localStorage.setItem('juunj-cart', JSON.stringify(cart)); }
function money(value,currency='USD'){ return new Intl.NumberFormat(currentLanguage==='ru'?'ru-RU':'en-US',{style:'currency',currency:currency||'USD',maximumFractionDigits:0}).format(Number(value)||0); }
function toast(message){ const el=$('.toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2300); }

window.addEventListener('load',()=>setTimeout(()=>$('.preloader')?.classList.add('out'),900));

// Live multi-brand catalogue (Catalog API). Demo items remain as a fallback until an API key is added.
let catalogueSource = 'demo';
async function loadProducts(){
 const status=$('#catalog-status');
 if(status) status.textContent = currentLanguage==='ru' ? 'ЗАГРУЗКА КАТАЛОГА…' : 'LOADING CATALOGUE…';
 const brand=$('#brand-select')?.value || 'all';
 const query=$('#catalog-search')?.value || '';
 try {
  const response=await fetch(`/api/products?brand=${encodeURIComponent(brand)}&q=${encodeURIComponent(query)}`);
  const payload=await response.json();
  if(!response.ok) throw new Error(payload.error || 'Catalogue API error');
  products=Array.isArray(payload.products)?payload.products:[];
  catalogueSource=payload.source || 'demo';
  if(status) status.textContent = catalogueSource==='live'
   ? (currentLanguage==='ru'?'ЖИВОЙ КАТАЛОГ · ЦЕНЫ И НАЛИЧИЕ ПО ДАННЫМ МАГАЗИНОВ':'LIVE CATALOGUE · PRICES & STOCK FROM RETAILERS')
   : (currentLanguage==='ru'?'ДЕМО-КАТАЛОГ · ДОБАВЬТЕ API-КЛЮЧ ДЛЯ РЕАЛЬНЫХ ТОВАРОВ':'DEMO CATALOGUE · ADD API KEY FOR REAL PRODUCTS');
 } catch(error){
  console.warn(error); products=[];
  if(status) status.textContent=(currentLanguage==='ru'?'НЕ УДАЛОСЬ ЗАГРУЗИТЬ КАТАЛОГ: ':'CATALOGUE ERROR: ')+error.message;
 }
 renderProducts(); renderCart();
}
function renderProducts(){
 const grid=$('#product-grid'); if(!grid) return;
 const sort=$('#sort-select')?.value || 'newest';
 let list=products.filter(p=>activeFilter==='all'||String(p.category).toLowerCase().includes(activeFilter));
 const selectedBrand=$('#brand-select')?.value || 'all';
 if(selectedBrand!=='all') list=list.filter(p=>String(p.brand||'').toLowerCase().includes(selectedBrand.toLowerCase()));
 if(sort==='price-low') list.sort((a,b)=>(a.price??Infinity)-(b.price??Infinity));
 if(sort==='price-high') list.sort((a,b)=>(b.price??-Infinity)-(a.price??-Infinity));
 if(sort==='name') list.sort((a,b)=>a.name.localeCompare(b.name));
 if(sort==='newest') list.sort((a,b)=>String(a.id).localeCompare(String(b.id)));
 grid.innerHTML=list.map((p,index)=>`<article class="product-card" data-category="${p.category}" data-id="${p.id}">
  <button class="product-image" type="button" data-view="${encodeURIComponent(p.id)}" aria-label="View ${p.name}">
   <img src="${p.image}" alt="${p.name}" loading="lazy"><span class="product-index">${String(index+1).padStart(2,'0')}</span>
   ${p.source==='live'?'<span class="product-badge">LIVE PRODUCT</span>':''}
   <span class="quick-view">${currentLanguage==='ru'?'ПОДРОБНЕЕ':'QUICK VIEW'} <b>↗</b></span>
  </button><div class="product-meta"><div><h3>${p.name}</h3><p>${String(p.brand||'').toUpperCase()} / ${String(p.category||'').toUpperCase()}</p></div><strong>${p.price==null?(currentLanguage==='ru'?'ЦЕНА НА САЙТЕ':'VIEW PRICE'):money(p.price,p.currency)}</strong></div>
  ${p.availability?`<span class="product-source">${p.availability}</span>`:''}
 </article>`).join('') || `<p class="no-results">${currentLanguage==='ru'?'ТОВАРЫ НЕ НАЙДЕНЫ. ИЗМЕНИТЕ ФИЛЬТРЫ.':'NO PRODUCTS FOUND. CHANGE YOUR FILTERS.'}</p>`;
 $('#product-count').textContent=`${String(list.length).padStart(2,'0')} ${currentLanguage==='ru'?'ТОВАРОВ':'PRODUCTS'}`;
}

// Cursor effect is enabled only on devices with a real pointer.
if(matchMedia('(hover:hover) and (pointer:fine)').matches){
 const dot=$('.cursor'),ring=$('.cursor-follower'); let x=innerWidth/2,y=innerHeight/2,rx=x,ry=y;
 addEventListener('mousemove',e=>{x=e.clientX;y=e.clientY;dot.style.left=x+'px';dot.style.top=y+'px'});
 function follow(){rx+=(x-rx)*.16;ry+=(y-ry)*.16;ring.style.left=rx+'px';ring.style.top=ry+'px';requestAnimationFrame(follow)} follow();
 document.addEventListener('mouseover',e=>{if(e.target.closest('a,button,select'))ring.classList.add('hover')});
 document.addEventListener('mouseout',e=>{if(e.target.closest('a,button,select'))ring.classList.remove('hover')});
}

const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target)}}),{threshold:.12});
$$('.reveal,.image-reveal').forEach(el=>observer.observe(el));
addEventListener('scroll',()=>{const max=document.documentElement.scrollHeight-innerHeight;$('.scroll-progress').style.width=(max>0?scrollY/max*100:0)+'%'},{passive:true});

// Filters and sorting
$$('.filter').forEach(btn=>btn.addEventListener('click',()=>{$$('.filter').forEach(b=>b.classList.remove('active'));btn.classList.add('active');activeFilter=btn.dataset.filter;renderProducts()}));
$('#sort-select')?.addEventListener('change',renderProducts);
$('#brand-select')?.addEventListener('change',loadProducts);
$('#catalog-search-button')?.addEventListener('click',loadProducts);
$('#catalog-search')?.addEventListener('keydown',e=>{if(e.key==='Enter')loadProducts()});

// Animated navigation
$('.menu-open')?.addEventListener('click',()=>{ $('.menu-overlay').classList.add('open'); document.body.classList.add('lock'); });
function closeMenu(){ $('.menu-overlay')?.classList.remove('open'); document.body.classList.remove('lock'); }
$('.menu-close')?.addEventListener('click',closeMenu);
$$('.menu-overlay nav a').forEach(a=>a.addEventListener('click',closeMenu));

// Shopping bag: quantity controls and contents persist after refresh.
function renderCart(){
 const count=cart.reduce((n,p)=>n+p.qty,0); $$('.bag-count').forEach(el=>el.textContent=count);
 const list=$('.cart-list'); if(!list)return;
 if(!cart.length){list.innerHTML=`<p class="empty-bag">${currentLanguage==='ru'?'Корзина пуста. Найдите что-нибудь своё.':'Your bag is empty. Find something that feels like you.'}</p>`;}
 else list.innerHTML=cart.map(p=>`<div class="cart-row"><img src="${p.image}" alt=""><div class="cart-row-info"><h4>${p.name}</h4><p>${money(p.price,p.currency)} · ${currentLanguage==='ru'?'РАЗМЕР':'SIZE'} ${p.size}</p><div class="qty-control"><button data-qty="-1" data-id="${p.id}" data-size="${p.size}" aria-label="Decrease quantity">−</button><span>${p.qty}</span><button data-qty="1" data-id="${p.id}" data-size="${p.size}" aria-label="Increase quantity">+</button></div></div><button class="remove-item" data-remove="${p.id}" data-size="${p.size}" aria-label="Remove ${p.name}">×</button></div>`).join('');
 $('#subtotal').textContent=money(cart.reduce((n,p)=>n+(Number(p.price)||0)*p.qty,0),cart[0]?.currency||'USD');
}
function addCart(id,size){const p=products.find(x=>String(x.id)===String(id));if(!p)return;const old=cart.find(x=>String(x.id)===String(id)&&x.size===size);if(old)old.qty++;else cart.push({...p,size,qty:1});saveCart();renderCart();closeModal();document.body.classList.add('cart-open','lock');toast(currentLanguage==='ru'?'ДОБАВЛЕНО В КОРЗИНУ':'ADDED TO YOUR BAG');}
$('.bag-open')?.addEventListener('click',()=>{document.body.classList.add('cart-open','lock');renderCart()});
function closeCart(){document.body.classList.remove('cart-open','lock')}
$('.cart-close')?.addEventListener('click',closeCart);$('.cart-shade')?.addEventListener('click',closeCart);
$('.cart-list')?.addEventListener('click',e=>{
 const qty=e.target.closest('[data-qty]'); const remove=e.target.closest('[data-remove]');
 if(qty){const item=cart.find(p=>String(p.id)===qty.dataset.id&&p.size===qty.dataset.size);if(item){item.qty+=Number(qty.dataset.qty);if(item.qty<=0)cart=cart.filter(p=>p!==item);}}
 if(remove)cart=cart.filter(p=>!(String(p.id)===remove.dataset.remove&&p.size===remove.dataset.size));
 saveCart();renderCart();
});

// Product quick view with size selection.
function openProduct(id){
 const p=products.find(x=>String(x.id)===String(id));if(!p)return;activeProduct=p;
 const isLive=p.source==='live';
 $('.modal-content').innerHTML=`<img src="${p.image}" alt="${p.name}"><div class="modal-details"><span class="eyebrow">${String(p.brand||'').toUpperCase()} / ${String(p.category||'').toUpperCase()}</span><h2>${p.name}</h2><p>${p.description||''}</p><p>${currentLanguage==='ru'?'НАЛИЧИЕ':'AVAILABILITY'} / ${p.availability||'—'}</p><strong>${p.price==null?(currentLanguage==='ru'?'ЦЕНА НА САЙТЕ':'VIEW PRICE'):money(p.price,p.currency)}</strong>${isLive?`<a class="product-outbound" href="${p.url||'#'}" target="_blank" rel="noopener noreferrer">${currentLanguage==='ru'?'ОТКРЫТЬ У ПРОДАВЦА ↗':'VIEW AT RETAILER ↗'}</a>`:`<div class="size-label">${currentLanguage==='ru'?'ВЫБРАТЬ РАЗМЕР':'SELECT SIZE'} <span>${currentLanguage==='ru'?'ОБЯЗАТЕЛЬНО':'REQUIRED'}</span></div><div class="size-options"><button type="button" class="size-option active" data-size="S">S</button><button type="button" class="size-option" data-size="M">M</button><button type="button" class="size-option" data-size="L">L</button><button type="button" class="size-option" data-size="XL">XL</button></div><button id="modal-add">${currentLanguage==='ru'?'ДОБАВИТЬ В КОРЗИНУ ↗':'ADD TO BAG ↗'}</button>`}</div>`;
 $('.quick-modal').classList.add('open');document.body.classList.add('lock');
 $$('.size-option').forEach(b=>b.addEventListener('click',()=>{$$('.size-option').forEach(x=>x.classList.remove('active'));b.classList.add('active')}));
 $('#modal-add')?.addEventListener('click',()=>addCart(id,$('.size-option.active')?.dataset.size||'M'));
}
function closeModal(){$('.quick-modal').classList.remove('open');if(!document.body.classList.contains('cart-open'))document.body.classList.remove('lock')}
$('#product-grid')?.addEventListener('click',e=>{const btn=e.target.closest('[data-view]');if(btn)openProduct(decodeURIComponent(btn.dataset.view))});
$('.modal-close')?.addEventListener('click',closeModal);

// Search uses the same product data as the collection.
$('.search-open')?.addEventListener('click',()=>{$('.search-panel').classList.add('open');document.body.classList.add('lock');$('#search-input').focus()});
$('.search-close')?.addEventListener('click',()=>{$('.search-panel').classList.remove('open');document.body.classList.remove('lock')});
$('#search-input')?.addEventListener('input',e=>{
 const q=e.target.value.toLowerCase().trim();const matches=products.filter(p=>p.name.toLowerCase().includes(q)||p.category.includes(q));
 $('.search-results').innerHTML=matches.map(p=>`<button type="button" data-search-view="${p.id}">${p.name} — ${p.price==null?'':money(p.price,p.currency)} <span>↗</span></button>`).join('')||`<p class="no-results">${currentLanguage==='ru'?'НИЧЕГО НЕ НАЙДЕНО. ПОПРОБУЙТЕ ДРУГОЙ ЗАПРОС.':'NO PIECES FOUND. TRY ANOTHER SEARCH.'}</p>`;
});
$('.search-results')?.addEventListener('click',e=>{const b=e.target.closest('[data-search-view]');if(!b)return;$('.search-panel').classList.remove('open');document.body.classList.remove('lock');openProduct(b.dataset.searchView);});

$('#newsletter-form')?.addEventListener('submit',e=>{e.preventDefault();$('#newsletter-note').textContent=currentLanguage==='ru'?'СПАСИБО — ВЫ В СПИСКЕ.':'THANK YOU — YOU’RE ON THE LIST.';e.target.reset();toast(currentLanguage==='ru'?'ВЫ В СПИСКЕ':'YOU’RE ON THE LIST')});
$('.checkout')?.addEventListener('click',()=>toast(currentLanguage==='ru'?'ДЕМО-МАГАЗИН — ОПЛАТА НЕ ПОДКЛЮЧЕНА':'DEMO STORE — CHECKOUT IS NOT CONNECTED'));
document.addEventListener('keydown',e=>{if(e.key==='Escape'){closeMenu();closeCart();closeModal();$('.search-panel')?.classList.remove('open');document.body.classList.remove('lock')}});
loadProducts();


// Complete RU / EN interface. Choice persists between visits.
const translations = {
 en:{nav:['COLLECTION','CAMPAIGN','ART OBJECTS','JOURNAL','ABOUT'],search:'SEARCH',bag:'BAG',kicker:'NEW CAMPAIGN / 001',hero:'<span>PERSONA</span><span class="outline-word">IN</span><span>MOTION<span class="asterisk">*</span></span>',heroCaption:'Clothing as an extension<br>of identity. Never a uniform.',discover:'DISCOVER<br>THE CAMPAIGN',scroll:'SCROLL TO EXPLORE',artTop:'03 / OBJECTS IN MOTION',artKicker:'FORM MEETS MOVEMENT',artTitle:'THE FALL<br>OF <em>ORDINARY.</em>',artDesc:'A study of contrast. Classical form, street energy and objects that refuse to stay still.',artLink:'DISCOVER THE OBJECTS',artBottom:'CLASSIC / REBUILT',collection:'THE<br><em>COLLECTION</em><sup>06</sup>',collectionSub:'Not seasonal noise.<br>Pieces with a point of view.',campaignTitle:'BEYOND<br>THE <em>EXPECTED.</em>',manifesto:'WEAR<br>YOUR<br><em>OWN</em><br>RULES<span>.</span>',journal:'BEHIND<br><em>THE FORM.</em>',newsletter:'THE NEXT<br><em>CHAPTER.</em>',brand:'BRAND',sort:'SORT BY',filters:['ALL PIECES','OUTERWEAR','TOPS','BOTTOMS','OBJECTS'],sorts:['NEWEST FIRST','PRICE: LOW TO HIGH','PRICE: HIGH TO LOW','NAME A–Z'],bagTitle:'YOUR BAG',emptyBag:'Your bag is empty. Find something that feels like you.',subtotal:'SUBTOTAL',checkout:'CONTINUE TO CHECKOUT ↗',searchPrompt:'WHAT ARE YOU LOOKING FOR?',searchPlaceholder:'Search the collection...',close:'CLOSE ×',subscribe:'SUBSCRIBE',newsletterNote:'NO NOISE. JUST THE GOOD STUFF.'},
 ru:{nav:['КОЛЛЕКЦИЯ','КАМПАНИЯ','АРТ-ОБЪЕКТЫ','ЖУРНАЛ','О НАС'],search:'ПОИСК',bag:'КОРЗИНА',kicker:'НОВАЯ КАМПАНИЯ / 001',hero:'<span>ЛИЧНОСТЬ</span><span class="outline-word">В</span><span>ДВИЖЕНИИ<span class="asterisk">*</span></span>',heroCaption:'Одежда — продолжение<br>личности. Не униформа.',discover:'СМОТРЕТЬ<br>КАМПАНИЮ',scroll:'ЛИСТАЙТЕ ВНИЗ',artTop:'03 / ОБЪЕКТЫ В ДВИЖЕНИИ',artKicker:'ФОРМА ВСТРЕЧАЕТ ДВИЖЕНИЕ',artTitle:'ПАДЕНИЕ<br><em>ОБЫЧНОГО.</em>',artDesc:'Игра контрастов. Классическая форма, энергия улиц и предметы, которые не стоят на месте.',artLink:'СМОТРЕТЬ ОБЪЕКТЫ',artBottom:'КЛАССИКА / ПЕРЕОСМЫСЛЕНИЕ',collection:'НАША<br><em>КОЛЛЕКЦИЯ</em><sup>06</sup>',collectionSub:'Не просто сезонные вещи.<br>У каждой свой характер.',campaignTitle:'ЗА ГРАНЬЮ<br><em>ОЖИДАНИЙ.</em>',manifesto:'НОСИ<br>СВОИ<br><em>СОБСТВЕННЫЕ</em><br>ПРАВИЛА<span>.</span>',journal:'ЗА КУЛИСАМИ<br><em>ФОРМЫ.</em>',newsletter:'СЛЕДУЮЩАЯ<br><em>ГЛАВА.</em>',brand:'БРЕНД',sort:'СОРТИРОВКА',filters:['ВСЕ ТОВАРЫ','ВЕРХНЯЯ ОДЕЖДА','ТОПЫ','БРЮКИ','АКСЕССУАРЫ'],sorts:['СНАЧАЛА НОВЫЕ','ЦЕНА: ПО ВОЗРАСТАНИЮ','ЦЕНА: ПО УБЫВАНИЮ','НАЗВАНИЕ А–Я'],bagTitle:'ВАША КОРЗИНА',emptyBag:'Корзина пуста. Найдите что-нибудь своё.',subtotal:'ИТОГО',checkout:'ПЕРЕЙТИ К ОФОРМЛЕНИЮ ↗',searchPrompt:'ЧТО ИЩЕМ?',searchPlaceholder:'Поиск по коллекции...',close:'ЗАКРЫТЬ ×',subscribe:'ПОДПИСАТЬСЯ',newsletterNote:'НИЧЕГО ЛИШНЕГО. ТОЛЬКО ВАЖНОЕ.'}
};
let currentLanguage=localStorage.getItem('juunj-language')||'en';
function setLanguage(lang){
 currentLanguage=lang;localStorage.setItem('juunj-language',lang);const t=translations[lang];document.documentElement.lang=lang;
 const nav=$$('.main-nav a');t.nav.forEach((label,i)=>{if(nav[i])nav[i].innerHTML=label+' <sup>0'+(i+1)+'</sup>'});
 const menu=$$('.menu-overlay nav a');t.nav.forEach((label,i)=>{if(menu[i])menu[i].innerHTML='<i>0'+(i+1)+'</i> '+label});
 $('.lang-toggle').textContent=lang==='en'?'RU':'EN';$('.search-open').textContent=t.search;$('.bag-open').childNodes[0].textContent=t.bag+' ';
 $('.hero-kicker').textContent=t.kicker;$('.hero-title').innerHTML=t.hero;$('.hero-caption p').innerHTML=t.heroCaption;$('.round-link').innerHTML=t.discover+' <b>↘</b>';$('.hero-bottom-note span:first-child').textContent=t.scroll;
 $('.art-topline span:first-child').textContent=t.artTop;$('.art-copy .eyebrow').textContent=t.artKicker;$('.art-copy h2').innerHTML=t.artTitle;$('.art-description').textContent=t.artDesc;$('.art-link').innerHTML=t.artLink+' <b>↗</b>';$('.art-bottomline span:first-child').textContent=t.artBottom;
 $('.collection-heading h2').innerHTML=t.collection;$('.collection-heading>p').innerHTML=t.collectionSub;$('.campaign-copy h2').innerHTML=t.campaignTitle;$('.manifesto-content h2').innerHTML=t.manifesto;$('.journal-heading h2').innerHTML=t.journal;$('.newsletter-inner h2').innerHTML=t.newsletter;
 const filterLabels=t.filters;$$('.filter').forEach((b,i)=>{const sup=b.querySelector('sup')?.outerHTML||'';b.innerHTML=filterLabels[i]+(i===0&&lang==='en'?' <sup>06</sup>':'')});
 const sortLabel=$('.sort-control span[data-i18n="sort"]');if(sortLabel)sortLabel.textContent=t.sort;const brandLabel=$('.sort-control span[data-i18n="brand"]');if(brandLabel)brandLabel.textContent=t.brand;
 const sortOptions=$$('#sort-select option');t.sorts.forEach((v,i)=>{if(sortOptions[i])sortOptions[i].textContent=v});
 $('.drawer-head h3').childNodes[0].textContent=t.bagTitle+' ';$('.cart-close').textContent=t.close;$('.empty-bag').textContent=t.emptyBag;$('.drawer-total>div span').textContent=t.subtotal;$('.checkout').textContent=t.checkout;
 $('.search-panel .eyebrow').textContent=t.searchPrompt;$('#search-input').placeholder=t.searchPlaceholder;$('.search-close').textContent=t.close;$('#newsletter-form button').innerHTML=t.subscribe+' <span>↗</span>';$('#newsletter-note').textContent=t.newsletterNote;
 const bodyCopy=$('.campaign-copy .body-copy');if(bodyCopy)bodyCopy.textContent=lang==='ru'?'Исследование формы, индивидуальности и пространства между структурой и свободой. В этом сезоне привычные силуэты разбираются на части и собираются заново.':'An exploration of shape, identity and the space between structure and freedom. This season, familiar silhouettes are taken apart and put back together.';
 const manifestoCopy=$('.manifesto-content>p:not(.eyebrow)');if(manifestoCopy)manifestoCopy.textContent=lang==='ru'?'Мы верим, что самое интересное, что можно носить, — это быть собой. JUUN.J — пространство экспериментов, где классика встречается с новой энергией.':'We believe the most interesting thing you can wear is yourself. JUUN.J is a space for experimentation — where classic codes meet a different kind of energy.';
 const journalLink=$('.journal-heading .text-link');if(journalLink)journalLink.textContent=lang==='ru'?'СЛЕДИТЕ ЗА ИСТОРИЕЙ ↗':'FOLLOW THE STORY ↗';
 const newsletterCopy=$('.newsletter-inner>p:not(.eyebrow)');if(newsletterCopy)newsletterCopy.textContent=lang==='ru'?'Новые коллекции, кампании и заметки из студии.':'New drops, campaigns and notes from the studio.';
 const menuClose=$('.menu-close');if(menuClose)menuClose.textContent=t.close;
 const menuFooter=$('.menu-overlay>span');if(menuFooter)menuFooter.textContent=lang==='ru'?'СЕУЛ / ВЕСЬ МИР':'SEOUL / EVERYWHERE';
 const footerLinks=$$('.footer-links a');['SHOP','ABOUT','JOURNAL','CONTACT'].forEach((v,i)=>{if(footerLinks[i])footerLinks[i].textContent=lang==='ru'?['МАГАЗИН','О НАС','ЖУРНАЛ','КОНТАКТЫ'][i]:v});
 const footerSocial=$$('.footer-social a');if(lang==='ru')footerSocial.forEach((a,i)=>a.textContent=(i===0?'ИНСТАГРАМ':'ПИНТЕРЕСТ')+' ↗');else footerSocial.forEach((a,i)=>a.textContent=(i===0?'INSTAGRAM':'PINTEREST')+' ↗');
 const catalogSearch=$('#catalog-search');if(catalogSearch)catalogSearch.placeholder=lang==='ru'?'Поиск Nike, Adidas, Stone Island…':'Search Nike, Adidas, Stone Island…';const catalogSearchBtn=$('#catalog-search-button');if(catalogSearchBtn)catalogSearchBtn.textContent=lang==='ru'?'ПОИСК ↗':'SEARCH ↗';
 renderProducts();renderCart();
}
$('.lang-toggle')?.addEventListener('click',()=>setLanguage(currentLanguage==='en'?'ru':'en'));
setLanguage(currentLanguage);
