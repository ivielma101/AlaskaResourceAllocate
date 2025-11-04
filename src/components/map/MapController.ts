import { formatKilometers } from '@/lib/numberFormat';
import { getPopulationPoints } from '@/lib/population';
import { getErmaFeatures } from '@/lib/erma';
import { RISK_COLORS } from '@/lib/risk';
import type { RiskLevel } from '@/types/domain';
import type { LatLng } from '@/types/geo';
import type { NearbyHospital } from '@/lib/hospitals';
import type { SimulationState } from '@/app/store';

type StagingArea = SimulationState['stagingAreas'][number];

type Allocation = ReturnType<SimulationState['computeAllocation']>;

type LayerVisibility = { population: boolean; erma: boolean };

type MapControllerOptions = {
  container: HTMLDivElement;
  onMapClick: (location: LatLng, isShift: boolean) => void;
  onStagingDrag: (id: string, location: LatLng) => void;
};

const ALASKA_CENTER: LatLng = { lat: 64.2, lng: -149.5 };
const ALASKA_BOUNDS = { north: 72.0, south: 50.0, east: -120.0, west: -179.0 };

const MAP_STYLE: any[] = [
  {
    elementType: 'geometry',
    stylers: [{ color: '#f7f9fb' }]
  },
  {
    elementType: 'labels.text.fill',
    stylers: [{ color: '#334155' }]
  },
  {
    elementType: 'labels.text.stroke',
    stylers: [{ color: '#f7f9fb' }]
  },
  {
    featureType: 'administrative.locality',
    elementType: 'labels.text.fill',
    stylers: [{ color: '#0f172a' }]
  },
  {
    featureType: 'poi',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry',
    stylers: [{ color: '#ffffff' }]
  },
  {
    featureType: 'road',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#d7dfe9' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry',
    stylers: [{ color: '#e2e8f0' }]
  },
  {
    featureType: 'road.highway',
    elementType: 'geometry.stroke',
    stylers: [{ color: '#cbd5e1' }]
  },
  {
    featureType: 'transit',
    stylers: [{ visibility: 'off' }]
  },
  {
    featureType: 'water',
    elementType: 'geometry',
    stylers: [{ color: '#d4e8ff' }]
  }
];

const ALASKA_CITIES: { name: string; location: LatLng }[] = [
  { name: 'Anchorage', location: { lat: 61.2181, lng: -149.9003 } },
  { name: 'Fairbanks', location: { lat: 64.8378, lng: -147.7164 } },
  { name: 'Juneau', location: { lat: 58.3019, lng: -134.4197 } },
  { name: 'Sitka', location: { lat: 57.0531, lng: -135.33 } },
  { name: 'Bethel', location: { lat: 60.7922, lng: -161.7558 } },
  { name: 'Nome', location: { lat: 64.5011, lng: -165.4064 } }
];

const createIncidentIcon = (risk: RiskLevel | null): any => {
  const color = risk ? RISK_COLORS[risk] : '#0f172a';
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="${color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round"><path fill="${color}" d="M12 2C7.58 2 4 5.58 4 10c0 5.25 7.09 12 7.42 12.3a1 1 0 0 0 1.16 0C12.91 22 20 15.25 20 10c0-4.42-3.58-8-8-8Z"/><circle cx="12" cy="10" r="3" fill="white"/></svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new google.maps.Size(44, 44),
    anchor: new google.maps.Point(22, 44)
  };
};

const createStagingIcon = (): any => ({
  url:
    'data:image/svg+xml;base64,' +
    'PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIzMiIgaGVpZ2h0PSIzMiIgdmlld0JveD0iMCAwIDI0IDI0IiBmaWxsPSJub25lIj48cGF0aCBkPSJNMTIgMmE3IDcgMCAwIDEgNyA3YzAgNC4yLTMuMTEgOS4xNS02LjM1IDEyLjU1YTEgMSAwIDAgMS0xLjMuMDZsLS4xLS4wNkM4LjExIDE4LjE1IDUgMTMuMiA1IDlhNyA3IDAgMCAxIDctN1ptMCA5LjVhMi41IDIuNSAwIDEgMCAwLTUgMi41IDIuNSAwIDAgMCAwIDVaIiBmaWxsPSIjMGVhNWU5Ii8+PC9zdmc+',
  scaledSize: new google.maps.Size(36, 36),
  anchor: new google.maps.Point(18, 36)
});

