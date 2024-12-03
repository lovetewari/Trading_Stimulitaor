import React, { useState, useEffect } from 'react';
import {
    Container,
    Paper,
    Typography,
    Grid,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    CircularProgress,
    Button,
    Box,
    IconButton,
    Tooltip,
    LinearProgress,
    Chip,
} from '@mui/material';
import {
    RefreshRounded,
    TrendingUpRounded,
    TrendingDownRounded,
    AccountBalanceWalletRounded,
    TimelineRounded,
} from '@mui/icons-material';
import axios from 'axios';

/**
 * PortfolioSummaryCard Component
 * A reusable card component to display key portfolio summary metrics.
 * Props:
 *  - title: The title of the card (e.g., "Total Value").
 *  - value: The main value displayed in the card (e.g., "$10,000").
 *  - icon: An optional icon displayed alongside the title.
 *  - subtitle: A small text below the main value (e.g., "Overall Performance").
 *  - trend: Numeric value to show a percentage change (optional).
 */
const PortfolioSummaryCard = ({ title, value, icon, subtitle, trend }) => (
    <Paper
        elevation={3}
        sx={{
            p: 3,
            height: '100%',
            borderRadius: 2,
            bgcolor: '#1a1a1a', // Dark background for consistent theme.
            '&:hover': { transform: 'translateY(-4px)' }, // Subtle hover effect.
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="h6" color="textSecondary">
                {title} {/* Title */}
            </Typography>
            {icon} {/* Icon (if provided) */}
        </Box>
        <Typography variant="h4">{value} {/* Main value */}</Typography>
        {subtitle && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                {trend && (
                    <Chip
                        icon={trend > 0 ? <TrendingUpRounded /> : <TrendingDownRounded />}
                        label={`${(trend * 100).toFixed(2)}%`} // Format percentage
                        color={trend > 0 ? "success" : "error"} // Green for positive, red for negative
                        size="small"
                    />
                )}
                <Typography variant="body2" color="textSecondary">
                    {subtitle}
                </Typography>
            </Box>
        )}
    </Paper>
);

const Portfolio = () => {
    // State Variables
    const [portfolio, setPortfolio] = useState([]); // Stores portfolio holdings
    const [summary, setSummary] = useState({
        totalValue: 0, // Total portfolio value
        totalProfit: 0, // Total profit/loss
        profitPercentage: 0, // Profit/Loss percentage
    });
    const [loading, setLoading] = useState(true); // Loading state for initial data
    const [refreshing, setRefreshing] = useState(false); // State for manual refresh
    const [error, setError] = useState(null); // Error state
    const [lastUpdated, setLastUpdated] = useState(null); // Tracks the last update time

    // Fetch Portfolio Data
    const fetchPortfolio = async () => {
        setRefreshing(true); // Trigger loading animation for refresh
        try {
            // Retrieve user data from localStorage
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user?.username) throw new Error('User not logged in');

            // Fetch portfolio data from API
            const { data = [] } = await axios.get(`http://localhost:8080/api/portfolio/${user.username}`);

            // Filter out holdings with zero quantity
            const filtered = data.filter((item) => item.quantity > 0);

            // Update portfolio state
            setPortfolio(filtered);

            // Calculate total portfolio metrics
            const totalValue = filtered.reduce((sum, item) => sum + (item.currentValue || 0), 0);
            const totalCost = filtered.reduce((sum, item) => sum + ((item.averagePrice || 0) * item.quantity), 0);
            const totalProfit = totalValue - totalCost;

            // Update summary with calculated metrics
            setSummary({
                totalValue,
                totalProfit,
                profitPercentage: totalCost > 0 ? totalProfit / totalCost : 0,
            });

            // Update last updated time
            setLastUpdated(new Date());
            setError(null); // Clear any previous errors
        } catch (err) {
            setError('Failed to load portfolio. Please try again.');
        } finally {
            setRefreshing(false); // End refresh animation
            setLoading(false); // End initial loading
        }
    };

    // Fetch data on component mount and set interval for auto-refresh
    useEffect(() => {
        fetchPortfolio();
        const interval = setInterval(fetchPortfolio, 60000); // Refresh every 60 seconds
        return () => clearInterval(interval); // Cleanup on component unmount
    }, []);

    // Render Loading Spinner
    if (loading) {
        return (
            <Container sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress size={60} />
            </Container>
        );
    }

    // Render Error Message
    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Paper sx={{ p: 3, textAlign: 'center', bgcolor: '#1a1a1a' }}>
                    <Typography color="error" variant="h6">
                        {error}
                    </Typography>
                    <Button
                        variant="contained"
                        onClick={fetchPortfolio}
                        sx={{ mt: 2 }}
                    >
                        Retry
                    </Button>
                </Paper>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            {/* Portfolio Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
                <Typography variant="h4">Portfolio Overview</Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    {lastUpdated && (
                        <Typography variant="body2" color="textSecondary">
                            Updated: {lastUpdated.toLocaleTimeString()}
                        </Typography>
                    )}
                    <Tooltip title="Refresh">
                        <IconButton onClick={fetchPortfolio} disabled={refreshing}>
                            <RefreshRounded />
                        </IconButton>
                    </Tooltip>
                </Box>
            </Box>

            {refreshing && <LinearProgress sx={{ mb: 2 }} />}

            {/* Summary Cards */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <PortfolioSummaryCard
                        title="Total Value"
                        value={`$${summary.totalValue.toFixed(2)}`}
                        icon={<AccountBalanceWalletRounded />}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <PortfolioSummaryCard
                        title="Total Profit/Loss"
                        value={`$${summary.totalProfit.toFixed(2)}`}
                        subtitle="Performance"
                        trend={summary.profitPercentage}
                        icon={<TimelineRounded />}
                    />
                </Grid>
                <Grid item xs={12} md={4}>
                    <PortfolioSummaryCard
                        title="Holdings"
                        value={portfolio.length}
                        subtitle="Active"
                        icon={<TrendingUpRounded />}
                    />
                </Grid>
            </Grid>

            {/* Portfolio Table */}
            <TableContainer component={Paper} sx={{ borderRadius: 2, bgcolor: '#1a1a1a' }}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ bgcolor: '#2a2a2a' }}>
                            <TableCell>Symbol</TableCell>
                            <TableCell align="right">Quantity</TableCell>
                            <TableCell align="right">Average Price</TableCell>
                            <TableCell align="right">Current Price</TableCell>
                            <TableCell align="right">Value</TableCell>
                            <TableCell align="right">Profit/Loss</TableCell>
                            <TableCell align="right">Change %</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {portfolio.map((item) => {
                            const profitLoss = item.currentValue - (item.averagePrice * item.quantity);
                            const profitPercent = ((profitLoss / (item.averagePrice * item.quantity)) * 100).toFixed(2);
                            return (
                                <TableRow key={item.id} sx={{ '&:hover': { bgcolor: '#2a2a2a' } }}>
                                    <TableCell>{item.stockSymbol}</TableCell>
                                    <TableCell align="right">{item.quantity}</TableCell>
                                    <TableCell align="right">${item.averagePrice.toFixed(2)}</TableCell>
                                    <TableCell align="right">${(item.currentValue / item.quantity).toFixed(2)}</TableCell>
                                    <TableCell align="right">${item.currentValue.toFixed(2)}</TableCell>
                                    <TableCell align="right" sx={{ color: profitLoss >= 0 ? 'success.main' : 'error.main' }}>
                                        ${profitLoss.toFixed(2)}
                                    </TableCell>
                                    <TableCell align="right">
                                        <Chip
                                            label={`${profitPercent}%`}
                                            size="small"
                                            color={profitLoss >= 0 ? "success" : "error"}
                                            icon={profitLoss >= 0 ? <TrendingUpRounded /> : <TrendingDownRounded />}
                                        />
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </TableContainer>
        </Container>
    );
};

export default Portfolio;