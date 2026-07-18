import { useState } from 'react';
import { SERVICES, HOURS, MONTH_NAMES } from '../lib/constants';
import { toKey, fmtTime } from '../lib/utils';
import { CalendarGrid, navBtn, primaryBtn, ghostBtn, inputStyle } from './UI';

export default function ClientView({ bookings, setBookings, blocked, toast, userPlan, setView }) {
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

  const svc      = SERVICES.find(s => s.id === svcId);
  const key      = day ? toKey(yr, mo, day) : null;
  const daySlots = key ? (bookings[key] || []) : [];
  const blkd     = key ? (blocked[key] || []) : [];

  function getSlotStatus(h) {
    const entry = daySlots.find(b => b.hour === h && b.status !== 'cancelled');
    if (blkd.includes(h)) return 'blocked';
    if (entry) return 'booked';
    return 'open';
  }

  function getBookedEntry(h) {
    return daySlots.find(b => b.hour === h && b.status !== 'cancelled');
  }

  function submit() {
    if (!form.name.trim()) return;
    const entry = {
      clientName: form.name,
      phone: form.phone,
      note: form.note,
      serviceId: svcId,
      hour,
      price: svc?.basePrice || 20,
      status: 'pending',
      bid: false,
      waitlist: false,
      payment: form.payment || 'cash',
    };
    setBookings(prev => ({ ...prev, [key]: [...(prev[key] || []), entry] }));
    setStep('done');
  }

  function submitBid() {
    const amt = parseFloat(bidAmt);
    const existing = getBookedEntry(hour);
    if (!amt || amt <= (existing?.price || 0)) {
      toast('Bid must be higher than current price');
      return;
    }
    const entry = {
      clientName: form.name,
      phone: form.phone,
      note: form.note,
      serviceId: svcId,
      hour,
      price: amt,
      status: 'pending',
      bid: true,
      waitlist: false,
      payment: form.payment || 'cash',
    };
    setBookings(prev => ({ ...prev, [key]: [...(prev[key] || []), entry] }));
    setIsBid(true);
    setStep('done');
  }

  function joinWaitlist() {
    if (!form.name.trim()) { toast('Enter your name first'); return; }
    const entry = {
      clientName: form.name,
      phone: form.phone,
      note: '',
      serviceId: svcId,
      hour,
      price: svc?.basePrice || 20,
      status: 'pending',
      bid: false,
      waitlist: true,
      payment: form.payment || 'cash',
    };
    setBookings(prev => ({ ...prev, [key]: [...(prev[key] || []), entry] }));
    setStep('done');
    toast('📋 Added to waitlist!');
  }

  function reset() {
    setSvcId(null); setHour(null); setDay(null);
    setForm({ name: '', phone: '', note: '', payment: 'cash' });
    setBidAmt(''); setIsBid(false);
    setStep('home');
  }

  const prevMo = () => { if (mo === 0) { setYr(y => y - 1); setMo(11); } else setMo(m => m - 1); setDay(null); };
  const nextMo = () => { if (mo === 11) { setYr(y => y + 1); setMo(0); } else setMo(m => m + 1); setDay(null); };

  // ── DONE ──
  if (step === 'done') return (
    <div style={{ textAlign: 'center', padding: '50px 20px' }}>
      <div style={{ fontSize: 64, marginBottom: 16 }}>{isBid ? '💰' : '✅'}</div>
      <div style={{ fontWeight: 900, fontSize: 24, marginBottom: 8 }}>
        {isBid ? 'Bid Submitted!' : "You're on the list!"}
      </div>
      <div style={{ color: '#64748b', fontSize: 14, marginBottom: 6 }}>
        {svc?.icon} {svc?.label} — {MONTH_NAMES[mo]} {day} at {fmtTime(hour)}
      </div>
      <div style={{ color: '#94a3b8', fontSize: 13, marginBottom: 20 }}>
        {isBid ? 'Lou will review your offer and respond soon.' : 'Lou will confirm your booking shortly.'}
      </div>
      <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 14, padding: 16, marginBottom: 20, textAlign: 'left' }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: '#1e293b', marginBottom: 8 }}>💰 Payment</div>
        {form.payment === 'venmo' ? (
          <>
            <div style={{ fontSize: 13, color: '#64748b', marginBottom: 10 }}>Send payment after Lou approves:</div>
            <a
              href="https://venmo.com/Saml-Poole-34"
              target="_blank"
              rel="noreferrer"
              style={{ display: 'block', padding: 10, background: '#008CFF', borderRadius: 10, color: '#fff', fontWeight: 800, fontSize: 15, textDecoration: 'none', textAlign: 'center' }}
            >
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
          <div style={{
            background: 'linear-gradient(135deg, #111827 0%, #1e3a5f 100%)',
            borderRadius: 20, padding: '28px 20px', color: '#fff',
          }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', letterSpacing: 2, marginBottom: 6 }}>YOUR NEIGHBORHOOD HELPER</div>
            <div style={{ fontWeight: 900, fontSize: 28, lineHeight: 1.15, marginBottom: 8 }}>
              Sweet Lou's<br />Services
            </div>
            <div style={{ fontSize: 13, color: '#94a3b8' }}>Fast, reliable, personal. Book Lou today.</div>
          </div>

          <div style={{ fontWeight: 700, fontSize: 15, color: '#1e293b' }}>What do you need?</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {SERVICES.map(s => {
              const locked = s.premium && userPlan === 'free';
              return (
                <button
                  key={s.id}
                  onClick={() => {
                    if (locked) {
                      toast('⭐ AC Filters is a Sweet Lou+ perk. Upgrade to book.');
                      return;
                    }
                    setSvcId(s.id);
                    setStep('calendar');
                  }}
                  style={{
                    padding: '16px 12px', borderRadius: 14,
                    cursor: locked ? 'default' : 'pointer',
                    border: `2px solid ${locked ? '#e2e8f0' : s.color + '30'}`,
                    background: locked ? '#f8fafc' : '#fff',
                    display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 6,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.06)', textAlign: 'left',
                    opacity: locked ? 0.75 : 1, position: 'relative', overflow: 'hidden',
                  }}
                >
                  {locked && (
                    <div style={{
                      position: 'absolute', top: 8, right: 8,
                      background: 'linear-gradient(135deg,#d97706,#f59e0b)',
                      color: '#fff', fontSize: 9, fontWeight: 800, padding: '2px 7px',
                      borderRadius: 20, letterSpacing: 0.5,
                    }}>⭐ PLUS</div>
                  )}
                  <span style={{ fontSize: 26, filter: locked ? 'grayscale(0.5)' : 'none' }}>{s.icon}</span>
                  <span style={{ fontWeight: 800, fontSize: 14, color: locked ? '#94a3b8' : '#1e293b' }}>{s.label}</span>
                  <span style={{ fontSize: 11, color: '#94a3b8' }}>{s.desc}</span>
                  {locked
                    ? <span style={{ fontSize: 11, fontWeight: 700, color: '#d97706' }}>Members only</span>
                    : <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>From ${s.basePrice}</span>
                  }
                </button>
              );
            })}
          </div>

          <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', boxShadow: '0 1px 3px rgba(0,0,0,0.06)', display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 13, marginBottom: 6 }}>Availability at a glance</div>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                {[['#22c55e','Open'],['#facc15','Filling'],['#fb923c','Busy'],['#ef4444','Full']].map(([c,l]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: c, display: 'block' }} />
                    <span style={{ fontSize: 11, color: '#64748b' }}>{l}</span>
                  </div>
                ))}
              </div>
            </div>
            <button onClick={() => setStep('calendar')} style={{ padding: '8px 14px', borderRadius: 10, border: 'none', background: '#111827', color: '#fff', fontWeight: 700, fontSize: 12, cursor: 'pointer' }}>
              View →
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
            <CalendarGrid year={yr} month={mo} selectedDay={day}
              onSelect={d => { setDay(d); setStep('time'); setHour(null); }}
              bookingsMap={bookings} blockedMap={blocked} showStatus />
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
                <button
                  key={h}
                  disabled={status === 'blocked'}
                  onClick={() => {
                    setHour(h);
                    if (status === 'booked') setStep('bid');
                    else { setIsBid(false); setStep('form'); }
                  }}
                  style={{
                    padding: '12px 10px', borderRadius: 12,
                    border: `2px solid ${status === 'blocked' ? '#e2e8f0' : status === 'booked' ? '#fde68a' : '#e2e8f0'}`,
                    background: status === 'blocked' ? '#f8fafc' : status === 'booked' ? '#fffbeb' : '#fff',
                    cursor: status === 'blocked' ? 'not-allowed' : 'pointer',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3,
                    opacity: status === 'blocked' ? 0.4 : 1,
                  }}
                >
                  <span style={{ fontWeight: 700, fontSize: 14, color: status === 'blocked' ? '#cbd5e1' : status === 'booked' ? '#b45309' : '#1e293b' }}>
                    {fmtTime(h)}
                  </span>
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
            <input placeholder="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
            <textarea placeholder="Any notes or details..." value={form.note} onChange={e => setForm(f => ({ ...f, note: e.target.value }))} rows={3} style={{ ...inputStyle, resize: 'vertical' }} />
            <div style={{ fontWeight: 700, fontSize: 13, color: '#1e293b' }}>How will you pay?</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, payment: 'venmo' }))}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: `2px solid ${form.payment === 'venmo' ? '#008CFF' : '#e2e8f0'}`,
                  background: form.payment === 'venmo' ? '#eff8ff' : '#fff',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  color: form.payment === 'venmo' ? '#008CFF' : '#475569',
                }}
              >
                💙 Venmo
              </button>
              <button
                type="button"
                onClick={() => setForm(f => ({ ...f, payment: 'cash' }))}
                style={{
                  flex: 1, padding: '10px', borderRadius: 10,
                  border: `2px solid ${form.payment === 'cash' ? '#16a34a' : '#e2e8f0'}`,
                  background: form.payment === 'cash' ? '#f0fdf4' : '#fff',
                  fontWeight: 700, fontSize: 13, cursor: 'pointer',
                  color: form.payment === 'cash' ? '#16a34a' : '#475569',
                }}
              >
                💵 Cash
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
            <button onClick={() => setStep('time')} style={ghostBtn}>Back</button>
            <button onClick={submit} disabled={!form.name.trim()} style={{ ...primaryBtn, flex: 1, opacity: form.name.trim() ? 1 : 0.5 }}>
              Send Request →
            </button>
          </div>
        </div>
      )}

      {/* ── BID / WAITLIST FORM ── */}
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
              <input placeholder="Phone number" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} style={inputStyle} />
              <div style={{ position: 'relative' }}>
                <span style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: '#64748b', fontWeight: 700 }}>$</span>
                <input
                  type="number"
                  placeholder={`More than $${existing?.price || 0}`}
                  value={bidAmt}
                  onChange={e => setBidAmt(e.target.value)}
                  style={{ ...inputStyle, paddingLeft: 26 }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
              <button onClick={() => setStep('time')} style={ghostBtn}>Back</button>
              <button
                onClick={submitBid}
                disabled={!form.name.trim() || !bidAmt}
                style={{ ...primaryBtn, flex: 1, background: '#d97706', opacity: form.name.trim() && bidAmt ? 1 : 0.5 }}
              >
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
