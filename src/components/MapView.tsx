import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSimulationStore } from '@/app/store';
import { ensureGoogleMaps } from '@/lib/googleMaps';
import { findHospitalsWithinRadius, getHospitalsInScope, HOSPITAL_SEARCH_RADIUS_KM } from '@/lib/hospitals';
import { getDemandRiskLevel, getRiskCopy, RISK_BADGE_CLASSES } from '@/lib/risk';
import { haversineKm } from '@/lib/geo';
import { MapController } from '@/components/map/MapController';
import { formatKilometers, formatMinutes } from '@/lib/numberFormat';
import { DraggablePanel } from '@/components/DraggablePanel';

type PanelId = 'incident' | 'actions' | 'hospital';

type PanelPosition = {
  x: number;
  y: number;
};

const stripHtml = (value: string) => {
  if (typeof window !== 'undefined') {
    const parser = window.document.createElement('div');
    parser.innerHTML = value;
    return parser.textContent ?? parser.innerText ?? '';
  }
  return value.replace(/<[^>]+>/g, ' ');
};

export const MapView = () => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const controllerRef = useRef<MapController | null>(null);
  const overlayBoundsRef = useRef<HTMLDivElement | null>(null);

  const [layerVisibility, setLayerVisibility] = useState<{ population: boolean; erma: boolean }>({
    population: true,
    erma: true
  });
  const [mapsError, setMapsError] = useState<Error | null>(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [overlayBounds, setOverlayBounds] = useState<{ width: number; height: number } | null>(null);
  const [panelPositions, setPanelPositions] = useState<Record<PanelId, PanelPosition>>({
    incident: { x: 24, y: 24 },
    actions: { x: 24, y: 308 },
    hospital: { x: 24, y: 520 }
  });
  const [userPositionOverrides, setUserPositionOverrides] = useState<Record<PanelId, boolean>>({
    incident: false,
    actions: false,
    hospital: false
  });
  const [collapsedPanels, setCollapsedPanels] = useState<Record<PanelId, boolean>>({
    incident: false,
    actions: false,
    hospital: false
  });
  const [dismissedPanels, setDismissedPanels] = useState<Record<PanelId, boolean>>({
    incident: false,
    actions: false,
    hospital: false
  });

  const incident = useSimulationStore((state) => state.incident);
  const stagingAreas = useSimulationStore((state) => state.stagingAreas);
  const setIncidentLocation = useSimulationStore((state) => state.setIncidentLocation);
  const addStaging = useSimulationStore((state) => state.addStaging);
  const updateStaging = useSimulationStore((state) => state.updateStaging);
  const computeAllocation = useSimulationStore((state) => state.computeAllocation);
  const setTravelMetrics = useSimulationStore((state) => state.setTravelMetrics);
  const clearTravelMetrics = useSimulationStore((state) => state.clearTravelMetrics);
  const setRoutingGuidance = useSimulationStore((state) => state.setRoutingGuidance);
  const clearRoutingGuidance = useSimulationStore((state) => state.clearRoutingGuidance);
  const hospitalRoute = useSimulationStore((state) => state.routingGuidance.hospital);

  const allocation = useMemo(() => computeAllocation(), [computeAllocation, incident, stagingAreas]);
  const nearbyHospitals = useMemo(
    () => findHospitalsWithinRadius(incident.location, HOSPITAL_SEARCH_RADIUS_KM),
    [incident.location]
  );
  const hospitalsInScope = useMemo(() => getHospitalsInScope(incident.location), [incident.location]);
  const hospitalsForMap = useMemo(
    () => (incident.location ? nearbyHospitals : hospitalsInScope),
    [incident.location, nearbyHospitals, hospitalsInScope]
  );
  const nearestHospital = useMemo(() => (hospitalsInScope.length > 0 ? hospitalsInScope[0] : null), [hospitalsInScope]);
  const demandRiskLevel = useMemo(() => getDemandRiskLevel(incident.demand), [incident.demand]);
  const demandRiskCopy = useMemo(() => getRiskCopy(demandRiskLevel), [demandRiskLevel]);
  const overallRiskCopy = useMemo(
    () => (allocation ? getRiskCopy(allocation.riskLevel) : 'Set an incident and resources to calculate system risk.'),
    [allocation]
  );

  useEffect(() => {
    const node = overlayBoundsRef.current;
    if (!node) return;

    const observer = new ResizeObserver((entries) => {
      const entry = entries[0];
      if (!entry) return;
      const { width, height } = entry.contentRect;
      setOverlayBounds({ width, height });
    });

    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  const updatePanelPosition = useCallback((panel: PanelId, position: PanelPosition) => {
    setPanelPositions((prev) => ({ ...prev, [panel]: position }));
    setUserPositionOverrides((prev) => ({ ...prev, [panel]: true }));
  }, []);

  const computeDefaultPanelPositions = useCallback(
    (bounds: { width: number; height: number }) => {
      const baseY = Math.max(24, bounds.height - 320);
      const middleX = Math.max(24, bounds.width / 2 - 160);
      const rightX = Math.max(24, bounds.width - 360);
      return {
        incident: { x: 24, y: baseY },
        actions: { x: middleX, y: Math.max(24, bounds.height - 260) },
        hospital: { x: rightX, y: baseY }
      } satisfies Record<PanelId, PanelPosition>;
    },
    []
  );

  useEffect(() => {
    if (!overlayBounds) return;

    setPanelPositions((prev) => {
      const defaults = computeDefaultPanelPositions(overlayBounds);
      let next: Record<PanelId, PanelPosition> | null = null;

      (['incident', 'actions', 'hospital'] as PanelId[]).forEach((panel) => {
        if (panel === 'hospital' && (!nearestHospital || !incident.location)) {
          return;
        }
        if (userPositionOverrides[panel]) {
          return;
        }
        const target = defaults[panel];
        const current = prev[panel];
        if (!current || !target) {
          return;
        }
        if (Math.abs(current.x - target.x) > 0.5 || Math.abs(current.y - target.y) > 0.5) {
          if (!next) {
            next = { ...prev };
          }
          next[panel] = target;
        }
      });

      return next ?? prev;
    });
  }, [
    computeDefaultPanelPositions,
    incident.location,
    nearestHospital,
    overlayBounds,
    userPositionOverrides
  ]);

  const reopenPanel = useCallback((panel: PanelId) => {
    setDismissedPanels((prev) => ({ ...prev, [panel]: false }));
  }, []);

  const toggleCollapsed = useCallback((panel: PanelId, collapsed: boolean) => {
    setCollapsedPanels((prev) => ({ ...prev, [panel]: collapsed }));
  }, []);

  const closePanel = useCallback((panel: PanelId) => {
    setDismissedPanels((prev) => ({ ...prev, [panel]: true }));
  }, []);

  useEffect(() => {
    let mounted = true;
    ensureGoogleMaps()
      .then(() => {
        if (!mounted || controllerRef.current || !containerRef.current) {
          return;
        }

        const controller = new MapController({
          container: containerRef.current,
          onMapClick: (location, isShift) => {
            if (isShift) {
              addStaging(location);
            } else {
              setIncidentLocation(location);
            }
          },
          onStagingDrag: (id, location) => updateStaging(id, { location })
        });

        controller.onLayerToggle((layer, visible) => {
          setLayerVisibility((prev) => ({ ...prev, [layer]: visible }));
        });

        controller.setHeatmapVisible(layerVisibility.population);
        controller.setErmaVisible(layerVisibility.erma);

        controllerRef.current = controller;
        setIsMapReady(true);
      })
      .catch((error) => {
        console.error(error);
        setMapsError(error instanceof Error ? error : new Error('Failed to load Google Maps'));
      });

    return () => {
      mounted = false;
      controllerRef.current?.destroy();
      controllerRef.current = null;
      setIsMapReady(false);
    };
  }, [addStaging, setIncidentLocation, updateStaging]);

  useEffect(() => {
    controllerRef.current?.setHeatmapVisible(layerVisibility.population);
  }, [layerVisibility.population]);

  useEffect(() => {
    controllerRef.current?.setErmaVisible(layerVisibility.erma);
  }, [layerVisibility.erma]);

  useEffect(() => {
    controllerRef.current?.setIncident(incident.location, allocation?.riskLevel ?? null);
  }, [incident.location, allocation?.riskLevel]);

  useEffect(() => {
    controllerRef.current?.setStagingAreas(stagingAreas);
  }, [stagingAreas]);

  useEffect(() => {
    controllerRef.current?.setHospitals(hospitalsForMap);
  }, [hospitalsForMap]);

  useEffect(() => {
    controllerRef.current?.setConnections(allocation, stagingAreas, incident.location ?? null);
  }, [allocation, stagingAreas, incident.location]);

  useEffect(() => {
    if (!incident.location || stagingAreas.length === 0) {
      clearTravelMetrics();
      return;
    }

    let cancelled = false;

    const loadingState = stagingAreas.reduce<Record<string, import('@/app/store').TravelMetrics>>((acc, area) => {
      acc[area.id] = { status: 'loading' };
      return acc;
    }, {});
    setTravelMetrics(loadingState);

    const fallbackFor = (status: string) =>
      stagingAreas.reduce<Record<string, import('@/app/store').TravelMetrics>>((acc, area) => {
        acc[area.id] = {
          status: 'error',
          fallbackDistanceKm: haversineKm(area.location, incident.location!),
          errorMessage: status
        };
        return acc;
      }, {});

    ensureGoogleMaps()
      .then((googleMaps) => {
        if (cancelled) {
          return;
        }

        const service = new googleMaps.maps.DistanceMatrixService();
        const origins = stagingAreas.map((area) => area.location);

        service.getDistanceMatrix(
          {
            origins,
            destinations: [incident.location],
            travelMode: googleMaps.maps.TravelMode.DRIVING,
            unitSystem: googleMaps.maps.UnitSystem.METRIC,
            avoidFerries: false,
            avoidHighways: false,
            avoidTolls: false
          },
          (response: any, status: any) => {
            if (cancelled) {
              return;
            }

            if (status !== 'OK' || !response.rows) {
              setTravelMetrics(fallbackFor(status));
              return;
            }

            const updates: Record<string, import('@/app/store').TravelMetrics> = {};
            response.rows.forEach((row: any, index: number) => {
              const area = stagingAreas[index];
              if (!area || !row) return;
              const element = row.elements?.[0];
              if (!element) return;
              if (element.status === 'OK' && element.distance && element.duration) {
                updates[area.id] = {
                  status: 'ready',
                  distanceKm: element.distance.value / 1000,
                  etaMinutes: element.duration.value / 60
                };
              } else {
                updates[area.id] = {
                  status: 'error',
                  fallbackDistanceKm: haversineKm(area.location, incident.location!),
                  errorMessage: element.status
                };
              }
            });
            setTravelMetrics(updates);
          }
        );
      })
      .catch((error) => {
        console.error('Failed to fetch distance matrix', error);
        if (cancelled) {
          return;
        }
        setTravelMetrics(fallbackFor(error instanceof Error ? error.message : 'REQUEST_FAILED'));
      });

    return () => {
      cancelled = true;
    };
  }, [incident.location, stagingAreas, setTravelMetrics, clearTravelMetrics]);

  useEffect(() => {
    if (!incident.location || stagingAreas.length === 0) {
      clearRoutingGuidance('staging');
      return;
    }

    let cancelled = false;
    const service = new google.maps.DirectionsService();

    stagingAreas.forEach((area) => {
      setRoutingGuidance('staging', area.id, {
        status: 'loading',
        destinationName: area.name
      });
    });

    const requests = stagingAreas.map(
      (area) =>
        new Promise<void>((resolve) => {
          service.route(
            {
              origin: area.location,
              destination: incident.location!,
              travelMode: google.maps.TravelMode.DRIVING
            },
            (result: any, status: any) => {
              if (cancelled) {
                resolve();
                return;
              }

              if (status === 'OK' && result?.routes?.[0]?.legs?.[0]) {
                const leg = result.routes[0].legs[0];
                setRoutingGuidance('staging', area.id, {
                  status: 'ready',
                  destinationName: area.name,
                  summary: {
                    distanceKm: (leg.distance?.value ?? 0) / 1000,
                    etaMinutes: (leg.duration?.value ?? 0) / 60
                  },
                  steps:
                    leg.steps?.map((step: any) => ({
                      instruction: stripHtml(step.instructions ?? ''),
                      distanceText: step.distance?.text ?? '',
                      durationText: step.duration?.text ?? ''
                    })) ?? []
                });
              } else {
                setRoutingGuidance('staging', area.id, {
                  status: 'error',
                  destinationName: area.name,
                  errorMessage: status
                });
              }
              resolve();
            }
          );
        })
    );

    Promise.allSettled(requests).catch((error) => {
      console.error('Failed to compute staging directions', error);
    });

    return () => {
      cancelled = true;
    };
  }, [incident.location, stagingAreas, setRoutingGuidance, clearRoutingGuidance]);

  useEffect(() => {
    if (!incident.location) {
      clearRoutingGuidance('hospital');
      return;
    }
    if (!nearestHospital) {
      clearRoutingGuidance('hospital');
      return;
    }

    let cancelled = false;
    const service = new google.maps.DirectionsService();

    setRoutingGuidance('hospital', null, {
      status: 'loading',
      destinationName: nearestHospital.name
    });

    service.route(
      {
        origin: incident.location,
        destination: nearestHospital.location,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result: any, status: any) => {
        if (cancelled) {
          return;
        }

        if (status === 'OK' && result?.routes?.[0]?.legs?.[0]) {
          const leg = result.routes[0].legs[0];
          setRoutingGuidance('hospital', null, {
            status: 'ready',
            destinationName: nearestHospital.name,
            summary: {
              distanceKm: (leg.distance?.value ?? 0) / 1000,
              etaMinutes: (leg.duration?.value ?? 0) / 60
            },
            steps:
              leg.steps?.map((step: any) => ({
                instruction: stripHtml(step.instructions ?? ''),
                distanceText: step.distance?.text ?? '',
                durationText: step.duration?.text ?? ''
              })) ?? []
          });
        } else {
          setRoutingGuidance('hospital', null, {
            status: 'error',
            destinationName: nearestHospital.name,
            errorMessage: status
          });
        }
      }
    );

    return () => {
      cancelled = true;
    };
  }, [incident.location, nearestHospital, setRoutingGuidance, clearRoutingGuidance]);

  useEffect(() => {
    return () => {
      controllerRef.current?.destroy();
      controllerRef.current = null;
    };
  }, []);

  if (mapsError) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-3xl border border-rose-200 bg-rose-50 text-sm text-rose-700 shadow-inner">
        Failed to load Google Maps: {mapsError.message}
      </div>
    );
  }

  return (
    <div className="relative h-full w-full">
      <div ref={containerRef} className="h-full w-full" />
      <div
        ref={overlayBoundsRef}
        className={`pointer-events-none absolute inset-0 transition-opacity duration-300 ${
          isMapReady ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {!dismissedPanels.incident && (
          <DraggablePanel
            id="incident-overview"
            title="Incident overview"
            subtitle={
              incident.location
                ? `${incident.location.lat.toFixed(2)}°, ${incident.location.lng.toFixed(2)}°`
                : 'Click to set incident centroid'
            }
            tone="dark"
            className="w-[320px] sm:w-[360px]"
            bounds={overlayBounds}
            position={panelPositions.incident}
            onPositionChange={(position) => updatePanelPosition('incident', position)}
            collapsed={collapsedPanels.incident}
            onToggleCollapsed={(collapsed) => toggleCollapsed('incident', collapsed)}
            onClose={() => closePanel('incident')}
          >
          <div className="space-y-4 text-sm leading-6 text-slate-200">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-slate-400">Situation overview</p>
              <div className="mt-3 flex flex-wrap items-center gap-3">
                <span className="text-2xl font-semibold text-white">
                  {incident.demand > 0 ? `${incident.demand.toLocaleString()} impacted` : 'Set demand'}
                </span>
                <span
                  className={`inline-flex items-center rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] ${
                    RISK_BADGE_CLASSES[demandRiskLevel]
                  }`}
                >
                  {demandRiskLevel}
                </span>
              </div>
              <p className="mt-3 text-[13px] leading-6 text-slate-300">{demandRiskCopy}</p>
            </div>
            <div className="grid gap-4 rounded-2xl border border-white/10 bg-slate-900/60 p-4 text-[13px] leading-6 text-slate-300">
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-[0.28em] text-slate-400">Status</span>
                <span className="font-semibold text-white">{allocation ? allocation.riskLevel : 'Pending routing'}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-[0.28em] text-slate-400">Coverage</span>
                <span className="font-semibold text-white">
                  {allocation ? overallRiskCopy : 'Add staging to calculate system risk.'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="uppercase tracking-[0.28em] text-slate-400">Coordinates</span>
                <span className="font-mono text-sm text-slate-200">
                  {incident.location
                    ? `${incident.location.lat.toFixed(2)}°, ${incident.location.lng.toFixed(2)}°`
                    : 'Awaiting input'}
                </span>
              </div>
            </div>
          </div>
          </DraggablePanel>
        )}

        {!dismissedPanels.actions && (
          <DraggablePanel
            id="map-actions"
            title="Map actions"
            tone="dark"
            className="w-[300px] sm:w-[320px]"
            bounds={overlayBounds}
            position={panelPositions.actions}
            onPositionChange={(position) => updatePanelPosition('actions', position)}
            collapsed={collapsedPanels.actions}
            onToggleCollapsed={(collapsed) => toggleCollapsed('actions', collapsed)}
            onClose={() => closePanel('actions')}
          >
          <ul className="space-y-2 text-sm leading-6 text-slate-200">
            <li>
              <span className="font-semibold text-white">Click</span> anywhere to position the incident centroid.
            </li>
            <li>
              <span className="font-semibold text-white">Shift + Click</span> to add a staging node and seed resources.
            </li>
            <li>
              <span className="font-semibold text-white">Drag</span> staging markers to tune coverage envelopes.
            </li>
          </ul>
          </DraggablePanel>
        )}

        {nearestHospital && incident.location && !dismissedPanels.hospital && (
          <DraggablePanel
            id="nearest-hospital"
            title="Nearest hospital"
            subtitle={nearestHospital.city}
            tone="dark"
            className="w-[320px] sm:w-[340px]"
            bounds={overlayBounds}
            position={panelPositions.hospital}
            onPositionChange={(position) => updatePanelPosition('hospital', position)}
            collapsed={collapsedPanels.hospital}
            onToggleCollapsed={(collapsed) => toggleCollapsed('hospital', collapsed)}
            onClose={() => closePanel('hospital')}
          >
            <div className="space-y-4 text-sm leading-6 text-slate-200">
              <div className="flex items-center justify-between">
                <span className="text-base font-semibold text-white">{nearestHospital.name}</span>
                <span className="rounded-full border border-slate-700 px-2 py-0.5 text-[10px] uppercase tracking-[0.28em] text-slate-300">
                  Lv {nearestHospital.traumaLevel}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Distance</p>
                  <p className="mt-1 font-mono text-lg text-white">
                    {nearestHospital.distanceKm === null
                      ? 'Pending'
                      : formatKilometers(nearestHospital.distanceKm)}
                  </p>
                </div>
                <div className="rounded-xl border border-white/10 bg-slate-900/60 p-3">
                  <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Capacity</p>
                  <p className="mt-1 text-lg font-semibold text-white">{nearestHospital.capacity.toLocaleString()}</p>
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-slate-900/60 p-4 text-[13px] leading-6">
                {hospitalRoute?.status === 'ready' && hospitalRoute.summary && (
                  <dl className="grid grid-cols-2 gap-4">
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Drive time</dt>
                      <dd className="mt-1 font-mono text-base text-white">
                        {formatMinutes(hospitalRoute.summary.etaMinutes)}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-semibold uppercase tracking-[0.28em] text-slate-400">Route length</dt>
                      <dd className="mt-1 font-mono text-base text-white">
                        {formatKilometers(hospitalRoute.summary.distanceKm)}
                      </dd>
                    </div>
                  </dl>
                )}
                {hospitalRoute?.status === 'loading' && <p>Fetching Google Maps route…</p>}
                {hospitalRoute?.status === 'error' && (
                  <p className="text-rose-200">Unable to fetch Google Maps travel time.</p>
                )}
                {!hospitalRoute && <p>Routing data will appear once calculations complete.</p>}
              </div>
            </div>
          </DraggablePanel>
        )}
        {(dismissedPanels.incident || dismissedPanels.actions || dismissedPanels.hospital) && (
          <div className="pointer-events-auto absolute bottom-6 left-6 flex flex-wrap gap-2">
            {dismissedPanels.incident && (
              <button
                type="button"
                onClick={() => reopenPanel('incident')}
                className="rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-200 shadow"
              >
                Show incident overview
              </button>
            )}
            {dismissedPanels.actions && (
              <button
                type="button"
                onClick={() => reopenPanel('actions')}
                className="rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-200 shadow"
              >
                Show map actions
              </button>
            )}
            {dismissedPanels.hospital && nearestHospital && incident.location && (
              <button
                type="button"
                onClick={() => reopenPanel('hospital')}
                className="rounded-full border border-slate-700/70 bg-slate-900/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.32em] text-slate-200 shadow"
              >
                Show nearest hospital
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
