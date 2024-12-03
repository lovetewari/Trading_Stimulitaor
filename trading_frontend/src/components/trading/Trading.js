import React, { useState, useEffect, useCallback } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    TextField,
    Button,
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Alert,
    CircularProgress,
    Box,
    Divider,
} from '@mui/material';
import IconButton from '@mui/material/IconButton'; // Ensure this is imported
import RefreshIcon from '@mui/icons-material/Refresh';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const Trading = () => {
    const { user } = useAuth();
    const [tradeData, setTradeData] = useState({ symbol: '', quantity: '', tradeType: 'BUY' });
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [priceRefreshing, setPriceRefreshing] = useState(false);
    const [previousPrice, setPreviousPrice] = useState(null);

    // Fetch user balance
    const fetchUserBalance = useCallback(async () => {
        if (user?.username) {
            try {
                const { accountBalance } = await api.getDashboard(user.username);
                setUserBalance(accountBalance || 0);
            } catch (err) {
                console.error('Error fetching user balance:', err);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchUserBalance();
    }, [fetchUserBalance]);

    // Fetch stock price
    const fetchStockPrice = useCallback(async () => {
        if (!tradeData.symbol) return;
        setPriceRefreshing(true);
        try {
            const data = await api.getStockPrice(tradeData.symbol);
            setPreviousPrice(stockData?.currentPrice);
            setStockData(data);
            setError(null);
        } catch {
            setError('Failed to fetch stock price. Please try again.');
            setStockData(null);
        } finally {
            setPriceRefreshing(false);
        }
    }, [tradeData.symbol, stockData]);

    useEffect(() => {
        if (tradeData.symbol) {
            fetchStockPrice();
            const interval = setInterval(fetchStockPrice, 10000);
            return () => clearInterval(interval);
        }
    }, [tradeData.symbol, fetchStockPrice]);

    // Calculate total trade value
    const totalValue = stockData?.currentPrice * Number(tradeData.quantity) || 0;
    const canTrade = tradeData.tradeType === 'BUY'
        ? totalValue <= userBalance
        : (stockData?.currentPrice && tradeData.quantity);

    // Handle trade execution
    const handleTrade = async () => {
        if (!user?.username || !tradeData.symbol || !tradeData.quantity || !stockData?.currentPrice) {
            setError('Please fill in all required fields');
            return;
        }
        setLoading(true);
        setError(null);
        setSuccess(null);
        try {
            await api.executeTrade({
                username: user.username,
                symbol: tradeData.symbol,
                quantity: Number(tradeData.quantity),
                price: stockData.currentPrice,
                tradeType: tradeData.tradeType,
            });
            setSuccess(`Successfully ${tradeData.tradeType.toLowerCase()}ed ${tradeData.quantity} shares of ${tradeData.symbol}`);
            setTradeData({ ...tradeData, quantity: '' });
            await fetchUserBalance();
        } catch (err) {
            setError(err.message || 'Failed to execute trade');
        } finally {
            setLoading(false);
        }
    };

    // Price change indicator
    const getPriceChangeIndicator = () => {
        if (!previousPrice || !stockData?.currentPrice) return null;
        const change = stockData.currentPrice - previousPrice;
        return change >= 0 ? <TrendingUpIcon color="success" /> : <TrendingDownIcon color="error" />;
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Grid container spacing={3}>
                {/* Trade Form */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h5" gutterBottom color="primary">Execute Trade</Typography>
                        <Divider sx={{ mb: 3 }} />
                        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
                        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
                        <FormControl fullWidth margin="normal">
                            <InputLabel>Trade Type</InputLabel>
                            <Select
                                value={tradeData.tradeType}
                                onChange={(e) => setTradeData({ ...tradeData, tradeType: e.target.value })}
                                label="Trade Type"
                            >
                                <MenuItem value="BUY">Buy</MenuItem>
                                <MenuItem value="SELL">Sell</MenuItem>
                            </Select>
                        </FormControl>
                        <TextField
                            fullWidth
                            label="Stock Symbol"
                            value={tradeData.symbol}
                            onChange={(e) => setTradeData({ ...tradeData, symbol: e.target.value.toUpperCase() })}
                            margin="normal"
                            InputProps={{
                                endAdornment: (
                                    <IconButton onClick={fetchStockPrice} disabled={!tradeData.symbol || priceRefreshing}>
                                        <RefreshIcon />
                                    </IconButton>
                                ),
                            }}
                        />
                        <TextField
                            fullWidth
                            label="Quantity"
                            type="number"
                            value={tradeData.quantity}
                            onChange={(e) => setTradeData({ ...tradeData, quantity: e.target.value })}
                            margin="normal"
                            InputProps={{ inputProps: { min: 1 } }}
                        />
                        <Button
                            fullWidth
                            variant="contained"
                            color={tradeData.tradeType === 'BUY' ? 'success' : 'error'}
                            onClick={handleTrade}
                            disabled={loading || !canTrade}
                            sx={{ mt: 3 }}
                        >
                            {loading ? <CircularProgress size={24} /> : `${tradeData.tradeType} ${tradeData.symbol || 'STOCK'}`}
                        </Button>
                    </Paper>
                </Grid>

                {/* Trading Info */}
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3, borderRadius: 2 }}>
                        <Typography variant="h5" gutterBottom color="primary">Trading Information</Typography>
                        <Divider sx={{ mb: 3 }} />
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                            <AccountBalanceWalletIcon sx={{ mr: 1 }} />
                            <Typography variant="h6">Balance: {formatCurrency(userBalance)}</Typography>
                        </Box>
                        {stockData && (
                            <Box>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6">Current Price</Typography>
                                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                                        {getPriceChangeIndicator()}
                                        <Typography variant="h6" sx={{ ml: 1 }}>{formatCurrency(stockData.currentPrice)}</Typography>
                                    </Box>
                                </Box>
                                {tradeData.quantity && (
                                    <Box>
                                        <Typography variant="h6">Total Value: {formatCurrency(totalValue)}</Typography>
                                        {tradeData.tradeType === 'BUY' && (
                                            <Typography
                                                variant="body2"
                                                color={canTrade ? 'success.main' : 'error.main'}
                                            >
                                                {canTrade ? 'Sufficient balance for trade' : 'Insufficient balance'}
                                            </Typography>
                                        )}
                                    </Box>
                                )}
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Trading;