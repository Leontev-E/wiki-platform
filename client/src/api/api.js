import axios from 'axios';

const DEFAULT_API_URL = 'http://localhost:10000/api';

export const api = axios.create({
    // Configure VITE_API_URL in client/.env to point to your backend API (must include the /api suffix)
    baseURL: import.meta.env.VITE_API_URL || DEFAULT_API_URL,
    withCredentials: true,
});
