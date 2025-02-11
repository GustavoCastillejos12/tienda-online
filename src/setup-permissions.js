const fs = require('fs');
const path = require('path');

// Definir la ruta de la carpeta de uploads
const uploadsDir = path.join(__dirname, 'public/uploads/products');

// Crear la carpeta si no existe
if (!fs.existsSync(uploadsDir)) {
    try {
        fs.mkdirSync(uploadsDir, { recursive: true });
        console.log('✅ Carpeta de uploads creada exitosamente');
    } catch (error) {
        console.error('❌ Error al crear la carpeta de uploads:', error);
        process.exit(1);
    }
}

// Verificar permisos de escritura
try {
    // Intentar escribir un archivo de prueba
    const testFile = path.join(uploadsDir, 'test.txt');
    fs.writeFileSync(testFile, 'test');
    fs.unlinkSync(testFile);
    console.log('✅ La carpeta tiene permisos de escritura correctos');
} catch (error) {
    console.error('❌ Error: La carpeta no tiene permisos de escritura');
    console.error('Por favor, sigue estos pasos para configurar los permisos:');
    console.error('1. Abre el Explorador de Windows');
    console.error(`2. Ve a la carpeta: ${uploadsDir}`);
    console.error('3. Click derecho en la carpeta -> Propiedades');
    console.error('4. Ve a la pestaña Seguridad');
    console.error('5. Click en Editar -> Agregar');
    console.error('6. Añade tu usuario y el usuario del servidor web');
    console.error('7. Marca la casilla "Control total" o al menos "Modificar" y "Escribir"');
    console.error('8. Click en Aplicar y luego en Aceptar');
    process.exit(1);
} 