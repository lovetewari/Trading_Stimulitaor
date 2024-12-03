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
    CircularProgress,
    Snackbar,
    Fade,
    InputAdornment,
    IconButton,
    Stepper,
    Step,
    StepLabel,
} from '@mui/material';
import {
    PersonOutlineRounded,
    EmailOutlined,
    LockOutlined,
    AccountBalanceWalletOutlined,
    BadgeOutlined,
    Visibility,
    VisibilityOff,
    ArrowForward,
    ArrowBack,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Component for User Registration
const Register = () => {
    const navigate = useNavigate();

    // State for form fields, progress, errors, and stepper navigation
    const [activeStep, setActiveStep] = useState(0); // Current step of the registration process
    const [userData, setUserData] = useState({ // User input data
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        fullName: '',
        accountBalance: '',
    });
    const [loading, setLoading] = useState(false); // Loading state for form submission
    const [error, setError] = useState(null); // Error messages
    const [success, setSuccess] = useState(false); // Success message state
    const [showPassword, setShowPassword] = useState(false); // Toggle visibility of password
    const [showConfirmPassword, setShowConfirmPassword] = useState(false); // Toggle visibility of confirm password

    const steps = ['Personal Info', 'Account Details']; // Step labels for the Stepper UI

    // Function to validate each step's required fields
    const validateStep = () => {
        if (activeStep === 0) return !!(userData.fullName && userData.email); // Personal Info step validation
        return !!(userData.username && userData.password && userData.confirmPassword); // Account Details step validation
    };

    // Move to the next step if validation passes
    const handleNext = () => {
        if (validateStep()) {
            setActiveStep((prev) => prev + 1);
            setError(null);
        } else {
            setError('Please fill in all required fields');
        }
    };

    // Move back to the previous step
    const handleBack = () => {
        setActiveStep((prev) => prev - 1);
        setError(null);
    };

    // Handle input field changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUserData((prev) => ({ ...prev, [name]: value }));
        setError(null); // Reset errors on input change
    };

    // Submit the registration form
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (userData.password !== userData.confirmPassword) {
            setError("Passwords don't match");
            return;
        }
        if (userData.password.length < 6) {
            setError('Password must be at least 6 characters long');
            return;
        }
        setLoading(true);
        try {
            const { data } = await axios.post('http://localhost:8080/api/users/register', {
                username: userData.username.trim(),
                email: userData.email.trim(),
                password: userData.password,
                fullName: userData.fullName.trim(),
                accountBalance: parseFloat(userData.accountBalance) || 0,
            });
            if (!data.error) {
                setSuccess(true);
                setTimeout(() => navigate('/login'), 1500); // Redirect to login on success
            } else {
                setError(data.message || 'Registration failed');
            }
        } catch (err) {
            setError(err.response?.data?.message || 'Registration failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    // Render the content for each step
    const renderStepContent = (step) => {
        const inputs = {
            0: [ // Personal Info step inputs
                { label: 'Full Name', name: 'fullName', icon: <BadgeOutlined /> },
                { label: 'Email Address', name: 'email', icon: <EmailOutlined />, type: 'email' },
                { label: 'Initial Account Balance', name: 'accountBalance', icon: <AccountBalanceWalletOutlined />, type: 'number' },
            ],
            1: [ // Account Details step inputs
                { label: 'Username', name: 'username', icon: <PersonOutlineRounded /> },
                { label: 'Password', name: 'password', icon: <LockOutlined />, type: showPassword ? 'text' : 'password', toggle: () => setShowPassword(!showPassword), show: showPassword },
                { label: 'Confirm Password', name: 'confirmPassword', icon: <LockOutlined />, type: showConfirmPassword ? 'text' : 'password', toggle: () => setShowConfirmPassword(!showConfirmPassword), show: showConfirmPassword },
            ],
        };

        return (
            <>
                {inputs[step].map((input, idx) => (
                    <TextField
                        key={idx}
                        margin="normal"
                        fullWidth
                        required
                        label={input.label}
                        name={input.name}
                        type={input.type || 'text'}
                        value={userData[input.name]}
                        onChange={handleInputChange}
                        disabled={loading}
                        InputProps={{
                            startAdornment: (
                                <InputAdornment position="start">{input.icon}</InputAdornment>
                            ),
                            ...(input.toggle && {
                                endAdornment: (
                                    <InputAdornment position="end">
                                        <IconButton onClick={input.toggle} edge="end">
                                            {input.show ? <VisibilityOff /> : <Visibility />}
                                        </IconButton>
                                    </InputAdornment>
                                ),
                            }),
                        }}
                    />
                ))}
            </>
        );
    };

    return (
        <Container maxWidth="xs" sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', py: 4 }}>
            <Fade in>
                <Paper elevation={8} sx={{ p: 4, borderRadius: 2, bgcolor: 'background.default' }}>
                    <Typography variant="h5" align="center" sx={{ mb: 3, fontWeight: 600 }}>
                        Create Account
                    </Typography>
                    <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
                        {steps.map((label) => (
                            <Step key={label}>
                                <StepLabel>{label}</StepLabel>
                            </Step>
                        ))}
                    </Stepper>
                    {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                    <Box component="form" onSubmit={activeStep === steps.length - 1 ? handleSubmit : handleNext}>
                        {renderStepContent(activeStep)}
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
                            <Button onClick={handleBack} disabled={activeStep === 0} startIcon={<ArrowBack />} sx={{ visibility: activeStep === 0 ? 'hidden' : 'visible' }}>
                                Back
                            </Button>
                            <Button variant="contained" onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext} disabled={loading} endIcon={activeStep === steps.length - 1 ? null : <ArrowForward />}>
                                {loading ? <CircularProgress size={24} /> : activeStep === steps.length - 1 ? 'Create Account' : 'Next'}
                            </Button>
                        </Box>
                        <Box sx={{ mt: 3, textAlign: 'center' }}>
                            <Link href="/login">Already have an account? Sign In</Link>
                        </Box>
                    </Box>
                </Paper>
            </Fade>
            <Snackbar open={success} autoHideDuration={2000} onClose={() => setSuccess(false)} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                <Alert severity="success" onClose={() => setSuccess(false)}>Registration successful! Redirecting...</Alert>
            </Snackbar>
        </Container>
    );
};

export default Register;