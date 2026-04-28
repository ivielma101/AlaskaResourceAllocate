# Arctic Allocation

## Getting started

Set the Google Maps API key as an environment variable before running the dev server or build:

```bash
export VITE_GOOGLE_MAPS_API_KEY="<your-google-maps-key>"
npm install
npm run dev
```

The development server runs on <http://localhost:5173>. Click the map to set the incident location, Shift+Click to add staging areas,
and use the left-hand panels to manage demand, capacity, and saved scenarios.

## Available scripts

- `npm run dev` – Start the development server.
- `npm run build` – Type-check and build the production bundle.
- `npm run preview` – Preview the production build locally.