const createHospitalIcon = (): any => ({
  url:
    'data:image/svg+xml;charset=UTF-8,' +
    encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none"><path fill="#0ea5e9" d="M4 4.75A2.75 2.75 0 0 1 6.75 2h10.5A2.75 2.75 0 0 1 20 4.75v14.5A2.75 2.75 0 0 1 17.25 22H6.75A2.75 2.75 0 0 1 4 19.25V4.75Z"/><path fill="#fff" d="M11 7h2v3h3v2h-3v3h-2v-3H8v-2h3V7Z"/></svg>'
    ),
  scaledSize: new google.maps.Size(32, 32),
  anchor: new google.maps.Point(16, 32)
});

export class MapController {
  private map: any;
  private infoWindow: any;
  private legendControl: HTMLDivElement | null = null;
  private layerControl: HTMLDivElement | null = null;
  private incidentMarker: any = null;
  private stagingMarkers = new Map<string, any>();
  private hospitalMarkers = new Map<string, any>();
  private cityMarkers: any[] = [];
  private connectionLines: any[] = [];
  private heatmap: any = null;
  private ermaPolygons: any[] = [];
  private ermaMarkers: any[] = [];

  constructor(private options: MapControllerOptions) {
    this.map = new google.maps.Map(options.container, {
      center: ALASKA_CENTER,
      zoom: 4,
      minZoom: 3,
      maxZoom: 10,
      restriction: { latLngBounds: ALASKA_BOUNDS, strictBounds: true },
      streetViewControl: false,
      mapTypeControl: false,
      fullscreenControl: false,
      zoomControl: true,
      clickableIcons: false,
      backgroundColor: '#f8fafc',
      styles: MAP_STYLE,
      scaleControl: true
    });

    this.infoWindow = new google.maps.InfoWindow();
    this.registerInteractions();
    this.renderCityLabels();
    this.renderLegend();
    this.renderLayerControl();
  }

  private registerInteractions() {
    this.map.addListener('click', (event: any) => {
      if (!event.latLng) return;
      const isShift = (event.domEvent as MouseEvent | undefined)?.shiftKey ?? false;
      this.options.onMapClick({ lat: event.latLng.lat(), lng: event.latLng.lng() }, isShift);
    });
  }

  private renderCityLabels() {
    this.clearCityMarkers();
    this.cityMarkers = ALASKA_CITIES.map((city) =>
      new google.maps.Marker({
        position: city.location,
        map: this.map,
        clickable: false,
        icon: { path: google.maps.SymbolPath.CIRCLE, scale: 0 },
        label: {
          text: city.name,
          color: '#1f2937',
          fontSize: '11px',
          fontWeight: '600'
        }
      })
    );
  }

  private renderLegend() {
    if (this.legendControl) return;
    const legend = document.createElement('div');
    legend.className = 'map-legend';
    legend.innerHTML = `
      <h3 class="map-legend__title">Map Key</h3>
      <div class="map-legend__row"><span class="map-legend__icon map-legend__icon--incident"></span>Incident (color indicates risk)</div>
      <div class="map-legend__row"><span class="map-legend__icon map-legend__icon--staging"></span>Staging area</div>
      <div class="map-legend__row"><span class="map-legend__icon map-legend__icon--hospital"></span>Hospital</div>
      <div class="map-legend__row"><span class="map-legend__icon map-legend__icon--arrow"></span>Resource flow</div>
      <div class="map-legend__separator"></div>
      <div class="map-legend__row"><span class="map-legend__swatch map-legend__swatch--low"></span>Risk: Low</div>
      <div class="map-legend__row"><span class="map-legend__swatch map-legend__swatch--medium"></span>Risk: Medium</div>
      <div class="map-legend__row"><span class="map-legend__swatch map-legend__swatch--high"></span>Risk: High</div>
    `;
    this.map.controls[google.maps.ControlPosition.LEFT_BOTTOM].push(legend);
    this.legendControl = legend;
  }

