import React from 'react';
import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from 'recharts';
import { Box, Button } from '@mui/material';

const StockChart = ({ data, timeframe, onTimeframeChange }) => {
    const timeframes = [
        { label: '1D', value: '1D' },
        { label: '1W', value: '1W' },
        { label: '1M', value: '1M' },
        { label: '1Y', value: '1Y' },
        { label: '5Y', value: '5Y' },
        { label: 'All', value: 'ALL' },
    ];

    const transformedData = React.useMemo(() => {
        if (!data || !Array.isArray(data)) {
            console.log('Invalid data received:', data);
            return [];
        }

        return data
            .filter(item => item && item.timestamp && !isNaN(item.price))
            .map(item => ({
                time: typeof item.timestamp === 'number' ? item.timestamp : new Date(item.timestamp).getTime(),
                price: Number(item.price)
            }))
            .sort((a, b) => a.time - b.time);
    }, [data]);

    const formatDate = (timestamp) => {
        if (!timestamp) return '';
        try {
            const date = new Date(timestamp);
            if (isNaN(date.getTime())) {
                console.error('Invalid timestamp:', timestamp);
                return 'Invalid Date';
            }

            switch (timeframe) {
                case '1D':
                    return date.toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                        hour12: false
                    });
                case '1W':
                    return date.toLocaleDateString([], {
                        weekday: 'short',
                        month: 'short',
                        day: 'numeric'
                    });
                case '1M':
                    return date.toLocaleDateString([], {
                        month: 'short',
                        day: 'numeric'
                    });
                case '1Y':
                    return date.toLocaleDateString([], {
                        month: 'short',
                        year: '2-digit'
                    });
                case '5Y':
                case 'ALL':
                    return date.toLocaleDateString([], {
                        month: 'short',
                        year: 'numeric'
                    });
                default:
                    return date.toLocaleDateString();
            }
        } catch (e) {
            console.error('Date formatting error:', e);
            return 'Invalid Date';
        }
    };

    const getYAxisDomain = () => {
        if (!transformedData.length) return ['auto', 'auto'];
        const prices = transformedData.map(item => item.price);
        const min = Math.min(...prices);
        const max = Math.max(...prices);
        const padding = (max - min) * 0.1;
        return [
            Math.floor((min - padding) * 100) / 100,
            Math.ceil((max + padding) * 100) / 100,
        ];
    };

    return (
        <Box sx={{ width: '100%', height: '400px', p: 2 }}>
            <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
                {timeframes.map(({ label, value }) => (
                    <Button
                        key={value}
                        onClick={() => onTimeframeChange(value)}
                        size="small"
                        variant={timeframe === value ? 'contained' : 'outlined'}
                        sx={{
                            minWidth: '45px',
                            height: '30px',
                            color: timeframe === value ? '#fff' : '#666',
                            backgroundColor: timeframe === value ? 'rgba(74, 158, 255, 0.2)' : 'transparent',
                            borderColor: timeframe === value ? '#4a9eff' : '#333',
                            '&:hover': {
                                backgroundColor: 'rgba(74, 158, 255, 0.1)',
                                borderColor: '#4a9eff',
                            },
                        }}
                    >
                        {label}
                    </Button>
                ))}
            </Box>

            <ResponsiveContainer>
                <LineChart
                    data={transformedData}
                    margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                >
                    <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="rgba(255, 255, 255, 0.05)"
                        vertical={false}
                    />
                    <XAxis
                        dataKey="time"
                        tickFormatter={formatDate}
                        tick={{ fill: '#666', fontSize: 11 }}
                        stroke="#333"
                        interval="preserveStartEnd"
                        minTickGap={50}
                        type="number"
                        domain={['dataMin', 'dataMax']}
                        allowDataOverflow={false}
                    />
                    <YAxis
                        domain={getYAxisDomain()}
                        tick={{ fill: '#666', fontSize: 11 }}
                        stroke="#333"
                        tickCount={8}
                        tickFormatter={(value) => `$${value.toFixed(2)}`}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#1a1a1a',
                            border: '1px solid #333',
                            padding: '10px',
                            borderRadius: '4px',
                        }}
                        labelFormatter={(value) => formatDate(value)}
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, 'Price']}
                    />
                    <Line
                        type="monotone"
                        dataKey="price"
                        stroke="#4a9eff"
                        strokeWidth={1.5}
                        dot={false}
                        activeDot={{ r: 4, fill: '#4a9eff' }}
                        connectNulls={true}
                    />
                </LineChart>
            </ResponsiveContainer>
        </Box>
    );
};

export default StockChart;