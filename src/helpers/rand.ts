/**
 * Generates a random integer between min (inclusive) and max (exclusive).
 * @param min - Minimum value (inclusive).
 * @param max - Maximum value (exclusive).
 */
export default function rand(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min)) + min;
}