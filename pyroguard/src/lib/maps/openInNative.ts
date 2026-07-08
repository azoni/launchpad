export function openInNativeMaps(lat: number, lng: number, label?: string) {
  if (typeof window === "undefined") return;
  const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
  const q = label ? encodeURIComponent(label) : `${lat},${lng}`;
  const url = isIOS
    ? `maps://?daddr=${lat},${lng}&q=${q}`
    : `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
  window.open(url, "_blank");
}
