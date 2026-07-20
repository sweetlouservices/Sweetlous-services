import { useState, useEffect } from 'react';
import Head from 'next/head';
import { db } from '../lib/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import AdminView      from '../components/AdminView';
import ClientView     from '../components/ClientView';
import MembershipView from '../components/MembershipView';
import { Toast }      from '../components/UI';
import { ADMIN_PIN }  from '../lib/constants';

export default function Home() {
  const [view, setView]             = useState('home');
  const [bookings, setBookings]     = useState({});
  const [blocked, setBlocked]       = useState({});
  const [points, setPoints]         = useState({});
  const [notifs, setNotifs]         = useState([]);
  const [toastMsg, setToastMsg]     = useState(null);
  const [adminOpen, setAdminOpen]   = useState(false);
  const [pin, setPin]               = useState('');
  const [userPlan, setUserPlan]     = useState('free');
  const [showNotifs, setShowNotifs] = useState(false);
  const [loading, setLoading]       = useState(true);

  // Load bookings from Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bookings'), snapshot => {
      const data = {};
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        if (!data[d.dateKey]) data[d.dateKey] = [];
        data[d.dateKey].push({ ...d, _id: docSnap.id });
      });
      setBookings(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load blocked slots from Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'blocked'), snapshot => {
      const data = {};
      snapshot.forEach(docSnap => {
        const d = docSnap.data();
        data[d.dateKey] = d.hours || [];
      });
      setBlocked(data);
    });
    return () => unsub();
  }, []);

  // Load points from Firebase
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'points'), snapshot => {
      const data = {};
      snapshot.forEach(docSnap => {
        data[docSnap.id] = docSnap.data();
      });
      setPoints(data);
    });
    return () => unsub();
  }, []);

  function toast(msg) { setToastMsg(msg); }

  function unlockAdmin() {
    if (pin === ADMIN_PIN) {
      setAdminOpen(true);
      setView('admin');
      setPin('');
    } else {
      toast('Wrong PIN');
      setPin('');
    }
  }

  // Save booking to Firebase
  async function handleSetBookings(updater) {
    const prev = bookings;
    const next = typeof updater === 'function' ? updater(prev) : updater;
    Object.entries(next).forEach(async ([dateKey, entries]) => {
      entries.forEach(async (entry) => {
        const id = entry._id || `${dateKey}-${entry.hour}-${Date.now()}`;
        await setDoc(doc(db, 'bookings', id), { ...entry, dateKey, _id: id });
        const prevEntries = prev[dateKey] || [];
        if (!entry._id && prevEntries.length < entries.length) {
          const msg = entry.bid
            ? `💰 New bid from ${entry.clientName} — $${entry.price}`
            : entry.waitlist
            ? `📋 Waitlist: ${entry.clientName}`
            : `📬 New booking: ${entry.clientName}`;
          setNotifs(n => [{ id: Date.now(), msg, time: new Date().toLocaleTimeString(), read: false }, ...n]);
          fetch('https://formsubmit.co/ajax/sambo.poole@gmail.com', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify({
              subject: `Sweet Lou's — New Booking from ${entry.clientName}`,
              message: `${msg}\nService: ${entry.serviceId}\nPayment: ${entry.payment || 'cash'}\nPhone: ${entry.phone || 'not provided'}\nNote: ${entry.note || 'none'}`,
            })
          }).catch(() => {});
        }
      });
    });
  }

  // Save blocked to Firebase
  async function handleSetBlocked(updater) {
    const next = typeof updater === 'function' ? updater(blocked) : updater;
    Object.entries(next).forEach(async ([dateKey, hours]) => {
      await setDoc(doc(db, 'blocked', dateKey), { dateKey, hours });
    });
  }

  // Save points to Firebase
  async function handleSetPoints(updater) {
    const next = typeof updater === 'function' ? updater(points) : updater;
    setPoints(next);
    Object.entries(next).forEach(async ([phone, data]) => {
      await setDoc(doc(db, 'points', phone), data);
    });
  }

  const unread = notifs.filter(n => !n.read).length;

  function markAllRead() {
    setNotifs(n => n.map(x => ({ ...x, read: true })));
    setShowNotifs(false);
  }

  if (loading) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f4f8' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <div style={{ fontWeight: 700, color: '#64748b' }}>Loading Sweet Lou's...</div>
      </div>
    </div>
  );

  return (
    <>
      <Head>
        <title>Sweet Lou's Services</title>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
      </Head>
      <div style={{ minHeight: '100vh', background: '#f0f4f8' }}>

        {/* Header */}
        <div style={{ background: '#fff', borderBottom: '1px solid #e2e8f0', padding: '13px 16px', position: 'sticky', top: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <button onClick={() => { if (view === 'admin') return; setView('home'); }}
            style={{ display: 'flex', alignItems: 'center', gap: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
            <div style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#111827,#1e3a5f)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>⚡</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontWeight: 900, fontSize: 16, color: '#111827', lineHeight: 1 }}>Sweet Lou's</div>
              <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600 }}>{view === 'admin' ? 'Admin Dashboard' : 'Services'}</div>
            </div>
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ position: 'relative' }}>
              <button onClick={() => setShowNotifs(s => !s)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, padding: 4, lineHeight: 1 }}>🔔</button>
              {unread > 0 && (
                <span style={{ position: 'absolute', top: 0, right: 0, width: 16, height: 16, borderRadius: '50%', background: '#dc2626', color: '#fff', fontSize: 9, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{unread}</span>
              )}
              {showNotifs && (
                <div style={{ position: 'absolute', top: 40, right: 0, width: 280, background: '#fff', borderRadius: 14, boxShadow: '0 8px 30px rgba(0,0,0,0.15)', border: '1px solid #e2e8f0', overflow: 'hidden', zIndex: 100 }}>
                  <div style={{ padding: '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 700, fontSize: 13 }}>Notifications</span>
                    <button onClick={markAllRead} style={{ background: 'none', border: 'none', fontSize: 11, color: '#2563eb', cursor: 'pointer', fontWeight: 600 }}>Mark all read</button>
                  </div>
                  {notifs.length === 0
                    ? <div style={{ padding: '20px 14px', color: '#94a3b8', fontSize: 13, textAlign: 'center' }}>No notifications yet</div>
                    : notifs.slice(0, 8).map(n => (
                      <div key={n.id} style={{ padding: '10px 14px', borderBottom: '1px solid #f8fafc', borderLeft: `3px solid ${n.read ? '#e2e8f0' : '#2563eb'}`, background: n.read ? '#fff' : '#f0f6ff' }}>
                        <div style={{ fontSize: 12, color: '#1e293b', fontWeight: n.read ? 400 : 700 }}>{n.msg}</div>
                        <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{n.time}</div>
                      </div>
                    ))
                  }
                </div>
              )}
            </div>

            {adminOpen ? (
              <button onClick={() => setView(v => v === 'admin' ? 'home' : 'admin')}
                style={{ padding: '6px 12px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, background: view === 'admin' ? '#111827' : '#f1f5f9', color: view === 'admin' ? '#fff' : '#475569', fontWeight: 700 }}>
                {view === 'admin' ? 'Exit Admin' : 'Admin'}
              </button>
            ) : (
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                <input type="password" placeholder="PIN" value={pin}
                  onChange={e => setPin(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && unlockAdmin()}
                  style={{ width: 52, padding: '6px 8px', borderRadius: 8, border: '1.5px solid #e2e8f0', fontSize: 12, textAlign: 'center', outline: 'none' }} />
                <button onClick={unlockAdmin} style={{ padding: '6px 10px', borderRadius: 8, border: 'none', background: '#f1f5f9', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#475569' }}>→</button>
              </div>
            )}
          </div>
        </div>

        {/* Main content */}
        <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 14px 90px' }}>
          {view === 'admin' ? (
            <AdminView
              bookings={bookings} setBookings={handleSetBookings}
              blocked={blocked} setBlocked={handleSetBlocked}
              notifs={notifs} toast={toast}
              points={points} setPoints={handleSetPoints}
            />
          ) : view === 'membership' ? (
            <MembershipView userPlan={userPlan} setUserPlan={setUserPlan} toast={toast} loyaltyPoints={0} />
          ) : (
            <ClientView
              bookings={bookings} setBookings={handleSetBookings}
              blocked={blocked} toast={toast}
              userPlan={userPlan} setView={setView}
              points={points}
            />
          )}
        </div>

        {/* Bottom nav */}
        {view !== 'admin' && (
          <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'center', paddingBottom: 'env(safe-area-inset-bottom, 8px)' }}>
            {[
              { id: 'home',       icon: '🏠', label: 'Home'   },
              { id: 'membership', icon: '⭐', label: 'Plans'  },
            ].map(t => (
              <button key={t.id} onClick={() => setView(t.id)}
                style={{ flex: 1, maxWidth: 180, padding: '12px 0 8px', border: 'none', background: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 22 }}>{t.icon}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: view === t.id ? '#111827' : '#94a3b8' }}>{t.label}</span>
                {view === t.id && <span style={{ width: 20, height: 2, background: '#111827', borderRadius: 2, display: 'block' }} />}
              </button>
            ))}
          </div>
        )}

        {toastMsg && <Toast msg={toastMsg} onDone={() => setToastMsg(null)} />}
      </div>
    </>
  );
}
