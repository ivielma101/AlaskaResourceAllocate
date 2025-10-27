# Arctic Allocation MVP

A lightweight simulation tool for placing an incident in Alaska, managing staging areas, and running a greedy allocation of resources. Built with React, TypeScript, Vite, Leaflet, Tailwind CSS, Zustand, and Zod.

## Getting started

```bash
npm install
npm run dev
```

The development server runs on <http://localhost:5173>. Click the map to set the incident location, Shift+Click to add staging areas, and use the left-hand panels to manage demand, capacity, and saved scenarios.

## Available scripts

- `npm run dev` – Start the development server.
- `npm run build` – Type-check and build the production bundle.
- `npm run preview` – Preview the production build locally.

## Features

- Tailwind-styled layout with controls on the left and a Leaflet map/results on the right.
- Incident placement, demand entry, and reset/demo controls.
- Staging area management with Shift+Click map placement, dragging, and panel edits.
- Greedy allocation summary with risk classification and customizable travel speed.
- Scenario save/load using browser `localStorage` with toast-style feedback.
