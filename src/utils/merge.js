// Recursively merge `source` into `target`. Nested objects are merged,
// everything else is overwritten. Returns the mutated target.
function deepMerge(target, source) {
  for (const key in source) {
    const value = source[key];
    if (value && typeof value === "object" && !Array.isArray(value)) {
      if (!target[key] || typeof target[key] !== "object") {
        target[key] = {};
      }
      deepMerge(target[key], value);
    } else {
      target[key] = value;
    }
  }
  return target;
}

module.exports = { deepMerge };
