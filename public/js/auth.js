// Funciones de utilidad
function showError(message) {
    alert(message);
}

function showSuccess(message) {
    alert(message);
}

function redirectToHome() {
    window.location.replace('/');
}

function redirectToAdmin() {
    window.location.replace('/admin');
}

// Manejar el registro
const registerForm = document.getElementById('registerForm');
if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const name = document.getElementById('name').value;
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            showError('Las contraseñas no coinciden');
            return;
        }

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name,
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en el registro');
            }

            localStorage.setItem('token', data.token);
            showSuccess('Registro exitoso');
            redirectToHome();
        } catch (error) {
            showError(error.message);
        }
    });
}

// Manejar el inicio de sesión
const loginForm = document.getElementById('loginForm');
if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email,
                    password
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.message || 'Error en el inicio de sesión');
            }

            localStorage.setItem('token', data.token);
            showSuccess('Inicio de sesión exitoso');
            redirectToHome();
        } catch (error) {
            showError(error.message);
        }
    });
}

// Verificar si el usuario está autenticado al cargar la página
document.addEventListener('DOMContentLoaded', async () => {
    const token = localStorage.getItem('token');
    if (token) {
        try {
            const response = await fetch('/api/auth/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();

            if (response.ok) {
                // Si estamos en la página de login o registro y el usuario está autenticado
                if (window.location.pathname === '/login' || window.location.pathname === '/registro') {
                    redirectToHome();
                }
            } else {
                localStorage.removeItem('token');
            }
        } catch (error) {
            console.error('Error al verificar autenticación:', error);
            localStorage.removeItem('token');
        }
    }
}); 