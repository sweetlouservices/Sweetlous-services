import { SERVICES, HOURS } from './constants';

export function toKey(y, m, d) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function fmtTime(h) {
  if (h === 12) return '12pm';
  return h > 12 ? `${h - 12}pm` : `${h}am`;
}

export function getDays(y, m) {
  return new Date(y, m + 1, 0).getDate();
}

export function getFirst(y, m) {
  return new Date(y, m, 1).getDay();
}

export function dayStatus(key, bookingsMap, blockedMap) {
  const booked  = (bookingsMap[key] || []).filter(b => b.status !== 'cancelled').length;
  const blocked = (blockedMap[key] || []).length;
  const total   = HOURS.length;
  const taken   = booked + blocked;
  if (taken === 0)           return { label: 'Open',        color: '#16a34a', dot: '#22c55e' };
  if (taken < total * 0.4)  return { label: 'Filling Up',  color: '#d97706', dot: '#facc15' };
  if (taken < total * 0.85) return { label: 'Busy',        color: '#ea580c', dot: '#fb923c' };
  return                           { label: 'Fully Booked', color: '#dc2626', dot: '#ef4444' };
}

export function bookingColor(b) {
  const svc = SERVICES.find(s => s.id === b.serviceId);
  if (b.status === 'pending')   return '#d97706';
  if (b.status === 'approved')  return svc?.color || '#2563eb';
  if (b.status === 'completed') return '#64748b';
  if (b.status === 'cancelled') return '#94a3b8';
  return '#2563eb';
}