  private renderLayerControl() {
    if (this.layerControl) return;
    const layerControl = document.createElement('div');
    layerControl.className = 'map-legend map-layer-control';
    layerControl.innerHTML = `
      <h3 class="map-legend__title">Data Layers</h3>
      <label><input type="checkbox" data-layer="population" checked />Population heatmap</label>
      <label><input type="checkbox" data-layer="erma" checked />ERMA assets</label>
    `;
    this.map.controls[google.maps.ControlPosition.TOP_LEFT].push(layerControl);
    this.layerControl = layerControl;
  }

  onLayerToggle(callback: (layer: keyof LayerVisibility, visible: boolean) => void) {
    if (!this.layerControl) return;
    this.layerControl.addEventListener('change', (event) => {
      const target = event.target as HTMLInputElement | null;
      if (!target) return;
      const layer = target.dataset.layer as keyof LayerVisibility | undefined;
      if (!layer) return;
      callback(layer, target.checked);
    });
  }

  setIncident(location: LatLng | null, risk: RiskLevel | null) {
    if (!location) {
      this.incidentMarker?.setMap(null);
      this.incidentMarker = null;
      this.clearConnectionLines();
      return;
    }

    const icon = createIncidentIcon(risk);
    if (!this.incidentMarker) {
      this.incidentMarker = new google.maps.Marker({
        position: location,
        map: this.map,
        icon,
        zIndex: 1000
      });
    } else {
      this.incidentMarker.setIcon(icon);
      this.incidentMarker.setPosition(location);
    }

    this.map.panTo(location);
    if ((this.map.getZoom() ?? 0) < 5) {
      this.map.setZoom(5);
    }
  }

  setStagingAreas(stagingAreas: StagingArea[]) {
    const active = new Set(stagingAreas.map((area) => area.id));
    for (const [id, marker] of Array.from(this.stagingMarkers.entries())) {
      if (!active.has(id)) {
        marker.setMap(null);
        this.stagingMarkers.delete(id);
      }
    }

    stagingAreas.forEach((area) => {
      let marker = this.stagingMarkers.get(area.id);
      if (!marker) {
        marker = new google.maps.Marker({
          position: area.location,
          map: this.map,
          draggable: true,
          icon: createStagingIcon(),
          label: {
            text: area.name,
            color: '#0f172a',
            fontWeight: '600',
            fontSize: '12px'
          }
        });
        marker.addListener('dragend', () => {
          const position = marker?.getPosition();
          if (!position) return;
          this.options.onStagingDrag(area.id, { lat: position.lat(), lng: position.lng() });
        });
        this.stagingMarkers.set(area.id, marker);
      } else {
        marker.setPosition(area.location);
        marker.setIcon(createStagingIcon());
      }
    });
  }

  setHospitals(hospitals: NearbyHospital[]) {
    const active = new Set(hospitals.map((hospital) => hospital.id));
    for (const [id, marker] of Array.from(this.hospitalMarkers.entries())) {
      if (!active.has(id)) {
        marker.setMap(null);
        this.hospitalMarkers.delete(id);
      }
    }

    hospitals.forEach((hospital) => {
      let marker = this.hospitalMarkers.get(hospital.id);
      if (!marker) {
        marker = new google.maps.Marker({
          position: hospital.location,
          map: this.map,
          icon: createHospitalIcon(),
          title: hospital.name
        });
        marker.addListener('click', () => {
          const distanceCopy =
            hospital.distanceKm !== null ? formatKilometers(hospital.distanceKm ?? 0) : '—';
          this.infoWindow.setContent(`
            <div class="map-tooltip__title">${hospital.name}</div>
            <div class="map-tooltip__meta">${hospital.city} • ${distanceCopy}</div>
            <div class="map-tooltip__meta">Trauma level ${hospital.traumaLevel} • Capacity ${hospital.capacity.toLocaleString()}</div>
            <div class="map-tooltip__badge ${hospital.airborneCapable ? 'map-tooltip__badge--ok' : 'map-tooltip__badge--neutral'}">
              ${hospital.airborneCapable ? 'Airborne capable' : 'Ground only'}
            </div>
          `);
          this.infoWindow.open({ map: this.map, anchor: marker! });
        });
        this.hospitalMarkers.set(hospital.id, marker);
      } else {
        marker.setPosition(hospital.location);
      }
    });
  }

