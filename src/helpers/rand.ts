/**
 * Generates a random integer between min (inclusive) and max (exclusive).
 * @param {number} min - Minimum value (inclusive).
 * @param {number} max - Maximum value (exclusive).
 * @returns {number} Random integer.
 */
const rand = (min: number, max: number): number => Math.floor(Math.random() * (max - min)) + min;

export {
  rand,
};
