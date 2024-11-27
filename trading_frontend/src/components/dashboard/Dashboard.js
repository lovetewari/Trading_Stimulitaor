import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
    Divider
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters'; // You'll need to create this

const Dashboard = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.username) {
                setError('Please login to view dashboard');
                setLoading(false);
                return;
            }

            try {
                const data = await api.getDashboard(user.username);
                setDashboardData(data);
                setError(null);
            } catch (err) {
                console.error('Dashboard error:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        // Set up auto-refresh every 30 seconds
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [user]);

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Alert severity="error">{error}</Alert>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom>
                Trading Dashboard
            </Typography>

            <Grid container spacing={3}>
                {/* Account Summary */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Account Summary
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        <Grid container spacing={2}>
                            <Grid item xs={12}>
                                <Typography color="textSecondary" variant="subtitle2">
                                    Available Balance
                                </Typography>
                                <Typography variant="h5">
                                    {formatCurrency(dashboardData?.accountBalance || 0)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="textSecondary" variant="subtitle2">
                                    Total Portfolio Value
                                </Typography>
                                <Typography variant="h5">
                                    {formatCurrency(dashboardData?.totalPortfolioValue || 0)}
                                </Typography>
                            </Grid>
                            <Grid item xs={12}>
                                <Typography color="textSecondary" variant="subtitle2">
                                    Total Profit/Loss
                                </Typography>
                                <Typography
                                    variant="h5"
                                    color={dashboardData?.totalProfitLoss >= 0 ? 'success.main' : 'error.main'}
                                >
                                    {formatCurrency(dashboardData?.totalProfitLoss || 0)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Recent Trades */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, height: '100%' }}>
                        <Typography variant="h6" gutterBottom>
                            Recent Trades
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        {dashboardData?.recentTrades?.length > 0 ? (
                            dashboardData.recentTrades.map((trade, index) => (
                                <Box key={trade.id || index} sx={{ mb: 2 }}>
                                    <Grid container alignItems="center" spacing={1}>
                                        <Grid item xs={12}>
                                            <Typography variant="body2">
                                                {new Date(trade.tradeDate).toLocaleString()}
                                            </Typography>
                                            <Typography>
                                                {trade.tradeType} {trade.quantity} {trade.stockSymbol} @ {formatCurrency(trade.price)}
                                            </Typography>
                                            <Typography variant="body2" color="textSecondary">
                                                Total: {formatCurrency(trade.totalAmount)}
                                            </Typography>
                                        </Grid>
                                    </Grid>
                                    {index < dashboardData.recentTrades.length - 1 && (
                                        <Divider sx={{ my: 1 }} />
                                    )}
                                </Box>
                            ))
                        ) : (
                            <Typography color="textSecondary">
                                No recent trades
                            </Typography>
                        )}
                    </Paper>
                </Grid>

                {/* Portfolio Holdings */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Portfolio Holdings
                        </Typography>
                        <Divider sx={{ my: 2 }} />
                        {dashboardData?.portfolio?.length > 0 ? (
                            <Grid container spacing={2}>
                                {dashboardData.portfolio.map((holding, index) => (
                                    <Grid item xs={12} key={holding.id || index}>
                                        <Paper elevation={0} sx={{ p: 2, bgcolor: 'background.default' }}>
                                            <Grid container spacing={2} alignItems="center">
                                                <Grid item xs={12} sm={3}>
                                                    <Typography variant="subtitle1">
                                                        {holding.stockSymbol}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={3}>
                                                    <Typography color="textSecondary" variant="body2">
                                                        Quantity
                                                    </Typography>
                                                    <Typography>
                                                        {holding.quantity}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={3}>
                                                    <Typography color="textSecondary" variant="body2">
                                                        Average Price
                                                    </Typography>
                                                    <Typography>
                                                        {formatCurrency(holding.averagePrice)}
                                                    </Typography>
                                                </Grid>
                                                <Grid item xs={12} sm={3}>
                                                    <Typography color="textSecondary" variant="body2">
                                                        Current Value
                                                    </Typography>
                                                    <Typography>
                                                        {formatCurrency(holding.currentValue)}
                                                    </Typography>
                                                </Grid>
                                            </Grid>
                                        </Paper>
                                    </Grid>
                                ))}
                            </Grid>
                        ) : (
                            <Typography color="textSecondary">
                                No holdings in portfolio
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Dashboard;