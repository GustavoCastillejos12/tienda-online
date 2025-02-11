const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');

// Middleware de autenticación
const auth = async (req, res, next) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (!token) {
            return res.status(401).json({ message: 'No autorizado' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// Obtener el carrito del usuario
router.get('/', auth, async (req, res) => {
    try {
        const [cartItems] = await db.query(`
            SELECT c.*, p.name, p.price, p.image 
            FROM cart c 
            JOIN products p ON c.product_id = p.id 
            WHERE c.user_id = ?
        `, [req.userId]);
        
        res.json(cartItems);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Agregar item al carrito
router.post('/', auth, async (req, res) => {
    try {
        const { productId, quantity } = req.body;

        // Verificar stock disponible
        const [products] = await db.query('SELECT stock FROM products WHERE id = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        if (products[0].stock < quantity) {
            return res.status(400).json({ message: 'Stock insuficiente' });
        }

        // Verificar si el producto ya está en el carrito
        const [existingItems] = await db.query(
            'SELECT * FROM cart WHERE user_id = ? AND product_id = ?',
            [req.userId, productId]
        );

        if (existingItems.length > 0) {
            // Actualizar cantidad
            await db.query(
                'UPDATE cart SET quantity = quantity + ? WHERE user_id = ? AND product_id = ?',
                [quantity, req.userId, productId]
            );
        } else {
            // Insertar nuevo item
            await db.query(
                'INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)',
                [req.userId, productId, quantity]
            );
        }

        res.status(201).json({ message: 'Producto agregado al carrito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Actualizar cantidad de un item
router.put('/:productId', auth, async (req, res) => {
    try {
        const { quantity } = req.body;
        const productId = req.params.productId;

        // Verificar stock disponible
        const [products] = await db.query('SELECT stock FROM products WHERE id = ?', [productId]);
        if (products.length === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        if (products[0].stock < quantity) {
            return res.status(400).json({ message: 'Stock insuficiente' });
        }

        const [result] = await db.query(
            'UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?',
            [quantity, req.userId, productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item no encontrado en el carrito' });
        }

        res.json({ message: 'Cantidad actualizada' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Eliminar item del carrito
router.delete('/:productId', auth, async (req, res) => {
    try {
        const [result] = await db.query(
            'DELETE FROM cart WHERE user_id = ? AND product_id = ?',
            [req.userId, req.params.productId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Item no encontrado en el carrito' });
        }

        res.json({ message: 'Item eliminado del carrito' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Vaciar carrito
router.delete('/', auth, async (req, res) => {
    try {
        await db.query('DELETE FROM cart WHERE user_id = ?', [req.userId]);
        res.json({ message: 'Carrito vaciado' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

module.exports = router; 