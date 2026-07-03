import { PLANS } from '../lib/constants';
import { Badge } from './UI';

export default function MembershipView({ userPlan, setUserPlan, toast }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{ fontWeight: 900, fontSize: 22, color: '#1e293b' }}>Membership Plans</div>
      <div style={{ fontSize: 13, color: '#64748b' }}>Unlock priority access, discounts & more.</div>
      {PLANS.map(p => (
        <div key={p.id} style={{
          background: '#fff', borderRadius: 16, padding: 20,
          border: `2px solid ${userPlan === p.id ? p.color : '#e2e8f0'}`,
          boxShadow: userPlan === p.id ? `0 0 0 3px ${p.color}20` : '0 1px 3px rgba(0,0,0,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
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
                  onClick={() => { setUserPlan(p.id); toast(`✅ Switched to ${p.label}`); }}
                  style={{
                    padding: '9px 18px', borderRadius: 10, border: 'none',
                    background: p.color, color: '#fff', fontWeight: 700,
                    cursor: 'pointer', fontSize: 13,
                  }}
                >
                  {p.price === 0 ? 'Downgrade' : 'Subscribe'}
                </button>
              )
            }
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {p.perks.map(perk => (
              <div key={perk} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <span style={{ color: p.color, fontWeight: 800, fontSize: 14 }}>✓</span>
                <span style={{ fontSize: 13, color: '#475569' }}>{perk}</span>
              </div>
            ))}
          </div>
        </div>
      ))}
      <div style={{ background: '#f8fafc', borderRadius: 14, padding: '14px 16px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: 12, color: '#64748b', lineHeight: 1.6 }}>
          💳 Stripe payments will be connected in Phase 2.
        </div>
      </div>
    </div>
  );
}
