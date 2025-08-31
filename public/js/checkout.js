// Variables globales
let cart = [];
let user = null;
let selectedPaymentMethod = 'card';

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

// Cargar datos del carrito
async function loadCheckout() {
    try {
        const token = localStorage.getItem('token');
        if (!token) {
            window.location.replace('/login');
            return;
        }

        // Verificar autenticación
        const authResponse = await fetch('/api/auth/verify', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        const userData = await authResponse.json();
        user = userData.user;
        document.getElementById('user-info').textContent = `Hola, ${user.name}`;

        // Cargar carrito
        const cartResponse = await fetch('/api/cart', {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        cart = await cartResponse.json();

        if (cart.length === 0) {
            window.location.replace('/carrito');
            return;
        }

        displayCheckoutItems();
        updateTotals();
    } catch (error) {
        console.error('Error:', error);
        showError('Error al cargar los datos del checkout');
    }
}

// Mostrar items del checkout
function displayCheckoutItems() {
    const container = document.getElementById('checkout-items');
    container.innerHTML = cart.map(item => `
        <div class="flex items-center justify-between">
            <div class="flex items-center">
                <img src="${item.image}" alt="${item.name}" class="w-12 h-12 object-cover rounded">
                <div class="ml-4">
                    <h4 class="text-sm font-medium">${item.name}</h4>
                    <p class="text-sm text-gray-500">Cantidad: ${item.quantity}</p>
                </div>
            </div>
            <span class="text-sm font-medium">${formatPrice(item.price * item.quantity)}</span>
        </div>
    `).join('');
}

// Actualizar totales
function updateTotals() {
    const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const shipping = 99; // Costo fijo de envío
    const tax = subtotal * 0.16; // IVA 16%
    const total = subtotal + shipping + tax;

    document.getElementById('checkout-subtotal').textContent = formatPrice(subtotal);
    document.getElementById('checkout-shipping').textContent = formatPrice(shipping);
    document.getElementById('checkout-tax').textContent = formatPrice(tax);
    document.getElementById('checkout-total').textContent = formatPrice(total);
}

// Manejar selección de método de pago
document.querySelectorAll('.payment-method').forEach(method => {
    method.addEventListener('click', function() {
        // Remover selección previa
        document.querySelectorAll('.payment-method').forEach(m => m.classList.remove('selected'));
        // Agregar selección al método actual
        this.classList.add('selected');
        
        // Actualizar método seleccionado
        selectedPaymentMethod = this.querySelector('span').textContent.toLowerCase();
        
        // Mostrar/ocultar formulario de tarjeta
        const cardForm = document.getElementById('card-form');
        cardForm.style.display = selectedPaymentMethod === 'tarjeta de crédito' ? 'block' : 'none';
    });
});

// Formatear número de tarjeta
document.getElementById('card-number').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    value = value.replace(/(\d{4})/g, '$1 ').trim();
    e.target.value = value;
});

// Formatear fecha de expiración
document.getElementById('card-expiry').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.slice(0,2) + '/' + value.slice(2);
    }
    e.target.value = value;
});

// Formatear CVV
document.getElementById('card-cvv').addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    e.target.value = value;
});

// Procesar pago
async function processPayment() {
    try {
        // Validar formulario
        const nombre = document.getElementById('nombre').value;
        const apellidos = document.getElementById('apellidos').value;
        const direccion = document.getElementById('direccion').value;
        const ciudad = document.getElementById('ciudad').value;
        const cp = document.getElementById('cp').value;

        if (!nombre || !apellidos || !direccion || !ciudad || !cp) {
            showError('Por favor completa todos los campos de envío');
            return;
        }

        if (selectedPaymentMethod === 'tarjeta de crédito') {
            const cardNumber = document.getElementById('card-number').value;
            const cardExpiry = document.getElementById('card-expiry').value;
            const cardCvv = document.getElementById('card-cvv').value;

            if (!cardNumber || !cardExpiry || !cardCvv) {
                showError('Por favor completa todos los campos de la tarjeta');
                return;
            }
        }

        // Aquí iría la integración con el sistema de pagos real
        showSuccess('¡Pago procesado con éxito!');
        
        // Limpiar carrito y redirigir a confirmación
        const token = localStorage.getItem('token');
        await fetch('/api/cart', {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        window.location.replace('/confirmacion');
    } catch (error) {
        console.error('Error:', error);
        showError('Error al procesar el pago');
    }
}

// Inicializar página
document.addEventListener('DOMContentLoaded', loadCheckout); 