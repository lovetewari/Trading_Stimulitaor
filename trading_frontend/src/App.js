// App.jsx
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import {
    ThemeProvider,
    createTheme,
    CssBaseline,
    Box,
    Typography,
    CircularProgress
} from '@mui/material';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/layout/Navbar';
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './components/dashboard/Dashboard';
import Trading from './components/trading/Trading';
import Portfolio from './components/portfolio/Portfolio';
import StockDetail from './components/stock/StockDetail';

const darkTheme = createTheme({
    palette: {
        mode: 'dark',
        primary: {
            main: '#4a9eff',
            light: '#7bb6ff',
            dark: '#2186ff',
        },
        error: {
            main: '#ff4444',
        },
        success: {
            main: '#00C853',
        },
        background: {
            default: '#121212',
            paper: '#1a1a1a',
        },
        text: {
            primary: '#ffffff',
            secondary: 'rgba(255, 255, 255, 0.7)',
        },
    },
    // ... other theme configurations ...
});

// Protected Route Component
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
};

// Loading Component
const LoadingFallback = () => (
    <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="100vh"
        bgcolor="background.default"
    >
        <CircularProgress />
    </Box>
);

// 404 Component
const NotFound = () => (
    <Box
        display="flex"
        flexDirection="column"
        justifyContent="center"
        alignItems="center"
        minHeight="80vh"
        color="text.primary"
    >
        <Typography variant="h4" gutterBottom>
            404
        </Typography>
        <Typography variant="body1">
            Page Not Found
        </Typography>
    </Box>
);

function App() {
    return (
        <ThemeProvider theme={darkTheme}>
            <CssBaseline />
            <AuthProvider>
                <BrowserRouter>
                    <Box
                        display="flex"
                        flexDirection="column"
                        minHeight="100vh"
                        bgcolor="background.default"
                    >
                        <Navbar />
                        <Box component="main" flex={1} py={3}>
                            <Suspense fallback={<LoadingFallback />}>
                                <Routes>
                                    {/* Public Routes */}
                                    <Route path="/login" element={<Login />} />
                                    <Route path="/register" element={<Register />} />

                                    {/* Protected Routes */}
                                    <Route path="/" element={
                                        <ProtectedRoute>
                                            <Dashboard />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/dashboard" element={
                                        <ProtectedRoute>
                                            <Dashboard />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/trading" element={
                                        <ProtectedRoute>
                                            <Trading />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/portfolio" element={
                                        <ProtectedRoute>
                                            <Portfolio />
                                        </ProtectedRoute>
                                    } />
                                    <Route path="/stock/:symbol" element={
                                        <ProtectedRoute>
                                            <StockDetail />
                                        </ProtectedRoute>
                                    } />

                                    {/* 404 Route */}
                                    <Route path="*" element={<NotFound />} />
                                </Routes>
                            </Suspense>
                        </Box>
                    </Box>
                </BrowserRouter>
            </AuthProvider>
        </ThemeProvider>
    );
}

export default App;