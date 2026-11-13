// ========================================
// CONFIGURACIÓN DE LA API
// ========================================
const API = "https://localhost:7177/api/Perfumeria";
const CLAVE_CARRITO = "carritoMay";

const parametros = new URLSearchParams(window.location.search);
const nombreBuscado = parametros.get("nombre");

const detalle = document.getElementById("detalle-perfume");

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
        const cantidad = carrito.reduce((total, producto) => total + producto.cantidad, 0);
        contador.textContent = cantidad;
    }
}

function agregarAlCarrito(perfume) {
    const carrito = obtenerCarrito();
    // Buscamos por productoId (que es más seguro que el nombre)
    const productoExistente = carrito.find((producto) => producto.productoId === perfume.productoId);

    if (productoExistente) {
        productoExistente.cantidad++;
    } else {
        carrito.push({
            productoId: perfume.productoId, // GUARDAMOS EL ID DE SQL
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
async function cargarDetallePerfume() {
    if (!detalle) return;

    if (!nombreBuscado) {
        detalle.innerHTML = "<div class='perfume-no-encontrado'><h2>Perfume no especificado</h2><a href='index.html#catalogo' class='boton-volver'>Volver al catálogo</a></div>";
        return;
    }

    try {
        // Traemos todos los productos de la API SQL
        const respuesta = await fetch(`${API}/todos`);
        
        if (!respuesta.ok) {
            throw new Error("La API no respondió correctamente.");
        }

        const productos = await respuesta.json();

        // Buscamos el perfume por nombre (ignorando mayúsculas/minúsculas y espacios)
        const perfumeEncontrado = productos.find(p => 
            p.nombre.trim().toLowerCase() === nombreBuscado.trim().toLowerCase()
        );

        if (!perfumeEncontrado) {
            document.title = "Perfume no encontrado | Emprendimiento May";
            detalle.innerHTML = "<div class='perfume-no-encontrado'><h2>No encontramos ese perfume</h2><a href='index.html#catalogo' class='boton-volver'>Volver al catálogo</a></div>";
            return;
        }

        // Adaptamos el objeto de SQL
        const perfume = {
            productoId: perfumeEncontrado.productoId,
            nombre: perfumeEncontrado.nombre,
            marca: perfumeEncontrado.marca?.nombre || perfumeEncontrado.marca || "",
            precio: Number(perfumeEncontrado.precio) || 0,
            categoria: perfumeEncontrado.categoria || "",
            descripcion: perfumeEncontrado.descripcion || "",
            imagen: perfumeEncontrado.imagen || ""
        };

        document.title = perfume.nombre + " | Emprendimiento May";

        // Construimos el HTML (respetando tu diseño original)
        const seccion = document.createElement("section");
        seccion.className = "producto-detalle";

        const foto = document.createElement("div");
        foto.className = "detalle-foto";
        const imagen = document.createElement("img");
        imagen.src = perfume.imagen;
        imagen.alt = perfume.nombre;
        const ayuda = document.createElement("p");
        ayuda.className = "ayuda-zoom";
        ayuda.textContent = "Clic para ampliar ⤢";
        foto.append(imagen, ayuda);

        const datos = document.createElement("div");
        datos.className = "detalle-datos";

        const marcaEl = document.createElement("p");
        marcaEl.className = "detalle-marca";
        marcaEl.textContent = perfume.marca;

        const titulo = document.createElement("h1");
        titulo.textContent = perfume.nombre;

        const categoriaEl = document.createElement("p");
        categoriaEl.className = "detalle-categoria";
        categoriaEl.textContent = perfume.categoria;

        const descripcionEl = document.createElement("p");
        descripcionEl.className = "detalle-descripcion";
        descripcionEl.textContent = perfume.descripcion;

        const separador = document.createElement("div");
        separador.className = "separador";

        const textoPrecio = document.createElement("p");
        textoPrecio.className = "texto-precio";
        textoPrecio.textContent = "Precio";

        const precioEl = document.createElement("p");
        precioEl.className = "detalle-precio";
        precioEl.textContent = "$" + perfume.precio.toLocaleString("es-AR");

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
            window.location.href = "carrito.html";
        });

        botones.append(volver, botonCarrito);

        datos.append(marcaEl, titulo, categoriaEl, descripcionEl, separador, textoPrecio, precioEl, botones);
        seccion.append(foto, datos);
        detalle.replaceChildren(seccion);

        // Zoom logic
        const zoom = document.createElement("div");
        zoom.className = "zoom-overlay";
        const cerrar = document.createElement("button");
        cerrar.className = "cerrar-zoom";
        cerrar.type = "button";
        cerrar.textContent = "×";
        const imagenAmpliada = document.createElement("img");
        imagenAmpliada.src = perfume.imagen;
        const textoZoom = document.createElement("p");
        textoZoom.textContent = perfume.nombre + " · Clic afuera para cerrar";
        zoom.append(cerrar, imagenAmpliada, textoZoom);
        document.body.appendChild(zoom);

        imagen.addEventListener("click", () => {
            zoom.classList.add("activo");
            document.body.classList.add("zoom-abierto");
        });

        cerrar.addEventListener("click", () => {
            zoom.classList.remove("activo");
            document.body.classList.remove("zoom-abierto");
        });

        zoom.addEventListener("click", (e) => {
            if (e.target === zoom) {
                zoom.classList.remove("activo");
                document.body.classList.remove("zoom-abierto");
            }
        });

    } catch (error) {
        console.error("Error al cargar detalle:", error);
        detalle.innerHTML = "<div class='perfume-no-encontrado'><h2>Error de conexión con el servidor</h2><p>Revisá si la API está corriendo.</p><a href='index.html#catalogo' class='boton-volver'>Volver al catálogo</a></div>";
    }
}

// Iniciar
cargarDetallePerfume();
actualizarContador();