// Variables globales
let cart = [];
let user = null;

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

// Cargar carrito
async function loadCart() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.replace('/login');
            return;
        }

        const response = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al cargar el carrito');
        
        cart = await response.json();
        displayCart();
        updateCartSummary();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar el carrito');
    }
}

// Mostrar productos en el carrito
function displayCart() {
    const container = document.getElementById('cart-items');
    const status = document.getElementById('cart-status');

    if (cart.length === 0) {
        status.textContent = 'Tu carrito está vacío';
        container.innerHTML = `
            <div class="text-center py-8">
                <p class="text-gray-500 mb-4">No hay productos en tu carrito</p>
                <a href="/productos" class="text-blue-600 hover:text-blue-800">
                    Ver productos disponibles
                </a>
            </div>
        `;
        return;
    }

    status.textContent = `${cart.length} producto(s) en tu carrito`;
    container.innerHTML = cart.map(item => `
        <div class="cart-item flex items-center justify-between p-4 border rounded-lg">
            <div class="flex items-center space-x-4">
                <img src="${item.image}" alt="${item.name}" class="w-20 h-20 object-cover rounded-md">
                <div>
                    <h3 class="font-semibold text-lg">${item.name}</h3>
                    <p class="text-gray-600">${formatPrice(item.price)} c/u</p>
                </div>
            </div>
            <div class="flex items-center space-x-4">
                <div class="flex items-center space-x-2">
                    <button 
                        onclick="updateQuantity(${item.product_id}, ${item.quantity - 1})"
                        class="p-1 rounded-full hover:bg-gray-100"
                        ${item.quantity <= 1 ? 'disabled' : ''}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 12H4" />
                        </svg>
                    </button>
                    <span class="w-8 text-center">${item.quantity}</span>
                    <button 
                        onclick="updateQuantity(${item.product_id}, ${item.quantity + 1})"
                        class="p-1 rounded-full hover:bg-gray-100"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                    </button>
                </div>
                <span class="font-semibold">${formatPrice(item.price * item.quantity)}</span>
                <button 
                    onclick="removeFromCart(${item.product_id})"
                    class="remove-button p-2 text-red-600 hover:text-red-800"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

// Actualizar resumen del carrito
function updateCartSummary() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const iva = subtotal * 0.16;
    const total = subtotal + iva;

    document.getElementById('subtotal').textContent = formatPrice(subtotal);
    document.getElementById('iva').textContent = formatPrice(iva);
    document.getElementById('total').textContent = formatPrice(total);
}

// Actualizar cantidad de un producto
async function updateQuantity(productId, quantity) {
    if (quantity <= 0) {
        await removeFromCart(productId);
        return;
    }

    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ quantity })
        });

        if (!response.ok) throw new Error('Error al actualizar cantidad');
        
        await loadCart();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al actualizar la cantidad');
    }
}

// Eliminar producto del carrito
async function removeFromCart(productId) {
    try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/cart/${productId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) throw new Error('Error al eliminar producto');
        
        await loadCart();
        showSuccess('Producto eliminado del carrito');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al eliminar el producto');
    }
}

// Proceder al pago
function proceedToCheckout() {
    if (cart.length === 0) {
        showError('El carrito está vacío');
        return;
    }
    window.location.href = '/checkout';
}

// Verificar autenticación
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (!token) {
        window.location.replace('/login');
        return;
    }

    try {
        const response = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const data = await response.json();

        if (!response.ok) throw new Error(data.message);

        user = data.user;
        document.getElementById('auth-buttons').innerHTML = `
            <span class="text-gray-600">Hola, ${user.name}</span>
            <button 
                onclick="logout()"
                class="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
                Cerrar Sesión
            </button>
        `;
    } catch (error) {
        console.error('Error de autenticación:', error);
        window.location.replace('/login');
    }
}

// Cerrar sesión
function logout() {
    localStorage.removeItem('token');
    window.location.replace('/login');
}

// Inicializar página
document.addEventListener('DOMContentLoaded', () => {
    checkAuth();
    loadCart();
}); 