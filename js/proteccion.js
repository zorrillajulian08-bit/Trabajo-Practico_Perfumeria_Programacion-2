
import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


onAuthStateChanged(auth, (usuario) => {

    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    const cerrarSesion = document.getElementById("cerrar-sesion");

    if (cerrarSesion) {
        cerrarSesion.hidden = false;
    }

});


const cerrarSesion = document.getElementById("cerrar-sesion");

if (cerrarSesion) {

    cerrarSesion.addEventListener("click", async () => {

        try {

            await signOut(auth);

            window.location.href = "login.html";

        } catch (error) {

            console.error("Error al cerrar sesión:", error);

        }

    });

}
