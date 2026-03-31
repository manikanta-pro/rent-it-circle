import { randomUUID } from 'crypto';

export const createId = () => randomUUID();

export const parseImages = (value) => {
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

export const stringifyImages = (value) => JSON.stringify(parseImages(value));

export const toBoolean = (value) => Boolean(Number(value));
