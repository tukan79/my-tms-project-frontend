// src/utils/objectHelpers.js
export const filterKeys = (obj = {}, allowedKeys = []) => {
  if (!obj || typeof obj !== 'object') return {};
  if (!Array.isArray(allowedKeys) || allowedKeys.length === 0) return { ...obj };
  const out = {};
  for (const k of allowedKeys) {
    if (Object.prototype.hasOwnProperty.call(obj, k)) {
      out[k] = obj[k];
    }
  }
  return out;
};

export const pick = (obj = {}, keys = []) => filterKeys(obj, keys);

export default { filterKeys, pick };