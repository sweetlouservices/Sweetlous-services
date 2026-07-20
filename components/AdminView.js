import { useState } from 'react';
import { SERVICES, HOURS, MONTH_NAMES } from '../lib/constants';
import { toKey, fmtTime, bookingColor } from '../lib/utils';
import { Badge, CalendarGrid, navBtn, smGreenBtn, smRedBtn, smGrayBtn, inputStyle, primaryBtn, ghostBtn } from './UI';

export default function AdminView({ bookings, setBookings, blocked, setBlocked, notifs, toast, points, setPoints }) {
  const today = new Date();
  const [yr, setYr]   = useState(today.getFullYear());
  const [mo, setMo]   = useState(today.getMonth());
  const [day, setDay] = useState(today.getDate());
  const [tab, setTab] = useState('calendar');
  const [blockMode, setBlockMode] = useState(false);
  const [addMode, setAddMode]     = useState(false);
  const [newBooking, setNewBooking] = useState({ name: '', phone: '', note: '', serviceId: 'ride', hour: 9, payment: 'cash', price: '' });
  const [pointsTab, setPointsTab] = useState(false);
  const [addPtsPhone, setAddPtsPhone] = useState('');
  const [addPtsAmt, setAddPtsAmt]   = useState('');
  const [lookupPhone, setLookupPhone] = useState('');

  const key        = toKey(yr, mo, day);
  const dayEntries = bookings[key] || [];
  const dayBlocked = blocked[key]  || [];
  const pending    = Object.values(bookings).flat().filter(b => b.status === 'pending');

  function toggleBlock(h) {
    setBlocked(prev => {
      const cur = prev[key] || [];
      return { ...prev, [key]: cur.includes(h) ? cur.filter(x => x !== h) : [...cur, h] };
    });
  }

  function approveBooking(bkey, idx) {
    setBookings(prev => {
      const arr = [...(prev[bkey] || [])];
      const approvedHour = arr[idx].hour;
      const updated = arr.map((b, i) => {
        if (i === idx) return { ...b, status: 'approved' };
        if (b.hour === approvedHour && b.status !== 'cancelled') return { ...b, status: 'cancelled' };
        return b;
      });
      return { ...prev, [bkey]: updated };
    });
    // Add 5 points to customer's phone number
    const booking = (bookings[bkey] || [])[idx];
    if (booking?.phone) {
      addPoints(booking.phone, booking.clientName, 5);
    }
    toast('✅ Approved — +5 points added');
  }

  function rejectBooking(bkey, idx) {
    setBookings(prev => {
      const arr = [...(prev[bkey] || [])];
      arr[idx] = { ...arr[idx], status: 'cancelled' };
      return { ...prev, [bkey]: arr };
    });
    toast('❌ Booking declined');
  }

  function cancelBooking(bkey, idx) {
    setBookings(prev => {
      const arr = [...(prev[bkey] || [])];
      arr[idx] = { ...arr[idx], status: 'cancelled' };
      return { ...prev, [bkey]: arr };
    });
    toast('🚫 Booking cancelled');
  }

  function acceptBid(bkey, bidIdx, origIdx) {
    setBookings(prev => {
      const arr = [...(prev[bkey] || [])];
      arr[origIdx] = { ...arr[origIdx], status: 'cancelled' };
      arr[bidIdx]  = { ...arr[bidIdx],  status: 'approved' };
      return { ...prev, [bkey]: arr };
    });
    toast('💰 Higher bid accepted!');
  }

  function markComplete(bkey, idx) {
    setBookings(prev => {
      const arr = [...(prev[bkey] || [])];
      arr[idx] = { ...arr[idx], status: 'completed' };
      return { ...prev, [bkey]: arr };
    });
    toast('🎉 Marked complete');
  }

  function saveNewBooking() {
    if (!newBooking.name.trim()) { toast('Enter a name'); return; }
    const svc = SERVICES.find(s => s.id === newBooking.serviceId);
    const entry = {
      clientName: newBooking.name, phone: newBooking.phone, note: newBooking.note,
      serviceId: newBooking.serviceId, hour: parseInt(newBooking.hour),
      price: parseFloat(newBooking.price) || svc?.basePrice || 20,
      status: 'approved', bid: false, waitlist: false,
      payment: newBooking.payment, addedByAdmin: true,
    };
    setBookings(prev => ({ ...prev, [key]: [...(prev[key] || []), entry] }));
    setAddMode(false);
    setNewBooking({ name: '', phone: '', note: '', serviceId: 'ride', hour: 9, payment: 'cash', price: '' });
    toast('✅ Booking added!');
  }

  // Points functions
  function addPoints(phone, name, amount) {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone) return;
    setPoints(prev => {
      const current = prev[cleanPhone] || { name, phone: cleanPhone, total: 0 };
      return { ...prev, [cleanPhone]: { ...current, name: name || current.name, total: current.total + amount } };
    });
  }

  function removePoints(phone, amount) {
    const cleanPhone = phone.replace(/\D/g, '');
    setPoints(prev => {
      const current = prev[cleanPhone];
      if (!current) return prev;
      const newTotal = Math.max(0, current.total - amount);
      return { ...prev, [cleanPhone]: { ...current, total: newTotal } };
    });
  }

  function clearPoints(phone) {
    const cleanPhone = phone.replace(/\D/g, '');
    setPoints(prev => {
      const current = prev[cleanPhone];
      if (!current) return prev;
      return { ...prev, [cleanPhone]: { ...current, total: 0 } };
    });
    toast('✅ Points cleared — coupon redeemed');
  }

  function handleAddPoints() {
    if (!addPtsPhone.trim() || !addPtsAmt) return;
    addPoints(addPtsPhone, '', parseInt(addPtsAmt));
    toast(`✅ Added ${addPtsAmt} points to ${addPtsPhone}`);
    setAddPtsPhone(''); setAddPtsAmt('');
  }

  const prevMo = () => { if (mo === 0) { setYr(y => y - 1); setMo(11); } else setMo(m => m - 1); setDay(1); };
  const nextMo = () => { if (mo === 11) { setYr(y => y + 1); setMo(0); } else setMo(m => m + 1); setDay(1); };

  const totalEarned = Object.values(bookings).flat()
    .filter(b => (b.status === 'completed' || b.status === 'approved') && b.status !== 'cancelled')
    .reduce((s, b) => s + (b.price || 0), 0);

  function paymentLabel(b) {
    if (!b.payment) return '';
    return b.payment === 'venmo' ? ' · 💙 Venmo' : ' · 💵 Cash';
  }

  const pointsList = Object.values(points || {}).sort((a, b) => b.total - a.total);
  const lookupResult = lookupPhone ? (points[lookupPhone.replace(/\D/g, '')] || null) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
        {[
          { label: 'Pending',  val: pending.length, color: '#d97706' },
          { label: 'Approved', val: Object.values(bookings).flat().filter(b => b.status === 'approved').length, color: '#16a34a' },
          { label: 'Earned',   val: `$${totalEarned}`, color: '#2563eb' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: '14px 10px', textAlign: 'center', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 6 }}>
        {[
          ['calendar', '📅'],
          ['requests', `🔔${pending.length ? ` (${pending.length})` : ''}`],
          ['all', '📋'],
          ['points', '⭐'],
        ].map(([t, l]) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '9px 4px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 13,
            background: tab === t ? '#111827' : '#fff',
            color: tab === t ? '#fff' : '#475569',
            fontWeight: 700, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
          }}>{l}</button>
        ))}
      </div>

      {/* ── CALENDAR TAB ── */}
      {tab === 'calendar' && (
        <>
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={prevMo} style={navBtn}>‹</button>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{MONTH_NAMES[mo]} {yr}</span>
              <button onClick={nextMo} style={navBtn}>›</button>
            </div>
            <CalendarGrid year={yr} month={mo} selectedDay={day} onSelect={setDay} bookingsMap={bookings} blockedMap={blocked} showStatus />
            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              {[['#22c55e','Open'],['#facc15','Filling'],['#fb923c','Busy'],['#ef4444','Full']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'block' }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{l}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Day detail */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <span style={{ fontWeight: 700, fontSize: 15 }}>{MONTH_NAMES[mo]} {day}</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => { setAddMode(a => !a); setBlockMode(false); }}
                  style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, background: addMode ? '#111827' : '#f0fdf4', color: addMode ? '#fff' : '#16a34a', fontWeight: 700 }}>
                  {addMode ? '✕ Cancel' : '+ Add'}
                </button>
                <button onClick={() => { setBlockMode(b => !b); setAddMode(false); }}
                  style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, background: blockMode ? '#fef2f2' : '#f8fafc', color: blockMode ? '#dc2626' : '#475569', fontWeight: 700 }}>
                  {blockMode ? '✕ Done' : '🚫 Block'}
                </button>
              </div>
            </div>

            {addMode && (
              <div style={{ background: '#f0fdf4', border: '1.5px solid #bbf7d0', borderRadius: 12, padding: 16, marginBottom: 14 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: '#15803d', marginBottom: 12 }}>Add booking for {MONTH_NAMES[mo]} {day}</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input placeholder="Customer name *" value={newBooking.name} onChange={e => setNewBooking(b => ({ ...b, name: e.target.value }))} style={inputStyle} />
                  <input placeholder="Phone number" value={newBooking.phone} onChange={e => setNewBooking(b => ({ ...b, phone: e.target.value }))} style={inputStyle} />
                  <select value={newBooking.serviceId} onChange={e => { const svc = SERVICES.find(s => s.id === e.target.value); setNewBooking(b => ({ ...b, serviceId: e.target.value, price: svc?.basePrice || '' })); }} style={{ ...inputStyle, background: '#fff' }}>
                    {SERVICES.map(s => <option key={s.id} value={s.id}>{s.icon} {s.label}</option>)}
                  </select>
                  <select value={newBooking.hour} onChange={e => setNewBooking(b => ({ ...b, hour: e.target.value }))} style={{ ...inputStyle, background: '#fff' }}>
                    {HOURS.map(h => <option key={h} value={h}>{fmtTime(h)}</option>)}
                  </select>
                  <input placeholder="Price ($)" type="number" value={newBooking.price} onChange={e => setNewBooking(b => ({ ...b, price: e.target.value }))} style={inputStyle} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" onClick={() => setNewBooking(b => ({ ...b, payment: 'cash' }))}
                      style={{ flex: 1, padding: '9px', borderRadius: 10, border: `2px solid ${newBooking.payment === 'cash' ? '#16a34a' : '#e2e8f0'}`, background: newBooking.payment === 'cash' ? '#f0fdf4' : '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: newBooking.payment === 'cash' ? '#16a34a' : '#475569' }}>💵 Cash</button>
                    <button type="button" onClick={() => setNewBooking(b => ({ ...b, payment: 'venmo' }))}
                      style={{ flex: 1, padding: '9px', borderRadius: 10, border: `2px solid ${newBooking.payment === 'venmo' ? '#008CFF' : '#e2e8f0'}`, background: newBooking.payment === 'venmo' ? '#eff8ff' : '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: newBooking.payment === 'venmo' ? '#008CFF' : '#475569' }}>💙 Venmo</button>
                  </div>
                  <textarea placeholder="Notes..." value={newBooking.note} onChange={e => setNewBooking(b => ({ ...b, note: e.target.value }))} rows={2} style={{ ...inputStyle, resize: 'vertical' }} />
                  <button onClick={saveNewBooking} style={{ ...primaryBtn, width: '100%', background: '#16a34a' }}>✓ Save Booking</button>
                </div>
              </div>
            )}

            {HOURS.map(h => {
              const entry = dayEntries.find(b => b.hour === h && b.status !== 'cancelled');
              const blk   = dayBlocked.includes(h);
              const svc   = entry ? SERVICES.find(s => s.id === entry.serviceId) : null;
              const bids  = dayEntries.filter(b => b.hour === h && b.bid && b.status === 'pending');
              return (
                <div key={h} onClick={() => blockMode && !entry && toggleBlock(h)}
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 10px', borderRadius: 9, marginBottom: 4, background: entry ? (svc?.color + '12') : blk ? '#fef2f2' : '#f8fafc', border: `1.5px solid ${entry ? (svc?.color + '40') : blk ? '#fecaca' : '#e2e8f0'}`, cursor: blockMode && !entry ? 'pointer' : 'default' }}>
                  <span style={{ fontSize: 12, color: '#94a3b8', width: 36, flexShrink: 0, paddingTop: 2 }}>{fmtTime(h)}</span>
                  {entry ? (
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 14 }}>{svc?.icon}</span>
                        <span style={{ fontWeight: 700, fontSize: 13, color: bookingColor(entry) }}>{entry.clientName}</span>
                        <Badge color={bookingColor(entry)} small>{entry.status}</Badge>
                        {entry.addedByAdmin && <Badge color="#64748b" small>📞 walk-in</Badge>}
                        <span style={{ marginLeft: 'auto', fontWeight: 700, color: '#16a34a', fontSize: 13 }}>{entry.status !== 'cancelled' ? `$${entry.price}` : ''}</span>
                      </div>
                      <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{svc?.label}{entry.note ? ` · ${entry.note}` : ''}{paymentLabel(entry)}</div>
                      {entry.phone && <div style={{ fontSize: 11, color: '#94a3b8' }}>{entry.phone}</div>}
                      {bids.length > 0 && (
                        <div style={{ marginTop: 6, padding: '8px 10px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#b45309' }}>💰 Higher bid: ${bids[0].price} from {bids[0].clientName}</div>
                          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                            <button onClick={() => acceptBid(key, dayEntries.indexOf(bids[0]), dayEntries.indexOf(entry))} style={smGreenBtn}>Accept bid</button>
                            <button onClick={() => rejectBooking(key, dayEntries.indexOf(bids[0]))} style={smRedBtn}>Ignore</button>
                          </div>
                        </div>
                      )}
                      {entry.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button onClick={() => approveBooking(key, dayEntries.indexOf(entry))} style={smGreenBtn}>Approve</button>
                          <button onClick={() => rejectBooking(key, dayEntries.indexOf(entry))} style={smRedBtn}>Decline</button>
                          <button onClick={() => markComplete(key, dayEntries.indexOf(entry))} style={smGrayBtn}>Done</button>
                        </div>
                      )}
                      {entry.status === 'approved' && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button onClick={() => markComplete(key, dayEntries.indexOf(entry))} style={smGrayBtn}>Mark complete</button>
                          <button onClick={() => cancelBooking(key, dayEntries.indexOf(entry))} style={smRedBtn}>Cancel</button>
                        </div>
                      )}
                    </div>
                  ) : blk ? (
                    <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12, color: '#ef4444', fontWeight: 700 }}>Blocked</span>
                      <button onClick={() => toggleBlock(h)} style={smGrayBtn}>Unblock</button>
                    </div>
                  ) : (
                    <span style={{ fontSize: 12, color: '#cbd5e1' }}>{blockMode ? 'Tap to block' : 'Open'}</span>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* ── REQUESTS TAB ── */}
      {tab === 'requests' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>Pending Requests</div>
          {pending.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0', fontSize: 14 }}>No pending requests 🎉</div>
          ) : (
            Object.entries(bookings).flatMap(([k, arr]) =>
              arr.map((b, idx) => {
                if (b.status !== 'pending') return null;
                const svc = SERVICES.find(s => s.id === b.serviceId);
                return (
                  <div key={`${k}-${idx}`} style={{ padding: '14px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 8 }}>
                      <span style={{ fontSize: 22 }}>{svc?.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{b.clientName}</div>
                        <div style={{ fontSize: 12, color: '#64748b' }}>{k} at {fmtTime(b.hour)} · {svc?.label}</div>
                        {b.phone && <div style={{ fontSize: 11, color: '#94a3b8' }}>{b.phone}</div>}
                        {b.note && <div style={{ fontSize: 11, color: '#475569', marginTop: 2 }}>"{b.note}"</div>}
                        {b.payment && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{b.payment === 'venmo' ? '💙 Venmo' : '💵 Cash'}</div>}
                        {b.bid && <div style={{ fontSize: 12, color: '#d97706', fontWeight: 700, marginTop: 4 }}>💰 Outbid: ${b.price}</div>}
                        {b.waitlist && <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 700, marginTop: 4 }}>📋 Waitlist</div>}
                      </div>
                      <div style={{ fontWeight: 800, fontSize: 16, color: '#16a34a' }}>${b.price}</div>
                    </div>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => approveBooking(k, idx)} style={{ ...smGreenBtn, flex: 1, padding: '9px 0', fontSize: 13 }}>✓ Approve</button>
                      <button onClick={() => rejectBooking(k, idx)} style={{ ...smRedBtn, flex: 1, padding: '9px 0', fontSize: 13 }}>✕ Decline</button>
                    </div>
                  </div>
                );
              }).filter(Boolean)
            )
          )}
        </div>
      )}

      {/* ── ALL JOBS TAB ── */}
      {tab === 'all' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>All Jobs</div>
          {Object.entries(bookings).flatMap(([k, arr]) => arr).length === 0 && (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: '30px 0' }}>No bookings yet</div>
          )}
          {Object.entries(bookings).flatMap(([k, arr]) =>
            arr.map((b, i) => {
              const svc = SERVICES.find(s => s.id === b.serviceId);
              return (
                <div key={`${k}-${i}`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 0', borderBottom: '1px solid #f8fafc' }}>
                  <span style={{ fontSize: 22, opacity: b.status === 'cancelled' ? 0.4 : 1 }}>{svc?.icon}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13, textDecoration: b.status === 'cancelled' ? 'line-through' : 'none', color: b.status === 'cancelled' ? '#94a3b8' : '#1e293b' }}>{b.clientName}</div>
                    <div style={{ fontSize: 11, color: '#64748b' }}>{k} {fmtTime(b.hour)} · {svc?.label}</div>
                    {b.phone && <div style={{ fontSize: 10, color: '#94a3b8' }}>{b.phone}</div>}
                    {b.payment && <div style={{ fontSize: 10, color: '#64748b' }}>{b.payment === 'venmo' ? '💙 Venmo' : '💵 Cash'}</div>}
                    {b.addedByAdmin && <div style={{ fontSize: 10, color: '#64748b' }}>📞 Added by you</div>}
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    {b.status !== 'cancelled' && <div style={{ fontWeight: 800, color: '#16a34a', fontSize: 13 }}>${b.price}</div>}
                    <Badge color={bookingColor(b)} small>{b.status}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ── POINTS TAB ── */}
      {tab === 'points' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Add points manually */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>➕ Add Points Manually</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <input placeholder="Phone number" value={addPtsPhone} onChange={e => setAddPtsPhone(e.target.value)} style={inputStyle} />
              <input placeholder="Points to add" type="number" value={addPtsAmt} onChange={e => setAddPtsAmt(e.target.value)} style={inputStyle} />
              <button onClick={handleAddPoints} disabled={!addPtsPhone || !addPtsAmt}
                style={{ ...primaryBtn, opacity: addPtsPhone && addPtsAmt ? 1 : 0.5 }}>Add Points</button>
            </div>
          </div>

          {/* Lookup */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 12 }}>🔍 Look Up Customer</div>
            <input placeholder="Enter phone number" value={lookupPhone} onChange={e => setLookupPhone(e.target.value)} style={{ ...inputStyle, marginBottom: 10 }} />
            {lookupPhone && (
              lookupResult ? (
                <div style={{ background: '#f0fdf4', borderRadius: 12, padding: 14, border: '1px solid #bbf7d0' }}>
                  <div style={{ fontWeight: 700, fontSize: 15 }}>{lookupResult.name || 'Customer'}</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>{lookupResult.phone}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, color: '#16a34a', marginBottom: 4 }}>{lookupResult.total} pts</div>
                  <div style={{ fontSize: 12, color: '#64748b', marginBottom: 12 }}>
                    {lookupResult.total >= 1000 ? '🎉 Eligible for $100 coupon!' : `${1000 - lookupResult.total} more points until $100 coupon`}
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => removePoints(lookupResult.phone, 5)} style={{ ...smGrayBtn, flex: 1 }}>−5 pts</button>
                    <button onClick={() => removePoints(lookupResult.phone, 10)} style={{ ...smGrayBtn, flex: 1 }}>−10 pts</button>
                    <button onClick={() => clearPoints(lookupResult.phone)} style={{ ...smRedBtn, flex: 1 }}>Clear All</button>
                  </div>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '10px 0' }}>No customer found with that number</div>
              )
            )}
          </div>

          {/* All customers with points */}
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 14 }}>All Customers</div>
            {pointsList.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>No points yet — approve bookings to add points</div>
            ) : (
              pointsList.map(c => (
                <div key={c.phone} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0', borderBottom: '1px solid #f8fafc' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 13 }}>{c.name || 'Unknown'}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.phone}</div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, fontSize: 18, color: c.total >= 1000 ? '#16a34a' : '#1e293b' }}>{c.total}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8' }}>points</div>
                    {c.total >= 1000 && <div style={{ fontSize: 10, color: '#16a34a', fontWeight: 700 }}>🎉 Eligible!</div>}
                  </div>
                  <button onClick={() => clearPoints(c.phone)} style={{ ...smRedBtn }}>Clear</button>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
