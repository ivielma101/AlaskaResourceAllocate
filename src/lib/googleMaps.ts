let mapsPromise: Promise<typeof google> | null = null;

const SCRIPT_ID = 'google-maps-sdk';

const loadScript = (url: string) =>
  new Promise<void>((resolve, reject) => {
    if (typeof document === 'undefined') {
      reject(new Error('Google Maps requires a browser environment.'));
      return;
    }

    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')), { once: true });
      return;
    }

    const script = document.createElement('script');
    script.id = SCRIPT_ID;
    script.src = url;
    script.async = true;
    script.defer = true;
    script.addEventListener('load', () => resolve(), { once: true });
    script.addEventListener('error', () => reject(new Error('Failed to load Google Maps script')), { once: true });
    document.head.appendChild(script);
  });

export const ensureGoogleMaps = () => {
  if (mapsPromise) {
    return mapsPromise;
  }

  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
  if (!apiKey) {
    throw new Error('Missing Google Maps API key. Set VITE_GOOGLE_MAPS_API_KEY in your environment.');
  }

  const url = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=visualization,geometry,places`;

  mapsPromise = loadScript(url).then(() => google);
  return mapsPromise;
};
