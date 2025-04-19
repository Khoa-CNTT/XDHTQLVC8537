import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [auth, setAuth] = useState({
        isAuthenticated: false,
        userRole: null,
        isLoading: true,
        userId: null
    });

    useEffect(() => {
        const checkAuthStatus = () => {
            const token = localStorage.getItem('token');
            const userInfo = localStorage.getItem('userInfo');

            try {
                const userData = userInfo ? JSON.parse(userInfo) : null;

                setAuth({
                    isAuthenticated: !!token,
                    userRole: userData?.Role || null,
                    userId: userData?.ID_TK || null,
                    isLoading: false
                });
            } catch (error) {
                console.error('Error parsing user info:', error);
                setAuth({
                    isAuthenticated: false,
                    userRole: null,
                    userId: null,
                    isLoading: false
                });
            }
        };

        // Check auth status on initial load
        checkAuthStatus();

        // Listen for storage events to update auth state
        window.addEventListener('storage', checkAuthStatus);

        // Listen for custom auth change events
        window.addEventListener('auth-change', checkAuthStatus);

        return () => {
            window.removeEventListener('storage', checkAuthStatus);
            window.removeEventListener('auth-change', checkAuthStatus);
        };
    }, []);

    // Login function
    const login = (userData) => {
        localStorage.setItem('token', userData.token);
        localStorage.setItem('userInfo', JSON.stringify({
            ID_TK: userData.ID_TK,
            Role: userData.Role
        }));
        localStorage.setItem('role', userData.Role);

        // Update auth state
        setAuth({
            isAuthenticated: true,
            userRole: userData.Role,
            userId: userData.ID_TK,
            isLoading: false
        });

        // Notify other components about auth change
        window.dispatchEvent(new Event('auth-change'));
    };

    // Logout function
    const logout = () => {
        localStorage.clear();
        setAuth({
            isAuthenticated: false,
            userRole: null,
            userId: null,
            isLoading: false
        });
        window.dispatchEvent(new Event('auth-change'));
    };

    return (
        <AuthContext.Provider value={{ auth, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
