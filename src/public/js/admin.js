// Variables globales
let currentUser = null;
let products = [];
let selectedImage = null;

// Funciones de utilidad
function formatPrice(price) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(price);
}

function showError(message) {
    alert(message);
}

function showSuccess(message) {
    alert(message);
}

// Manejar la vista previa de la imagen
function handleImagePreview(event) {
    const file = event.target.files[0];
    if (file) {
        selectedImage = file;
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('imagePreview');
            preview.src = e.target.result;
            preview.classList.remove('hidden');
        }
        reader.readAsDataURL(file);
    }
}

// Verificar autenticación
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.href = '/login';
        return;
    }

    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message);
        }

        currentUser = data.user;
        if (currentUser.role !== 'admin') {
            window.location.href = '/';
            return;
        }

        document.getElementById('adminName').textContent = `Hola, ${currentUser.name}`;
        loadDashboardData();
        loadProducts();
    } catch (error) {
        console.error('Error de autenticación:', error);
        window.location.href = '/login';
    }
}

// Cargar datos del dashboard
async function loadDashboardData() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/dashboard', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();

        document.getElementById('totalSales').textContent = formatPrice(data.totalSales);
        document.getElementById('activeProducts').textContent = data.activeProducts;
        document.getElementById('pendingOrders').textContent = data.pendingOrders;
    } catch (error) {
        console.error('Error al cargar datos del dashboard:', error);
    }
}

// Cargar productos
async function loadProducts() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/products', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error al cargar productos:', error);
    }
}

// Mostrar productos en la tabla
function displayProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = products.map(product => `
        <tr>
            <td class="px-6 py-4">
                <div class="flex items-center">
                    <img class="h-10 w-10 rounded-full" src="${product.image}" alt="${product.name}">
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${product.name}</div>
                        <div class="text-sm text-gray-500">${product.description}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 text-sm text-gray-900">${formatPrice(product.price)}</td>
            <td class="px-6 py-4 text-sm text-gray-900">${product.stock}</td>
            <td class="px-6 py-4">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                    product.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                }">
                    ${product.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="px-6 py-4 text-sm font-medium space-x-2">
                <button onclick="editProduct(${product.id})" class="text-blue-600 hover:text-blue-900">Editar</button>
                <button onclick="toggleProductStatus(${product.id})" class="text-${
                    product.status === 'active' ? 'red' : 'green'
                }-600 hover:text-${
                    product.status === 'active' ? 'red' : 'green'
                }-900">
                    ${product.status === 'active' ? 'Desactivar' : 'Activar'}
                </button>
            </td>
        </tr>
    `).join('');
}

// Funciones del modal de productos
function showAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Producto';
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').classList.add('hidden');
    selectedImage = null;
    document.getElementById('productModal').classList.remove('hidden');
}

function showEditProductModal(product) {
    document.getElementById('modalTitle').textContent = 'Editar Producto';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;
    
    // Mostrar la imagen actual del producto
    const preview = document.getElementById('imagePreview');
    preview.src = product.image;
    preview.classList.remove('hidden');
    
    document.getElementById('productModal').classList.remove('hidden');
}

function hideProductModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('productForm').reset();
    document.getElementById('imagePreview').classList.add('hidden');
    selectedImage = null;
}

// Manejar el formulario de productos
document.getElementById('productForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const productId = document.getElementById('productId').value;
    const formData = new FormData();
    
    formData.append('name', document.getElementById('productName').value);
    formData.append('description', document.getElementById('productDescription').value);
    formData.append('price', document.getElementById('productPrice').value);
    formData.append('stock', document.getElementById('productStock').value);
    
    if (selectedImage) {
        formData.append('image', selectedImage);
    }

    try {
        const token = localStorage.getItem('token');
        const url = productId 
            ? `/api/admin/products/${productId}`
            : '/api/admin/products';
        const method = productId ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: formData
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }

        hideProductModal();
        loadProducts();
        showSuccess(productId ? 'Producto actualizado' : 'Producto creado');
    } catch (error) {
        showError(error.message);
    }
});

// Editar producto
async function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (product) {
        showEditProductModal(product);
    }
}

// Cambiar estado del producto
async function toggleProductStatus(productId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/admin/products/${productId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }

        loadProducts();
        showSuccess('Estado del producto actualizado');
    } catch (error) {
        showError(error.message);
    }
}

// Generar reporte PDF
async function generateReport() {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch('/api/admin/reports/sales', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            const data = await response.json();
            throw new Error(data.message);
        }

        // Descargar el PDF
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'reporte-ventas.pdf';
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();
    } catch (error) {
        showError(error.message);
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    window.location.href = '/login';
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    
    // Agregar event listener para la vista previa de la imagen
    const imageInput = document.getElementById('productImage');
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }
}); 