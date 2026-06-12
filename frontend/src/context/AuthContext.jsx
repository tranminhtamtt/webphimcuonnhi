import React, { createContext, useState, useEffect } from 'react';
import axios from 'axios';
import { BACKEND_URL } from '../config';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [token, setToken] = useState(localStorage.getItem('token') || null);

    useEffect(() => {
        if (token) {
            localStorage.setItem('token', token);
            // Optionally, decode token to set user details or fetch from an endpoint
            try {
                // simple jwt decode
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
                    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                }).join(''));

                setUser(JSON.parse(jsonPayload));
            } catch (e) {
                console.error("Invalid token");
                logout();
            }
        } else {
            localStorage.removeItem('token');
            setUser(null);
        }
    }, [token]);

    const login = async (email, password) => {
        const response = await axios.post(`${BACKEND_URL}/auth/login`, { email, password });
        setToken(response.data.token);
        setUser(response.data.user);
    };

    const register = async (email, password) => {
        const response = await axios.post(`${BACKEND_URL}/auth/register`, { email, password });
        setToken(response.data.token);
        setUser(response.data.user);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, register, logout }}>
            {children}
        </AuthContext.Provider>
    );
};
