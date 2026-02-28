import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('user');
        return saved ? JSON.parse(saved) : null;
    });
    const [token, setToken] = useState(() => localStorage.getItem('token'));
    const [loading, setLoading] = useState(false);

    const isAuthenticated = !!token;

    const login = async (email, password) => {
        const res = await api.post('/login', { email, password });
        const { access_token, user: userData } = res.data;
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(userData));
        setToken(access_token);
        setUser(userData);
        return userData;
    };

    const register = async (name, email, password, role) => {
        const res = await api.post('/register', { name, email, password, role });
        return res.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setToken(null);
        setUser(null);
    };

    const refreshProfile = async () => {
        try {
            const res = await api.get('/profile');
            setUser(res.data);
            localStorage.setItem('user', JSON.stringify(res.data));
        } catch (e) {
            // ignore
        }
    };

    return (
        <AuthContext.Provider value={{ user, token, isAuthenticated, loading, login, register, logout, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);
