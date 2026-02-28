import type { LocationOption } from "@/types/weather";

const EARTH_RADIUS_KM = 6371;

function toRadians(value: number): number {
  return (value * Math.PI) / 180;
}

export function haversineDistanceKm(
  from: { lat: number; lon: number },
  to: { lat: number; lon: number }
): number {
  const dLat = toRadians(to.lat - from.lat);
  const dLon = toRadians(to.lon - from.lon);
  const lat1 = toRadians(from.lat);
  const lat2 = toRadians(to.lat);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

export function findNearestLocation(
  user: { lat: number; lon: number },
  locations: LocationOption[]
): LocationOption | null {
  if (!locations.length) {
    return null;
  }

  let nearest = locations[0];
  let shortestDistance = haversineDistanceKm(user, {
    lat: nearest.lat,
    lon: nearest.lon
  });

  for (let index = 1; index < locations.length; index += 1) {
    const candidate = locations[index];
    const candidateDistance = haversineDistanceKm(user, {
      lat: candidate.lat,
      lon: candidate.lon
    });

    if (candidateDistance < shortestDistance) {
      shortestDistance = candidateDistance;
      nearest = candidate;
    }
  }

  return nearest;
}
