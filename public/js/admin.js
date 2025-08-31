// Variables globales
let currentTab = 'dashboard';
let products = [];
let users = [];
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
        return false;
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

        localStorage.setItem('userData', JSON.stringify(data.user));
        if (data.user.role !== 'admin') {
            window.location.href = '/';
            return false;
        }

        document.getElementById('adminName').textContent = `¡Hola, ${data.user.name}!`;
        await loadDashboardStats();
        await loadProducts();
        await loadUsers();
        return true;
    } catch (error) {
        console.error('Error de autenticación:', error);
        localStorage.removeItem('token');
        localStorage.removeItem('userData');
        window.location.href = '/login';
        return false;
    }
}

// Funciones de navegación por tabs
function showTab(tabName) {
    currentTab = tabName;
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
    document.getElementById(`${tabName}-tab`).classList.remove('hidden');
    
    document.querySelectorAll('.tab-button').forEach(button => {
        button.classList.remove('active', 'border-blue-500', 'text-blue-600');
        button.classList.add('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
    });
    
    const activeButton = document.querySelector(`[onclick="showTab('${tabName}')"]`);
    activeButton.classList.add('active', 'border-blue-500', 'text-blue-600');
    activeButton.classList.remove('text-gray-500', 'hover:text-gray-700', 'hover:border-gray-300');
}

// Funciones del Dashboard
async function loadDashboardStats() {
    try {
        const response = await fetch('/api/admin/stats', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar estadísticas');
        
        const stats = await response.json();
        document.getElementById('totalSales').textContent = `$${stats.totalSales.toFixed(2)}`;
        document.getElementById('activeProducts').textContent = stats.activeProducts;
        document.getElementById('pendingOrders').textContent = stats.pendingOrders;
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar las estadísticas del dashboard');
    }
}

// Funciones de Productos
async function loadProducts() {
    try {
        const response = await fetch('/api/products', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar productos');
        
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los productos');
    }
}

function displayProducts() {
    const tbody = document.getElementById('productsTableBody');
    tbody.innerHTML = '';
    
    products.forEach(product => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="flex items-center">
                    <div class="h-10 w-10 flex-shrink-0">
                        <img class="h-10 w-10 rounded-full object-cover" src="${product.image}" alt="${product.name}">
                    </div>
                    <div class="ml-4">
                        <div class="text-sm font-medium text-gray-900">${product.name}</div>
                        <div class="text-sm text-gray-500">${product.description}</div>
                    </div>
                </div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">$${parseFloat(product.price).toFixed(2)}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${product.stock}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${product.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                    ${product.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <button onclick="editProduct(${product.id})" class="text-blue-600 hover:text-blue-900 mr-3">Editar</button>
                <button onclick="toggleProductStatus(${product.id})" class="text-yellow-600 hover:text-yellow-900 mr-3">
                    ${product.status === 'active' ? 'Desactivar' : 'Activar'}
                </button>
                <button onclick="deleteProduct(${product.id})" class="text-red-600 hover:text-red-900">Eliminar</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
}

// Funciones de Usuarios
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });
        
        if (!response.ok) throw new Error('Error al cargar usuarios');
        
        users = await response.json();
        displayUsers();
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cargar los usuarios');
    }
}

function displayUsers() {
    const tbody = document.getElementById('usersTableBody');
    tbody.innerHTML = '';
    
    users.forEach(user => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm font-medium text-gray-900">${user.name}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${user.email}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-gray-100 text-gray-800'}">
                    ${user.role}
                </span>
            </td>
            <td class="px-6 py-4 whitespace-nowrap">
                <div class="text-sm text-gray-900">${new Date(user.created_at).toLocaleDateString()}</div>
            </td>
            <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                ${user.role === 'admin' ? 
                    `<button onclick="changeRole(${user.id}, 'user')" class="text-gray-600 hover:text-gray-900">Quitar Admin</button>` :
                    `<button onclick="changeRole(${user.id}, 'admin')" class="text-blue-600 hover:text-blue-900">Hacer Admin</button>`
                }
            </td>
        `;
        tbody.appendChild(tr);
    });
}

async function changeRole(userId, newRole) {
    try {
        const response = await fetch(`/api/admin/users/${userId}/role`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            },
            body: JSON.stringify({ role: newRole })
        });

        if (!response.ok) throw new Error('Error al cambiar el rol');

        await loadUsers(); // Recargar la lista de usuarios
        alert(`Rol actualizado correctamente a ${newRole}`);
    } catch (error) {
        console.error('Error:', error);
        alert('Error al cambiar el rol del usuario');
    }
}

// Funciones del Modal de Productos
function showAddProductModal() {
    document.getElementById('modalTitle').textContent = 'Agregar Nuevo Producto';
    document.getElementById('productId').value = '';
    document.getElementById('productForm').reset();
    document.getElementById('productModal').classList.remove('hidden');
}

function hideProductModal() {
    document.getElementById('productModal').classList.add('hidden');
    document.getElementById('productForm').reset();
}

function editProduct(productId) {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    document.getElementById('modalTitle').textContent = 'Editar Producto';
    document.getElementById('productId').value = product.id;
    document.getElementById('productName').value = product.name;
    document.getElementById('productDescription').value = product.description;
    document.getElementById('productPrice').value = product.price;
    document.getElementById('productStock').value = product.stock;

    document.getElementById('productModal').classList.remove('hidden');
}

async function deleteProduct(productId) {
    if (!confirm('¿Estás seguro de que deseas eliminar este producto?')) return;

    try {
        const response = await fetch(`/api/products/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar el producto');

        await loadProducts();
        alert('Producto eliminado correctamente');
    } catch (error) {
        console.error('Error:', error);
        alert('Error al eliminar el producto');
    }
}

async function toggleProductStatus(productId) {
    try {
        const response = await fetch(`/api/admin/products/${productId}/toggle-status`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        if (!response.ok) throw new Error('Error al cambiar el estado del producto');

        await loadProducts();
        showSuccess('Estado del producto actualizado correctamente');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cambiar el estado del producto');
    }
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    if (!await checkAuth()) {
        window.location.href = '/admin/login.html';
        return;
    }

    await loadDashboardStats();
    await loadProducts();
    await loadUsers();
    displayAdminName();
    
    // Agregar event listener para la vista previa de la imagen
    const imageInput = document.getElementById('productImage');
    if (imageInput) {
        imageInput.addEventListener('change', handleImagePreview);
    }
}); 