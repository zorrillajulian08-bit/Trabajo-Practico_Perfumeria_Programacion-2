
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

let CLAVE_CARRITO = null;
const API = "https://localhost:7177/api/Perfumeria";

const contenedor = document.getElementById("productos-carrito");
const subtotalElemento = document.getElementById("subtotal");
const totalElemento = document.getElementById("total");
const botonVaciar = document.getElementById("vaciar-carrito");
const botonConfirmar = document.getElementById("confirmar-pedido");

// ========================================
// FUNCIONES AUXILIARES
// ========================================

function obtenerCarrito() {
    if (!CLAVE_CARRITO) return [];

    try {
        return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
    } catch (error) {
        console.error("Error al leer el carrito:", error);
        return [];
    }
}

function guardarCarrito(carrito) {
    if (!CLAVE_CARRITO) return;

    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

function formatoPrecio(precio) {
    return "$" + Number(precio).toLocaleString("es-AR");
}

// ========================================
// MOSTRAR PRODUCTOS
// ========================================

function mostrarCarrito() {
    if (!contenedor) return;

    const carrito = obtenerCarrito();
    contenedor.replaceChildren();

    if (carrito.length === 0) {
        contenedor.innerHTML = `
            <div class="carrito-vacio">
                <h2>Tu carrito está vacío</h2>
                <p>Todavía no agregaste ningún perfume.</p>
                <a href="index.html#catalogo" class="boton-volver">Explorar perfumes</a>
            </div>
        `;

        actualizarTotal([]);

        if (botonConfirmar) botonConfirmar.disabled = true;
        if (botonVaciar) botonVaciar.disabled = true;

        return;
    }

    if (botonConfirmar) botonConfirmar.disabled = false;
    if (botonVaciar) botonVaciar.disabled = false;

    carrito.forEach(function (producto) {
        const tarjeta = document.createElement("article");
        tarjeta.className = "producto-carrito";

        tarjeta.innerHTML = `
            <img class="imagen-carrito" src="${producto.imagen}" alt="${producto.nombre}">
            <div class="info-producto">
                <h3>${producto.nombre}</h3>
                <p class="marca-producto">${producto.marca}</p>
                <p class="precio-unitario">${formatoPrecio(producto.precio)}</p>
                <div class="controles-cantidad">
                    <button type="button" onclick="cambiarCantidad(${producto.productoId}, -1)">−</button>
                    <span class="cantidad">${producto.cantidad}</span>
                    <button type="button" onclick="cambiarCantidad(${producto.productoId}, 1)">+</button>
                </div>
                <button type="button" class="boton-eliminar" onclick="eliminarProducto(${producto.productoId})">Eliminar producto</button>
            </div>
            <div class="subtotal-producto">${formatoPrecio(producto.precio * producto.cantidad)}</div>
        `;

        contenedor.appendChild(tarjeta);
    });

    actualizarTotal(carrito);
}

// ========================================
// ACTUALIZAR TOTALES
// ========================================

function actualizarTotal(carrito) {
    const total = carrito.reduce(
        (suma, producto) => suma + producto.precio * producto.cantidad,
        0
    );

    if (subtotalElemento) {
        subtotalElemento.textContent = formatoPrecio(total);
    }

    if (totalElemento) {
        totalElemento.textContent = formatoPrecio(total);
    }
}

// ========================================
// CAMBIAR CANTIDAD Y ELIMINAR
// ========================================

window.cambiarCantidad = function (productoId, cambio) {
    const carrito = obtenerCarrito();

    const producto = carrito.find(
        p => Number(p.productoId) === Number(productoId)
    );

    if (!producto) return;

    producto.cantidad += cambio;

    if (producto.cantidad <= 0) {
        window.eliminarProducto(productoId);
        return;
    }

    guardarCarrito(carrito);
    mostrarCarrito();
};

window.eliminarProducto = function (productoId) {
    let carrito = obtenerCarrito();

    carrito = carrito.filter(
        p => Number(p.productoId) !== Number(productoId)
    );

    guardarCarrito(carrito);
    mostrarCarrito();
};

// ========================================
// VACIAR CARRITO
// ========================================

function vaciarCarrito() {
    const carrito = obtenerCarrito();

    if (carrito.length === 0) return;

    Swal.fire({
        title: "¿Vaciar carrito?",
        text: "Se eliminarán todos los perfumes que agregaste.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, vaciar",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#493524",
        cancelButtonColor: "#a98968",
        background: "#faf7f1",
        color: "#33271d"
    }).then((resultado) => {
        if (resultado.isConfirmed) {
            guardarCarrito([]);
            mostrarCarrito();

            Swal.fire({
                title: "Carrito vacío",
                text: "Eliminamos todos los productos.",
                icon: "success",
                confirmButtonColor: "#493524",
                background: "#faf7f1",
                color: "#33271d"
            });
        }
    });
}

// ========================================
// CONFIRMAR PEDIDO
// ========================================

async function confirmarPedido() {
    const carrito = obtenerCarrito();

    if (carrito.length === 0) return;

    const usuarioActual = auth.currentUser;

    if (!usuarioActual) {
        Swal.fire({
            title: "Iniciá sesión",
            text: "Tenés que estar logueado para confirmar tu pedido.",
            icon: "warning",
            confirmButtonColor: "#493524",
            background: "#faf7f1",
            color: "#33271d"
        });

        return;
    }

    const tokenReal = await usuarioActual.getIdToken();

    localStorage.setItem("firebaseToken", tokenReal);

    // Buscar el ID del usuario en SQL
    let usuarioIdSQL = null;

    try {
        const resUsuarios = await fetch(`${API}/usuarios`, {
            headers: {
                "Authorization": `Bearer ${tokenReal}`
            }
        });

        if (resUsuarios.ok) {
            const usuarios = await resUsuarios.json();

            const encontrado = usuarios.find(
                u => String(u.firebaseUid).trim() === String(usuarioActual.uid).trim()
            );

            if (encontrado) {
                usuarioIdSQL = encontrado.usuarioId;
            }
        }
    } catch (error) {
        console.warn("No se pudo buscar al usuario en SQL:", error);
    }

    // No utilizar un ID de respaldo que podría pertenecer a otra persona
    if (!usuarioIdSQL) {
        Swal.fire({
            title: "No se pudo identificar tu cuenta",
            text: "No encontramos tu usuario en la base de datos. Cerrá sesión e iniciá sesión nuevamente.",
            icon: "error",
            confirmButtonColor: "#493524",
            background: "#faf7f1",
            color: "#33271d"
        });

        return;
    }

    // Resumen del pedido
    const total = carrito.reduce(
        (suma, producto) => suma + producto.precio * producto.cantidad,
        0
    );

    let resumen = "";

    carrito.forEach((p) => {
        resumen += `${p.nombre} x ${p.cantidad} — ${formatoPrecio(p.precio * p.cantidad)}\n`;
    });

    Swal.fire({
        title: "Confirmar pedido",
        text: resumen + "\nTotal: " + formatoPrecio(total),
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Confirmar pedido",
        cancelButtonText: "Seguir revisando",
        confirmButtonColor: "#493524",
        cancelButtonColor: "#a98968",
        background: "#faf7f1",
        color: "#33271d"
    }).then(async (resultado) => {
        if (resultado.isConfirmed) {

            const pedidoParaAPI = {
                usuarioId: Number(usuarioIdSQL),
                detalles: carrito.map((prod) => ({
                    productoId: Number(prod.productoId),
                    cantidad: Number(prod.cantidad)
                }))
            };

            try {
                const respuesta = await fetch(`${API}/pedidos`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${tokenReal}`
                    },
                    body: JSON.stringify(pedidoParaAPI)
                });

                if (!respuesta.ok) {
                    throw new Error("Error al crear el pedido en el servidor.");
                }

                // Vaciar solamente el carrito de este usuario
                guardarCarrito([]);
                mostrarCarrito();

                Swal.fire({
                    title: "¡Pedido confirmado!",
                    text: "Tu pedido fue registrado en el sistema.",
                    icon: "success",
                    confirmButtonText: "Ver mis pedidos",
                    confirmButtonColor: "#493524",
                    background: "#faf7f1",
                    color: "#33271d"
                }).then(() => {
                    window.location.href = "pedidos.html";
                });

            } catch (error) {
                console.error(error);

                Swal.fire({
                    title: "No se pudo confirmar",
                    text: error.message || "Error de conexión con el servidor.",
                    icon: "error",
                    confirmButtonColor: "#493524",
                    background: "#faf7f1",
                    color: "#33271d"
                });
            }
        }
    });
}

// ========================================
// EVENTOS
// ========================================

if (botonVaciar) {
    botonVaciar.addEventListener("click", vaciarCarrito);
}

if (botonConfirmar) {
    botonConfirmar.addEventListener("click", confirmarPedido);
}

// ========================================
// IDENTIFICAR USUARIO Y CARGAR SU CARRITO
// ========================================

onAuthStateChanged(auth, (usuario) => {
    if (usuario) {
        CLAVE_CARRITO = `carritoMay_${usuario.uid}`;
    } else {
        CLAVE_CARRITO = null;
    }

    mostrarCarrito();
});
