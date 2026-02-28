import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import api from '../api/axios';
import { FiPlus, FiCircle, FiUser } from 'react-icons/fi';

const COLUMNS = [
    { id: 'open', title: 'Open', color: 'var(--blue)' },
    { id: 'in_progress', title: 'In Progress', color: 'var(--amber)' },
    { id: 'resolved', title: 'Resolved', color: 'var(--green)' },
];

export default function KanbanBoard() {
    const [searchParams] = useSearchParams();
    const projectFilter = searchParams.get('project');
    const [issues, setIssues] = useState([]);
    const [projects, setProjects] = useState([]);
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedProject, setSelectedProject] = useState(projectFilter || '');
    const [form, setForm] = useState({ title: '', description: '', priority: 'medium', project_id: '', assigned_to: '' });
    const [aiSuggestion, setAiSuggestion] = useState(null);
    const [saving, setSaving] = useState(false);

    const fetchAll = () => {
        const params = {};
        if (selectedProject) params.project_id = selectedProject;
        Promise.all([
            api.get('/issues', { params }),
            api.get('/projects'),
            api.get('/users'),
        ]).then(([issuesRes, projRes, usersRes]) => {
            setIssues(issuesRes.data);
            setProjects(projRes.data);
            setUsers(usersRes.data);
        }).catch(() => { })
            .finally(() => setLoading(false));
    };

    useEffect(() => { fetchAll(); }, [selectedProject]);

    const getColumnIssues = (status) => issues.filter(i => i.status === status);

    const onDragEnd = async (result) => {
        if (!result.destination) return;
        const { draggableId, destination } = result;
        const newStatus = destination.droppableId;
        const issueId = parseInt(draggableId);

        setIssues(prev => prev.map(i => i.id === issueId ? { ...i, status: newStatus } : i));

        try {
            await api.patch(`/issues/${issueId}/status`, { status: newStatus });
        } catch {
            fetchAll();
        }
    };

    const suggestPriority = async () => {
        if (!form.title) return;
        try {
            const res = await api.post('/ai/suggest-priority', { title: form.title, description: form.description });
            setAiSuggestion(res.data);
            if (res.data.priority) setForm(prev => ({ ...prev, priority: res.data.priority }));
        } catch { }
    };

    const handleCreate = async (e) => {
        e.preventDefault();
        if (!form.project_id) { alert('Select a project'); return; }
        setSaving(true);
        try {
            await api.post('/issues', {
                ...form,
                assigned_to: form.assigned_to ? parseInt(form.assigned_to) : null,
                project_id: parseInt(form.project_id),
            });
            setShowModal(false);
            setForm({ title: '', description: '', priority: 'medium', project_id: '', assigned_to: '' });
            setAiSuggestion(null);
            fetchAll();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create issue');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return <div className="page"><div className="loading-container"><div className="spinner" /></div></div>;
    }

    return (
        <div className="page" style={{ maxWidth: 1400 }}>
            <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <div>
                    <h1 className="page-title">Board</h1>
                    <p className="page-subtitle">Drag issues between columns to update status</p>
                </div>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                    <select className="form-input" style={{ width: 180 }} value={selectedProject}
                        onChange={e => setSelectedProject(e.target.value)}>
                        <option value="">All projects</option>
                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <button className="btn btn-primary" onClick={() => {
                        setForm(prev => ({ ...prev, project_id: selectedProject || (projects[0]?.id?.toString() || '') }));
                        setShowModal(true);
                    }}>
                        <FiPlus size={14} /> New issue
                    </button>
                </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
                <div style={{ display: 'flex', gap: 12 }}>
                    {COLUMNS.map(col => (
                        <Droppable key={col.id} droppableId={col.id}>
                            {(provided, snapshot) => (
                                <div className="kanban-column" style={{
                                    borderColor: snapshot.isDraggingOver ? col.color : undefined,
                                }}>
                                    <div className="kanban-column-header">
                                        <FiCircle size={10} style={{ color: col.color, fill: col.color }} />
                                        <span>{col.title}</span>
                                        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>
                                            {getColumnIssues(col.id).length}
                                        </span>
                                    </div>
                                    <div className="kanban-column-body" ref={provided.innerRef} {...provided.droppableProps}>
                                        {getColumnIssues(col.id).map((issue, idx) => (
                                            <Draggable key={issue.id} draggableId={String(issue.id)} index={idx}>
                                                {(provided, snapshot) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
                                                        className={`kanban-card ${snapshot.isDragging ? 'dragging' : ''}`}>
                                                        <Link to={`/issues/${issue.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
                                                            <div style={{ fontWeight: 500, fontSize: 13, marginBottom: 6 }}>{issue.title}</div>
                                                            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                                                                <span className={`badge badge-${issue.priority}`}>{issue.priority}</span>
                                                                {issue.project_name && (
                                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{issue.project_name}</span>
                                                                )}
                                                                {issue.assignee_name && (
                                                                    <span style={{ fontSize: 11, color: 'var(--text-muted)', marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 3 }}>
                                                                        <FiUser size={10} /> {issue.assignee_name}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </Link>
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                        {getColumnIssues(col.id).length === 0 && (
                                            <div style={{ textAlign: 'center', padding: 20, color: 'var(--text-muted)', fontSize: 12 }}>
                                                No issues
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </Droppable>
                    ))}
                </div>
            </DragDropContext>

            {showModal && (
                <div className="modal-overlay" onClick={() => setShowModal(false)}>
                    <div className="modal-content" onClick={e => e.stopPropagation()}>
                        <h2 className="modal-title">New issue</h2>
                        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                            <div>
                                <label className="form-label">Title</label>
                                <input className="form-input" placeholder="Short description" required
                                    value={form.title} onChange={e => setForm({ ...form, title: e.target.value })}
                                    onBlur={suggestPriority} />
                            </div>
                            <div>
                                <label className="form-label">Description</label>
                                <textarea className="form-input" placeholder="Details about the issue..."
                                    value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
                                    onBlur={suggestPriority} />
                            </div>
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                                <div>
                                    <label className="form-label">Project</label>
                                    <select className="form-input" required value={form.project_id}
                                        onChange={e => setForm({ ...form, project_id: e.target.value })}>
                                        <option value="">Select</option>
                                        {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="form-label">
                                        Priority
                                        {aiSuggestion && <span className="ai-hint" style={{ marginLeft: 6 }}>
                                            {aiSuggestion.ai_powered ? 'AI' : 'auto'}
                                        </span>}
                                    </label>
                                    <select className="form-input" value={form.priority}
                                        onChange={e => setForm({ ...form, priority: e.target.value })}>
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                            </div>
                            {aiSuggestion?.reason && (
                                <div style={{ fontSize: 12, color: 'var(--purple)', background: 'var(--purple-light)', padding: '6px 10px', borderRadius: 6 }}>
                                    {aiSuggestion.reason}
                                </div>
                            )}
                            <div>
                                <label className="form-label">Assign to</label>
                                <select className="form-input" value={form.assigned_to}
                                    onChange={e => setForm({ ...form, assigned_to: e.target.value })}>
                                    <option value="">Unassigned</option>
                                    {users.map(u => <option key={u.id} value={u.id}>{u.name} ({u.role})</option>)}
                                </select>
                            </div>
                            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                                <button type="button" className="btn btn-secondary" onClick={() => { setShowModal(false); setAiSuggestion(null); }}>Cancel</button>
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
