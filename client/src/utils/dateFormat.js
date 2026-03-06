/**
 * German date format: dd.mm.yyyy, HH:mm
 */
export function formatDateTime(dateString) {
  const date = new Date(dateString);
  return date.toLocaleString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * German date only: dd.mm.yyyy
 */
export function formatDate(dateString) {
  const date = new Date(dateString);
  return date.toLocaleDateString('de-DE', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
}

/**
 * Compact date for table view: DD.MM.'YY (e.g. 06.12.'25)
 */
export function formatDateCompact(dateString) {
  const date = new Date(dateString);
  const d = String(date.getDate()).padStart(2, '0');
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const y = String(date.getFullYear()).slice(-2);
  return `${d}.${m}.'${y}`;
}
