const express = require('express');
const router = express.Router();
const db = require('../config/database');
const jwt = require('jsonwebtoken');
const PDFDocument = require('pdfkit');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configuración de multer para subida de imágenes
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const uploadDir = 'src/public/uploads/products';
        // Crear el directorio si no existe
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'product-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Obtener el tipo MIME del archivo
    const mimeType = file.mimetype;
    console.log('Tipo de archivo:', mimeType);
    console.log('Nombre original:', file.originalname);

    // Lista de tipos MIME permitidos
    const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/jpg'];

    if (allowedMimes.includes(mimeType)) {
        cb(null, true);
    } else {
        cb(new Error(`Tipo de archivo no permitido. Solo se permiten: ${allowedMimes.join(', ')}`));
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB máximo
    }
});

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

        req.userId = decoded.userId;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Token inválido' });
    }
};

// Obtener datos del dashboard
router.get('/dashboard', isAdmin, async (req, res) => {
    try {
        // Obtener total de ventas
        const [salesResult] = await db.query(`
            SELECT COALESCE(SUM(total_amount), 0) as total
            FROM orders 
            WHERE status = 'completed'
        `);

        // Obtener cantidad de productos activos
        const [productsResult] = await db.query(`
            SELECT COUNT(*) as count 
            FROM products 
            WHERE status = 'active'
        `);

        // Obtener órdenes pendientes
        const [ordersResult] = await db.query(`
            SELECT COUNT(*) as count 
            FROM orders 
            WHERE status = 'pending'
        `);

        res.json({
            totalSales: salesResult[0].total,
            activeProducts: productsResult[0].count,
            pendingOrders: ordersResult[0].count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Obtener todos los productos (incluyendo inactivos)
router.get('/products', isAdmin, async (req, res) => {
    try {
        const [products] = await db.query('SELECT * FROM products WHERE created_by = ?', [req.userId]);
        res.json(products);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Crear nuevo producto
router.post('/products', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        
        // Verificar que se recibió un archivo
        if (!req.file) {
            return res.status(400).json({ message: 'La imagen es requerida' });
        }

        const image = `/uploads/products/${req.file.filename}`;

        // Validar datos
        if (!name || !description || !price || !stock) {
            // Si hay error, eliminar la imagen subida
            const imagePath = path.join(__dirname, '../public', image);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        const [result] = await db.query(
            'INSERT INTO products (name, description, price, image, stock, created_by) VALUES (?, ?, ?, ?, ?, ?)',
            [name, description, parseFloat(price), image, parseInt(stock), req.userId]
        );
        
        res.status(201).json({
            message: 'Producto creado exitosamente',
            productId: result.insertId
        });
    } catch (error) {
        console.error('Error al crear producto:', error);
        // Si hay error, eliminar la imagen si se subió
        if (req.file) {
            const imagePath = path.join(__dirname, '../public/uploads/products', req.file.filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        res.status(500).json({ message: 'Error al crear el producto: ' + error.message });
    }
});

// Actualizar producto
router.put('/products/:id', isAdmin, upload.single('image'), async (req, res) => {
    try {
        const { name, description, price, stock } = req.body;
        
        // Validar datos
        if (!name || !description || !price || !stock) {
            if (req.file) {
                const imagePath = path.join(__dirname, '../public/uploads/products', req.file.filename);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            return res.status(400).json({ message: 'Todos los campos son requeridos' });
        }

        let query = 'UPDATE products SET name = ?, description = ?, price = ?, stock = ?';
        let params = [name, description, parseFloat(price), parseInt(stock)];

        // Si se subió una nueva imagen
        if (req.file) {
            // Obtener la imagen anterior para eliminarla
            const [oldProduct] = await db.query(
                'SELECT image FROM products WHERE id = ? AND created_by = ?',
                [req.params.id, req.userId]
            );

            if (oldProduct.length > 0 && oldProduct[0].image) {
                const oldImagePath = path.join(__dirname, '../public', oldProduct[0].image);
                // Eliminar la imagen anterior si existe
                if (fs.existsSync(oldImagePath)) {
                    fs.unlinkSync(oldImagePath);
                }
            }

            query += ', image = ?';
            params.push(`/uploads/products/${req.file.filename}`);
        }

        query += ' WHERE id = ? AND created_by = ?';
        params.push(req.params.id, req.userId);

        const [result] = await db.query(query, params);

        if (result.affectedRows === 0) {
            // Si no se encontró el producto, eliminar la imagen subida
            if (req.file) {
                const imagePath = path.join(__dirname, '../public/uploads/products', req.file.filename);
                if (fs.existsSync(imagePath)) {
                    fs.unlinkSync(imagePath);
                }
            }
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json({ message: 'Producto actualizado exitosamente' });
    } catch (error) {
        console.error('Error al actualizar producto:', error);
        // Si hay error, eliminar la imagen si se subió
        if (req.file) {
            const imagePath = path.join(__dirname, '../public/uploads/products', req.file.filename);
            if (fs.existsSync(imagePath)) {
                fs.unlinkSync(imagePath);
            }
        }
        res.status(500).json({ message: 'Error al actualizar el producto: ' + error.message });
    }
});

// Cambiar estado del producto
router.put('/products/:id/toggle-status', isAdmin, async (req, res) => {
    try {
        const [result] = await db.query(
            'UPDATE products SET status = CASE WHEN status = "active" THEN "inactive" ELSE "active" END WHERE id = ? AND created_by = ?',
            [req.params.id, req.userId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Producto no encontrado' });
        }

        res.json({ message: 'Estado del producto actualizado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
});

// Generar reporte de ventas en PDF
router.get('/reports/sales', isAdmin, async (req, res) => {
    try {
        // Obtener datos de ventas
        const [orders] = await db.query(`
            SELECT o.*, u.name as user_name, u.email as user_email,
                   p.name as product_name, oi.quantity, oi.price
            FROM orders o
            JOIN users u ON o.user_id = u.id
            JOIN order_items oi ON o.id = oi.order_id
            JOIN products p ON oi.product_id = p.id
            WHERE o.status = 'completed'
            AND p.created_by = ?
            ORDER BY o.created_at DESC
        `, [req.userId]);

        // Crear PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=reporte-ventas.pdf');
        doc.pipe(res);

        // Título
        doc.fontSize(20).text('Reporte de Ventas', { align: 'center' });
        doc.moveDown();

        // Fecha del reporte
        doc.fontSize(12).text(`Fecha: ${new Date().toLocaleDateString()}`, { align: 'right' });
        doc.moveDown();

        // Tabla de ventas
        let totalVentas = 0;
        orders.forEach((order, index) => {
            if (index > 0) doc.moveDown();
            
            doc.fontSize(14).text(`Orden #${order.id}`);
            doc.fontSize(12).text(`Cliente: ${order.user_name} (${order.user_email})`);
            doc.text(`Fecha: ${new Date(order.created_at).toLocaleDateString()}`);
            doc.text(`Producto: ${order.product_name}`);
            doc.text(`Cantidad: ${order.quantity}`);
            doc.text(`Precio unitario: $${order.price}`);
            doc.text(`Total: $${order.total_amount}`);

            totalVentas += order.total_amount;
        });

        doc.moveDown();
        doc.fontSize(16).text(`Total de Ventas: $${totalVentas}`, { align: 'right' });

        doc.end();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al generar el reporte' });
    }
});

module.exports = router; 