import axios from 'axios';

const BASE_URL = 'http://localhost:8080/api';

const apiClient = axios.create({
    baseURL: BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
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

// Response interceptor
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        if (error.response?.status === 401) {
            localStorage.removeItem('user');
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

const api = {
    // Auth endpoints
    login: async (credentials) => {
        const response = await apiClient.post('/users/login', credentials);
        return response.data;
    },

    register: async (userData) => {
        const response = await apiClient.post('/users/register', userData);
        return response.data;
    },

    // Dashboard endpoints
    getDashboard: async (username) => {
        const response = await apiClient.get(`/dashboard/${username}`);
        return response.data;
    },

    // Portfolio endpoints
    getPortfolio: async (username) => {
        const response = await apiClient.get(`/portfolio/${username}`);
        return response.data;
    },

    // Trading endpoints
    executeTrade: async (tradeData) => {
        const response = await apiClient.post('/trades/execute', tradeData);
        return response.data;
    },

    getStockPrice: async (symbol) => {
        const response = await apiClient.get(`/stocks/${symbol}/realtime`);
        return response.data;
    },

    getUserTrades: async (username) => {
        const response = await apiClient.get(`/trades/user/${username}`);
        return response.data;
    },

    // Error handler
    handleError: (error) => {
        console.error('API Error:', error);
        const message = error.response?.data?.message || error.message || 'An error occurred';
        throw new Error(message);
    }
};

export default api;