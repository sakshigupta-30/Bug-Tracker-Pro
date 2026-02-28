import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FaBug } from 'react-icons/fa';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-page">
            <div className="auth-card card">
                <div style={{ textAlign: 'center', marginBottom: 8 }}>
                    <FaBug size={28} color="var(--blue)" />
                </div>
                <h1 className="auth-title">Welcome back</h1>
                <p className="auth-subtitle">Sign in to BugTrack Pro</p>
                {error && <div className="error-box">{error}</div>}
                <form className="auth-form" onSubmit={handleSubmit}>
                    <div>
                        <label className="form-label">Email</label>
                        <input type="email" className="form-input" placeholder="you@example.com"
                            value={email} onChange={e => setEmail(e.target.value)} required />
                    </div>
                    <div>
                        <label className="form-label">Password</label>
                        <input type="password" className="form-input" placeholder="Your password"
                            value={password} onChange={e => setPassword(e.target.value)} required />
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '10px' }} disabled={loading}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>
                <p className="auth-footer">
                    No account? <Link to="/register">Register</Link>
                </p>
            </div>
        </div>
    );
}
