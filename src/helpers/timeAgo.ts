const TIME_UNITS: [string, number][] = [
  ['дн.', 86400],
  ['ч.', 3600],
  ['мин.', 60],
  ['сек.', 1]
];

/** 
 * Converts a timestamp to a human-readable "time ago" format.
 * @param {number} ts - Timestamp
 * @returns {TimeAgoResult} 
*/

export default function timeAgo(ts: number | string, text: boolean = false): { value: number; unit: string; } | string {
  const diff = Math.floor(Date.now() / 1000) - (typeof ts === "string" ? parseInt(ts, 10) : ts);

  if (diff < 0) return { value: 0, unit: 'в будущем' };
  if (diff < 1) return { value: 0, unit: 'только что' };

  const [unit, seconds] = TIME_UNITS.find(([, s]) => diff >= s)!;

  if (!text) {
    return {
      value: Math.floor(diff / seconds),
      unit
    };
  }
  else {
    return `${Math.floor(diff / seconds)} ${unit}`;
  }
}