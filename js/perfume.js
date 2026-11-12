
const perfumes = [
    {
        nombre: "Afnan 9PM",
        marca: "Afnan",
        precio: 65000,
        categoria: "Masculino",
        imagen: "images/9pm.jpg",
        descripcion: "Una fragancia moderna, intensa y con personalidad."
    },
    {
        nombre: "Sauvage",
        marca: "Dior",
        precio: 150000,
        categoria: "Masculino",
        imagen: "images/SauvageDior.jpg",
        descripcion: "Un aroma fresco y amaderado de estilo elegante."
    },
    {
        nombre: "Good Girl",
        marca: "Carolina Herrera",
        precio: 180000,
        categoria: "Femenino",
        imagen: "images/GoodGirl.jpg",
        descripcion: "Una fragancia sofisticada con una identidad única."
    },
    {
        nombre: "Baccarat Rouge 540",
        marca: "Maison Francis Kurkdjian",
        precio: 350000,
        categoria: "Unisex",
        imagen: "images/Baccarat.jpg",
        descripcion: "Una fragancia envolvente y elegante."
    }
];

const parametros = new URLSearchParams(window.location.search);
const nombre = parametros.get("nombre");

const perfume = perfumes.find(function (p) {
    return p.nombre.toLowerCase() === (nombre || "").trim().toLowerCase();
});

const detalle = document.getElementById("detalle-perfume");

const CLAVE_CARRITO = "carritoMay";

// ========================================
// FUNCIONES DEL CARRITO
// ========================================

function obtenerCarrito() {
    return JSON.parse(localStorage.getItem(CLAVE_CARRITO)) || [];
}

function guardarCarrito(carrito) {
    localStorage.setItem(CLAVE_CARRITO, JSON.stringify(carrito));
}

function actualizarContador() {
    const contador = document.getElementById("contador-carrito");

    if (contador) {
        const carrito = obtenerCarrito();

        const cantidad = carrito.reduce(function (total, producto) {
            return total + producto.cantidad;
        }, 0);

        contador.textContent = cantidad;
    }
}

function agregarAlCarrito(perfume) {
    const carrito = obtenerCarrito();

    const productoExistente = carrito.find(function (producto) {
        return producto.nombre === perfume.nombre;
    });

    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({
            nombre: perfume.nombre,
            marca: perfume.marca,
            precio: perfume.precio,
            imagen: perfume.imagen,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    actualizarContador();
}

// ========================================
// MOSTRAR DETALLE DEL PERFUME
// ========================================

if (detalle) {

    if (perfume) {

        document.title = perfume.nombre + " | Emprendimiento May";

        const seccion = document.createElement("section");
        seccion.className = "producto-detalle";

        // IMAGEN

        const foto = document.createElement("div");
        foto.className = "detalle-foto";

        const imagen = document.createElement("img");
        imagen.id = "imagen-perfume";
        imagen.src = perfume.imagen;
        imagen.alt = perfume.nombre;
        imagen.tabIndex = 0;
        imagen.setAttribute("role", "button");
        imagen.setAttribute("aria-label", "Ampliar imagen de " + perfume.nombre);

        const ayuda = document.createElement("p");
        ayuda.className = "ayuda-zoom";
        ayuda.textContent = "Clic para ampliar ⤢";

        foto.append(imagen, ayuda);

        // INFORMACIÓN

        const datos = document.createElement("div");
        datos.className = "detalle-datos";

        const marca = document.createElement("p");
        marca.className = "detalle-marca";
        marca.textContent = perfume.marca;

        const titulo = document.createElement("h1");
        titulo.textContent = perfume.nombre;

        const categoria = document.createElement("p");
        categoria.className = "detalle-categoria";
        categoria.textContent = perfume.categoria;

        const descripcion = document.createElement("p");
        descripcion.className = "detalle-descripcion";
        descripcion.textContent = perfume.descripcion;

        const separador = document.createElement("div");
        separador.className = "separador";

        const textoPrecio = document.createElement("p");
        textoPrecio.className = "texto-precio";
        textoPrecio.textContent = "Precio";

        const precio = document.createElement("p");
        precio.className = "detalle-precio";
        precio.textContent = "$" + perfume.precio.toLocaleString("es-AR");

        // BOTONES

        const botones = document.createElement("div");
        botones.className = "botones-detalle";

        const volver = document.createElement("a");
        volver.className = "boton-volver";
        volver.href = "index.html#catalogo";
        volver.textContent = "← Volver al catálogo";

        const botonCarrito = document.createElement("button");
        botonCarrito.className = "boton-volver boton-carrito";
        botonCarrito.type = "button";
        botonCarrito.innerHTML = '<span>🛒</span> Agregar al carrito';

        botonCarrito.addEventListener("click", function () {
            agregarAlCarrito(perfume);

            // Ambos archivos están en la carpeta raíz.
            window.location.href = "carrito.html";
        });

        botones.append(volver, botonCarrito);

        // UNIR ELEMENTOS

        datos.append(
            marca,
            titulo,
            categoria,
            descripcion,
            separador,
            textoPrecio,
            precio,
            botones
        );

        seccion.append(foto, datos);
        detalle.replaceChildren(seccion);

        // ========================================
        // VISOR DE IMAGEN AMPLIADA
        // ========================================

        const zoom = document.createElement("div");
        zoom.className = "zoom-overlay";

        const cerrar = document.createElement("button");
        cerrar.className = "cerrar-zoom";
        cerrar.type = "button";
        cerrar.textContent = "×";
        cerrar.setAttribute("aria-label", "Cerrar imagen");

        const imagenAmpliada = document.createElement("img");
        imagenAmpliada.src = perfume.imagen;
        imagenAmpliada.alt = perfume.nombre;

        const textoZoom = document.createElement("p");
        textoZoom.textContent = perfume.nombre + " · Clic afuera para cerrar";

        zoom.append(cerrar, imagenAmpliada, textoZoom);
        document.body.appendChild(zoom);

        function abrirZoom() {
            zoom.classList.add("activo");
            document.body.classList.add("zoom-abierto");
        }

        function cerrarZoom() {
            zoom.classList.remove("activo");
            document.body.classList.remove("zoom-abierto");
        }

        imagen.addEventListener("click", abrirZoom);

        imagen.addEventListener("keydown", function (event) {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                abrirZoom();
            }
        });

        cerrar.addEventListener("click", cerrarZoom);

        zoom.addEventListener("click", function (event) {
            if (event.target === zoom) {
                cerrarZoom();
            }
        });

        document.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && zoom.classList.contains("activo")) {
                cerrarZoom();
            }
        });

    } else {

        document.title = "Perfume no encontrado | Emprendimiento May";

        const mensaje = document.createElement("div");
        mensaje.className = "perfume-no-encontrado";

        const titulo = document.createElement("h2");
        titulo.textContent = "No encontramos ese perfume";

        const volver = document.createElement("a");
        volver.className = "boton-volver";
        volver.href = "index.html#catalogo";
        volver.textContent = "Volver al catálogo";

        mensaje.append(titulo, volver);
        detalle.replaceChildren(mensaje);
    }
}

actualizarContador();
