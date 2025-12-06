// Configuration for different environments
const config = {
    development: {
        apiUrl: 'http://localhost:5000/api'
    },
    production: {
        apiUrl: 'https://your-edutracker-api.onrender.com/api'
    }
};

// Use development for local, production when deployed
const API_URL = window.location.hostname === 'localhost' 
    ? config.development.apiUrl 
    : config.production.apiUrl;

console.log('API URL:', API_URL);