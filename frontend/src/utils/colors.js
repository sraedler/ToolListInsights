/**
 * Deterministic Contract Color Generator
 * Produces consistent, visually distinct HSL colors for order contract numbers.
 */

export function getContractColor(contractNum) {
  if (!contractNum) return 'hsl(210, 65%, 45%)';
  let hash = 0;
  for (let i = 0; i < contractNum.length; i++) {
    hash = contractNum.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash) % 360;
  return `hsl(${hue}, 65%, 40%)`;
}
