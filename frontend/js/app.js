// Copy all JavaScript from your HTML file here
// Replace localStorage calls with API calls

class eduTrackerAPI {
    constructor() {
       this.baseURL = API_URL;
        this.token = localStorage.getItem('edutracker_token');
    }

    setToken(token) {
        this.token = token;
        localStorage.setItem('edutracker_token', token);
    }

    async request(endpoint, method = 'GET', data = null) {
        const headers = {
            'Content-Type': 'application/json',
        };
        
        if (this.token) {
            headers['Authorization'] = `Bearer ${this.token}`;
        }

        const config = {
            method,
            headers,
        };

        if (data) {
            config.body = JSON.stringify(data);
        }

        const response = await fetch(`${this.baseURL}${endpoint}`, config);
        return await response.json();
    }

    // Auth methods
    async login(email, password, userType) {
        const data = { email, password, user_type: userType };
        return await this.request('/auth/login', 'POST', data);
    }

    async register(userData) {
        return await this.request('/auth/register', 'POST', userData);
    }

    async getProfile() {
        return await this.request('/auth/profile');
    }

    // Student methods
    async getStudentDashboard() {
        return await this.request('/student/dashboard');
    }

    async getStudentAttendance() {
        return await this.request('/student/attendance');
    }

    async getStudentPerformance() {
        return await this.request('/student/performance');
    }

    async getPlacements() {
        return await this.request('/student/placements');
    }

    async applyForPlacement(placementId) {
        return await this.request('/student/placements/apply', 'POST', { placement_id: placementId });
    }

    // Faculty methods
    async getFacultyDashboard() {
        return await this.request('/faculty/dashboard');
    }

    async getFacultyStudents() {
        return await this.request('/faculty/students');
    }

    async updateAttendance(attendanceData) {
        return await this.request('/faculty/attendance', 'POST', attendanceData);
    }

    async updatePerformance(performanceData) {
        return await this.request('/faculty/performance', 'POST', performanceData);
    }

    // QR Code methods
    async generateQRCode(subject) {
        return await this.request('/attendance/qr/generate', 'POST', { subject });
    }

    async scanQRCode(sessionId) {
        return await this.request('/attendance/qr/scan', 'POST', { sessionId });
    }
}

// Initialize API
const api = new eduTrackerAPI();

// Update your existing JavaScript to use API calls instead of localStorage
// Example: Replace dataManager.getStudents() with api.getFacultyStudents()