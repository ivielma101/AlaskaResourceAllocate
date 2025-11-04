import { useEffect, useMemo, useRef } from 'react';
import L, { Control, LatLngLiteral, Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSimulationStore } from '@/app/store';
import { findHospitalsWithinRadius, HOSPITAL_SEARCH_RADIUS_KM } from '@/lib/hospitals';
import { formatKilometers, formatMinutes } from '@/lib/numberFormat';
import type { RiskLevel } from '@/types/domain';
import type { IconTheme } from '@/app/store';

const ALASKA_CENTER: LatLngLiteral = { lat: 64.2, lng: -149.5 };
const ALASKA_BOUNDS = L.latLngBounds(L.latLng(50.0, -179.0), L.latLng(72.0, -120.0));

const RISK_COLOR_THEMES: Record<IconTheme, Record<RiskLevel, string>> = {
  classic: {
    Low: '#047857',
    Medium: '#b45309',
    High: '#b91c1c'
  },
  contrast: {
    Low: '#2563eb',
    Medium: '#d946ef',
    High: '#f97316'
  }
};

const stagingFill: Record<IconTheme, string> = {
  classic: '#0ea5e9',
  contrast: '#6366f1'
};

const hospitalFill: Record<IconTheme, string> = {
  classic: '#0ea5e9',
  contrast: '#facc15'
};

const createIncidentIcon = (risk: RiskLevel | null, theme: IconTheme) => {
  const palette = RISK_COLOR_THEMES[theme];
  const color = risk ? palette[risk] : '#0f172a';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path fill="${color}" d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.09 12 7.42 12.3a1 1 0 0 0 1.16 0C12.91 22 20 15.25 20 10c0-4.42-3.58-8-8-8Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;
  return L.icon({
    iconUrl: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  });
};

const createStagingIcon = (theme: IconTheme) =>
  L.icon({
    iconUrl:
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"><path d="M12 2a7 7 0 0 1 7 7c0 4.2-3.11 9.15-6.35 12.55a1 1 0 0 1-1.3 0C8.11 18.15 5 13.2 5 9a7 7 0 0 1 7-7Zm0 9.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z" fill="${stagingFill[theme]}"/></svg>`
      ),
    iconSize: [32, 32],
    iconAnchor: [16, 32]
  });

const createHospitalIcon = (theme: IconTheme) =>
  L.icon({
    iconUrl:
      'data:image/svg+xml;charset=UTF-8,' +
      encodeURIComponent(
        `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"><path fill="${hospitalFill[theme]}" d="M4 4.75A2.75 2.75 0 0 1 6.75 2h10.5A2.75 2.75 0 0 1 20 4.75v14.5A2.75 2.75 0 0 1 17.25 22H6.75A2.75 2.75 0 0 1 4 19.25V4.75Z"/><path fill="#0f172a" d="M11 7h2v3h3v2h-3v3h-2v-3H8v-2h3V7Z"/></svg>`
      ),
    iconSize: [28, 28],
    iconAnchor: [14, 28]
  });

const HOSPITAL_ICON = L.icon({
  iconUrl:
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none"><path fill="#0ea5e9" d="M4 4.75A2.75 2.75 0 0 1 6.75 2h10.5A2.75 2.75 0 0 1 20 4.75v14.5A2.75 2.75 0 0 1 17.25 22H6.75A2.75 2.75 0 0 1 4 19.25V4.75Z"/><path fill="#fff" d="M11 7h2v3h3v2h-3v3h-2v-3H8v-2h3V7Z"/></svg>'
    ),
  iconSize: [28, 28],
  iconAnchor: [14, 28]
});

// const ALASKA_CITIES: { name: string; location: LatLngLiteral }[] = [
//   { name: 'Anchorage', location: { lat: 61.2181, lng: -149.9003 } },
//   { name: 'Fairbanks', location: { lat: 64.8378, lng: -147.7164 } },
//   { name: 'Juneau', location: { lat: 58.3019, lng: -134.4197 } },
//   { name: 'Sitka', location: { lat: 57.0531, lng: -135.33 } },
//   { name: 'Bethel', location: { lat: 60.7922, lng: -161.7558 } },
//   { name: 'Nome', location: { lat: 64.5011, lng: -165.4064 } }
// ];

