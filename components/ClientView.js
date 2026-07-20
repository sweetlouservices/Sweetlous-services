import { useState } from 'react';
import { SERVICES, HOURS, MONTH_NAMES, BOOKING_LIMIT } from '../lib/constants';
import { toKey, fmtTime, getDays, getFirst, dayStatus } from '../lib/utils';
import { navBtn, primaryBtn, ghostBtn, inputStyle } from './UI';

export default function ClientView({ bookings, setBookings, blocked, toast, userPlan, setView, points }) {
  const today = new Date();
  const [yr, setYr]   = useState(today.getFullYear());
  const [mo, setMo]   = useState(today.getMonth());
  const [day, setDay] = useState(null);
  const [svcId, setSvcId]   = useState(null);
  const [hour, setHour]     = useState(null);
  const [step, setStep]     = useState('home');
  const [form, setForm]     = useState({ name: '', phone: '', note: '', payment: 'cash' });
  const [bidAmt, setBidAmt] = useState('');
  const [isBid, setIsBid]   = useState(false);
  const [lookupPhone, setLookupPhone] = useState('');
  const [showLookup, setShowLookup]   = useState(false);

  const svc      = SERVICES.find(s => s.id === svcId);
  const key      = day ? toKey(yr, mo, day) : null;
  const daySlots = key ? (bookings[key] || []) : [];
  const blkd     = key ? (blocked[key] || []) : [];
  const bookingLimit = BOOKING_LIMIT[userPlan] || 30;
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + bookingLimit);

  function isDayBookable(y, m, d) {
    const date = new Date(y, m, d);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date >= todayStart && date <= maxDate;
  }

  function isDayVisible(y, m, d) {
    if (userPlan === 'vip') return true;
    const date = new Date(y, m, d);
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    return date >= todayStart && date <= maxDate;
  }

  function getSlotStatus(h) {
    const entry = daySlots.find(b => b.hour === h && b.status !== 'cancelled');
    if (blkd.includes(h)) return 'blocked';
    if (entry) return 'booked';
    return 'open';
  }

  function getBookedEntry(h) {
    return daySlots.find(b => b.hour === h && b.status !== 'cancelled');
  }

  function getCustomerPoints(phone) {
    if (!phone) return null;
    const clean = phone.replace(/\D/g, '');
    return points?.[clean] || null;
  }

  function submit() {
    if (!form.name.trim() || !form.phone.trim()) return;
    const entry = {
      clientName: form.name, phone: form.phone, note: form.note,
      serviceId: svcId, hour, price: svc?.basePrice || 20,
      status: 'pending', bid: false, waitlist: false, payment: form.payment || 'cash',
    };
    setBookings(prev => ({ ...prev, [key]: [...(prev[key] || []), entry] }));
    setStep('done');
  }

  function submitBid() {
    const amt = parseFloat(bidAmt);
    const existing = getBookedEntry(hour);
    if (!amt || amt <= (existing?.price || 0)) { toast('Bid must be higher than current price'); return; }
    if (!form.name.trim() || !form.phone.trim()) { toast('Name and phone required'); return; }
    const entry = {
      clientName: form.name, phone: form.phone, note: form.note,
      serviceId: svcId, hour, price: amt,
      status: 'pending', bid: true, waitlist: false, payment: form.payment || 'cash',
    };
    setBookings(prev => ({ ...prev, [key]: [...(prev[key] || []), entry] }));
    setIsBid(true);
    setStep('done');
  }

  function joinWaitlist() {
    if (!form.name.trim() || !form.phone.trim()) { toast('Name and phone required'); return; }
    const entry = {
      clientName: form.name, phone: form.phone, note: '',
      serviceId: svcId, hour, price: svc?.basePrice || 20,
      status: 'pending', bid: false, waitlist: true, payment: form.payment || 'cash',
    };
    setBookings(prev => ({ ...prev, [key]: [...(prev[key] || []), entry] }));
    setStep('done');
    toast('Added to waitlist!');
  }

  function reset() {
    setSvcId(null); setHour(null); setDay(null);
    setForm({ name: '', phone: '', note: '', payment: 'cash' });
    setBidAmt(''); setIsBid(false); setStep('home');
  }

  const prevMo = () => { if (mo === 0) { setYr(y => y - 1); setMo(11); } else setMo(m => m - 1); setDay(null); };
  const nextMo = () => { if (mo === 11) { setYr(y => y + 1); setMo(0); } else setMo(m => m + 1); setDay(null); };

  const customerPts = getCustomerPoints(form.phone);

  // ── DONE ──
  if (step === 'done') return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>{isBid ? '💰' : '✅'}</div>
      <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 8 }}>{isBid ? 'Bid Submitted!' : "You're on the list!"}</div>
      <div style={{ color: '#64748b', fontSize: 14, marginBottom: 6 }}>{svc?.icon} {svc?.label} — {MONTH_NAMES[mo]} {day} at {fmtTime(hour)}</div>
      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
        {isBid ? 'Lou will review your offer and respond soon.' : 'Lou will confirm your booking shortly.'}
      </div>

      {/* Points display on confirmation */}
      {getCustomerPoints(form.phone) && (
        <div style={{ background: 'linear-gradient(135deg, #111827, #1e3a5f)', borderRadius: 14, padding: 16, marginBottom: 16, textAlign: 'left' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', letterSpacing: 2, marginBottom: 4 }}>YOUR LOYALTY POINTS</div>
          <div style={{ fontSize: 36, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{getCustomerPoints(form.phone).total}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>
            {getCustomerPoints(form.phone).total >= 1000
              ? '🎉 You have enough for $100 off a ride! Contact Lou to redeem.'
              : `${1000 - getCustomerPoints(form.phone).total} more points until $100 off a ride`}
          </div>
        </div>
      )}

      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 20, textAlign: 'left' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 8 }}>💰 Payment</div>
        {form.payment === 'venmo' ? (
          <>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>Send payment after Lou approves:</div>
            <a href="https://venmo.com/Saml-Poole-34" target="_blank" rel="noreferrer"
              style={{ display: 'block', padding: 10, background: '#008CFF', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none', textAlign: 'center' }}>
              @Saml-Poole-34 on Venmo
            </a>
          </>
        ) : (
          <div style={{ fontSize: 13, color: '#16a34a', fontWeight: 600 }}>💵 Paying cash — Lou will collect at time of service.</div>
        )}
      </div>
      <button onClick={reset} style={primaryBtn}>Book Another</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* ── HOME ── */}
      {step === 'home' && (
        <>
          <div style={{ background: 'linear-gradient(135deg, #111827 0%, #1e3a5f 100%)', borderRadius: 20, padding: '28px 20px', color: '#fff' }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', letterSpacing: 2, marginBottom: 6 }}>YOUR NEIGHBORHOOD HELPER</div>
            <div style={{ fontWeight: 900, fontSize: 28, lineHeight: 1.15, marginBottom: 8 }}>Sweet Lou's<br />Services</div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Fast, reliable, personal. Book Lou today.</div>
          </div>

          {userPlan === 'vip' && (
            <div style={{ background: 'linear-gradient(135deg, #d97706, #f59e0b)', borderRadius: 12, padding: '10px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 20 }}>⭐</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 13, color: '#fff' }}>VIP Member</div>
                <div style={{ fontSize: 11, color: '#fef3c7' }}>Full year booking · AC Filters · Loyalty points</div>
              </div>
            </div>
          )}

          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>What do you need?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {SERVICES.map(s => {
              const locked = s.vipOnly && userPlan !== 'vip';
              return (
                <button key={s.id}
                  onClick={() => {
                    if (locked) { toast('⭐ AC Filters is a VIP member perk. Upgrade to book.'); return; }
                    setSvcId(s.id); setStep('calendar');
                  }}
                  style={{ padding: '16px 12px', borderRadius: 14, cursor: locked ? 'default' : 'pointer', border: `2px solid ${locked ? '#e2e8f0' : s.color + '30'}`, background: locked ? '#f8fafc' : '#fff', display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6, boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'left', opacity: locked ? 0.75 : 1, position: 'relative', overflow: 'hidden' }}>
                  {locked && <div style={{ position: 'absolute', top: 8, right: 8, background: 'linear-gradient(135deg,#d97706,#f59e0b)', color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px', borderRadius: 20 }}>⭐ VIP</div>}
                  <span style={{ fontSize: 26, filter: locked ? 'grayscale(0.5)' : 'none' }}>{s.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: locked ? '#94a3b8' : '#1e293b' }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.desc}</span>
                  {locked ? <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>VIP only</span> : <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>From ${s.basePrice}</span>}
                </button>
              );
            })}
          </div>

          {/* Points lookup */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: showLookup ? 12 : 0 }}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 13 }}>⭐ Check My Points</div>
                <div style={{ fontSize: 11, color: '#94a3b8' }}>1000 pts = $100 off a ride</div>
              </div>
              <button onClick={() => setShowLookup(s => !s)} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: '#f1f5f9', color: '#475569', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
                {showLookup ? 'Close' : 'Check'}
              </button>
            </div>
            {showLookup && (
              <div>
                <input
                  placeholder="Enter your phone number"
                  value={lookupPhone}
                  onChange={e => setLookupPhone(e.target.value)}
                  style={{ ...inputStyle, marginBottom: 10 }}
                />
                {lookupPhone.replace(/\D/g,'').length >= 10 && (
                  (() => {
                    const result = getCustomerPoints(lookupPhone);
                    return result ? (
                      <div style={{ background: 'linear-gradient(135deg, #111827, #1e3a5f)', borderRadius: 12, padding: 14 }}>
                        <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', letterSpacing: 1, marginBottom: 4 }}>YOUR POINTS</div>
                        <div style={{ fontSize: 40, fontWeight: 900, color: '#fff', marginBottom: 4 }}>{result.total}</div>
                        <div style={{ fontSize: 12, color: '#94a3b8' }}>
                          {result.total >= 1000
                            ? '🎉 Eligible for $100 off! Text Lou to redeem.'
                            : `${1000 - result.total} more until $100 off a ride`}
                        </div>
                        <div style={{ marginTop: 10, background: '#ffffff20', borderRadius: 8, height: 6, overflow: 'hidden' }}>
                          <div style={{ height: '100%', borderRadius: 8, background: 'linear-gradient(90deg,#fbbf24,#f59e0b)', width: `${Math.min((result.total / 1000) * 100, 100)}%` }} />
                        </div>
                      </div>
                    ) : (
                      <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '8px 0' }}>No points found for this number</div>
                    );
                  })()
                )}
              </div>
            )}
          </div>

          {/* View Calendar */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Availability at a glance</div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 10 }}>
              {[['#22c55e','Open'],['#facc15','Filling'],['#fb923c','Busy'],['#ef4444','Full']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'block' }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{l}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setStep('calendar')} style={{ width: '100%', padding: '9px', borderRadius: 10, border: 'none', background: '#111827', color: '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>
              View Calendar →
            </button>
          </div>
        </>
      )}

      {/* ── CALENDAR ── */}
      {step === 'calendar' && (
        <>
          {svc && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', background: '#fff', borderRadius: 14, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 24 }}>{svc.icon}</span>
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>{svc.label}</div>
                <div style={{ fontSize: 12, color: '#64748b' }}>From ${svc.basePrice} · Select a date</div>
              </div>
              <button onClick={reset} style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: 22 }}>×</button>
            </div>
          )}
          <div style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
              <button onClick={prevMo} style={navBtn}>‹</button>
              <span style={{ fontWeight: 800, fontSize: 16 }}>{MONTH_NAMES[mo]} {yr}</span>
              <button onClick={nextMo} style={navBtn}>›</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 3 }}>
              {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => (
                <div key={d} style={{ fontSize: 11, color: '#94a3b8', fontWeight: 700, textAlign: 'center', paddingBottom: 6 }}>{d}</div>
              ))}
              {Array.from({ length: getFirst(yr, mo) }).map((_, i) => <div key={`e${i}`} />)}
              {Array.from({ length: getDays(yr, mo) }, (_, i) => {
                const d = i + 1;
                const bookable = isDayBookable(yr, mo, d);
                const visible  = isDayVisible(yr, mo, d);
                const sel = d === day;
                const isT = d === today.getDate() && mo === today.getMonth() && yr === today.getFullYear();
                const k = toKey(yr, mo, d);
                const st = visible ? dayStatus(k, bookings, blocked) : null;
                const isPast = new Date(yr, mo, d) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
                return (
                  <div key={d}
                    onClick={() => {
                      if (isPast) return;
                      if (!bookable) { toast('⭐ Upgrade to VIP to book this date'); return; }
                      setDay(d); setStep('time'); setHour(null);
                    }}
                    style={{ padding: '7px 0 5px', borderRadius: 10, textAlign: 'center', cursor: (!isPast && bookable) ? 'pointer' : 'default', background: sel ? '#111827' : isT ? '#f0f9ff' : 'transparent', color: sel ? '#fff' : (isPast || !visible) ? '#cbd5e1' : '#1e293b', fontWeight: sel ? 800 : isT ? 700 : 400, fontSize: 13, opacity: isPast ? 0.3 : 1 }}>
                    {d}
                    {visible && !isPast && st && (
                      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 3 }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: sel ? '#fff' : st.dot, display: 'block' }} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 14, flexWrap: 'wrap' }}>
              {[['#22c55e','Open'],['#facc15','Filling'],['#fb923c','Busy'],['#ef4444','Full']].map(([c,l]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'block' }} />
                  <span style={{ fontSize: 11, color: '#64748b' }}>{l}</span>
                </div>
              ))}
            </div>
            {userPlan !== 'vip' && (
              <div style={{ marginTop: 12, padding: '10px 12px', background: '#fffbeb', borderRadius: 8, border: '1px solid #fde68a' }}>
                <div style={{ fontSize: 11, color: '#b45309', marginBottom: 6 }}>⭐ Dates beyond 30 days require VIP to book</div>
                <button onClick={() => setView('membership')} style={{ padding: '6px 14px', borderRadius: 8, border: 'none', background: '#d97706', color: '#fff', fontWeight: 700, fontSize: 11, cursor: 'pointer' }}>Go VIP →</button>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TIME SLOTS ── */}
      {step === 'time' && day && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontWeight: 800, fontSize: 16, color: '#1e293b' }}>{MONTH_NAMES[mo]} {day} — Pick a time</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            {HOURS.map(h => {
              const status = getSlotStatus(h);
              const entry  = getBookedEntry(h);
              const bSvc   = entry ? SERVICES.find(s => s.id === entry.serviceId) : null;
              return (
                <button key={h} disabled={status === 'blocked'}
                  onClick={() => { setHour(h); if (status === 'booked') setStep('bid'); else { setIsBid(false); setStep('form'); } }}
                  style={{ padding: '12px 10px', borderRadius: 12, border: `2px solid ${status === 'blocked' ? '#e2e8f0' : status === 'booked' ? '#fde68a' : '#e2e8f0'}`, background: status === 'blocked' ? '#f8fafc' : status === 'booked' ? '#fffbeb' : '#fff', cursor: status === 'blocked' ? 'not-allowed' : 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, opacity: status === 'blocked' ? 0.4 : 1 }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: status === 'blocked' ? '#cbd5e1' : status === 'booked' ? '#b45309' : '#1e293b' }}>{fmtTime(h)}</span>
                  {status === 'booked'  && <span style={{ fontSize: 10, color: '#b45309', fontWeight: 700 }}>BOOKED · Outbid?</span>}
                  {status === 'blocked' && <span style={{ fontSize: 10, color: '#94a3b8' }}>Unavailable</span>}
                  {status === 'open'    && <span style={{ fontSize: 10, color: '#16a34a', fontWeight: 600 }}>Available</span>}
                  {status === 'booked' && bSvc && <span style={{ fontSize: 11 }}>{bSvc.icon} ${entry.price}</span>}
                </button>
              );
            })}
          </div>
          <button onClick={() => setStep('calendar')} style={ghostBtn}>← Change date</button>
        </div>
      )}

      {/* ── BOOKING FORM ── */}
      {step === 'form' && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
          <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>Book your slot</div>
          <div style={{ padding: '10px 12px', borderRadius: 10, background: svc?.color + '10', border: `1px solid ${svc?.color}30`, marginBottom: 18 }}>
            <div style={{ fontWeight: 700, color: svc?.color }}>{svc?.icon} {svc?.label}</div>
            <div style={{ fontSize: 12, color: '#64748b' }}>{MONTH_NAMES[mo]} {day} at {fmtTime(hour)} · ${svc?.basePrice}</div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input placeholder="Your name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
            <input placeholder="Phone number *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
            {/* Show points if phone entered */}
            {form.phone.replace(/\D/g,'').length >= 10 && customerPts && (
              <div style={{ background: '#f0fdf4', borderRadius: 8, padding: '8px 12px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 700 }}>⭐ You have {customerPts.total} loyalty points</div>
                <div style={{ fontSize: 11, color: '#64748b' }}>{customerPts.total >= 1000 ? 'Eligible for $100 off!' : `${1000 - customerPts.total} more until $100 off`}</div>
              </div>
            )}
            <textarea placeholder="Any notes or details..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>How will you pay?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => setForm(f => ({ ...f, payment: 'venmo' }))}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${form.payment === 'venmo' ? '#008CFF' : '#e2e8f0'}`, background: form.payment === 'venmo' ? '#eff8ff' : '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: form.payment === 'venmo' ? '#008CFF' : '#475569' }}>
                💙 Venmo
              </button>
              <button type="button" onClick={() => setForm(f => ({ ...f, payment: 'cash' }))}
                style={{ flex: 1, padding: '10px', borderRadius: 10, border: `2px solid ${form.payment === 'cash' ? '#16a34a' : '#e2e8f0'}`, background: form.payment === 'cash' ? '#f0fdf4' : '#fff', fontWeight: 700, fontSize: 13, cursor: 'pointer', color: form.payment === 'cash' ? '#16a34a' : '#475569' }}>
                💵 Cash
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => setStep('time')} style={ghostBtn}>Back</button>
            <button onClick={submit} disabled={!form.name.trim() || !form.phone.trim()}
              style={{ ...primaryBtn, flex: 1, opacity: form.name.trim() && form.phone.trim() ? 1 : 0.5 }}>
              Send Request →
            </button>
          </div>
        </div>
      )}

      {/* ── BID / WAITLIST ── */}
      {step === 'bid' && (() => {
        const existing = getBookedEntry(hour);
        return (
          <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: '0 1px 3px rgba(0,0,0,0.06)' }}>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>This slot is taken</div>
            <div style={{ padding: '12px', background: '#fef9c3', borderRadius: 10, marginBottom: 16, border: '1px solid #fde68a' }}>
              <div style={{ fontSize: 13, color: '#92400e', fontWeight: 700 }}>Currently booked at ${existing?.price}</div>
              <div style={{ fontSize: 12, color: '#b45309' }}>Submit a higher offer and Lou will decide, or join the waitlist.</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <input placeholder="Your name *" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={inputStyle} />
              <input placeholder="Phone number *" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700 }}>$</span>
                <input type="number" placeholder={`More than $${existing?.price || 0}`} value={bidAmt} onChange={e => setBidAmt(e.target.value)} style={{ ...inputStyle, paddingLeft: 26 }} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setStep('time')} style={ghostBtn}>Back</button>
              <button onClick={submitBid} disabled={!form.name.trim() || !form.phone.trim() || !bidAmt}
                style={{ ...primaryBtn, flex: 1, background: '#d97706', opacity: form.name.trim() && form.phone.trim() && bidAmt ? 1 : 0.5 }}>
                💰 Submit Bid
              </button>
            </div>
            <button onClick={joinWaitlist} style={{ ...ghostBtn, width: '100%', marginTop: 8, fontSize: 12 }}>
              📋 Join waitlist — notify me if it opens
            </button>
          </div>
        );
      })()}
    </div>
  );
}
