export type Stop = { lat: number; lng: number; name: string; id: string };

export function haversine(a: Stop, b: Stop): number {
  const toRad = (x: number) => (x * Math.PI) / 180;
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}

export function nearestNeighborOrder(start: Stop, stops: Stop[]): Stop[] {
  const remaining = [...stops];
  const ordered: Stop[] = [];
  let current = start;
  while (remaining.length > 0) {
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < remaining.length; i++) {
      const d = haversine(current, remaining[i]);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    current = remaining[bestIdx];
    ordered.push(current);
    remaining.splice(bestIdx, 1);
  }
  return ordered;
}

export async function fetchDirections(
  stops: Stop[],
  token: string
): Promise<{ geometry: GeoJSON.LineString; durationSec: number; distanceM: number } | null> {
  if (stops.length < 2) return null;
  const coords = stops.map((s) => `${s.lng},${s.lat}`).join(";");
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${coords}?geometries=geojson&overview=full&access_token=${token}`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    const j = await res.json();
    const route = j.routes?.[0];
    if (!route) return null;
    return {
      geometry: route.geometry as GeoJSON.LineString,
      durationSec: route.duration as number,
      distanceM: route.distance as number,
    };
  } catch {
    return null;
  }
}

export function formatDuration(sec: number): string {
  const m = Math.round(sec / 60);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  const rem = m % 60;
  return `${h}h ${rem}m`;
}
