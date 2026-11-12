
import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    deleteUser
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================

const API = "https://localhost:7177/api/Perfumeria";


// ==========================================
// ELEMENTOS DEL HTML
// ==========================================

const formularioRegistro = document.getElementById("form-registro");
const formularioLogin = document.getElementById("form-login");

const inputNombre = document.getElementById("nombre");
const inputEmail = document.getElementById("email");
const inputPassword = document.getElementById("password");
const inputConfirmarPassword = document.getElementById("confirmar-password");

const mensajeRegistro = document.getElementById("mensaje-registro");
const mensajeLogin = document.getElementById("mensaje-login");

const rolLogin = document.getElementById("rol-login");
const botonesRol = document.querySelectorAll(".boton-rol");


// ==========================================
// FUNCIONES AUXILIARES
// ==========================================

function mostrarMensaje(elemento, mensaje, tipo = "error") {
    if (!elemento) return;

    elemento.textContent = mensaje;
    elemento.className = `mensaje ${tipo}`;
}

function limpiarMensaje(elemento) {
    if (!elemento) return;

    elemento.textContent = "";
    elemento.className = "mensaje";
}

async function obtenerMensajeRespuesta(response) {
    const texto = await response.text();

    if (!texto) {
        return `Error HTTP ${response.status}`;
    }

    try {
        const datos = JSON.parse(texto);

        if (typeof datos === "string") {
            return datos;
        }

        return datos.message ||
            datos.title ||
            datos.detail ||
            texto;
    } catch {
        return texto;
    }
}


// ==========================================
// SELECCIÓN DE ROL EN EL LOGIN
// ==========================================

if (botonesRol.length > 0) {

    botonesRol.forEach(boton => {

        boton.addEventListener("click", () => {

            botonesRol.forEach(b => {
                b.classList.remove("seleccionado");
            });

            boton.classList.add("seleccionado");

            if (rolLogin) {
                rolLogin.value = boton.dataset.rol;
            }

            limpiarMensaje(mensajeLogin);
        });
    });

}


// ==========================================
// REGISTRO DE USUARIOS
// ==========================================

