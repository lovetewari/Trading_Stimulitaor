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
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';

const Trading = () => {
    const { user } = useAuth();
    const [tradeData, setTradeData] = useState({
        symbol: '',
        quantity: '',
        tradeType: 'BUY',
    });
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [userBalance, setUserBalance] = useState(0);
    const [priceRefreshing, setPriceRefreshing] = useState(false);

    const fetchUserBalance = useCallback(async () => {
        if (user?.username) {
            try {
                const response = await api.getDashboard(user.username);
                setUserBalance(response.accountBalance || 0);
            } catch (err) {
                console.error('Error fetching user balance:', err);
            }
        }
    }, [user]);

    useEffect(() => {
        fetchUserBalance();
    }, [fetchUserBalance]);

    const fetchStockPrice = useCallback(async () => {
        if (!tradeData.symbol) return;

        setPriceRefreshing(true);
        try {
            const data = await api.getStockPrice(tradeData.symbol);
            setStockData(data);
            setError(null);
        } catch (err) {
            setError('Failed to fetch stock price. Please try again.');
            setStockData(null);
        } finally {
            setPriceRefreshing(false);
        }
    }, [tradeData.symbol]);

    useEffect(() => {
        let interval;
        if (tradeData.symbol) {
            fetchStockPrice();
            interval = setInterval(fetchStockPrice, 10000);
        }
        return () => {
            if (interval) {
                clearInterval(interval);
            }
        };
    }, [tradeData.symbol, fetchStockPrice]);

    const handleSymbolChange = useCallback(async (e) => {
        const symbol = e.target.value.toUpperCase();
        setTradeData(prev => ({ ...prev, symbol }));
        if (symbol.length >= 1) {
            await fetchStockPrice();
        } else {
            setStockData(null);
        }
    }, [fetchStockPrice]);

    const calculateTotal = useCallback(() => {
        if (!stockData?.currentPrice || !tradeData.quantity) return 0;
        return stockData.currentPrice * Number(tradeData.quantity);
    }, [stockData?.currentPrice, tradeData.quantity]);

    const handleTrade = async () => {
        if (!user?.username) {
            setError('Please login to trade');
            return;
        }

        if (!tradeData.symbol || !tradeData.quantity || !stockData?.currentPrice) {
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
                tradeType: tradeData.tradeType
            });

            setSuccess(`Successfully ${tradeData.tradeType.toLowerCase()}ed ${tradeData.quantity} shares of ${tradeData.symbol}`);
            setTradeData(prev => ({
                ...prev,
                quantity: '',
            }));

            await fetchUserBalance();
        } catch (err) {
            setError(err.message || 'Failed to execute trade');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Execute Trade
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        {error && (
                            <Alert severity="error" sx={{ mb: 2 }}>
                                {error}
                            </Alert>
                        )}
                        {success && (
                            <Alert severity="success" sx={{ mb: 2 }}>
                                {success}
                            </Alert>
                        )}

                        <Box component="form" noValidate>
                            <TextField
                                fullWidth
                                label="Stock Symbol"
                                value={tradeData.symbol}
                                onChange={handleSymbolChange}
                                margin="normal"
                                variant="outlined"
                                required
                            />

                            <FormControl fullWidth margin="normal">
                                <InputLabel>Trade Type</InputLabel>
                                <Select
                                    value={tradeData.tradeType}
                                    onChange={(e) => setTradeData(prev => ({ ...prev, tradeType: e.target.value }))}
                                    label="Trade Type"
                                >
                                    <MenuItem value="BUY">Buy</MenuItem>
                                    <MenuItem value="SELL">Sell</MenuItem>
                                </Select>
                            </FormControl>

                            <TextField
                                fullWidth
                                label="Quantity"
                                type="number"
                                value={tradeData.quantity}
                                onChange={(e) => setTradeData(prev => ({ ...prev, quantity: e.target.value }))}
                                margin="normal"
                                InputProps={{
                                    inputProps: { min: 1 }
                                }}
                                required
                            />

                            <Button
                                fullWidth
                                variant="contained"
                                color="primary"
                                onClick={handleTrade}
                                disabled={loading || !stockData}
                                sx={{ mt: 3 }}
                            >
                                {loading ? <CircularProgress size={24} /> : 'Execute Trade'}
                            </Button>
                        </Box>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Trading Information
                        </Typography>
                        <Divider sx={{ mb: 3 }} />

                        <Box sx={{ mb: 3 }}>
                            <Typography variant="subtitle1">
                                Available Balance: {formatCurrency(userBalance)}
                            </Typography>

                            {stockData && (
                                <>
                                    <Typography variant="subtitle1" sx={{ mt: 2 }}>
                                        Current Price: {formatCurrency(stockData.currentPrice)}
                                        {priceRefreshing && <CircularProgress size={16} sx={{ ml: 1 }} />}
                                    </Typography>

                                    {tradeData.quantity && (
                                        <Typography variant="subtitle1" sx={{ mt: 1 }}>
                                            Total Value: {formatCurrency(calculateTotal())}
                                        </Typography>
                                    )}
                                </>
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Trading;