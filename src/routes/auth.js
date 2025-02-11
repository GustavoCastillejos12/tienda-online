const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/database');

// Registro de usuario
router.post('/register', async (req, res) => {
    try {
        const { name, email, password } = req.body;
        
        // Verificar si el usuario ya existe
        const existingUser = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }

        // Encriptar contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar nuevo usuario
        const result = await db.query(
            'INSERT INTO users (name, email, password) VALUES ($1, $2, $3) RETURNING id',
            [name, email, hashedPassword]
        );

        // Obtener el usuario recién creado incluyendo su rol
        const newUser = await db.query(
            'SELECT id, name, email, role FROM users WHERE id = $1',
            [result.rows[0].id]
        );

        // Generar token
        const token = jwt.sign(
            { userId: result.rows[0].id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.status(201).json({
            message: 'Usuario registrado exitosamente',
            token,
            user: newUser.rows[0]
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Inicio de sesión
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Buscar usuario
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        if (result.rows.length === 0) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const user = result.rows[0];

        // Verificar contraseña
        const isValidPassword = await bcrypt.compare(password, user.password);
        if (!isValidPassword) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        // Generar token
        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET || 'your-secret-key',
            { expiresIn: '24h' }
        );

        res.json({
            message: 'Inicio de sesión exitoso',
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Verificar token
router.get('/verify', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const result = await db.query(
            'SELECT id, name, email, role FROM users WHERE id = $1', 
            [decoded.userId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json({ user: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(401).json({ message: 'Token inválido' });
    }
});

module.exports = router; 