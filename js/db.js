/**
 * BuanantaraDB - JSON File-based Database Client.
 * Communicates with the local Node.js API server to read/write JSON files directly.
 */
(function () {
    const API_URL = 'http://localhost:3000';
    const SESSION_KEY = 'buanantara_session';

    // Fallback in case server isn't running
    let dbInMemory = { users: [], bookings: [], settings: {} };

    async function fetchDB() {
        try {
            const response = await fetch(`${API_URL}/api/db`);
            if (response.ok) {
                dbInMemory = await response.json();
            }
        } catch (error) {
            console.warn("Server is offline. Data cannot be loaded from db.json.", error);
        }
    }

    const DB = {
        // User Registration
        async registerUser({ fullName, email, password }) {
            try {
                const response = await fetch(`${API_URL}/api/register`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ fullName, email, password })
                });

                const result = await response.json();
                if (!response.ok) {
                    throw new Error(result.error || 'Terjadi kesalahan saat pendaftaran.');
                }
                return result.user;
            } catch (error) {
                throw error;
            }
        },

        // User Login
        async loginUser({ email, password }) {
            await fetchDB();
            const user = dbInMemory.users.find(u => 
                (u.email.toLowerCase() === email.toLowerCase()) && 
                u.password === password
            );

            if (!user) {
                throw new Error('Email atau password salah!');
            }

            // Save active session
            localStorage.setItem(SESSION_KEY, JSON.stringify(user));
            return user;
        },

        // Get Current Logged In User
        getCurrentUser() {
            const session = localStorage.getItem(SESSION_KEY);
            return session ? JSON.parse(session) : null;
        },

        // Get All Database Records
        async getDatabaseData() {
            await fetchDB();
            return dbInMemory;
        },

        // Logout
        logoutUser() {
            localStorage.removeItem(SESSION_KEY);
            window.location.href = 'login.html';
        }
    };

    // Export to window object
    window.BuanantaraDB = DB;
})();
