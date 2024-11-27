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
} from '@mui/material';
import axios from 'axios';

const Portfolio = () => {
    const [portfolio, setPortfolio] = useState([]);
    const [summary, setSummary] = useState({
        totalValue: 0,
        totalProfit: 0,
    });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchPortfolio = async () => {
        try {
            const user = JSON.parse(localStorage.getItem('user'));
            if (!user || !user.username) throw new Error('User not logged in');

            const response = await axios.get(`http://localhost:8080/api/portfolio/${user.username}`);
            const portfolioData = response.data || [];

            setPortfolio(portfolioData);

            // Calculate summary
            const totalValue = portfolioData.reduce((sum, item) => sum + (item.currentValue || 0), 0);
            const totalProfit = portfolioData.reduce(
                (sum, item) => sum + ((item.currentValue || 0) - ((item.averagePrice || 0) * (item.quantity || 0))),
                0
            );

            setSummary({ totalValue, totalProfit });
        } catch (err) {
            console.error('Error fetching portfolio:', err);
            setError('Failed to load portfolio. Please try again later.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPortfolio();
    }, []);

    if (loading) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
                <CircularProgress />
            </Container>
        );
    }

    if (error) {
        return (
            <Container maxWidth="lg" sx={{ mt: 4 }}>
                <Typography color="error" variant="h6" align="center">
                    {error}
                </Typography>
            </Container>
        );
    }

    return (
        <Container maxWidth="lg" sx={{ mt: 4 }}>
            <Grid container spacing={3}>
                {/* Portfolio Summary */}
                <Grid item xs={12}>
                    <Paper sx={{ p: 3, mb: 3 }}>
                        <Typography variant="h6" gutterBottom>
                            Portfolio Summary
                        </Typography>
                        <Grid container spacing={3}>
                            <Grid item xs={6}>
                                <Typography color="textSecondary">Total Value</Typography>
                                <Typography variant="h4">${summary.totalValue.toFixed(2)}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                                <Typography color="textSecondary">Total Profit/Loss</Typography>
                                <Typography
                                    variant="h4"
                                    color={summary.totalProfit >= 0 ? 'success.main' : 'error.main'}
                                >
                                    ${summary.totalProfit.toFixed(2)}
                                </Typography>
                            </Grid>
                        </Grid>
                    </Paper>
                </Grid>

                {/* Portfolio Details */}
                <Grid item xs={12}>
                    <TableContainer component={Paper}>
                        <Table>
                            <TableHead>
                                <TableRow>
                                    <TableCell>Symbol</TableCell>
                                    <TableCell align="right">Quantity</TableCell>
                                    <TableCell align="right">Average Price</TableCell>
                                    <TableCell align="right">Current Price</TableCell>
                                    <TableCell align="right">Current Value</TableCell>
                                    <TableCell align="right">Profit/Loss</TableCell>
                                </TableRow>
                            </TableHead>
                            <TableBody>
                                {portfolio.map((item) => (
                                    <TableRow key={item.id}>
                                        <TableCell>{item.stockSymbol || '-'}</TableCell>
                                        <TableCell align="right">{item.quantity || 0}</TableCell>
                                        <TableCell align="right">${item.averagePrice?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell align="right">
                                            ${((item.currentValue || 0) / (item.quantity || 1)).toFixed(2)}
                                        </TableCell>
                                        <TableCell align="right">${item.currentValue?.toFixed(2) || '0.00'}</TableCell>
                                        <TableCell
                                            align="right"
                                            sx={{
                                                color:
                                                    (item.currentValue || 0) -
                                                    ((item.averagePrice || 0) * (item.quantity || 0)) >=
                                                    0
                                                        ? 'success.main'
                                                        : 'error.main',
                                            }}
                                        >
                                            ${(
                                            (item.currentValue || 0) -
                                            ((item.averagePrice || 0) * (item.quantity || 0))
                                        ).toFixed(2)}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </TableContainer>
                </Grid>
            </Grid>
        </Container>
    );
};

export default Portfolio;