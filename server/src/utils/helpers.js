import { randomUUID } from 'crypto';

export const createId = () => randomUUID();

export const parseJsonArray = (value) => {
  if (!value) {
    return [];
  }

  if (Array.isArray(value)) {
    return value;
  }

  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

export const parseImages = (value) => parseJsonArray(value);

export const stringifyImages = (value) => JSON.stringify(parseImages(value));
export const stringifyJsonArray = (value) => JSON.stringify(parseJsonArray(value));

export const toBoolean = (value) => Boolean(Number(value));
export const toNumber = (value, fallback = null) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const normalizePostalArea = (value) => {
  if (!value) {
    return '';
  }

  return String(value).trim().toUpperCase().replace(/\s+/g, '').slice(0, 4);
};

export const calculateDistanceKm = (lat1, lon1, lat2, lon2) => {
  const coords = [lat1, lon1, lat2, lon2].map((value) => Number(value));

  if (coords.some((value) => !Number.isFinite(value))) {
    return null;
  }

  const [fromLat, fromLon, toLat, toLon] = coords;
  const earthRadiusKm = 6371;
  const dLat = ((toLat - fromLat) * Math.PI) / 180;
  const dLon = ((toLon - fromLon) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((fromLat * Math.PI) / 180) *
      Math.cos((toLat * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Number((earthRadiusKm * c).toFixed(2));
};
