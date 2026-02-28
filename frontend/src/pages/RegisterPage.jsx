import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function RegisterPage() {
    const [form, setForm] = useState({ name: '', email: '', password: '', role: 'developer' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();

    const update = (field, value) => setForm(prev => ({ ...prev, [field]: value }));

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await register(form.name, form.email, form.password, form.role);
            navigate('/login');
        } catch (err) {
            setError(err.response?.data?.error || 'Registration failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <h1 className="auth-title">Create account</h1>
                <p className="auth-subtitle">Get started with BugTrack Pro</p>
                {error && <div className="error-box">{error}</div>}
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div>
                        <label className="form-label">Full name</label>
                        <input type="text" className="form-input" placeholder="Jane Smith"
                            value={form.name} onChange={e => update('name', e.target.value)} required />
                    </div>
                    <div>
                        <label className="form-label">Email</label>
                        <input type="email" className="form-input" placeholder="you@example.com"
                            value={form.email} onChange={e => update('email', e.target.value)} required />
                    </div>
                    <div>
                        <label className="form-label">Password</label>
                        <input type="password" className="form-input" placeholder="Min 6 characters"
                            value={form.password} onChange={e => update('password', e.target.value)} required minLength={6} />
                    </div>
                    <div>
                        <label className="form-label">Role</label>
                        <select className="form-input" value={form.role} onChange={e => update('role', e.target.value)}>
                            <option value="developer">Developer</option>
                            <option value="tester">Tester</option>
                            <option value="admin">Admin</option>
                        </select>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }} disabled={loading}>
                        {loading ? 'Creating...' : 'Create account'}
                    </button>
                </form>
                <p className="auth-footer">
                    Already registered? <Link to="/login">Sign in</Link>
                </p>
            </div>
        </div>
    );
}
