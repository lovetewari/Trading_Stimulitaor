import React, { useState, useEffect, useMemo } from 'react';
import {
    TextField,
    Autocomplete,
    Box,
    Typography,
    CircularProgress,
} from '@mui/material';
import { TrendingUp } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const StockSearch = () => {
    const navigate = useNavigate();
    const [inputValue, setInputValue] = useState('');
    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    // Updated stock list with correct symbols
    const stocks = useMemo(() => [
        { symbol: 'AAPL', name: 'Apple Inc.' },
        { symbol: 'GOOGL', name: 'Alphabet Inc.' },
        { symbol: 'MSFT', name: 'Microsoft Corporation' },
        { symbol: 'AMZN', name: 'Amazon.com Inc.' },
        { symbol: 'META', name: 'Meta Platforms Inc.' },
        { symbol: 'TSLA', name: 'Tesla Inc.' },
        { symbol: 'RELIANCE.BSE', name: 'Reliance Industries Ltd.' },
        { symbol: 'TCS.BSE', name: 'Tata Consultancy Services Ltd.' },
        { symbol: 'INFY.BSE', name: 'Infosys Ltd.' },
        { symbol: 'HDFC.BSE', name: 'HDFC Bank Ltd.' },
        { symbol: 'WIPRO.BSE', name: 'Wipro Ltd.' },
        { symbol: 'ITC.BSE', name: 'ITC Ltd.' },
        { symbol: 'SBIN.BSE', name: 'State Bank of India' },
        { symbol: 'TATAMOTORS.BSE', name: 'Tata Motors Ltd.' },
        { symbol: 'HCLTECH.BSE', name: 'HCL Technologies Ltd.' },
    ], []);

    useEffect(() => {
        setLoading(true);
        if (!inputValue) {
            setOptions(stocks);
        } else {
            const filtered = stocks.filter(stock =>
                stock.symbol.toLowerCase().includes(inputValue.toLowerCase()) ||
                stock.name.toLowerCase().includes(inputValue.toLowerCase())
            );
            setOptions(filtered);
        }
        setLoading(false);
    }, [inputValue, stocks]);

    return (
        <Autocomplete
            options={options}
            getOptionLabel={(option) => `${option.symbol.split('.')[0]} - ${option.name}`}
            inputValue={inputValue}
            onInputChange={(event, newInputValue) => {
                setInputValue(newInputValue);
            }}
            onChange={(event, newValue) => {
                if (newValue) {
                    navigate(`/stock/${newValue.symbol}`);
                }
            }}
            loading={loading}
            noOptionsText="No stocks found"
            renderInput={(params) => (
                <TextField
                    {...params}
                    placeholder="Search stocks..."
                    sx={{
                        width: '400px',
                        '& .MuiOutlinedInput-root': {
                            backgroundColor: '#1a1a1a',
                            '&:hover': {
                                backgroundColor: '#252525',
                            }
                        }
                    }}
                    InputProps={{
                        ...params.InputProps,
                        endAdornment: (
                            <React.Fragment>
                                {loading ? <CircularProgress color="inherit" size={20} /> : null}
                                {params.InputProps.endAdornment}
                            </React.Fragment>
                        ),
                    }}
                />
            )}
            renderOption={(props, option) => (
                <Box component="li" {...props}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <TrendingUp color="primary" />
                        <div>
                            <Typography variant="subtitle1">{option.symbol.split('.')[0]}</Typography>
                            <Typography variant="body2" color="text.secondary">
                                {option.name}
                            </Typography>
                        </div>
                    </Box>
                </Box>
            )}
        />
    );
};

export default StockSearch;