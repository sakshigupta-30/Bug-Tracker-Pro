import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { FiGrid, FiFolder, FiColumns, FiUser, FiLogOut } from 'react-icons/fi';
import { FaBug } from 'react-icons/fa';

export default function Navbar() {
    const { user, logout } = useAuth();
    const location = useLocation();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    const isActive = (path) => location.pathname === path ? 'nav-link active' : 'nav-link';

    return (
        <nav className="navbar">
            <Link to="/" className="nav-brand">
                <FaBug size={18} />
                BugTrack Pro
            </Link>
            <div className="nav-links">
                <Link to="/" className={isActive('/')}>
                    <FiGrid size={14} /> Dashboard
                </Link>
                <Link to="/projects" className={isActive('/projects')}>
                    <FiFolder size={14} /> Projects
                </Link>
                <Link to="/board" className={isActive('/board')}>
                    <FiColumns size={14} /> Board
                </Link>
                <Link to="/profile" className={isActive('/profile')}>
                    <FiUser size={14} /> Profile
                </Link>
                <button className="btn btn-secondary btn-sm" onClick={handleLogout} style={{ marginLeft: 8 }}>
                    <FiLogOut size={13} /> Logout
                </button>
            </div>
        </nav>
    );
}
