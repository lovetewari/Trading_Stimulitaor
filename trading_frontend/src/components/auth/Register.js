// Register.js
import React, { useState } from 'react';
import {
    Container,
    Paper,
    TextField,
    Button,
    Typography,
    Box,
    Link,
    Alert,
    CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Register = () => {
    const navigate = useNavigate();
    const [userData, setUserData] = useState({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        accountBalance: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Basic validation
        if (!userData.username || !userData.email || !userData.password || !userData.fullName) {
            setError('Please fill in all required fields');
            setLoading(false);
            return;
        }

        if (userData.password !== userData.confirmPassword) {
            setError("Passwords don't match");
            setLoading(false);
            return;
        }

        if (userData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            setLoading(false);
            return;
        }

        try {
            const requestData = {
                username: userData.username.trim(),
                email: userData.email.trim(),
                password: userData.password,
                fullName: userData.fullName.trim(),
                accountBalance: parseFloat(userData.accountBalance) || 0
            };

            const response = await axios.post('http://localhost:8080/api/users/register', requestData);

            if (response.data && !response.data.error) {
                navigate('/login');
            } else {
                setError(response.data.message || 'Registration failed');
            }
        } catch (err) {
            console.error('Registration error:', err);
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    return (
        <Container component="main" maxWidth="xs">
            <Paper elevation={6} sx={{ mt: 8, p: 4 }}>
                <Typography component="h1" variant="h5" align="center" gutterBottom>
                    Register
                </Typography>
                <Box component="form" onSubmit={handleSubmit} noValidate>
                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            {error}
                        </Alert>
                    )}
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="username"
                        label="Username"
                        name="username"
                        autoComplete="username"
                        autoFocus
                        value={userData.username}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="fullName"
                        label="Full Name"
                        name="fullName"
                        autoComplete="name"
                        value={userData.fullName}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="email"
                        label="Email Address"
                        name="email"
                        autoComplete="email"
                        type="email"
                        value={userData.email}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        fullWidth
                        id="accountBalance"
                        label="Initial Account Balance"
                        name="accountBalance"
                        type="number"
                        value={userData.accountBalance}
                        onChange={handleInputChange}
                        disabled={loading}
                        InputProps={{
                            inputProps: { min: 0 }
                        }}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="password"
                        label="Password"
                        name="password"
                        type="password"
                        autoComplete="new-password"
                        value={userData.password}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <TextField
                        margin="normal"
                        required
                        fullWidth
                        id="confirmPassword"
                        label="Confirm Password"
                        name="confirmPassword"
                        type="password"
                        autoComplete="new-password"
                        value={userData.confirmPassword}
                        onChange={handleInputChange}
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{ mt: 3, mb: 2 }}
                        disabled={loading}
                    >
                        {loading ? <CircularProgress size={24} /> : 'Register'}
                    </Button>
                    <Box textAlign="center">
                        <Link href="/login" variant="body2">
                            Already have an account? Sign In
                        </Link>
                    </Box>
                </Box>
            </Paper>si
        </Container>
    );
};

export default Register;
