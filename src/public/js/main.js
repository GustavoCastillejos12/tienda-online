// Estado global
let cart = [];
let products = [];
let user = null;

// Configuración de la API
const API_URL = window.location.origin;

// Configuración de fetch
const defaultHeaders = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
};

// Función para hacer peticiones fetch con configuración por defecto
async function fetchWithConfig(url, options = {}) {
    const token = localStorage.getItem('token');
    const headers = {
        ...defaultHeaders,
        ...options.headers,
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    const config = {
        ...options,
        headers,
        credentials: 'same-origin'
    };

    try {
        const response = await fetch(url, config);
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Error en la petición');
        }
        return response;
    } catch (error) {
        console.error('Error en fetchWithConfig:', error);
        throw error;
    }
}

// Funciones de utilidad
const formatPrice = (price) => {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
    }).format(price);
};

function showError(message) {
    alert(message);
}

function showSuccess(message) {
    alert(message);
}

// Prevenir comportamiento por defecto de los enlaces y manejar la navegación
document.addEventListener('click', (e) => {
    const link = e.target.closest('a');
    if (link) {
        const href = link.getAttribute('href');
        if (href && href.startsWith('/')) {
            e.preventDefault();
            if (href === window.location.pathname) {
                // Si estamos en la misma página, solo recargamos los productos
                if (href === '/productos') {
                    loadProducts();
                }
                return;
            }
            window.location.href = href;
        }
    }
});

// Cargar productos
async function loadProducts() {
    try {
        const response = await fetchWithConfig(`${API_URL}/api/products`);
        products = await response.json();
        displayProducts();
    } catch (error) {
        console.error('Error al cargar productos:', error);
        showError('Error al cargar los productos');
    }
}

// Mostrar productos
function displayProducts() {
    const container = document.getElementById('products-container');
    if (!container) return;
    
    container.innerHTML = products.map(product => `
        <div class="product-card bg-white rounded-lg shadow-md overflow-hidden">
            <div class="relative">
                <img src="${product.image}" alt="${product.name}" class="w-full h-48 object-cover">
                <div class="absolute top-0 right-0 m-2">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${
                        product.stock > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }">
                        ${product.stock > 0 ? 'En Stock' : 'Agotado'}
                    </span>
                </div>
            </div>
            <div class="p-4">
                <h3 class="text-lg font-semibold text-gray-900">${product.name}</h3>
                <div class="product-description mt-2">
                    <p class="text-gray-600 text-sm">${product.description}</p>
                </div>
                <div class="mt-4 flex flex-col space-y-3">
                    <span class="text-xl font-bold text-gray-900">${formatPrice(product.price)}</span>
                    <button 
                        onclick="addToCart(${product.id})"
                        class="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-300 ${
                            product.stock === 0 ? 'opacity-50 cursor-not-allowed' : ''
                        }"
                        ${product.stock === 0 ? 'disabled' : ''}
                    >
                        ${product.stock === 0 ? 'Agotado' : 'Agregar al carrito'}
                    </button>
                </div>
            </div>
        </div>
    `).join('');
}

// Funciones de filtrado y búsqueda
let currentCategory = '';
let currentSort = 'newest';
let searchQuery = '';

function filterProducts() {
    let filteredProducts = [...products];

    // Filtrar por categoría
    if (currentCategory) {
        filteredProducts = filteredProducts.filter(product => product.category === currentCategory);
    }

    // Filtrar por búsqueda
    if (searchQuery) {
        const query = searchQuery.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
            product.name.toLowerCase().includes(query) || 
            product.description.toLowerCase().includes(query)
        );
    }

    // Ordenar productos
    switch (currentSort) {
        case 'price-asc':
            filteredProducts.sort((a, b) => a.price - b.price);
            break;
        case 'price-desc':
            filteredProducts.sort((a, b) => b.price - a.price);
            break;
        case 'newest':
            filteredProducts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
            break;
    }

    return filteredProducts;
}

// Event Listeners para filtros
document.addEventListener('DOMContentLoaded', () => {
    const categoryFilter = document.getElementById('categoryFilter');
    const sortFilter = document.getElementById('sortFilter');
    const searchInput = document.getElementById('searchProducts');

    if (categoryFilter) {
        categoryFilter.addEventListener('change', (e) => {
            currentCategory = e.target.value;
            products = filterProducts();
            displayProducts();
        });
    }

    if (sortFilter) {
        sortFilter.addEventListener('change', (e) => {
            currentSort = e.target.value;
            products = filterProducts();
            displayProducts();
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            searchQuery = e.target.value;
            if (searchQuery === '') {
                // Si la búsqueda está vacía, recargar todos los productos
                loadProducts();
            } else {
                // Si hay texto en la búsqueda, filtrar los productos
                products = filterProducts();
                displayProducts();
            }
        });
    }

    loadProducts();
    checkAuth();
});

// Funciones del carrito
async function loadCart() {
    if (!user) {
        displayEmptyCart();
        return;
    }

    try {
        const response = await fetchWithConfig(`${API_URL}/api/cart`);
        cart = await response.json();
        displayCartItems();
        updateCartCount();
        updateCartTotal();
    } catch (error) {
        console.error('Error al cargar el carrito:', error);
        showError('Error al cargar el carrito');
    }
}

function displayEmptyCart() {
    const cartItems = document.getElementById('cart-items');
    if (cartItems) {
        cartItems.innerHTML = `
            <div class="empty-cart">
                <p>Tu carrito está vacío</p>
            </div>
        `;
    }
    updateCartTotal();
}

