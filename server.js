require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Local fallback keeps the storefront usable before an API key is configured.
const demoProducts = [
  {id:'demo-1',name:'Sculpted wool coat',brand:'JUUN.J STUDIO',category:'outerwear',price:420,currency:'USD',color:'Midnight',image:'https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=90',description:'A strong silhouette, softened by fluid tailoring.',url:'',availability:'Demo item'},
  {id:'demo-2',name:'The form blazer',brand:'JUUN.J STUDIO',category:'outerwear',price:360,currency:'USD',color:'Ink black',image:'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1000&q=90',description:'A precise shoulder and an oversized line.',url:'',availability:'Demo item'},
  {id:'demo-3',name:'Second skin knit',brand:'JUUN.J STUDIO',category:'tops',price:145,currency:'USD',color:'Stone',image:'https://images.unsplash.com/photo-1576566588028-4147f3842f27?auto=format&fit=crop&w=1000&q=90',description:'Soft knitwear with a clean architectural finish.',url:'',availability:'Demo item'},
  {id:'demo-4',name:'Volume shirt',brand:'JUUN.J STUDIO',category:'tops',price:180,currency:'USD',color:'Cloud',image:'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=1000&q=90',description:'An everyday shirt reworked with generous proportions.',url:'',availability:'Demo item'},
  {id:'demo-5',name:'Wide line trousers',brand:'JUUN.J STUDIO',category:'bottoms',price:230,currency:'USD',color:'Charcoal',image:'https://images.unsplash.com/photo-1506629905607-d9c297d3c5f3?auto=format&fit=crop&w=1000&q=90',description:'Long lines, easy movement.',url:'',availability:'Demo item'},
  {id:'demo-6',name:'Arc shoulder bag',brand:'JUUN.J STUDIO',category:'objects',price:275,currency:'USD',color:'Black',image:'https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1000&q=90',description:'A compact sculptural object.',url:'',availability:'Demo item'}
];

function first(...values) { return values.find(v => v !== undefined && v !== null && v !== ''); }
function findProductArray(data) {
  if (Array.isArray(data)) return data;
  if (!data || typeof data !== 'object') return [];
  for (const key of ['products','items','results','data','matches']) {
    const value = data[key];
    if (Array.isArray(value)) return value;
    if (value && typeof value === 'object') {
      const nested = findProductArray(value);
      if (nested.length) return nested;
    }
  }
  return [];
}
function normalizeProduct(p, i) {
  p = p.product && typeof p.product === 'object' ? {...p, ...p.product} : p;
  const priceValue = first(p.price, p.sale_price, p.current_price, p.display_price, p.offers?.[0]?.price, p.pricing?.price);
  const parsedPrice = typeof priceValue === 'number' ? priceValue : Number(String(priceValue || '').replace(/[^0-9.,]/g,'').replace(',','.'));
  const image = first(p.image, p.image_url, p.image_link, p.thumbnail, p.images?.[0]?.url, p.images?.[0]);
  const url = first(p.url, p.product_url, p.link, p.product_link, p.merchant_url, p.offers?.[0]?.url);
  const title = first(p.title, p.name, p.product_name, p.product?.title);
  if (!title || !image) return null;
  const brand = first(p.brand, p.brand_name, p.vendor, p.merchant, p.retailer, 'MULTI BRAND');
  const stock = first(p.availability, p.stock_status, p.in_stock === true ? 'In stock' : undefined, p.in_stock === false ? 'Out of stock' : undefined, p.inventory?.status);
  return {
    id: String(first(p.id, p.sku, p.product_id, `live-${i}-${title.slice(0,16)}`)),
    name: String(title), brand: String(brand), category: String(first(p.category, p.product_type, p.department, 'fashion')).toLowerCase(),
    price: Number.isFinite(parsedPrice) ? parsedPrice : null,
    currency: String(first(p.currency, p.price_currency, p.offers?.[0]?.currency, 'USD')),
    color: String(first(p.color, p.colour, '—')),
    image: typeof image === 'string' ? image : image?.url,
    description: String(first(p.description, p.short_description, 'Product details from the retailer.')),
    url: String(url || ''), availability: String(stock || 'Not provided by retailer'), source: 'live'
  };
}

app.get('/api/status', (_req,res) => res.json({provider:'Catalog API',configured:Boolean(process.env.CATALOG_API_KEY),mode:process.env.CATALOG_API_KEY?'live':'demo'}));
app.get('/api/products', async (req,res) => {
  const key = process.env.CATALOG_API_KEY;
  if (!key) return res.json({products:demoProducts,source:'demo',configured:false,message:'Add CATALOG_API_KEY to .env to enable live multi-brand search.'});
  const brand = String(req.query.brand || 'all').trim();
  const q = String(req.query.q || '').trim();
  const brandText = brand === 'all' ? 'Nike Adidas Jordan Balenciaga Stone Island fashion sneakers clothing' : `${brand} fashion sneakers clothing`;
  const query = [brandText, q].filter(Boolean).join(' ');
  try {
    const response = await fetch('https://api.getcatalog.ai/v1/agentic-search', {
      method:'POST', headers:{'Content-Type':'application/json','x-api-key':key},
      body:JSON.stringify({query}) , signal:AbortSignal.timeout(25000)
    });
    const data = await response.json().catch(()=>({}));
    if (!response.ok) return res.status(response.status).json({error:data.message || data.error || 'Catalog API request failed'});
    const products = findProductArray(data).map(normalizeProduct).filter(Boolean);
    res.json({products,source:'live',configured:true,total:first(data.meta?.totalItems,data.total,data.count,products.length),updatedAt:new Date().toISOString()});
  } catch (error) {
    res.status(502).json({error:`Live catalogue unavailable: ${error.message}`});
  }
});
app.listen(PORT, () => console.log(`JUUN.J → http://localhost:${PORT}`));
