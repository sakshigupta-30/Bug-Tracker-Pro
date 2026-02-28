import { useAuth } from '../context/AuthContext';
import { FiMail, FiHash, FiCalendar } from 'react-icons/fi';

export default function ProfilePage() {
    const { user } = useAuth();

    return (
        <div className="page" style={{ maxWidth: 500 }}>
            <div className="page-header">
                <h1 className="page-title">Profile</h1>
                <p className="page-subtitle">Your account details</p>
            </div>

            <div className="card" style={{ padding: 24 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: 24 }}>
                    <div style={{
                        width: 64, height: 64, borderRadius: '50%',
                        background: 'var(--blue-light)', color: 'var(--blue)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 24, fontWeight: 700, marginBottom: 12
                    }}>
                        {user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <h2 style={{ fontSize: 18, fontWeight: 700 }}>{user?.name}</h2>
                    <span className={`badge badge-${user?.role === 'admin' ? 'high' : user?.role === 'tester' ? 'resolved' : 'open'}`} style={{ marginTop: 6 }}>
                        {user?.role}
                    </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {[
                        [<FiMail size={14} />, 'Email', user?.email],
                        [<FiHash size={14} />, 'User ID', `#${user?.id}`],
                        [<FiCalendar size={14} />, 'Member since', user?.created_at
                            ? new Date(user.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                            : 'N/A'
                        ],
                    ].map(([icon, label, value], i) => (
                        <div key={i} style={{ padding: 14, background: 'var(--bg-secondary)', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 12 }}>
                            <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
                            <div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{label}</div>
                                <div style={{ fontSize: 13, fontWeight: 500 }}>{value}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