if (formularioRegistro) {

    formularioRegistro.addEventListener("submit", async (e) => {

        e.preventDefault();

        limpiarMensaje(mensajeRegistro);

        const nombre = inputNombre.value.trim();
        const email = inputEmail.value.trim();
        const password = inputPassword.value;
        const confirmarPassword = inputConfirmarPassword.value;

        // VALIDACIONES

        if (!nombre || !email || !password || !confirmarPassword) {
            mostrarMensaje(
                mensajeRegistro,
                "Completá todos los campos."
            );
            return;
        }

        if (nombre.length > 100) {
            mostrarMensaje(
                mensajeRegistro,
                "El nombre no puede superar los 100 caracteres."
            );
            return;
        }

        if (email.length > 150) {
            mostrarMensaje(
                mensajeRegistro,
                "El email es demasiado largo."
            );
            return;
        }

        if (password !== confirmarPassword) {
            mostrarMensaje(
                mensajeRegistro,
                "Las contraseñas no coinciden."
            );
            return;
        }

        if (password.length < 6) {
            mostrarMensaje(
                mensajeRegistro,
                "La contraseña debe tener al menos 6 caracteres."
            );
            return;
        }

        let usuarioFirebase = null;

        try {

            // CREAR USUARIO EN FIREBASE

            const credenciales =
                await createUserWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            usuarioFirebase = credenciales.user;

            // OBTENER TOKEN DE FIREBASE

            const token = await usuarioFirebase.getIdToken();

            // PREPARAR DATOS PARA SQL SERVER

            const nuevoUsuario = {
                nombre: nombre,
                email: email
            };

            // REGISTRAR USUARIO EN LA API

            const response = await fetch(`${API}/usuarios`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`
                },
                body: JSON.stringify(nuevoUsuario)
            });

            if (!response.ok) {

                const mensaje = await obtenerMensajeRespuesta(response);

                // ELIMINAR CUENTA DE FIREBASE SI FALLA SQL

                try {
                    await deleteUser(usuarioFirebase);
                } catch (error) {
                    console.error(
                        "No se pudo eliminar el usuario de Firebase:",
                        error
                    );

                    await signOut(auth);
                }

                throw new Error(mensaje);
            }

            // CERRAR SESIÓN DESPUÉS DEL REGISTRO

            await signOut(auth);

            mostrarMensaje(
                mensajeRegistro,
                "¡Cuenta creada correctamente! Ya podés iniciar sesión.",
                "exito"
            );

            formularioRegistro.reset();

        } catch (error) {

            console.error("ERROR COMPLETO AL REGISTRAR:", error);

            let mensaje = "No se pudo completar el registro.";

            if (error.code === "auth/email-already-in-use") {
                mensaje = "Este email ya está registrado.";
            }
            else if (error.code === "auth/invalid-email") {
                mensaje = "El email no es válido.";
            }
            else if (error.code === "auth/weak-password") {
                mensaje = "La contraseña es demasiado débil.";
            }
            else if (
                error.message &&
                error.message.includes("Failed to fetch")
            ) {
                mensaje = "No se pudo conectar con el servidor.";
            }
            else if (error.message) {
                mensaje = error.message;
            }

            mostrarMensaje(mensajeRegistro, mensaje);
        }

    });

}


// ==========================================
// INICIO DE SESIÓN
// ==========================================

if (formularioLogin) {

    formularioLogin.addEventListener("submit", async (e) => {

        e.preventDefault();

        limpiarMensaje(mensajeLogin);

        const email = inputEmail.value.trim();
        const password = inputPassword.value;

        const rolSeleccionado =
            rolLogin?.value?.toLowerCase();

        if (!email || !password) {
            mostrarMensaje(
                mensajeLogin,
                "Completá el email y la contraseña."
            );
            return;
        }

        if (
            rolSeleccionado !== "cliente" &&
            rolSeleccionado !== "empleado"
        ) {
            mostrarMensaje(
                mensajeLogin,
                "Seleccioná si querés ingresar como cliente o empleado."
            );
            return;
        }

        let usuarioFirebase = null;

        try {

            // INICIAR SESIÓN EN FIREBASE

            const credenciales =
                await signInWithEmailAndPassword(
                    auth,
                    email,
                    password
                );

            usuarioFirebase = credenciales.user;

            // CONSULTAR USUARIOS EN SQL SERVER

            const response = await fetch(`${API}/usuarios`);

            if (!response.ok) {

                const mensaje = await obtenerMensajeRespuesta(response);

                throw new Error(
                    `Error al consultar SQL Server. Código HTTP: ${response.status}. ${mensaje}`
                );
            }

            const usuarios = await response.json();

            // BUSCAR EL USUARIO MEDIANTE SU UID DE FIREBASE

            const usuarioSQL = usuarios.find(
                usuario =>
                    usuario.firebaseUid === usuarioFirebase.uid
            );

            if (!usuarioSQL) {
                throw new Error(
                    "No se encontró el usuario en la base de datos."
                );
            }

            const rolUsuario = usuarioSQL.rol?.toLowerCase();

            // VALIDAR ROL SELECCIONADO

            if (rolSeleccionado === "empleado") {

                if (rolUsuario !== "empleado") {
                    throw new Error(
                        "No tenés permisos para ingresar como empleado."
                    );
                }

                window.location.href = "empleado.html";
                return;
            }

            if (rolSeleccionado === "cliente") {

                if (rolUsuario !== "cliente") {
                    throw new Error(
                        "Tu cuenta no tiene permisos para ingresar como cliente."
                    );
                }

                window.location.href = "index.html";
                return;
            }

        } catch (error) {

            console.error(
                "ERROR COMPLETO AL INICIAR SESIÓN:",
                error
            );

            console.error("Código:", error.code);
            console.error("Mensaje:", error.message);

            // CERRAR SESIÓN SI EL LOGIN NO SE COMPLETÓ

            if (usuarioFirebase) {
                try {
                    await signOut(auth);
                } catch (errorSignOut) {
                    console.error(
                        "Error al cerrar sesión:",
                        errorSignOut
                    );
                }
            }

            let mensaje = "No se pudo iniciar sesión.";

            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/wrong-password" ||
                error.code === "auth/user-not-found"
            ) {
                mensaje = "El email o la contraseña son incorrectos.";
            }
            else if (error.code === "auth/invalid-email") {
                mensaje = "El email no es válido.";
            }
            else if (
                error.message &&
                error.message.includes("Failed to fetch")
            ) {
                mensaje = "No se pudo conectar con el servidor.";
            }
            else if (error.message) {
                mensaje = error.message;
            }

            mostrarMensaje(mensajeLogin, mensaje);
        }

    });

}
