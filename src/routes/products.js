const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware de autenticación para administradores
const isAdmin = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        const [users] = await db.query('SELECT role FROM users WHERE id = ?', [decoded.userId]);
        
        if (users.length === 0 || users[0].role !== 'admin') {
            return res.status(403).json({ message: 'Acceso denegado' });
        }

        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// Obtener todos los productos
router.get('/', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products');
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener un producto específico
router.get('/:id', async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }
        res.json(products[0]);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear un nuevo producto (solo admin)
router.post('/', isAdmin, async (req, res) => {
    try {
        const { name, description, price, image, stock } = req.body;
        const [result] = await db.query(
            'INSERT INTO products (name, description, price, image, stock) VALUES (?, ?, ?, ?, ?)',
            [name, description, price, image, stock]
        );
        
        res.status(201).json({
            message: 'Producto creado exitosamente',
            productId: result.insertId
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar un producto (solo admin)
router.put('/:id', isAdmin, async (req, res) => {
    try {
        const { name, description, price, image, stock } = req.body;
        const [result] = await db.query(
            'UPDATE products SET name = ?, description = ?, price = ?, image = ?, stock = ? WHERE id = ?',
            [name, description, price, image, stock, req.params.id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Eliminar un producto (solo admin)
router.delete('/:id', isAdmin, async (req, res) => {
    try {
        const [result] = await db.query('DELETE FROM products WHERE id = ?', [req.params.id]);
        
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router; 