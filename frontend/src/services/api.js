import axios from 'axios';

const API = axios.create({
    baseURL: 'http://localhost:5000/api', // L'URL de ton backend Node.js
});

// Ajouter le token automatiquement s'il existe
API.interceptors.request.use((req) => {
    const token = localStorage.getItem('token');
    if (token) {
        req.headers.Authorization = `Bearer ${token}`;
    }
    return req;
});

export default API;