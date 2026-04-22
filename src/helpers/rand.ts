/**
 * Generates a random integer between min (inclusive) and max (exclusive).
 * @param {number} min - Minimum value (inclusive).
 * @param {number} max - Maximum value (exclusive).
 * @returns {number} Random integer.
 */
export default function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}