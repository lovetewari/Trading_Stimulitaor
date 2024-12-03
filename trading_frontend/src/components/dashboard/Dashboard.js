import React, { useState, useEffect } from 'react';
import {
    Container,
    Grid,
    Paper,
    Typography,
    Box,
    CircularProgress,
    Alert,
} from '@mui/material';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { formatCurrency } from '../../utils/formatters';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination, Navigation } from 'swiper/modules';

// Import Swiper styles
import 'swiper/css';
import 'swiper/css/pagination';
import 'swiper/css/navigation';

const swiperStyle = {
    padding: '20px 10px',
    '.swiper-button-next, .swiper-button-prev': {
        color: '#fff',
        background: 'rgba(255, 255, 255, 0.1)',
        width: '40px',
        height: '40px',
        borderRadius: '50%',
        '&:after': {
            fontSize: '20px',
        },
    },
    '.swiper-pagination-bullet': {
        background: '#fff',
    },
    '.swiper-pagination-bullet-active': {
        background: '#3f51b5',
    },
};

const InfoCard = ({ title, value, isProfit }) => (
    <Paper
        elevation={3}
        sx={{
            p: 3,
            height: '100%',
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
        }}
    >
        <Typography color="textSecondary" variant="subtitle2" sx={{ mb: 1 }}>
            {title}
        </Typography>
        <Typography
            variant="h4"
            sx={{
                color: isProfit !== undefined ? (isProfit ? '#4caf50' : '#f44336') : '#fff',
                fontWeight: 'bold',
            }}
        >
            {value}
        </Typography>
    </Paper>
);

const TradeCard = ({ trade }) => (
    <Paper
        elevation={3}
        sx={{
            p: 3,
            bgcolor: '#1a1a1a',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            borderRadius: 2,
            height: '100%',
        }}
    >
        <Typography variant="subtitle2" color="textSecondary">
            {new Date(trade.tradeDate).toLocaleString()}
        </Typography>
        <Typography variant="h6" sx={{ mt: 1, color: trade.tradeType === 'BUY' ? '#4caf50' : '#f44336' }}>
            {trade.tradeType} {trade.quantity} {trade.stockSymbol}
        </Typography>
        <Typography variant="body1" color="textPrimary">
            Price: {formatCurrency(trade.price)}
        </Typography>
        <Typography variant="body1" color="textSecondary">
            Total: {formatCurrency(trade.totalAmount)}
        </Typography>
    </Paper>
);

const PortfolioCard = ({ holding }) => {
    const profitLoss = holding.currentValue - holding.averagePrice * holding.quantity;
    const profitLossPercentage = (
        ((holding.currentValue / (holding.averagePrice * holding.quantity)) - 1) *
        100
    ).toFixed(2);

    return (
        <Paper
            elevation={3}
            sx={{
                p: 3,
                bgcolor: '#1a1a1a',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: 2,
                height: '100%',
            }}
        >
            <Typography variant="h5" sx={{ mb: 2, color: '#fff' }}>
                {holding.stockSymbol}
            </Typography>
            <Grid container spacing={2}>
                <Grid item xs={6}>
                    <Typography color="textSecondary" variant="body2">Quantity</Typography>
                    <Typography variant="h6" color="textPrimary">{holding.quantity}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography color="textSecondary" variant="body2">Average Price</Typography>
                    <Typography variant="h6" color="textPrimary">{formatCurrency(holding.averagePrice)}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography color="textSecondary" variant="body2">Current Value</Typography>
                    <Typography variant="h6" color="textPrimary">{formatCurrency(holding.currentValue)}</Typography>
                </Grid>
                <Grid item xs={6}>
                    <Typography color="textSecondary" variant="body2">Profit/Loss</Typography>
                    <Typography variant="h6" sx={{ color: profitLoss >= 0 ? '#4caf50' : '#f44336' }}>
                        {formatCurrency(profitLoss)} ({profitLossPercentage}%)
                    </Typography>
                </Grid>
            </Grid>
        </Paper>
    );
};

const Dashboard = () => {
    const { user } = useAuth();
    const [dashboardData, setDashboardData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user?.username) {
                setError('Please login to view the dashboard.');
                setLoading(false);
                return;
            }
            try {
                const data = await api.getDashboard(user.username);
                const filteredPortfolio = (data?.portfolio || []).filter((holding) => holding.quantity > 0);
                setDashboardData({
                    ...data,
                    portfolio: filteredPortfolio,
                    recentTrades: (data?.recentTrades || []).sort(
                        (a, b) => new Date(b.tradeDate) - new Date(a.tradeDate)
                    ),
                });
                setError(null);
            } catch {
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, [user]);

    if (loading) return <Box display="flex" justifyContent="center" minHeight="80vh"><CircularProgress /></Box>;
    if (error) return <Container maxWidth="lg" sx={{ mt: 4 }}><Alert severity="error">{error}</Alert></Container>;

    const { accountBalance, totalPortfolioValue, totalProfitLoss, portfolio, recentTrades } = dashboardData || {};

    return (
        <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
            <Typography variant="h4" gutterBottom sx={{ color: '#fff' }}>Trading Dashboard</Typography>

            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid item xs={12} md={4}>
                    <InfoCard title="Available Balance" value={formatCurrency(accountBalance || 0)} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <InfoCard title="Portfolio Value" value={formatCurrency(totalPortfolioValue || 0)} />
                </Grid>
                <Grid item xs={12} md={4}>
                    <InfoCard title="Total Profit/Loss" value={formatCurrency(totalProfitLoss || 0)} isProfit={totalProfitLoss >= 0} />
                </Grid>
            </Grid>

            <Typography variant="h5" gutterBottom sx={{ color: '#fff', mb: 3 }}>Recent Trades</Typography>
            <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 5000 }}
                breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
                style={swiperStyle}
            >
                {recentTrades?.map((trade, index) => (
                    <SwiperSlide key={index}>
                        <TradeCard trade={trade} />
                    </SwiperSlide>
                ))}
            </Swiper>

            <Typography variant="h5" gutterBottom sx={{ color: '#fff', mt: 4, mb: 3 }}>Portfolio Holdings</Typography>
            <Swiper
                modules={[Autoplay, Pagination, Navigation]}
                slidesPerView={1}
                navigation
                pagination={{ clickable: true }}
                autoplay={{ delay: 6000 }}
                breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }}
                style={swiperStyle}
            >
                {portfolio?.map((holding, index) => (
                    <SwiperSlide key={index}>
                        <PortfolioCard holding={holding} />
                    </SwiperSlide>
                ))}
            </Swiper>
        </Container>
    );
};

export default Dashboard;