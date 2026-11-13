import { auth, db } from "./firebase.js";

import {
    signInWithEmailAndPassword,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
    doc,
    getDoc
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const API = "https://localhost:7177/api/Perfumeria";

const botonesRol = document.querySelectorAll(".boton-rol");
const inputRol = document.getElementById("rol-login");

botonesRol.forEach(boton => {
    boton.addEventListener("click", () => {
        botonesRol.forEach(b => b.classList.remove("seleccionado"));
        boton.classList.add("seleccionado");
        inputRol.value = boton.dataset.rol;
    });
});

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
            // 1. Login en Firebase Auth
            const credenciales = await signInWithEmailAndPassword(auth, email, password);
            const usuario = credenciales.user;

            // ==========================================
            // ¡AQUÍ GUARDAMOS EL TOKEN REAL INMEDIATAMENTE!
            // ==========================================
            const token = await usuario.getIdToken();
            localStorage.setItem("firebaseToken", token);
            console.log("✅ Token real guardado:", token.substring(0, 20) + "...");

            // 2. Buscar en Firestore (con tolerancia)
            const referenciaUsuario = doc(db, "usuarios", usuario.uid);
            const documentoUsuario = await getDoc(referenciaUsuario);

            let rolReal = "cliente"; // Por defecto si no está en Firestore

            if (documentoUsuario.exists()) {
                const datosUsuario = documentoUsuario.data();
                rolReal = datosUsuario.rol;
            }

            // 3. Validar rol (comparando en minúsculas para evitar errores)
            if (rolSeleccionado.toLowerCase() !== String(rolReal).toLowerCase()) {
                await signOut(auth);
                mensaje.textContent = "El rol seleccionado no coincide con tu cuenta.";
                return;
            }

            // 4. CONEXIÓN CON LA API SQL (Obtener ID de SQL)
            try {
                const respuestaUsuarios = await fetch(`${API}/usuarios`);
                if (respuestaUsuarios.ok) {
                    const usuariosSQL = await respuestaUsuarios.json();
                    const usuarioEncontrado = usuariosSQL.find(u => 
                        String(u.firebaseUid).trim() === String(usuario.uid).trim()
                    );

                    if (usuarioEncontrado) {
                        localStorage.setItem("usuarioId", usuarioEncontrado.usuarioId);
                        console.log("✅ ID de SQL guardado:", usuarioEncontrado.usuarioId);
                    } else {
                        console.warn("⚠️ Usuario no encontrado en SQL. Guardando ID 1 por defecto.");
                        localStorage.setItem("usuarioId", "1"); 
                    }
                }
            } catch (errorAPI) {
                console.error("Error con la API SQL:", errorAPI);
                localStorage.setItem("usuarioId", "1"); 
            }

            // 5. Redireccionar
            if (String(rolReal).toLowerCase() === "empleado") {
                window.location.href = "empleado.html";
            } else {
                window.location.href = "index.html";
            }

        } catch (error) {
            console.error("Error en login:", error);
            mensaje.textContent = "Correo o contraseña incorrectos o error de conexión.";
        } finally {
            botonIngresar.disabled = false;
        }
    });
}