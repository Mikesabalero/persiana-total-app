// ============================================================
// auth.js — Firebase Authentication + gestión de roles
// ============================================================

import { firebaseConfig, USER_ROLES } from './config.js';
import { setCurrentUser, setCurrentRole } from './state.js';

// Firebase ya está cargado como global desde el CDN en index.html
const app = firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);

// Exportar auth para que otros módulos puedan usarlo si es necesario
export { auth };

export function loginEmail() {
    let email = document.getElementById('login-email').value;
    let pass = document.getElementById('login-pass').value;
    let errDiv = document.getElementById('login-error');
    errDiv.style.display = 'none';
    if (!email || !pass) {
        errDiv.textContent = 'Ingresá tu email y contraseña';
        errDiv.style.display = 'block';
        return;
    }
    auth.signInWithEmailAndPassword(email, pass).catch(function(error) {
        let msg = 'Error desconocido. Intentá de nuevo.';
        switch(error.code) {
            case 'auth/invalid-credential':
            case 'auth/wrong-password':
            case 'auth/user-not-found':
                msg = 'Email o contraseña incorrectos';
                break;
            case 'auth/invalid-email':
                msg = 'El email ingresado no es válido';
                break;
            case 'auth/user-disabled':
                msg = 'Esta cuenta fue deshabilitada. Contactá al administrador.';
                break;
            case 'auth/too-many-requests':
                msg = 'Demasiados intentos fallidos. Esperá unos minutos e intentá de nuevo.';
                break;
            case 'auth/network-request-failed':
                msg = 'Error de conexión. Verificá tu internet.';
                break;
        }
        errDiv.textContent = msg;
        errDiv.style.display = 'block';
    });
}

export function loginGoogle() {
    let provider = new firebase.auth.GoogleAuthProvider();
    auth.signInWithPopup(provider).catch(function(error) {
        let errDiv = document.getElementById('login-error');
        let msg = 'Error al iniciar sesión con Google. Intentá de nuevo.';
        if (error.code === 'auth/popup-closed-by-user') {
            return;
        }
        if (error.code === 'auth/network-request-failed') {
            msg = 'Error de conexión. Verificá tu internet.';
        }
        errDiv.textContent = msg;
        errDiv.style.display = 'block';
    });
}

export function logout() {
    localStorage.removeItem("persiana_uid");
    localStorage.removeItem("persiana_email");
    localStorage.removeItem("persiana_role");
    window._appInitialized = false;
    auth.signOut();
}

export function applyRolePermissions(role) {
    let tabConfig = document.querySelector('[onclick*="config"]');
    if (tabConfig) tabConfig.style.display = (role === 'admin') ? '' : 'none';

    let tabComp = document.querySelector('[onclick*="precios"]');
    if (tabComp) tabComp.style.display = (role === 'admin') ? '' : 'none';

    let tabZonas = document.querySelector('[onclick*="zonas"]');
    if (tabZonas) tabZonas.style.display = (role === 'admin') ? '' : 'none';

    if (role !== 'admin') {
        document.querySelectorAll('.hide-margin').forEach(el => el.style.display = 'none');
    }

    if (role === 'instalador') {
        let btnNuevoPres = document.querySelector('[onclick*="openNewPres"]');
        if (btnNuevoPres) btnNuevoPres.style.display = 'none';
    }
}

/**
 * Inicializa el listener de auth.
 * Recibe initApp como callback para evitar dependencia circular con router.js
 */
export function initAuth(initAppCallback) {
    auth.onAuthStateChanged(function(user) {
        if (user) {
            setCurrentUser(user);
            let role = USER_ROLES[user.uid] || null;
            setCurrentRole(role);
            if (!role) {
                if (window._appInitialized) {
                    return;
                }
                alert('Tu cuenta (' + user.email + ') no tiene permisos asignados.');
                auth.signOut();
                return;
            }
            localStorage.setItem('persiana_uid', user.uid);
            localStorage.setItem('persiana_email', user.email);
            localStorage.setItem('persiana_role', role);

            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('user-info').textContent = user.email + ' (' + role + ')';
            applyRolePermissions(role);

            if (!window._appInitialized) {
                window._appInitialized = true;
                initAppCallback();
            }
        } else {
            let savedUid = localStorage.getItem('persiana_uid');
            let savedRole = localStorage.getItem('persiana_role');
            let savedEmail = localStorage.getItem('persiana_email');

            if (savedUid && savedRole && window._appInitialized) {
                console.warn('Firebase desconectado temporalmente - sesión local activa');
                return;
            }

            if (savedUid && savedRole && !window._appInitialized) {
                setCurrentRole(savedRole);
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('user-info').textContent = savedEmail + ' (' + savedRole + ')';
                applyRolePermissions(savedRole);
                window._appInitialized = true;
                initAppCallback();
                return;
            }

            setCurrentUser(null);
            setCurrentRole(null);
            document.getElementById('login-screen').style.display = 'flex';
        }
    });
}