  setConnections(allocation: Allocation | null, stagingAreas: StagingArea[], incidentLocation: LatLng | null) {
    this.clearConnectionLines();
    if (!allocation || !incidentLocation) return;
    const color = RISK_COLORS[allocation.riskLevel];

    allocation.decisions.forEach((decision) => {
      const staging = stagingAreas.find((area) => area.id === decision.stagingId);
      if (!staging) return;
      const line = new google.maps.Polyline({
        path: [staging.location, incidentLocation],
        strokeColor: color,
        strokeOpacity: 0.85,
        strokeWeight: 4,
        icons: [
          {
            icon: {
              path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
              scale: 3,
              strokeColor: color,
              strokeWeight: 2
            },
            offset: '50%'
          }
        ]
      });
      line.setMap(this.map);
      this.connectionLines.push(line);
    });
  }

  setHeatmapVisible(visible: boolean) {
    if (!this.heatmap) {
      const data = getPopulationPoints().map((point) => ({
        location: new google.maps.LatLng(point.location.lat, point.location.lng),
        weight: point.weight
      }));
      this.heatmap = new google.maps.visualization.HeatmapLayer({
        data,
        dissipating: true,
        radius: 60,
        opacity: 0.6
      });
    }
    this.heatmap.setMap(visible ? this.map : null);
  }

  setErmaVisible(visible: boolean) {
    if (this.ermaPolygons.length === 0 && this.ermaMarkers.length === 0) {
      const features = getErmaFeatures();
      const infoWindow = this.infoWindow;
      features.forEach((feature) => {
        if (feature.type === 'polygon') {
          const polygon = new google.maps.Polygon({
            paths: feature.coordinates,
            strokeColor: '#2563eb',
            strokeOpacity: 0.9,
            strokeWeight: 2,
            fillColor: '#2563eb',
            fillOpacity: 0.12
          });
          polygon.addListener('click', (event: any) => {
            const position = event?.latLng ?? polygon.getPath().getAt(0);
            infoWindow.setContent(`
              <div class="map-tooltip__title">${feature.name}</div>
              <div class="map-tooltip__meta">ERMA planning boundary</div>
            `);
            infoWindow.setPosition(position);
            infoWindow.open({ map: this.map });
          });
          this.ermaPolygons.push(polygon);
        } else {
          const marker = new google.maps.Marker({
            position: feature.location,
            icon: {
              path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
              scale: 6,
              strokeColor: '#1d4ed8',
              fillColor: '#60a5fa',
              fillOpacity: 0.9
            },
            title: feature.name
          });
          marker.addListener('click', () => {
            infoWindow.setContent(`
              <div class="map-tooltip__title">${feature.name}</div>
              <div class="map-tooltip__meta">${feature.summary}</div>
            `);
            infoWindow.open({ map: this.map, anchor: marker });
          });
          this.ermaMarkers.push(marker);
        }
      });
    }

    this.ermaPolygons.forEach((polygon) => polygon.setMap(visible ? this.map : null));
    this.ermaMarkers.forEach((marker) => marker.setMap(visible ? this.map : null));
  }

  destroy() {
    this.legendControl && this.removeControl(google.maps.ControlPosition.LEFT_BOTTOM, this.legendControl);
    this.layerControl && this.removeControl(google.maps.ControlPosition.TOP_LEFT, this.layerControl);
    this.legendControl = null;
    this.layerControl = null;
    this.clearCityMarkers();
    this.incidentMarker?.setMap(null);
    this.incidentMarker = null;
    this.stagingMarkers.forEach((marker) => marker.setMap(null));
    this.stagingMarkers.clear();
    this.hospitalMarkers.forEach((marker) => marker.setMap(null));
    this.hospitalMarkers.clear();
    this.clearConnectionLines();
    this.heatmap?.setMap(null);
    this.heatmap = null;
    this.ermaPolygons.forEach((polygon) => polygon.setMap(null));
    this.ermaPolygons = [];
    this.ermaMarkers.forEach((marker) => marker.setMap(null));
    this.ermaMarkers = [];
  }

  private removeControl(position: any, element: HTMLDivElement) {
    const controls = this.map.controls[position];
    const index = controls.getArray().indexOf(element);
    if (index >= 0) {
      controls.removeAt(index);
    }
  }

  private clearCityMarkers() {
    this.cityMarkers.forEach((marker) => marker.setMap(null));
    this.cityMarkers = [];
  }

  private clearConnectionLines() {
    this.connectionLines.forEach((line) => line.setMap(null));
    this.connectionLines = [];
  }
}
