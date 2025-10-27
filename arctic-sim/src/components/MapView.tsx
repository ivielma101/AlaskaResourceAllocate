import { useEffect, useRef } from 'react';
import L, { LatLngLiteral, Map as LeafletMap, Marker } from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useSimulationStore } from '@/app/store';

const ALASKA_CENTER: LatLngLiteral = { lat: 64.2, lng: -149.5 };
const ALASKA_BOUNDS = L.latLngBounds(
  L.latLng(50.0, -179.0),
  L.latLng(72.0, -120.0)
);

const INCIDENT_ICON = L.icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzNiIgaGVpZ2h0PSIzNiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48cGF0aCBkPSJNMTIgMkM3LjU4IDIgNCA1LjU4IDQgMTBjMCA1LjI1IDcuMDkgMTIgNy40MiAxMi4zYTEgMSAwIDAgMCAxLjE2IDBDMTIuOTEgMjIgMjAgMTUuMjUgMjAgMTBjMC00LjQyLTMuNTgtOC04LThabTAgMTEuNWEzLjUgMy41IDAgMSAxIDAtNyAzLjUgMy41IDAgMCAxIDAgN1oiIGZpbGw9IiNlZjQ0NDQiLz48L3N2Zz4=',
  iconSize: [36, 36],
  iconAnchor: [18, 36]
});

const STAGING_ICON = L.icon({
  iconUrl:
    'data:image/svg+xml;base64,' +
    'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48cGF0aCBkPSJNMTIgMmE3IDcgMCAwIDEgNyA3YzAgNC4yLTMuMTEgOS4xNS02LjM1IDEyLjU1YTEgMSAwIDAgMS0xLjMuMDZsLS4xLS4wNkM4LjExIDE4LjE1IDUgMTMuMiA1IDlhNyA3IDAgMCAxIDctN1ptMCA5LjVhMi41IDIuNSAwIDEgMCAwLTUgMi41IDIuNSAwIDAgMCAwIDVaIiBmaWxsPSIjMGVhNWU5Ii8+PC9zdmc+',
  iconSize: [32, 32],
  iconAnchor: [16, 32]
});

export const MapView = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const incidentMarkerRef = useRef<Marker | null>(null);
  const stagingMarkersRef = useRef<Map<string, Marker>>(new Map());

  const incident = useSimulationStore((state) => state.incident);
  const stagingAreas = useSimulationStore((state) => state.stagingAreas);
  const setIncidentLocation = useSimulationStore((state) => state.setIncidentLocation);
  const addStaging = useSimulationStore((state) => state.addStaging);
  const updateStaging = useSimulationStore((state) => state.updateStaging);

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
    L.control.zoom({ position: 'topright' }).addTo(map);
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
    if (!incident.location) {
      if (incidentMarkerRef.current) {
        incidentMarkerRef.current.removeFrom(mapRef.current);
        incidentMarkerRef.current = null;
      }
      return;
    }
    if (!incidentMarkerRef.current) {
      incidentMarkerRef.current = L.marker(incident.location, { icon: INCIDENT_ICON }).addTo(mapRef.current);
    } else {
      incidentMarkerRef.current.setLatLng(incident.location);
    }
    mapRef.current.flyTo(incident.location, Math.max(mapRef.current.getZoom(), 5), { duration: 0.6 });
  }, [incident.location]);

  useEffect(() => {
    if (!mapRef.current) return;
    const map = mapRef.current;
    const existing = stagingMarkersRef.current;
    const currentIds = new Set(stagingAreas.map((area) => area.id));

    // Remove markers that no longer exist
    for (const [id, marker] of Array.from(existing.entries())) {
      if (!currentIds.has(id)) {
        marker.removeFrom(map);
        existing.delete(id);
      }
    }

    // Add or update markers
    stagingAreas.forEach((area) => {
      let marker = existing.get(area.id);
      if (!marker) {
        marker = L.marker(area.location, { draggable: true, icon: STAGING_ICON }).addTo(map);
        marker.on('dragend', (event) => {
          const latLng = event.target.getLatLng();
          updateStaging(area.id, { location: { lat: latLng.lat, lng: latLng.lng } });
        });
        existing.set(area.id, marker);
      }
      marker.setLatLng(area.location);
    });
  }, [stagingAreas, updateStaging]);

  return <div ref={containerRef} className="h-full w-full" />;
};