const createArrowIcon = (color: string, angle: number) =>
  L.divIcon({
    className: 'map-arrow',
    html: `<div class="map-arrow__chevron" style="--arrow-color:${color}; transform: rotate(${angle}deg);"></div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14]
  });

export const MapView = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const incidentMarkerRef = useRef<Marker | null>(null);
  const stagingMarkersRef = useRef<Map<string, Marker>>(new Map());
  const hospitalMarkersRef = useRef<Map<string, Marker>>(new Map());
  const cityLayerRef = useRef<L.LayerGroup | null>(null);
  const connectionLayerRef = useRef<L.LayerGroup | null>(null);
  const legendRef = useRef<Control | null>(null);

  const incident = useSimulationStore((state) => state.incident);
  const stagingAreas = useSimulationStore((state) => state.stagingAreas);
  const setIncidentLocation = useSimulationStore((state) => state.setIncidentLocation);
  const addStaging = useSimulationStore((state) => state.addStaging);
  const updateStaging = useSimulationStore((state) => state.updateStaging);
  const travelSpeedKph = useSimulationStore((state) => state.travelSpeedKph);
  const computeAllocation = useSimulationStore((state) => state.computeAllocation);
  const mapLayers = useSimulationStore((state) => state.mapLayers);
  const iconTheme = useSimulationStore((state) => state.iconTheme);
  const setSelectedFeature = useSimulationStore((state) => state.setSelectedFeature);

  const allocation = useMemo(() => computeAllocation(), [computeAllocation, incident, stagingAreas, travelSpeedKph]);
  const nearbyHospitals = useMemo(() => {
    if (!incident.location) return [];
    return findHospitalsWithinRadius(incident.location, HOSPITAL_SEARCH_RADIUS_KM);
  }, [incident.location]);

  const palette = useMemo(() => RISK_COLOR_THEMES[iconTheme], [iconTheme]);
  const stagingIcon = useMemo(() => createStagingIcon(iconTheme), [iconTheme]);
  const hospitalIcon = useMemo(() => createHospitalIcon(iconTheme), [iconTheme]);

  useEffect(() => {
    if (mapRef.current || !containerRef.current) {
      return;
    }

    const map = L.map(containerRef.current, {
      center: ALASKA_CENTER,
      zoom: 4,
      minZoom: 3,
      maxZoom: 10,
      maxBounds: ALASKA_BOUNDS,
      maxBoundsViscosity: 1.0,
      zoomControl: false
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    // map.attributionControl?.setPrefix(
    //   '<a href="https://leafletjs.com" title="A JS library for interactive maps">Leaflet</a>'
    // );

    L.control.zoom({ position: 'topright' }).addTo(map);
    map.createPane('connections');
    const connectionsPane = map.getPane('connections');
    if (connectionsPane) {
      connectionsPane.style.zIndex = '650';
      connectionsPane.style.pointerEvents = 'auto';
    }

    map.on('click', (event) => {
      const { latlng, originalEvent } = event;
      const isShift = originalEvent instanceof MouseEvent && originalEvent.shiftKey;
      if (isShift) {
        addStaging(latlng);
      } else {
        setIncidentLocation(latlng);
      }
    });

    mapRef.current = map;
  }, [addStaging, setIncidentLocation]);

  useEffect(() => {
    if (!mapRef.current) return;
    if (!connectionLayerRef.current) {
      connectionLayerRef.current = L.layerGroup().addTo(mapRef.current);
    }
  }, []);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!cityLayerRef.current) {
      const layer = L.layerGroup();
      ALASKA_CITIES.forEach((city) => {
        const marker = L.marker(city.location, {
          icon: L.divIcon({
            className: 'map-city-label',
            html: `<div>${city.name}</div>`,
            iconSize: [0, 0]
          }),
          interactive: true
        });
        marker.on('click', () => {
          setSelectedFeature({
            type: 'city',
            title: city.name,
            description: 'Regional population center',
            meta: [
              { label: 'Latitude', value: city.location.lat.toFixed(3) },
              { label: 'Longitude', value: city.location.lng.toFixed(3) }
            ]
          });
        });
        marker.bindTooltip(`<div class="map-tooltip__title">${city.name}</div>`, {
          direction: 'top',
          offset: [0, -18],
          opacity: 0.9,
          sticky: true,
          className: 'map-tooltip map-tooltip--city'
        });
        layer.addLayer(marker);
      });
      cityLayerRef.current = layer;
    }

    if (mapLayers.showCities) {
      cityLayerRef.current.addTo(mapRef.current);
    } else {
      cityLayerRef.current.remove();
    }
  }, [mapLayers.showCities, setSelectedFeature]);

  useEffect(() => {
    if (!mapRef.current) return;

    legendRef.current?.remove();
    legendRef.current = null;

    if (!mapLayers.showLegend) {
      return;
    }

    const LegendControl = L.Control.extend({
      onAdd: () => {
        const div = L.DomUtil.create('div', 'map-legend');
        div.innerHTML = `
          <h3 class="map-legend__title">Map Key</h3>
          <div class="map-legend__row">
            <span class="map-legend__icon" style="background:${palette.High}; background:linear-gradient(135deg, ${palette.Low}, ${palette.Medium}, ${palette.High});"></span>
            Incident (color indicates risk)
          </div>
          <div class="map-legend__row">
            <span class="map-legend__icon" style="background:${stagingFill[iconTheme]};"></span>
            Staging area
          </div>
          <div class="map-legend__row">
            <span class="map-legend__icon" style="background:${hospitalFill[iconTheme]};"></span>
            Hospital
          </div>
          <div class="map-legend__row">
            <span class="map-legend__icon map-legend__icon--arrow"></span>
            Resource flow
          </div>
          <div class="map-legend__separator"></div>
          <div class="map-legend__row"><span class="map-legend__swatch" style="background:${palette.Low};"></span>Risk: Low</div>
          <div class="map-legend__row"><span class="map-legend__swatch" style="background:${palette.Medium};"></span>Risk: Medium</div>
          <div class="map-legend__row"><span class="map-legend__swatch" style="background:${palette.High};"></span>Risk: High</div>
        `;
        return div;
      }
    });
    const legend: Control = new LegendControl({ position: 'bottomleft' });
    legend.addTo(mapRef.current);
    legendRef.current = legend;

    return () => {
      legendRef.current?.remove();
      legendRef.current = null;
    };
  }, [iconTheme, mapLayers.showLegend, palette]);

  useEffect(() => {
    if (!mapRef.current) return;

    if (!incident.location) {
      if (incidentMarkerRef.current) {
        incidentMarkerRef.current.removeFrom(mapRef.current);
        incidentMarkerRef.current = null;
      }
      connectionLayerRef.current?.clearLayers();
      return;
    }

    const map = mapRef.current;

    if (!incidentMarkerRef.current) {
      incidentMarkerRef.current = L.marker(incident.location, {
        icon: createIncidentIcon(allocation?.riskLevel ?? null, iconTheme)
      }).addTo(map);
    } else {
      incidentMarkerRef.current.setLatLng(incident.location);
      incidentMarkerRef.current.setIcon(createIncidentIcon(allocation?.riskLevel ?? null, iconTheme));
    }

    const marker = incidentMarkerRef.current;
    if (marker) {
      const featureMeta = [
        { label: 'Demand', value: incident.demand.toLocaleString() },
        { label: 'Risk', value: allocation?.riskLevel ?? incident.riskPreset }
      ];
      if (allocation) {
        featureMeta.push(
          { label: 'Utilized', value: allocation.totalSent.toLocaleString() },
          { label: 'Unmet', value: allocation.unmet.toLocaleString() }
        );
        if (allocation.averageEtaMinutes !== null) {
          featureMeta.push({ label: 'Avg ETA', value: formatMinutes(allocation.averageEtaMinutes) });
        }
      }

      marker.off('click');
      marker.on('click', () => {
        setSelectedFeature({
          type: 'incident',
          title: 'Incident Summary',
          description: 'Live demand and allocation snapshot.',
          meta: featureMeta
        });
      });

      marker.bindTooltip(
        `
          <div class="map-tooltip__title">Incident</div>
          <div class="map-tooltip__meta">Risk: ${(allocation?.riskLevel ?? incident.riskPreset).toString()}</div>
          <div class="map-tooltip__meta">Demand: ${incident.demand.toLocaleString()}</div>
        `,
        {
          direction: 'top',
          offset: [0, -30],
          opacity: 0.95,
          sticky: true,
          className: 'map-tooltip map-tooltip--incident'
        }
      );
    }

    map.flyTo(incident.location, Math.max(map.getZoom(), 5), { duration: 0.6 });
  }, [allocation, iconTheme, incident.demand, incident.location, incident.riskPreset, setSelectedFeature]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const existing = stagingMarkersRef.current;
    const currentIds = new Set(stagingAreas.map((area) => area.id));

    for (const [id, marker] of Array.from(existing.entries())) {
      if (!currentIds.has(id)) {
        marker.removeFrom(map);
        existing.delete(id);
      }
    }

    stagingAreas.forEach((area) => {
      let marker = existing.get(area.id);
      if (!marker) {
        marker = L.marker(area.location, { draggable: true, icon: stagingIcon }).addTo(map);
        marker.on('dragend', (event) => {
          const latLng = event.target.getLatLng();
          updateStaging(area.id, { location: { lat: latLng.lat, lng: latLng.lng } });
        });
        existing.set(area.id, marker);
      }
      marker.setLatLng(area.location);
      marker.setIcon(stagingIcon);
      marker.off('click');
      marker.on('click', () => {
        setSelectedFeature({
          type: 'staging',
          id: area.id,
          title: area.name,
          description: 'Drag to reposition or adjust quantities in the staging panel.',
          meta: [
            { label: 'Available', value: area.available.toLocaleString() },
            { label: 'Latitude', value: area.location.lat.toFixed(3) },
            { label: 'Longitude', value: area.location.lng.toFixed(3) }
          ]
        });
      });
      marker.bindTooltip(
        `
          <div class="map-tooltip__title">${area.name}</div>
          <div class="map-tooltip__meta">Available: ${area.available.toLocaleString()}</div>
        `,
        {
          permanent: true,
          direction: 'top',
          offset: [0, -28],
          className: 'map-label'
        }
      );
    });
  }, [setSelectedFeature, stagingAreas, stagingIcon, updateStaging]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const existing = hospitalMarkersRef.current;

    if (!mapLayers.showHospitals) {
      for (const marker of existing.values()) {
        marker.removeFrom(map);
      }
      existing.clear();
      return;
    }

    const activeIds = new Set(nearbyHospitals.map((hospital) => hospital.id));

    for (const [id, marker] of Array.from(existing.entries())) {
      if (!activeIds.has(id)) {
        marker.removeFrom(map);
        existing.delete(id);
      }
    }

    nearbyHospitals.forEach((hospital) => {
      let marker = existing.get(hospital.id);
      if (!marker) {
        marker = L.marker(hospital.location, { icon: hospitalIcon }).addTo(map);
        existing.set(hospital.id, marker);
      }
      marker.setLatLng(hospital.location);
      marker.setIcon(hospitalIcon);
      marker.off('click');
      marker.on('click', () => {
        setSelectedFeature({
          type: 'hospital',
          id: hospital.id,
          title: hospital.name,
          description: 'Nearest care facility within the configured search radius.',
          meta: [
            { label: 'City', value: hospital.city },
            { label: 'Distance', value: formatKilometers(hospital.distanceKm) },
            { label: 'Airborne', value: hospital.airborneCapable ? 'Capable' : 'Ground only' }
          ]
        });
      });
      marker.bindTooltip(
        `
          <div class="map-tooltip__title">${hospital.name}</div>
          <div class="map-tooltip__meta">${hospital.city} • ${formatKilometers(hospital.distanceKm)}</div>
          <div class="map-tooltip__badge ${hospital.airborneCapable ? 'map-tooltip__badge--ok' : 'map-tooltip__badge--neutral'}">
            ${hospital.airborneCapable ? 'Airborne capable' : 'Ground only'}
          </div>
        `,
        {
          direction: 'top',
          offset: [0, -24],
          opacity: 0.9,
          sticky: true,
          className: 'map-tooltip'
        }
      );
    });
  }, [hospitalIcon, mapLayers.showHospitals, nearbyHospitals, setSelectedFeature]);

  useEffect(() => {
    if (!mapRef.current || !connectionLayerRef.current) return;
    const layer = connectionLayerRef.current;
    layer.clearLayers();

    if (!incident.location || !allocation || !mapLayers.showRoutes) return;

    const color = palette[allocation.riskLevel];

    allocation.decisions.forEach((decision) => {
      const staging = stagingAreas.find((area) => area.id === decision.stagingId);
      if (!staging) return;

      const line = L.polyline([staging.location, incident.location!], {
        color,
        weight: 4,
        opacity: 0.85,
        pane: 'connections'
      });

      line.on('click', () => {
        setSelectedFeature({
          type: 'route',
          id: decision.stagingId,
          title: `${staging.name} ➜ Incident`,
          description: 'Active resource movement corridor.',
          meta: [
            { label: 'Quantity', value: decision.quantity.toLocaleString() },
            { label: 'Distance', value: formatKilometers(decision.distanceKm) },
            { label: 'ETA', value: formatMinutes(decision.etaMinutes) }
          ]
        });
      });

      if (mapLayers.showDistances) {
        line.bindTooltip(
          `
            <div class="map-tooltip__title">${staging.name}</div>
            <div class="map-tooltip__meta">${formatKilometers(decision.distanceKm)} • ${formatMinutes(decision.etaMinutes)}</div>
          `,
          {
            permanent: false,
            direction: 'center',
            opacity: 0.9,
            className: 'map-distance-tooltip'
          }
        );
      }
      layer.addLayer(line);

      if (!mapLayers.showArrows) {
        return;
      }

      const midpoint: LatLngLiteral = {
        lat: (staging.location.lat + incident.location!.lat) / 2,
        lng: (staging.location.lng + incident.location!.lng) / 2
      };
      const angle =
        (Math.atan2(
          incident.location!.lat - staging.location.lat,
          incident.location!.lng - staging.location.lng
        ) * 180) /
        Math.PI;

      const arrow = L.marker(midpoint, {
        icon: createArrowIcon(color, angle),
        pane: 'connections',
        interactive: true
      });
      arrow.on('click', () => {
        setSelectedFeature({
          type: 'route',
          id: `${decision.stagingId}-arrow`,
          title: `Movement to incident`,
          description: `Flow from ${staging.name} covering ${formatKilometers(decision.distanceKm)}.`,
          meta: [
            { label: 'Quantity', value: decision.quantity.toLocaleString() },
            { label: 'ETA', value: formatMinutes(decision.etaMinutes) }
          ]
        });
      });
      if (mapLayers.showDistances) {
        arrow.bindTooltip(
          `
            <div class="map-tooltip__meta">${formatKilometers(decision.distanceKm)}</div>
          `,
          {
            direction: 'top',
            opacity: 0.85,
            className: 'map-tooltip map-tooltip--arrow'
          }
        );
      }
      layer.addLayer(arrow);
    });
  }, [allocation, incident.location, mapLayers.showArrows, mapLayers.showDistances, mapLayers.showRoutes, palette, setSelectedFeature, stagingAreas]);

  return <div ref={containerRef} className="h-full w-full" />;
};
