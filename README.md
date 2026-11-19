# JUUN.J — Editorial Fashion Store v3.1

Node.js + Express storefront with a RU/EN interface and a live multi-brand catalogue adapter.

## Run locally

1. Install Node.js 18+.
2. Extract the ZIP and open the project folder in VS Code.
3. Run `npm install`.
4. Copy `.env.example` to `.env`.
5. Add your Catalog API key to `.env` as `CATALOG_API_KEY=...`.
6. Run `npm start` and open `http://localhost:3000`.

## Live multi-brand catalogue

The server calls Catalog API's Agentic Search endpoint (`POST https://api.getcatalog.ai/v1/agentic-search`). The key stays on the Node.js server and is never exposed to the browser. Search is available for Nike, Adidas, Jordan, Balenciaga, Stone Island and other brands covered by the provider. Use the brand selector and search field in the Collection section.

**Important:** live data is not active until you obtain and add a valid API key. Without a key, the site deliberately displays the local demo catalogue and marks it as demo. Live prices, retailer links and stock are displayed only when the provider returns those fields. Stock may be absent for some products. The live catalogue is a product-discovery layer; checkout and payment are not connected. Live products open on the original retailer's website instead of pretending JUUN.J is the seller.

API provider documentation: https://catalog.mintlify.app/v1/quickstart

## Languages

Use the RU / EN button in the header. The selection is saved in localStorage and applies to navigation, hero, collection controls, catalogue status, cart, search, newsletter and footer.

## Notes

- Local demo products keep the layout functional before API setup.
- Real product availability depends on the upstream catalogue and retailer response.
- Never commit `.env` or share your API key publicly.
