import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// SELECTOR CLIENTE / EMPLEADO

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

// INICIO DE SESIÓN

const formulario = document.getElementById("form-login");

if (formulario) {

    formulario.addEventListener("submit", async (e) => {

        e.preventDefault();

        const email = document.getElementById("email").value.trim();
        const password = document.getElementById("password").value;
        const rolSeleccionado = inputRol.value;

        const mensaje = document.getElementById("mensaje-login");
        const botonIngresar = formulario.querySelector(".boton-login");

        mensaje.textContent = "";
        botonIngresar.disabled = true;

        try {

            // Comprobar correo y contraseña
            const credenciales = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            const usuario = credenciales.user;

            // Buscar el usuario en Firestore
            const referenciaUsuario = doc(db, "usuarios", usuario.uid);
            const documentoUsuario = await getDoc(referenciaUsuario);

            if (!documentoUsuario.exists()) {

                await signOut(auth);

                mensaje.textContent = "No encontramos tu perfil en la base de datos.";
                return;
            }

            const datosUsuario = documentoUsuario.data();
            const rolReal = datosUsuario.rol;

            // Comprobar si el rol seleccionado coincide con el registrado
            if (rolSeleccionado !== rolReal) {

                await signOut(auth);

                mensaje.textContent = rolSeleccionado === "empleado"
                    ? "Esta cuenta no está autorizada como empleado."
                    : "Esta cuenta está registrada como empleado.";

                return;
            }

            // Redireccionar según el rol
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