const CLAVE_CARRITO = "carritoMay";

const contenedor = document.getElementById("productos-carrito");
const subtotalElemento = document.getElementById("subtotal");
const totalElemento = document.getElementById("total");
const botonVaciar = document.getElementById("vaciar-carrito");
const botonConfirmar = document.getElementById("confirmar-pedido");

// Obtener productos guardados
function obtenerCarrito() {
    return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
}

// Guardar productos
function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

// Formatear precios argentinos
function formatoPrecio(precio) {
    return "$" + precio.toLocaleString("es-AR");
}

// Mostrar productos
function mostrarCarrito() {
    const carrito = obtenerCarrito();

    contenedor.replaceChildren();

    if (carrito.length === 0) {
        const vacio = document.createElement("div");
        vacio.className = "carrito-vacio";

        const titulo = document.createElement("h2");
        titulo.textContent = "Tu carrito está vacío";

        const mensaje = document.createElement("p");
        mensaje.textContent = "Todavía no agregaste ningún perfume.";

        const enlace = document.createElement("a");
        enlace.href = "index.html#catalogo";
        enlace.className = "boton-volver";
        enlace.textContent = "Explorar perfumes";

        vacio.append(titulo, mensaje, enlace);
        contenedor.appendChild(vacio);

        actualizarTotal([]);
        botonConfirmar.disabled = true;
        botonVaciar.disabled = true;

        return;
    }

    botonConfirmar.disabled = false;
    botonVaciar.disabled = false;

    carrito.forEach(function (producto) {
        const tarjeta = document.createElement("article");
        tarjeta.className = "producto-carrito";

        // Imagen
        const imagen = document.createElement("img");
        imagen.className = "imagen-carrito";
        imagen.src = "/" + producto.imagen;
        imagen.alt = producto.nombre;
        imagen.loading = "eager";

        imagen.onerror = function () {
            console.error("No se pudo cargar la imagen:", imagen.src);
        };

        // Información
        const informacion = document.createElement("div");
        informacion.className = "info-producto";

        const nombre = document.createElement("h3");
        nombre.textContent = producto.nombre;

        const marca = document.createElement("p");
        marca.className = "marca-producto";
        marca.textContent = producto.marca;

        const precio = document.createElement("p");
        precio.className = "precio-unitario";
        precio.textContent = formatoPrecio(producto.precio);

        // Controles de cantidad
        const controles = document.createElement("div");
        controles.className = "controles-cantidad";

        const disminuir = document.createElement("button");
        disminuir.type = "button";
        disminuir.textContent = "−";
        disminuir.setAttribute("aria-label", "Disminuir cantidad");

        const cantidad = document.createElement("span");
        cantidad.className = "cantidad";
        cantidad.textContent = producto.cantidad;

        const aumentar = document.createElement("button");
        aumentar.type = "button";
        aumentar.textContent = "+";
        aumentar.setAttribute("aria-label", "Aumentar cantidad");

        disminuir.addEventListener("click", function () {
            cambiarCantidad(producto.nombre, -1);
        });

        aumentar.addEventListener("click", function () {
            cambiarCantidad(producto.nombre, 1);
        });

        controles.append(disminuir, cantidad, aumentar);

        // Eliminar producto
        const eliminar = document.createElement("button");
        eliminar.type = "button";
        eliminar.className = "boton-eliminar";
        eliminar.textContent = "Eliminar producto";

        eliminar.addEventListener("click", function () {
            eliminarProducto(producto.nombre);
        });

        informacion.append(
            nombre,
            marca,
            precio,
            controles,
            eliminar
        );

        // Subtotal del producto
        const subtotalProducto = document.createElement("div");
        subtotalProducto.className = "subtotal-producto";
        subtotalProducto.textContent = formatoPrecio(
            producto.precio * producto.cantidad
        );

        tarjeta.append(imagen, informacion, subtotalProducto);
        contenedor.appendChild(tarjeta);
    });

    actualizarTotal(carrito);
}

// Actualizar subtotal y total
function actualizarTotal(carrito) {
    const total = carrito.reduce(function (suma, producto) {
        return suma + producto.precio * producto.cantidad;
    }, 0);

    subtotalElemento.textContent = formatoPrecio(total);
    totalElemento.textContent = formatoPrecio(total);
}

// Cambiar cantidad
function cambiarCantidad(nombre, cambio) {
    const carrito = obtenerCarrito();

    const producto = carrito.find(function (p) {
        return p.nombre === nombre;
    });

    if (!producto) return;

    producto.cantidad += cambio;

    if (producto.cantidad <= 0) {
        eliminarProducto(nombre);
        return;
    }

    guardarCarrito(carrito);
    mostrarCarrito();
}

// Eliminar producto
function eliminarProducto(nombre) {
    let carrito = obtenerCarrito();

    carrito = carrito.filter(function (producto) {
        return producto.nombre !== nombre;
    });

    guardarCarrito(carrito);
    mostrarCarrito();
}

// Vaciar todo el carrito con SweetAlert
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
    }).then(function (resultado) {

        if (resultado.isConfirmed) {
            guardarCarrito([]);
            mostrarCarrito();

            Swal.fire({
                title: "Carrito vacío",
                text: "Eliminamos todos los productos.",
                icon: "success",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#493524",
                background: "#faf7f1",
                color: "#33271d"
            });
        }
    });
}

// Confirmar pedido
function confirmarPedido() {
    const carrito = obtenerCarrito();

    if (carrito.length === 0) return;

    const total = carrito.reduce(function (suma, producto) {
        return suma + producto.precio * producto.cantidad;
    }, 0);

    let resumen = "";

    carrito.forEach(function (producto) {
        resumen += producto.nombre +
            " x " + producto.cantidad +
            " — " + formatoPrecio(producto.precio * producto.cantidad) +
            "\n";
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
    }).then(function (resultado) {

        if (resultado.isConfirmed) {

            guardarCarrito([]);
            mostrarCarrito();

            Swal.fire({
                title: "¡Pedido confirmado!",
                text: "Gracias por elegir Emprendimiento May. Tu pedido quedó confirmado en esta demostración.",
                icon: "success",
                confirmButtonText: "Aceptar",
                confirmButtonColor: "#493524",
                background: "#faf7f1",
                color: "#33271d"
            });
        }
    });
}

// Eventos
botonVaciar.addEventListener("click", vaciarCarrito);
botonConfirmar.addEventListener("click", confirmarPedido);

// Cargar carrito
mostrarCarrito();