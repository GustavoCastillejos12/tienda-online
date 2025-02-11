const mysql = require('mysql2');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
    // Configuración para Railway
    pool = mysql.createPool(process.env.DATABASE_URL);
} else {
    // Configuración local
    pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'tienda_online',
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0
    });
}

const promisePool = pool.promise();

module.exports = promisePool; 