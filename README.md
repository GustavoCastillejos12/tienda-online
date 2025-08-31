# Tienda Online

Aplicación web de comercio electrónico desarrollada con Node.js, Express y PostgreSQL.

## 🌐 Demo en Vivo

Puedes ver una demostración de la interfaz en: [GitHub Pages](https://gustavocastillejos12.github.io/tienda-online/)

**Nota:** La demo en GitHub Pages muestra solo la interfaz. Para funcionalidad completa (base de datos, autenticación), necesitas ejecutar el servidor localmente.

## Características

- Autenticación de usuarios
- Catálogo de productos
- Carrito de compras
- Panel de administración
- Procesamiento de pagos
- Diseño responsivo
- Tema claro/oscuro

## Requisitos

- Node.js >= 14
- MySQL >= 5.7
- XAMPP (opcional)

## Instalación

1. Clonar el repositorio:
```bash
git clone <URL_DEL_REPOSITORIO>
cd Tienda
```

2. Instalar dependencias:
```bash
npm install
```

3. Configurar variables de entorno:
   - Copia el archivo `.env.example` a `.env`
   - Modifica las variables según tu configuración

4. Crear la base de datos:
   - Importa el archivo `database.sql` en tu servidor MySQL
   - O ejecuta las queries manualmente

5. Iniciar el servidor:
```bash
npm run dev
```

## Estructura del Proyecto

```
src/
├── config/         # Configuración de la base de datos
├── public/         # Archivos estáticos
│   ├── css/       # Estilos
│   ├── js/        # Scripts del cliente
│   └── images/    # Imágenes
├── routes/        # Rutas de la API
└── app.js         # Punto de entrada
```

## Uso

1. Accede a `http://localhost:3000`
2. Regístrate o inicia sesión
3. Explora el catálogo de productos
4. Agrega productos al carrito
5. Procede al checkout

## Panel de Administración

1. Accede a `http://localhost:3000/admin`
2. Inicia sesión con credenciales de administrador
3. Gestiona productos, órdenes y usuarios

## Contribuir

1. Haz un Fork del proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## Licencia

Este proyecto está bajo la Licencia ISC. 