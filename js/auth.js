
import { auth } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    deleteUser
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


// DIRECCIÓN DE LA API

const API = "https://localhost:7177/api/Perfumeria";


// ==========================================
// SELECTOR CLIENTE / EMPLEADO
// ==========================================

const botonesRol = document.querySelectorAll(".boton-rol");
const inputRol = document.getElementById("rol-login");

botonesRol.forEach(boton => {

    boton.addEventListener("click", () => {

        botonesRol.forEach(b => {
            b.classList.remove("seleccionado");
        });

        boton.classList.add("seleccionado");

        inputRol.value = boton.dataset.rol;

    });

});


// ==========================================
// REGISTRO DE USUARIOS
// ==========================================

const formularioRegistro = document.getElementById("form-registro");

if (formularioRegistro) {

    formularioRegistro.addEventListener("submit", async (e) => {

        e.preventDefault();

        const nombre = document.getElementById("nombre").value.trim();
        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const confirmarPassword = document.getElementById("confirmar-password").value;

        const mensaje = document.getElementById("mensaje-registro");
        const botonRegistrar = formularioRegistro.querySelector(".boton-login");

        mensaje.textContent = "";
        botonRegistrar.disabled = true;

        let usuarioFirebase = null;

        try {

            // VALIDACIONES

            if (!nombre || !email || !password || !confirmarPassword) {
                mensaje.textContent = "Completá todos los campos.";
                return;
            }

            if (password.length < 6) {
                mensaje.textContent = "La contraseña debe tener al menos 6 caracteres.";
                return;
            }

            if (password !== confirmarPassword) {
                mensaje.textContent = "Las contraseñas no coinciden.";
                return;
            }

            // 1. CREAR CUENTA EN FIREBASE

            const credenciales = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            usuarioFirebase = credenciales.user;

            // 2. PREPARAR DATOS PARA SQL SERVER

            const nuevoUsuario = {
                firebaseUid: usuarioFirebase.uid,
                nombre: nombre,
                email: email
            };

            // 3. ENVIAR USUARIO A LA API

            const respuesta = await fetch(`${API}/usuarios`, {

                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(nuevoUsuario)

            });

            if (!respuesta.ok) {
                throw new Error("No se pudo guardar el usuario en SQL Server.");
            }

            // 4. CERRAR SESIÓN DE FIREBASE

            await signOut(auth);

            formularioRegistro.reset();

            mensaje.textContent = "¡Cuenta creada correctamente! Ya podés iniciar sesión.";

        } catch (error) {

            console.error(error);

            // Si Firebase creó la cuenta pero SQL falló,
            // intentamos eliminar la cuenta recién creada.

            if (usuarioFirebase) {

                try {
                    await deleteUser(usuarioFirebase);
                } catch (errorEliminar) {
                    console.error("No se pudo eliminar la cuenta de Firebase:", errorEliminar);
                    await signOut(auth);
                }

            }

            if (error.code === "auth/email-already-in-use") {

                mensaje.textContent = "Ese correo ya está registrado.";

            } else if (error.code === "auth/invalid-email") {

                mensaje.textContent = "El correo electrónico no es válido.";

            } else if (error.code === "auth/weak-password") {

                mensaje.textContent = "La contraseña es demasiado débil.";

            } else {

                mensaje.textContent = "No se pudo completar el registro. Intentá nuevamente.";

            }

        } finally {

            botonRegistrar.disabled = false;

        }

    });

}


// ==========================================
// INICIO DE SESIÓN
// ==========================================

const formulario = document.getElementById("form-login");

if (formulario) {

    formulario.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const rolSeleccionado = inputRol?.value;

        const mensaje = document.getElementById("mensaje-login");
        const botonIngresar = formulario.querySelector(".boton-login");

        mensaje.textContent = "";
        botonIngresar.disabled = true;

        try {

            if (!rolSeleccionado) {
                mensaje.textContent = "Seleccioná Cliente o Empleado.";
                return;
            }

            // 1. COMPROBAR CORREO Y CONTRASEÑA EN FIREBASE

            const credenciales = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const usuarioFirebase = credenciales.user;

            // 2. CONSULTAR LOS USUARIOS DE SQL SERVER

            const respuesta = await fetch(`${API}/usuarios`);

            if (!respuesta.ok) {
                throw new Error("No se pudieron consultar los usuarios.");
            }

            const usuarios = await respuesta.json();

            // 3. BUSCAR EL USUARIO MEDIANTE SU FIREBASE UID

            const usuarioSQL = usuarios.find(usuario =>
                (usuario.firebaseUid || usuario.FirebaseUid) === usuarioFirebase.uid
            );

            if (!usuarioSQL) {

                await signOut(auth);

                mensaje.textContent = "No encontramos tu perfil en la base de datos.";

                return;
            }

            // 4. COMPROBAR EL ROL

            const rolReal = (
                usuarioSQL.rol || usuarioSQL.Rol || ""
            ).toLowerCase();

            if (rolSeleccionado !== rolReal) {

                await signOut(auth);

                mensaje.textContent = rolSeleccionado === "empleado"
                    ? "Esta cuenta no está autorizada como empleado."
                    : "Esta cuenta está registrada como empleado.";

                return;
            }

            // 5. REDIRECCIONAR

            if (rolReal === "empleado") {

                window.location.href = "empleado.html";

            } else if (rolReal === "cliente") {

                window.location.href = "index.html";

            } else {

                await signOut(auth);

                mensaje.textContent = "El rol de esta cuenta no es válido.";

            }

        } catch (error) {

            console.error(error);

            if (
                error.code === "auth/invalid-credential" ||
                error.code === "auth/user-not-found" ||
                error.code === "auth/wrong-password"
            ) {

                mensaje.textContent = "Correo o contraseña incorrectos.";

            } else {

                mensaje.textContent = "Ocurrió un error al iniciar sesión. Intentá nuevamente.";

            }

        } finally {

            botonIngresar.disabled = false;

        }

    });

}
