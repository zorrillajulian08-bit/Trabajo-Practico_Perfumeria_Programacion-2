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
async function mostrarPedidos() {
    if (!contenedorPedidos) return;

    const usuarioId = localStorage.getItem("usuarioId");
    const token = localStorage.getItem("firebaseToken");

    if (!usuarioId || !token) {
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
        const respuesta = await fetch(`${API}/pedidos/mis-pedidos`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        });

        if (!respuesta.ok) throw new Error("Error al cargar pedidos");

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

    if (pedidos.length === 0) {
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

        const fechaFormateada = new Date(pedido.fecha).toLocaleDateString('es-AR', { 
            day: 'numeric', month: 'long', year: 'numeric' 
        });

        const estadoClase = `estado-${(pedido.estado || 'pendiente').toLowerCase()}`;

        // --- ARMAMOS LOS PRODUCTOS CON IMAGEN ---
        let productosHTML = "";
        const listaDetalles = pedido.detallePedidos || pedido.detalles || [];

        if (listaDetalles.length > 0) {
            listaDetalles.forEach(detalle => {
                const nombreProducto = detalle.producto?.nombre || "Perfume";
                const marcaProducto = detalle.producto?.marca?.nombre || "";
                // Tomamos la imagen del producto
                const imagenProducto = detalle.producto?.imagen || ""; 
                
                productosHTML += `
                    <div class="item-pedido">
                        <img class="imagen-pedido" src="${imagenProducto}" alt="${nombreProducto}">
                        <div class="info-item">
                            <p class="marca-producto">${marcaProducto}</p>
                            <h3>${nombreProducto}</h3>
                            <p class="detalle-cantidad">Cantidad: ${detalle.cantidad}</p>
                        </div>
                        <span class="subtotal-item">${formatoPrecio(detalle.precioUnitario * detalle.cantidad)}</span>
                    </div>
                `;
            });
        } else {
            productosHTML = `<p style="padding: 15px; color: #81776b; font-size: 12px;">No hay detalles disponibles.</p>`;
        }

        // --- BOTÓN CANCELAR PEDIDO ---
        // Solo mostramos el botón si el pedido no está entregado ni cancelado
        let botonCancelarHTML = "";
        if (pedido.estado.toLowerCase() !== "entregado" && pedido.estado.toLowerCase() !== "cancelado") {
            botonCancelarHTML = `
                <button class="boton-secundario boton-cancelar-pedido" data-id="${pedido.pedidoId}" style="color: #a46e60; border: 1px solid #e8dcd8;">
                    Cancelar pedido
                </button>
            `;
        }

        tarjeta.innerHTML = `
            <div class="cabecera-pedido">
                <div class="datos-pedido">
                    <span class="numero-pedido">Pedido #${pedido.pedidoId}</span>
                    <span class="fecha-pedido">${fechaFormateada}</span>
                </div>
                <span class="estado-pedido ${estadoClase}">${pedido.estado || 'Pendiente'}</span>
            </div>
            <div class="productos-pedido">
                ${productosHTML}
            </div>
            <div class="pie-pedido">
                <div class="total-pedido">
                    <span>Total del pedido</span>
                    <strong>${formatoPrecio(pedido.total)}</strong>
                </div>
                <div class="acciones-pedido">
                    ${botonCancelarHTML}
                    <a href="index.html#catalogo" class="boton-volver">Volver a comprar</a>
                </div>
            </div>
        `;

        contenedorPedidos.appendChild(tarjeta);
    });

    // Escuchamos los clics de los botones de cancelar
    document.querySelectorAll(".boton-cancelar-pedido").forEach(boton => {
        boton.addEventListener("click", (e) => {
            const idPedido = e.target.getAttribute("data-id");
            cancelarPedido(idPedido);
        });
    });
}

// ========================================
// CANCELAR PEDIDO (ELIMINAR EN LA API)
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
            const token = localStorage.getItem("firebaseToken");
            try {
                // Hacemos el DELETE a la API
                const respuesta = await fetch(`${API}/pedidos/${idPedido}`, {
                    method: "DELETE",
                    headers: {
                        "Authorization": `Bearer ${token}`
                    }
                });

                if (!respuesta.ok) {
                    throw new Error("El servidor no permitió eliminar el pedido.");
                }

                Swal.fire({
                    title: "Pedido cancelado",
                    text: "El pedido fue dado de baja correctamente.",
                    icon: "success",
                    confirmButtonColor: "#493524",
                    background: "#faf7f1",
                    color: "#33271d"
                });

                // Volvemos a dibujar la lista para que desaparezca el pedido
                mostrarPedidos();

            } catch (error) {
                console.error("Error al eliminar:", error);
                Swal.fire({
                    title: "No se pudo cancelar",
                    text: "Hubo un error en el servidor al intentar eliminar el pedido.",
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
// INICIALIZAR
// ========================================
mostrarPedidos();