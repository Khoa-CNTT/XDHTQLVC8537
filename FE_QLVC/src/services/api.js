import axios from 'axios';

const api = axios.create({
<<<<<<< HEAD
    baseURL: 'http://localhost:8080',
=======
    baseURL: 'http://localhost:8080/api',
>>>>>>> thong
    headers: {
        'Content-Type': 'application/json',
    },
});

<<<<<<< HEAD
=======
// Add a request interceptor to include the auth token in all requests
api.interceptors.request.use(
    (config) => {
        // Get token from localStorage
        const token = localStorage.getItem('token');
        
        // If token exists, add it to the authorization header
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

>>>>>>> thong
export default api;