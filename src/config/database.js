const { Pool } = require('pg');
require('dotenv').config();

let pool;

if (process.env.DATABASE_URL) {
    // Configuración para Render
    pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: {
            rejectUnauthorized: false
        }
    });
} else {
    // Configuración local
    pool = new Pool({
        user: process.env.DB_USER || 'postgres',
        host: process.env.DB_HOST || 'localhost',
        database: process.env.DB_NAME || 'tienda_online',
        password: process.env.DB_PASSWORD || 'gustavo02.',
        port: process.env.DB_PORT || 5432,
        ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
}

// Probar la conexión
pool.on('connect', () => {
    console.log('Base de datos conectada exitosamente');
});

pool.on('error', (err) => {
    console.error('Error en la conexión de la base de datos:', err);
});

module.exports = {
    query: (text, params) => pool.query(text, params),
    pool
}; 