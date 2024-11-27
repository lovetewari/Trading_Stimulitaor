import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Trading from './components/trading/Trading';
import Portfolio from './components/portfolio/Portfolio';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
    },
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth(); // Check if the user is authenticated
    return isAuthenticated ? children : <Navigate to="/login" />;
};

function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <AuthProvider>
                <BrowserRouter>
                    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
                        <Navbar />
                        <Suspense fallback={<div>Loading...</div>}>
                            <Routes>
                                {/* Public Routes */}
                                <Route path="/login" element={<Login />} />
                                <Route path="/register" element={<Register />} />

                                {/* Protected Routes */}
                                <Route
                                    path="/"
                                    element={
                                        <ProtectedRoute>
                                            <Dashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/dashboard"
                                    element={
                                        <ProtectedRoute>
                                            <Dashboard />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/trading"
                                    element={
                                        <ProtectedRoute>
                                            <Trading />
                                        </ProtectedRoute>
                                    }
                                />
                                <Route
                                    path="/portfolio"
                                    element={
                                        <ProtectedRoute>
                                            <Portfolio />
                                        </ProtectedRoute>
                                    }
                                />

                                {/* Fallback for undefined routes */}
                                <Route path="*" element={<div>Page Not Found</div>} />
                            </Routes>
                        </Suspense>
                    </div>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;