import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiAlertCircle, FiClock, FiCheckCircle, FiArrowUpRight, FiArrowRight } from 'react-icons/fi';

export default function DashboardPage() {
    const { user } = useAuth();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        api.get('/dashboard/stats')
            .then(res => setStats(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    }, []);

    if (loading) {
        return <div className="page"><div className="loading-container"><div className="spinner" /></div></div>;
    }

    return (
        <div className="page">
            <div className="page-header">
                <h1 className="page-title">Dashboard</h1>
                <p className="page-subtitle">Welcome back, {user?.name}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 28 }}>
                <div className="card stat-card">
                    <div className="stat-value">{stats?.total_issues || 0}</div>
                    <div className="stat-label">Total issues</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value" style={{ color: 'var(--blue)' }}>{stats?.by_status?.open || 0}</div>
                    <div className="stat-label">Open</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value" style={{ color: 'var(--amber)' }}>{stats?.by_status?.in_progress || 0}</div>
                    <div className="stat-label">In progress</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value" style={{ color: 'var(--green)' }}>{stats?.by_status?.resolved || 0}</div>
                    <div className="stat-label">Resolved</div>
                </div>
                <div className="card stat-card">
                    <div className="stat-value" style={{ color: 'var(--red)' }}>{stats?.by_priority?.high || 0}</div>
                    <div className="stat-label">High priority</div>
                </div>
            </div>

            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontWeight: 600, fontSize: 14 }}>Recent issues</span>
                    <Link to="/board" className="btn btn-sm btn-secondary">
                        View board <FiArrowRight size={12} />
                    </Link>
                </div>
                {stats?.recent_issues?.length > 0 ? (
                    <div>
                        {stats.recent_issues.map(issue => (
                            <Link to={`/issues/${issue.id}`} key={issue.id} style={{ textDecoration: 'none', color: 'inherit', display: 'block' }}>
                                <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.1s' }}
                                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                    <span style={{ flex: 1, fontWeight: 500, fontSize: 13 }}>{issue.title}</span>
                                    <span className={`badge badge-${issue.priority}`}>{issue.priority}</span>
                                    <span className={`badge badge-${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{issue.project_name}</span>
                                </div>
                            </Link>
                        ))}
                    </div>
                ) : (
                    <div className="empty-state">
                        <div className="empty-state-icon"><FiAlertCircle /></div>
                        <div className="empty-state-text">No issues yet. Create a project to get started.</div>
                    </div>
                )}
            </div>
        </div>
    );
}
