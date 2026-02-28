import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { FiPlus, FiTrash2, FiFolder } from 'react-icons/fi';

export default function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [form, setForm] = useState({ name: '', description: '' });
    const [saving, setSaving] = useState(false);

    const fetchProjects = () => {
        api.get('/projects')
            .then(res => setProjects(res.data))
            .catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchProjects(); }, []);

    const handleCreate = async (e) => {
        e.preventDefault();
        setSaving(true);
        try {
            await api.post('/projects', form);
            setShowModal(false);
            setForm({ name: '', description: '' });
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create project');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('Delete this project and all its issues?')) return;
        try {
            await api.delete(`/projects/${id}`);
            fetchProjects();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to delete');
        }
    };

    if (loading) {
        return <div className="page"><div className="loading-container"><div className="spinner" /></div></div>;
    }

    return (
        <div className="page">
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                    <h1 className="page-title">Projects</h1>
                    <p className="page-subtitle">Manage your software projects</p>
                </div>
                <button className="btn btn-primary" onClick={() => setShowModal(true)}>
                    <FiPlus size={14} /> New project
                </button>
            </div>

            {projects.length > 0 ? (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
                    {projects.map(p => (
                        <div key={p.id} className="card" style={{ padding: 20 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                <Link to={`/board?project=${p.id}`} style={{ textDecoration: 'none', color: 'var(--text)', fontSize: 15, fontWeight: 600 }}>
                                    {p.name}
                                </Link>
                                <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id)} title="Delete project">
                                    <FiTrash2 size={12} />
                                </button>
                            </div>
                            <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, lineHeight: 1.5 }}>
                                {p.description || 'No description'}
                            </p>
                            <div style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 12, color: 'var(--text-muted)' }}>
                                <span>{p.issue_count || 0} issues</span>
                                <span>·</span>
                                <span>by {p.creator_name}</span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="card">
                    <div className="empty-state">
                        <div className="empty-state-icon"><FiFolder /></div>
                        <div className="empty-state-text">No projects yet. Create your first one.</div>
                    </div>
                </div>
            )}

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">New project</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label className="form-label">Name</label>
                                <input className="form-input" placeholder="Project name" required
                                    value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <textarea className="form-input" placeholder="Brief description..."
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} />
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancel</button>
                                <button type="submit" className="btn btn-primary" disabled={saving}>
                                    {saving ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
