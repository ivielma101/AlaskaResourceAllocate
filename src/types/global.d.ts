export {};

declare global {
  // Minimal declaration to satisfy TypeScript when the Google Maps SDK loads on the window.
  const google: any;
}
