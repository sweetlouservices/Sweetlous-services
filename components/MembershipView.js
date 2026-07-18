import { PLANS } from '../lib/constants';
import { Badge } from './UI';

export default function MembershipView({ userPlan, setUserPlan, toast, loyaltyPoints }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontWeight: 900, fontSize: 22, color: '#1e293b' }}>Membership</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>Upgrade to VIP for full access and loyalty rewards.</div>

      {userPlan === 'vip' && (
        <div style={{
          background: 'linear-gradient(135deg, #111827, #1e3a5f)',
          borderRadius: 16, padding: 20, color: '#fff',
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: '#fbbf24', letterSpacing: 2, marginBottom: 6 }}>YOUR LOYALTY POINTS</div>
          <div style={{ fontSize: 48, fontWeight: 900, marginBottom: 4 }}>{loyaltyPoints || 0}</div>
          <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>
            {loyaltyPoints >= 100
              ? '🎉 You have enough for $100 off a ride!'
              : `${100 - (loyaltyPoints || 0)} more points until $100 off a ride`}
          </div>
          <div style={{ background: '#ffffff20', borderRadius: 8, padding: '8px 12px' }}>
            <div style={{ fontSize: 12, color: '#cbd5e1' }}>+10 points added each month you're subscribed</div>
          </div>
          <div style={{ marginTop: 12, background: '#ffffff20', borderRadius: 10, height: 8, overflow: 'hidden' }}>
            <div style={{
              height: '100%', borderRadius: 10,
              background: 'linear-gradient(90deg, #fbbf24, #f59e0b)',
              width: `${Math.min(((loyaltyPoints || 0) / 100) * 100, 100)}%`,
              transition: 'width 0.5s ease',
            }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
            <span style={{ fontSize: 10, color: '#64748b' }}>0</span>
            <span style={{ fontSize: 10, color: '#fbbf24', fontWeight: 700 }}>100 pts = $100 off ride</span>
          </div>
        </div>
      )}

      {PLANS.map(p => (
        <div key={p.id} style={{
          background: '#fff', borderRadius: 16, padding: 20,
          border: `2px solid ${userPlan === p.id ? p.color : '#e2e8f0'}`,
          boxShadow: userPlan === p.id ? `0 0 0 3px ${p.color}20` : '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <div>
              <div style={{ fontWeight: 800, fontSize: 17, color: '#1e293b' }}>{p.label}</div>
              <div style={{ fontSize: 24, fontWeight: 900, color: p.color }}>
                {p.price === 0 ? 'Free' : `$${p.price}/mo`}
              </div>
            </div>
            {userPlan === p.id
              ? <Badge color={p.color}>Current Plan</Badge>
              : (
                <button
                  onClick={() => {
                    setUserPlan(p.id);
                    toast(p.price === 0 ? '✅ Switched to Free' : '⭐ Welcome to VIP! Stripe coming soon.');
                  }}
                  style={{ padding: '9px 18px', borderRadius: 10, border: 'none', background: p.color, color: '#fff', fontWeight: 700, cursor: 'pointer', fontSize: 13 }}
                >
                  {p.price === 0 ? 'Downgrade' : 'Go VIP'}
                </button>
              )
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {p.perks.map(perk => (
              <div key={perk} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{ color: p.color, fontWeight: 800, fontSize: 14, flexShrink: 0 }}>✓</span>
                <span style={{ fontSize: 13, color: '#475569' }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      <div style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          💳 Stripe payments coming soon — VIP billing will be automatic monthly.
        </div>
      </div>
    </div>
  );
}
