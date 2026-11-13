
import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

const API = "https://localhost:7177/api/Perfumeria";
const contenedorPedidos = document.getElementById("lista-pedidos");

// ========================================
// FUNCIONES AUXILIARES
// ========================================

function formatoPrecio(precio) {
    return "$" + Number(precio).toLocaleString("es-AR");
}

// ========================================
// MOSTRAR PEDIDOS
// ========================================

async function mostrarPedidos(usuario) {
    if (!contenedorPedidos) return;

    if (!usuario) {
        contenedorPedidos.innerHTML = `
            <div class="pedidos-vacios">
                <div class="icono-vacio">🔒</div>
                <h2>Iniciá sesión</h2>
                <p>Necesitás estar logueado para ver tus pedidos.</p>
                <a href="login.html" class="boton-volver">Ir a Login</a>
            </div>
        `;
        return;
    }

    try {
        // Obtenemos el token del usuario actualmente autenticado
        const token = await usuario.getIdToken(true);

        const respuesta = await fetch(`${API}/pedidos/mis-pedidos`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!respuesta.ok) {
            throw new Error("Error al cargar pedidos");
        }

        const pedidos = await respuesta.json();

        dibujarPedidos(pedidos);

    } catch (error) {
        console.error("Error al cargar pedidos:", error);

        contenedorPedidos.innerHTML = `
            <div class="pedidos-vacios">
                <div class="icono-vacio">⚠️</div>
                <h2>Error de conexión</h2>
                <p>No se pudieron cargar los pedidos desde el servidor.</p>
            </div>
        `;
    }
}

// ========================================
// DIBUJAR PEDIDOS
// ========================================

function dibujarPedidos(pedidos) {
    contenedorPedidos.replaceChildren();

    if (!Array.isArray(pedidos) || pedidos.length === 0) {
        contenedorPedidos.innerHTML = `
            <div class="pedidos-vacios">
                <div class="icono-vacio">🛍️</div>
                <h2>Todavía no tenés pedidos</h2>
                <p>Cuando confirmes tu primera compra, aparecerá acá.</p>
                <a href="index.html#catalogo" class="boton-volver">Explorar perfumes</a>
            </div>
        `;
        return;
    }

    pedidos.forEach(function (pedido) {
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-pedido";

        const estado = String(
            pedido.estado ?? pedido.Estado ?? "Pendiente"
        ).trim();

        const estadoClase = `estado-${estado.toLowerCase()}`;

        const fechaFormateada = new Date(pedido.fecha).toLocaleDateString("es-AR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        });

        // ========================================
        // PRODUCTOS DEL PEDIDO
        // ========================================

        let productosHTML = "";

        const listaDetalles = pedido.detallePedidos || pedido.detalles || [];

        if (listaDetalles.length > 0) {
            listaDetalles.forEach(detalle => {
                const producto = detalle.producto || detalle.Producto;

                const nombreProducto = producto?.nombre || producto?.Nombre || "Perfume";
                const marcaProducto = producto?.marca?.nombre || producto?.Marca?.Nombre || "";
                const imagenProducto = producto?.imagen || producto?.Imagen || "";

                productosHTML += `
                    <div class="item-pedido">
                        <img class="imagen-pedido" src="${imagenProducto}" alt="${nombreProducto}">

                        <div class="info-item">
                            <p class="marca-producto">${marcaProducto}</p>
                            <h3>${nombreProducto}</h3>
                            <p class="detalle-cantidad">Cantidad: ${detalle.cantidad ?? detalle.Cantidad}</p>
                        </div>

                        <span class="subtotal-item">
                            ${formatoPrecio(
                                (detalle.precioUnitario ?? detalle.PrecioUnitario) *
                                (detalle.cantidad ?? detalle.Cantidad)
                            )}
                        </span>
                    </div>
                `;
            });
        } else {
            productosHTML = `
                <p style="padding: 15px; color: #81776b; font-size: 12px;">
                    No hay detalles disponibles.
                </p>
            `;
        }

        // ========================================
        // BOTÓN CANCELAR
        // ========================================

        let botonCancelarHTML = "";

        if (estado.toLowerCase() !== "entregado" &&
            estado.toLowerCase() !== "cancelado") {

            botonCancelarHTML = `
                <button
                    class="boton-secundario boton-cancelar-pedido"
                    data-id="${pedido.pedidoId ?? pedido.PedidoId}"
                    style="color: #a46e60; border: 1px solid #e8dcd8;">
                    Cancelar pedido
                </button>
            `;
        }

        // ========================================
        // TARJETA COMPLETA
        // ========================================

        tarjeta.innerHTML = `
            <div class="cabecera-pedido">
                <div class="datos-pedido">
                    <span class="numero-pedido">
                        Pedido #${pedido.pedidoId ?? pedido.PedidoId}
                    </span>

                    <span class="fecha-pedido">
                        ${fechaFormateada}
                    </span>
                </div>

                <span class="estado-pedido ${estadoClase}">
                    ${estado}
                </span>
            </div>

            <div class="productos-pedido">
                ${productosHTML}
            </div>

            <div class="pie-pedido">
                <div class="total-pedido">
                    <span>Total del pedido</span>
                    <strong>${formatoPrecio(pedido.total ?? pedido.Total)}</strong>
                </div>

                <div class="acciones-pedido">
                    ${botonCancelarHTML}

                    <a href="index.html#catalogo" class="boton-volver">
                        Volver a comprar
                    </a>
                </div>
            </div>
        `;

        contenedorPedidos.appendChild(tarjeta);
    });

    // ========================================
    // EVENTOS DE LOS BOTONES
    // ========================================

    document.querySelectorAll(".boton-cancelar-pedido").forEach(boton => {
        boton.addEventListener("click", () => {
            const idPedido = boton.getAttribute("data-id");
            cancelarPedido(idPedido);
        });
    });
}

// ========================================
// CANCELAR PEDIDO
// ========================================

function cancelarPedido(idPedido) {
    Swal.fire({
        title: "¿Cancelar pedido?",
        text: "Esta acción eliminará el pedido de tu historial. No se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, cancelar",
        cancelButtonText: "Volver atrás",
        confirmButtonColor: "#a46e60",
        cancelButtonColor: "#927653",
        background: "#faf7f1",
        color: "#33271d"
    }).then(async (resultado) => {

        if (resultado.isConfirmed) {
            try {
                const usuario = auth.currentUser;

                if (!usuario) {
                    throw new Error("No hay un usuario autenticado.");
                }

                const token = await usuario.getIdToken(true);

                const respuesta = await fetch(`${API}/pedidos/${idPedido}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!respuesta.ok) {
                    throw new Error("El servidor no permitió eliminar el pedido.");
                }

                await Swal.fire({
                    title: "Pedido cancelado",
                    text: "El pedido fue dado de baja correctamente.",
                    icon: "success",
                    confirmButtonColor: "#493524",
                    background: "#faf7f1",
                    color: "#33271d"
                });

                mostrarPedidos(usuario);

            } catch (error) {
                console.error("Error al cancelar:", error);

                Swal.fire({
                    title: "No se pudo cancelar",
                    text: "Hubo un error en el servidor al intentar cancelar el pedido.",
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
// INICIALIZAR FIREBASE
// ========================================

onAuthStateChanged(auth, (usuario) => {
    mostrarPedidos(usuario);
});
