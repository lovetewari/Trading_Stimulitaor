import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Button,
    Box,
    CircularProgress,
    TextField,
    Alert,
    ButtonGroup,
    Snackbar,
} from '@mui/material';
import { useParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import StockChart from './StockChart';

const StockDetail = () => {
    const { symbol } = useParams();
    const { user } = useAuth();
    const [stockData, setStockData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [quantity, setQuantity] = useState('');
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [tradeType, setTradeType] = useState('BUY');
    const [chartTimeframe, setChartTimeframe] = useState('1D');
    const [userBalance, setUserBalance] = useState(0);

    const fetchStockData = React.useCallback(async () => {
        try {
            setLoading(true);
            console.log('Fetching data for:', symbol, 'timeframe:', chartTimeframe);
            const response = await api.getStockPrice(symbol, chartTimeframe);
            console.log('API Response:', response);

            if (response && response.historicalData) {
                setStockData({
                    ...response,
                    historicalData: response.historicalData
                        .filter(point => point && point.timestamp && !isNaN(point.price))
                        .map(point => ({
                            ...point,
                            timestamp: new Date(point.timestamp).getTime(),
                            price: Number(point.price)
                        }))
                        .sort((a, b) => a.timestamp - b.timestamp)
                });
            }
            setError(null);
        } catch (err) {
            console.error('Error fetching stock data:', err);
            setError('Failed to fetch stock data');
        } finally {
            setLoading(false);
        }
    }, [symbol, chartTimeframe]);

    useEffect(() => {
        const fetchUserBalance = async () => {
            if (!user?.username) return;
            try {
                const { accountBalance } = await api.getDashboard(user.username);
                setUserBalance(accountBalance || 0);
            } catch (err) {
                console.error('Error fetching balance:', err);
            }
        };

        fetchUserBalance();
    }, [user]);

    useEffect(() => {
        fetchStockData();
        const interval = setInterval(fetchStockData, 30000);
        return () => clearInterval(interval);
    }, [fetchStockData]);

    const handleTrade = async () => {
        if (!quantity) {
            setError('Please enter a quantity');
            return;
        }

        try {
            await api.executeTrade({
                username: user.username,
                symbol,
                quantity: parseInt(quantity),
                price: stockData.currentPrice,
                tradeType,
            });

            setSuccess(`Successfully ${tradeType.toLowerCase()}ed ${quantity} shares of ${symbol}`);
            setQuantity('');
            const { accountBalance } = await api.getDashboard(user.username);
            setUserBalance(accountBalance);
        } catch (err) {
            setError(err.message || 'Failed to execute trade');
        }
    };

    if (loading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
                <CircularProgress />
            </Box>
        );
    }

    const totalValue = quantity * (stockData?.currentPrice || 0);

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Paper sx={{ p: 3, mb: 3 }}>
                <Typography variant="h4" gutterBottom>{symbol}</Typography>
                <Typography variant="h3" sx={{
                    color: stockData?.currentPrice >= stockData?.openPrice ? 'success.main' : 'error.main',
                    mb: 1
                }}>
                    {formatCurrency(stockData?.currentPrice)}
                </Typography>
                <Typography variant="body1" color="textSecondary">
                    Available Balance: {formatCurrency(userBalance)}
                </Typography>
            </Paper>

            <Paper sx={{ p: 3, mb: 3 }}>
                <StockChart
                    data={stockData?.historicalData || []}
                    timeframe={chartTimeframe}
                    onTimeframeChange={setChartTimeframe}
                />
            </Paper>

            <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Trade {symbol}
                        </Typography>
                        <ButtonGroup fullWidth sx={{ mb: 2 }}>
                            <Button
                                variant={tradeType === 'BUY' ? 'contained' : 'outlined'}
                                onClick={() => setTradeType('BUY')}
                                color="success"
                                sx={{ py: 1.5 }}
                            >
                                Buy
                            </Button>
                            <Button
                                variant={tradeType === 'SELL' ? 'contained' : 'outlined'}
                                onClick={() => setTradeType('SELL')}
                                color="error"
                                sx={{ py: 1.5 }}
                            >
                                Sell
                            </Button>
                        </ButtonGroup>

                        <TextField
                            fullWidth
                            label="Quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            sx={{ mb: 2 }}
                            InputProps={{
                                inputProps: { min: 1 }
                            }}
                        />

                        <Typography variant="h6" gutterBottom>
                            Total: {formatCurrency(totalValue)}
                        </Typography>

                        <Button
                            fullWidth
                            variant="contained"
                            onClick={handleTrade}
                            disabled={!quantity || (tradeType === 'BUY' && totalValue > userBalance)}
                            sx={{
                                py: 1.5,
                                bgcolor: tradeType === 'BUY' ? 'success.main' : 'error.main'
                            }}
                        >
                            {tradeType} {symbol}
                        </Button>
                    </Paper>
                </Grid>

                <Grid item xs={12} md={6}>
                    <Paper sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom>Market Data</Typography>
                        <Grid container spacing={2}>
                            <Grid item xs={6}>
                                <Typography color="textSecondary">Open</Typography>
                                <Typography variant="h6">{formatCurrency(stockData?.openPrice)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography color="textSecondary">High</Typography>
                                <Typography variant="h6">{formatCurrency(stockData?.highPrice)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography color="textSecondary">Low</Typography>
                                <Typography variant="h6">{formatCurrency(stockData?.lowPrice)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography color="textSecondary">Volume</Typography>
                                <Typography variant="h6">{stockData?.volume?.toLocaleString()}</Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>
            </Grid>

            <Snackbar
                open={!!success}
                autoHideDuration={3000}
                onClose={() => setSuccess(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="success" onClose={() => setSuccess(null)}>
                    {success}
                </Alert>
            </Snackbar>

            <Snackbar
                open={!!error}
                autoHideDuration={3000}
                onClose={() => setError(null)}
                anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
            >
                <Alert severity="error" onClose={() => setError(null)}>
                    {error}
                </Alert>
            </Snackbar>
        </Container>
    );
};

export default StockDetail;