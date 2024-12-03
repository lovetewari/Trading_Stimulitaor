import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

apiClient.interceptors.request.use(
    (config) => {
        const user = JSON.parse(localStorage.getItem('user'));
        if (user?.username) {
            config.headers['X-User-ID'] = user.username;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const api = {
    login: async (credentials) => {
        const response = await apiClient.post('/users/login', credentials);
        return response.data;
    },

    register: async (userData) => {
        const response = await apiClient.post('/users/register', userData);
        return response.data;
    },

    getDashboard: async (username) => {
        const response = await apiClient.get(`/dashboard/${username}`);
        return response.data;
    },

    getPortfolio: async (username) => {
        const response = await apiClient.get(`/portfolio/${username}`);
        return response.data;
    },

    getStockPrice: async (symbol, timeframe = '1D') => {
        try {
            console.log('Fetching stock data for:', symbol, 'timeframe:', timeframe);

            // Get current stock data
            const currentDataResponse = await apiClient.get(`/stocks/${symbol}/realtime`);
            console.log('Current data response:', currentDataResponse.data);

            // Get historical data
            const historicalDataResponse = await apiClient.get(`/stocks/${symbol}/historical/${timeframe}`);
            console.log('Historical data response:', historicalDataResponse.data);

            const currentData = currentDataResponse.data;
            const historicalData = historicalDataResponse.data;

            if (!Array.isArray(historicalData)) {
                console.error('Invalid historical data format:', historicalData);
                throw new Error('Invalid historical data format received');
            }

            return {
                ...currentData,
                historicalData: historicalData.map(point => ({
                    timestamp: point.timestamp,
                    price: Number(point.price),
                    open: Number(point.open),
                    high: Number(point.high),
                    low: Number(point.low),
                    volume: Number(point.volume)
                }))
            };
        } catch (err) {
            console.error('Error in getStockPrice:', err);
            throw new Error(err.response?.data?.message || 'Failed to fetch stock data');
        }
    },

    executeTrade: async (tradeData) => {
        const response = await apiClient.post('/trades/execute', tradeData);
        return response.data;
    },

    getUserTrades: async (username) => {
        const response = await apiClient.get(`/trades/user/${username}`);
        return response.data;
    },

    handleError: (error) => {
        console.error('API Error:', error);
        const message = error.response?.data?.message || error.message || 'An error occurred';
        throw new Error(message);
    },
};

export default api;