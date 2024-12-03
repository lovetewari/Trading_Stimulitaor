import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Link,
    IconButton,
    InputAdornment,
    Alert,
    CircularProgress,
    Snackbar,
    Fade,
} from '@mui/material';
import {
    Visibility,
    VisibilityOff,
    LoginRounded,
    PersonOutlineRounded,
    LockOutlined,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';

const Login = () => {
    const navigate = useNavigate(); // Navigation to other routes
    const { login } = useAuth(); // Authentication function from context

    // Component state management
    const [credentials, setCredentials] = useState({ username: '', password: '' });
    const [error, setError] = useState(null); // To show login errors
    const [loading, setLoading] = useState(false); // To indicate login progress
    const [showPassword, setShowPassword] = useState(false); // Toggle password visibility
    const [success, setSuccess] = useState(false); // Show success message

    // Handle input changes
    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
        setError(null); // Reset error on change
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!credentials.username || !credentials.password) return setError('Please fill in all fields');
        setLoading(true);

        try {
            const { data } = await axios.post('http://localhost:8080/api/users/login', credentials);
            if (data && !data.message) {
                login(data); // Update authentication context
                setSuccess(true); // Show success message
                setTimeout(() => navigate('/dashboard'), 1500); // Redirect to dashboard
            } else {
                setError(data.message || 'Login failed'); // Show server error message
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Login failed'); // Handle network/server errors
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container
            component="main"
            maxWidth="xs"
            sx={{
                minHeight: '100vh', // Full viewport height
                display: 'flex', // Center align form
                alignItems: 'center',
                justifyContent: 'center',
            }}
        >
            {/* Main Login Form */}
            <Fade in>
                <Paper
                    elevation={8}
                    sx={{
                        p: 4, // Padding inside the form
                        borderRadius: 2,
                        background: 'linear-gradient(145deg, #1a1a1a, #2a2a2a)', // Gradient background
                        border: '1px solid rgba(255, 255, 255, 0.1)',
                    }}
                >
                    {/* Welcome Message */}
                    <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography
                            variant="h5"
                            sx={{
                                fontWeight: 600,
                                background: 'linear-gradient(45deg, #4a9eff, #90caf9)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            Welcome Back
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            Sign in to continue
                        </Typography>
                    </Box>

                    {/* Error Message */}
                    {error && (
                        <Fade in>
                            <Alert
                                severity="error"
                                variant="outlined"
                                sx={{
                                    mb: 2,
                                    borderRadius: 1,
                                    bgcolor: 'rgba(211, 47, 47, 0.1)',
                                }}
                            >
                                {error}
                            </Alert>
                        </Fade>
                    )}

                    {/* Login Form */}
                    <Box component="form" onSubmit={handleSubmit}>
                        <TextField
                            fullWidth
                            name="username"
                            label="Username"
                            value={credentials.username}
                            onChange={handleChange}
                            margin="normal"
                            required
                            autoFocus
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <PersonOutlineRounded />
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                        />
                        <TextField
                            fullWidth
                            name="password"
                            label="Password"
                            type={showPassword ? 'text' : 'password'}
                            value={credentials.password}
                            onChange={handleChange}
                            margin="normal"
                            required
                            disabled={loading}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <LockOutlined />
                                    </InputAdornment>
                                ),
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                                            {showPassword ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 1.5 } }}
                        />
                        <Button
                            type="submit"
                            fullWidth
                            variant="contained"
                            disabled={loading}
                            startIcon={!loading && <LoginRounded />}
                            sx={{
                                mt: 3,
                                height: 46,
                                borderRadius: 1.5,
                                textTransform: 'none',
                                fontSize: '1rem',
                            }}
                        >
                            {loading ? <CircularProgress size={24} /> : 'Sign In'}
                        </Button>
                        <Box sx={{ mt: 2, textAlign: 'center' }}>
                            <Link href="/register" variant="body2">
                                Don't have an account? Register
                            </Link>
                        </Box>
                    </Box>
                </Paper>
            </Fade>

            {/* Success Snackbar */}
            <Snackbar
                open={success}
                autoHideDuration={2000}
                onClose={() => setSuccess(false)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert
                    variant="filled"
                    onClose={() => setSuccess(false)}
                    severity="success"
                >
                    Login successful! Redirecting...
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default Login;