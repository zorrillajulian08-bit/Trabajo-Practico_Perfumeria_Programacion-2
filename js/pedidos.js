// ========================================
// CONFIGURACIÓN
// ========================================
const CLAVE_PEDIDOS = "pedidosMay";
const contenedorPedidos = document.getElementById("lista-pedidos");

// ========================================
// FUNCIONES AUXILIARES
// ========================================
function obtenerPedidos() {
    return JSON.parse(localStorage.getItem(CLAVE_PEDIDOS)) || [];
}

function guardarPedidos(pedidos) {
    localStorage.setItem(CLAVE_PEDIDOS, JSON.stringify(pedidos));
}

function formatoPrecio(precio) {
    return "$" + precio.toLocaleString("es-AR");
}

// ========================================
// ELIMINAR PEDIDO (Con confirmación)
// ========================================
function eliminarPedido(idPedido) {
    Swal.fire({
        title: "¿Eliminar pedido?",
        text: "Esta acción borrará el pedido de tu historial. No se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Volver atrás",
        confirmButtonColor: "#a46e60", // Color rojizo para advertir
        cancelButtonColor: "#927653",
        background: "#faf7f1",
        color: "#33271d"
    }).then(function (resultado) {
        if (resultado.isConfirmed) {
            let pedidos = obtenerPedidos();
            
            // Filtramos la lista para sacar el pedido que queremos borrar
            pedidos = pedidos.filter(p => p.id !== idPedido);
            guardarPedidos(pedidos);
            
            // Volvemos a dibujar la lista (ya sin el pedido)
            mostrarPedidos();

            Swal.fire({
                title: "Pedido eliminado",
                text: "El pedido fue dado de baja correctamente.",
                icon: "success",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#493524",
                background: "#faf7f1",
                color: "#33271d"
            });
        }
    });
}

// ========================================
// MOSTRAR PEDIDOS
// ========================================
function mostrarPedidos() {
    const pedidos = obtenerPedidos();

    if (!contenedorPedidos) return;

    contenedorPedidos.replaceChildren();

    if (pedidos.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "pedidos-vacios";

        const icono = document.createElement("div");
        icono.className = "icono-vacio";
        icono.textContent = "🛍️";

        const titulo = document.createElement("h2");
        titulo.textContent = "Todavía no tenés pedidos";

        const mensaje = document.createElement("p");
        mensaje.textContent = "Cuando confirmes tu primera compra, aparecerá acá.";

        const enlace = document.createElement("a");
        enlace.href = "index.html#catalogo";
        enlace.className = "boton-volver";
        enlace.textContent = "Explorar perfumes";

        vacio.append(icono, titulo, mensaje, enlace);
        contenedorPedidos.appendChild(vacio);
        return;
    }

    // Recorremos los pedidos (del más nuevo al más viejo)
    pedidos.slice().reverse().forEach(function (pedido) {
        
        // --- TARJETA PRINCIPAL ---
        const tarjeta = document.createElement("article");
        tarjeta.className = "tarjeta-pedido";

        // --- CABECERA ---
        const cabecera = document.createElement("div");
        cabecera.className = "cabecera-pedido";

        const datos = document.createElement("div");
        datos.className = "datos-pedido";

        const numero = document.createElement("span");
        numero.className = "numero-pedido";
        numero.textContent = "Pedido #" + pedido.id;

        const fecha = document.createElement("span");
        fecha.className = "fecha-pedido";
        fecha.textContent = pedido.fecha;

        datos.append(numero, fecha);

        const estado = document.createElement("span");
        estado.className = "estado-pedido " + (pedido.claseEstado || "estado-camino");
        estado.textContent = pedido.estado || "En camino";

        cabecera.append(datos, estado);

        // --- PRODUCTOS ---
        const productosContenedor = document.createElement("div");
        productosContenedor.className = "productos-pedido";

        pedido.productos.forEach(function (producto) {
            const item = document.createElement("div");
            item.className = "item-pedido";

            const imagen = document.createElement("img");
            imagen.className = "imagen-pedido";
            imagen.src = producto.imagen.startsWith("/") ? producto.imagen : "/" + producto.imagen;
            imagen.alt = producto.nombre;
            
            const info = document.createElement("div");
            info.className = "info-item";

            const marca = document.createElement("p");
            marca.className = "marca-producto";
            marca.textContent = producto.marca;

            const nombre = document.createElement("h3");
            nombre.textContent = producto.nombre;

            const cantidad = document.createElement("p");
            cantidad.className = "detalle-cantidad";
            cantidad.textContent = "Cantidad: " + producto.cantidad;

            info.append(marca, nombre, cantidad);

            const subtotal = document.createElement("span");
            subtotal.className = "subtotal-item";
            subtotal.textContent = formatoPrecio(producto.precio * producto.cantidad);

            item.append(imagen, info, subtotal);
            productosContenedor.appendChild(item);
        });

        // --- PIE DEL PEDIDO ---
        const pie = document.createElement("div");
        pie.className = "pie-pedido";

        const totalContenedor = document.createElement("div");
        totalContenedor.className = "total-pedido";

        const textoTotal = document.createElement("span");
        textoTotal.textContent = "Total del pedido";

        const montoTotal = document.createElement("strong");
        montoTotal.textContent = pedido.total; 

        totalContenedor.append(textoTotal, montoTotal);

        const acciones = document.createElement("div");
        acciones.className = "acciones-pedido";

        // Botón "Eliminar pedido"
        const botonEliminar = document.createElement("button");
        botonEliminar.className = "boton-secundario"; 
        botonEliminar.textContent = "Cancelar pedido";
        botonEliminar.style.color = "#a46e60"; 
        botonEliminar.style.border = "1px solid #e8dcd8";
        
        botonEliminar.addEventListener("click", function () {
            eliminarPedido(pedido.id);
        });

        // Botón "Volver a comprar"
        const botonVolver = document.createElement("a");
        botonVolver.href = "index.html#catalogo";
        botonVolver.className = "boton-volver";
        botonVolver.textContent = "Volver a comprar";

        acciones.append(botonEliminar, botonVolver);

        pie.append(totalContenedor, acciones);

        // --- UNIR TODO ---
        tarjeta.append(cabecera, productosContenedor, pie);
        contenedorPedidos.appendChild(tarjeta);
    });
}

// ========================================
// INICIALIZAR
// ========================================
mostrarPedidos();