function displayCartItems() {
    const cartItems = document.getElementById('cart-items');
    if (!cartItems) return;

    if (cart.length === 0) {
        displayEmptyCart();
        return;
    }

    cartItems.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
            <div class="flex items-center space-x-4">
                <img src="${item.image}" alt="${item.name}" class="cart-item-image">
                <div>
                    <h4 class="font-semibold">${item.name}</h4>
                    <p class="text-sm text-gray-600">
                        ${formatPrice(item.price)} x ${item.quantity}
                    </p>
                </div>
            </div>
            <div class="flex items-center space-x-2">
                <button 
                    onclick="updateCartItemQuantity(${item.product_id}, ${item.quantity - 1})"
                    class="text-gray-500 hover:text-gray-700"
                    ${item.quantity <= 1 ? 'disabled' : ''}
                >
                    -
                </button>
                <span>${item.quantity}</span>
                <button 
                    onclick="updateCartItemQuantity(${item.product_id}, ${item.quantity + 1})"
                    class="text-gray-500 hover:text-gray-700"
                >
                    +
                </button>
                <button 
                    onclick="removeFromCart(${item.product_id})"
                    class="ml-2 text-red-500 hover:text-red-700"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
        </div>
    `).join('');
}

async function addToCart(productId) {
    if (!user) {
        window.location.replace('/login');
        return;
    }

    try {
        const response = await fetchWithConfig(`${API_URL}/api/cart`, {
            method: 'POST',
            body: JSON.stringify({ productId, quantity: 1 })
        });

        if (!response.ok) throw new Error('Error al agregar al carrito');
        loadCart();
        showSuccess('Producto agregado al carrito');
    } catch (error) {
        console.error('Error al agregar al carrito:', error);
        showError('Error al agregar el producto al carrito');
    }
}

async function updateCartItemQuantity(productId, quantity) {
    if (quantity <= 0) {
        await removeFromCart(productId);
        return;
    }

    try {
        const response = await fetchWithConfig(`${API_URL}/api/cart/${productId}`, {
            method: 'PUT',
            body: JSON.stringify({ quantity })
        });

        if (!response.ok) throw new Error('Error al actualizar cantidad');
        loadCart();
    } catch (error) {
        console.error('Error al actualizar cantidad:', error);
        showError('Error al actualizar la cantidad del producto');
    }
}

async function removeFromCart(productId) {
    try {
        const response = await fetchWithConfig(`${API_URL}/api/cart/${productId}`, {
            method: 'DELETE'
        });

        if (!response.ok) throw new Error('Error al eliminar del carrito');
        loadCart();
        showSuccess('Producto eliminado del carrito');
    } catch (error) {
        console.error('Error al eliminar del carrito:', error);
        showError('Error al eliminar el producto del carrito');
    }
}

function updateCartCount() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const cartCountElement = document.getElementById('cart-count');
    if (cartCountElement) {
        cartCountElement.textContent = count;
    }
}

function updateCartTotal() {
    const total = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const cartTotalElement = document.getElementById('cart-total');
    if (cartTotalElement) {
        cartTotalElement.textContent = formatPrice(total);
    }
}

async function proceedToCheckout() {
    if (!user) {
        window.location.replace('/login');
        return;
    }

    if (cart.length === 0) {
        showError('El carrito está vacío');
        return;
    }

    window.location.replace('/checkout');
}

// Autenticación
async function checkAuth() {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetchWithConfig(`${API_URL}/api/auth/verify`);
            const data = await response.json();
            
            if (data.user) {
                user = data.user;
                console.log('Usuario autenticado:', user);
                updateAuthUI();
                loadCart();

                // Si el usuario es admin y no está en el panel de admin, mostrar el botón
                if (user.role === 'admin' && window.location.pathname !== '/admin') {
                    const authButtons = document.getElementById('auth-buttons');
                    if (authButtons) {
                        updateAuthUI();
                    }
                }
            } else {
                localStorage.removeItem('token');
                user = null;
                updateAuthUI();
                displayEmptyCart();
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            localStorage.removeItem('token');
            user = null;
            updateAuthUI();
            displayEmptyCart();
        }
    } else {
        updateAuthUI();
        displayEmptyCart();
    }
}

function updateAuthUI() {
    const authButtons = document.getElementById('auth-buttons');
    if (!authButtons) return;

    if (user) {
        console.log('Actualizando UI para usuario:', user);
        let adminButton = '';
        if (user.role === 'admin') {
            console.log('Usuario es admin, agregando botón de admin');
            adminButton = `
                <a href="/admin" 
                   class="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 mr-4">
                    Panel Admin
                </a>
            `;
        }

        authButtons.innerHTML = `
            ${adminButton}
            <span class="text-gray-600">Hola, ${user.name}</span>
            <button 
                onclick="logout()"
                class="ml-4 px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
            >
                Cerrar Sesión
            </button>
        `;
    } else {
        authButtons.innerHTML = `
            <a href="/login" class="text-gray-600 hover:text-gray-900">Iniciar Sesión</a>
            <a href="/registro" class="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700">Registrarse</a>
        `;
    }
}

function logout() {
    localStorage.removeItem('token');
    user = null;
    cart = [];
    updateAuthUI();
    displayEmptyCart();
    window.location.replace('/login');
} 