import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import { FiArrowLeft, FiEdit2, FiTrash2, FiSend, FiZap } from 'react-icons/fi';

export default function IssueDetailPage() {
    const { id } = useParams();
    const { user } = useAuth();
    const navigate = useNavigate();
    const [issue, setIssue] = useState(null);
    const [comments, setComments] = useState([]);
    const [users, setUsers] = useState([]);
    const [newComment, setNewComment] = useState('');
    const [editing, setEditing] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [loading, setLoading] = useState(true);
    const [aiSummary, setAiSummary] = useState(null);

    const fetchIssue = () => {
        Promise.all([
            api.get(`/issues/${id}`),
            api.get(`/issues/${id}/comments`),
            api.get('/users'),
        ]).then(([issueRes, commentsRes, usersRes]) => {
            setIssue(issueRes.data);
            setEditForm(issueRes.data);
            setComments(commentsRes.data);
            setUsers(usersRes.data);
        }).catch(() => navigate('/board'))
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchIssue(); }, [id]);

    const handleAddComment = async (e) => {
        e.preventDefault();
        if (!newComment.trim()) return;
        try {
            await api.post(`/issues/${id}/comments`, { comment_text: newComment });
            setNewComment('');
            const res = await api.get(`/issues/${id}/comments`);
            setComments(res.data);
        } catch { }
    };

    const handleUpdate = async () => {
        try {
            const res = await api.put(`/issues/${id}`, {
                title: editForm.title,
                description: editForm.description,
                priority: editForm.priority,
                status: editForm.status,
                assigned_to: editForm.assigned_to || null,
            });
            setIssue(res.data);
            setEditing(false);
        } catch (err) {
            alert(err.response?.data?.error || 'Update failed');
        }
    };

    const handleDelete = async () => {
        if (!confirm('Delete this issue?')) return;
        try {
            await api.delete(`/issues/${id}`);
            navigate('/board');
        } catch (err) {
            alert(err.response?.data?.error || 'Delete failed');
        }
    };

    const getSmartSummary = async () => {
        if (!issue?.description) return;
        try {
            const res = await api.post('/ai/summarize', { description: issue.description });
            setAiSummary(res.data);
        } catch { }
    };

    const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-US', {
        month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
    }) : '—';

    if (loading) {
        return <div className="page"><div className="loading-container"><div className="spinner" /></div></div>;
    }
    if (!issue) return null;

    return (
        <div className="page" style={{ maxWidth: 780 }}>
            <Link to="/board" style={{ color: 'var(--blue)', textDecoration: 'none', fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 4, marginBottom: 16 }}>
                <FiArrowLeft size={14} /> Back to board
            </Link>

            <div className="card" style={{ padding: 24, marginBottom: 16 }}>
                {editing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <input className="form-input" value={editForm.title}
                            onChange={e => setEditForm({ ...editForm, title: e.target.value })} />
                        <textarea className="form-input" value={editForm.description || ''}
                            onChange={e => setEditForm({ ...editForm, description: e.target.value })} />
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
                            <div>
                                <label className="form-label">Status</label>
                                <select className="form-input" value={editForm.status}
                                    onChange={e => setEditForm({ ...editForm, status: e.target.value })}>
                                    <option value="open">Open</option>
                                    <option value="in_progress">In Progress</option>
                                    <option value="resolved">Resolved</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Priority</label>
                                <select className="form-input" value={editForm.priority}
                                    onChange={e => setEditForm({ ...editForm, priority: e.target.value })}>
                                    <option value="low">Low</option>
                                    <option value="medium">Medium</option>
                                    <option value="high">High</option>
                                </select>
                            </div>
                            <div>
                                <label className="form-label">Assignee</label>
                                <select className="form-input" value={editForm.assigned_to || ''}
                                    onChange={e => setEditForm({ ...editForm, assigned_to: e.target.value ? parseInt(e.target.value) : null })}>
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </select>
                            </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button className="btn btn-primary" onClick={handleUpdate}>Save</button>
                            <button className="btn btn-secondary" onClick={() => { setEditing(false); setEditForm(issue); }}>Cancel</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                            <div>
                                <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>{issue.title}</h1>
                                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                                    <span className={`badge badge-${issue.status}`}>{issue.status.replace('_', ' ')}</span>
                                    <span className={`badge badge-${issue.priority}`}>{issue.priority}</span>
                                    <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>{issue.project_name}</span>
                                </div>
                            </div>
                            <div style={{ display: 'flex', gap: 6 }}>
                                <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>
                                    <FiEdit2 size={12} /> Edit
                                </button>
                                <button className="btn btn-danger btn-sm" onClick={handleDelete}>
                                    <FiTrash2 size={12} /> Delete
                                </button>
                            </div>
                        </div>

                        <div style={{ marginBottom: 16 }}>
                            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.5px' }}>Description</div>
                            <p style={{ fontSize: 13, lineHeight: 1.7, color: 'var(--text-secondary)' }}>
                                {issue.description || 'No description.'}
                            </p>
                            {issue.description && issue.description.length > 100 && (
                                <button className="btn btn-sm" style={{ marginTop: 8, background: 'var(--purple-light)', color: 'var(--purple)', border: 'none' }}
                                    onClick={getSmartSummary}>
                                    <FiZap size={12} /> Summarize
                                </button>
                            )}
                            {aiSummary && (
                                <div style={{ marginTop: 8, padding: '8px 12px', borderRadius: 6, background: 'var(--purple-light)', fontSize: 12, color: 'var(--purple)' }}>
                                    <span className="ai-hint" style={{ marginRight: 6 }}>{aiSummary.ai_powered ? 'AI' : 'auto'}</span>
                                    {aiSummary.summary}
                                </div>
                            )}
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, padding: 14, background: 'var(--bg-secondary)', borderRadius: 6 }}>
                            {[
                                ['Assignee', issue.assignee_name || 'Unassigned'],
                                ['Created by', issue.creator_name],
                                ['Created', fmtDate(issue.created_at)],
                                ['Updated', fmtDate(issue.updated_at)],
                            ].map(([label, val]) => (
                                <div key={label}>
                                    <div style={{ fontSize: 11, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: 2 }}>{label}</div>
                                    <div style={{ fontSize: 13, fontWeight: 500 }}>{val}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>

            {/* Comments */}
            <div className="card" style={{ overflow: 'hidden' }}>
                <div style={{ padding: '14px 16px', borderBottom: '1px solid var(--border)', fontWeight: 600, fontSize: 14 }}>
                    Comments ({comments.length})
                </div>

                {comments.length > 0 ? (
                    <div>
                        {comments.map(c => (
                            <div key={c.id} className="comment-item">
                                <div className="comment-header">
                                    <div className="comment-avatar">{c.author_name?.[0]?.toUpperCase() || '?'}</div>
                                    <span className="comment-author">{c.author_name}</span>
                                    <span className="comment-time">{fmtDate(c.created_at)}</span>
                                </div>
                                <div className="comment-body">{c.comment_text}</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 13 }}>
                        No comments yet.
                    </div>
                )}

                <form onSubmit={handleAddComment} style={{ padding: 14, borderTop: '1px solid var(--border)', display: 'flex', gap: 8 }}>
                    <input className="form-input" placeholder="Write a comment..." style={{ flex: 1 }}
                        value={newComment} onChange={e => setNewComment(e.target.value)} />
                    <button type="submit" className="btn btn-primary">
                        <FiSend size={13} />
                    </button>
                </form>
            </div>
        </div>
    );
}
