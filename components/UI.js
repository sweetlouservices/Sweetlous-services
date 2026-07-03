import { useEffect } from 'react';
import { DAY_NAMES } from '../lib/constants';
import { getDays, getFirst, toKey, dayStatus } from '../lib/utils';

export function Badge({ color, children, small }) {
  return (
    <span style={{
      background: color + '18', color, border: `1px solid ${color}40`,
      borderRadius: 20, padding: small ? '2px 8px' : '4px 12px',
      fontSize: small ? 10 : 11, fontWeight: 700, whiteSpace: 'nowrap',
      display: 'inline-block',
    }}>{children}</span>
  );
}

export function Toast({ msg, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, []);
  return (
    <div style={{
      position: 'fixed', bottom: 24, left: '50%', transform: 'translateX(-50%)',
      background: '#1e293b', color: '#fff', padding: '12px 20px', borderRadius: 12,
      fontSize: 13, fontWeight: 600, zIndex: 9999,
      boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
      maxWidth: 320, textAlign: 'center', pointerEvents: 'none',
    }}>{msg}</div>
  );
}

export function CalendarGrid({ year, month, selectedDay, onSelect, bookingsMap, blockedMap, showStatus }) {
  const days  = getDays(year, month);
  const first = getFirst(year, month);
  const today = new Date();

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
      {DAY_NAMES.map(d => (
        <div key={d} style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textAlign: 'center', paddingBottom: 6 }}>{d}</div>
      ))}
      {Array.from({ length: first }).map((_, i) => <div key={`e${i}`} />)}
      {Array.from({ length: days }, (_, i) => {
        const d   = i + 1;
        const key = toKey(year, month, d);
        const st  = dayStatus(key, bookingsMap, blockedMap);
        const sel = d === selectedDay;
        const isT = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
        return (
          <div
            key={d}
            onClick={() => onSelect(d)}
            style={{
              padding: '7px 0 5px', borderRadius: 10, textAlign: 'center',
              cursor: 'pointer',
              background: sel ? '#111827' : isT ? '#f0f9ff' : 'transparent',
              color: sel ? '#fff' : '#1e293b',
              fontWeight: sel ? 800 : isT ? 700 : 400,
              fontSize: 13, transition: 'background 0.12s', userSelect: 'none',
            }}
          >
            {d}
            {showStatus && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 3 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: sel ? '#fff' : st.dot, display: 'block' }} />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

export const navBtn     = { background: 'none', border: 'none', cursor: 'pointer', fontSize: 22, color: '#475569', padding: '2px 8px', borderRadius: 6 };
export const primaryBtn = { padding: '13px 20px', borderRadius: 12, border: 'none', background: '#111827', color: '#fff', fontWeight: 800, fontSize: 15, cursor: 'pointer' };
export const ghostBtn   = { padding: '12px 16px', borderRadius: 12, border: '1.5px solid #e2e8f0', background: '#fff', color: '#475569', fontWeight: 700, fontSize: 13, cursor: 'pointer' };
export const inputStyle = { width: '100%', padding: '11px 13px', borderRadius: 10, border: '1.5px solid #e2e8f0', fontSize: 14, color: '#1e293b', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' };
export const smGreenBtn = { padding: '5px 12px', borderRadius: 7, border: 'none', background: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 11, cursor: 'pointer' };
export const smRedBtn   = { padding: '5px 12px', borderRadius: 7, border: 'none', background: '#fef2f2', color: '#dc2626', fontWeight: 700, fontSize: 11, cursor: 'pointer' };
export const smGrayBtn  = { padding: '5px 12px', borderRadius: 7, border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 11, cursor: 'pointer' };
