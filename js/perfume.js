
import { auth } from "./firebase.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

// ========================================
// CONFIGURACIÓN DE LA API
// ========================================

const API = "https://localhost:7177/api/Perfumeria";
let CLAVE_CARRITO = null;

const parametros = new URLSearchParams(window.location.search);
const nombreBuscado = parametros.get("nombre");

const detalle = document.getElementById("detalle-perfume");

// ========================================
// OBTENER PROPIEDADES DE LA API
// ========================================

function obtenerPropiedad(objeto, ...nombres) {

    if (!objeto || typeof objeto !== "object") return undefined;

    for (const nombre of nombres) {

        if (objeto[nombre] !== undefined && objeto[nombre] !== null) {
            return objeto[nombre];
        }

        const clave = Object.keys(objeto).find(
            propiedad => propiedad.toLowerCase() === nombre.toLowerCase()
        );

        if (clave) {
            return objeto[clave];
        }
    }

    return undefined;
}

// ========================================
// FUNCIONES DEL CARRITO
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

    localStorage.setItem(
        CLAVE_CARRITO,
        JSON.stringify(carrito)
    );
}

function actualizarContador() {

    const contador = document.getElementById("contador-carrito");

    if (contador) {

        const carrito = obtenerCarrito();

        const cantidad = carrito.reduce(
            (total, producto) => total + (Number(producto.cantidad) || 0),
            0
        );

        contador.textContent = cantidad;
    }
}

// ========================================
// ALERTA DE PRODUCTO SIN STOCK
// ========================================

function mostrarAlertaSinStock(nombre) {

    Swal.fire({
        icon: "info",
        title: "Sin stock disponible",
        html: `
            <p style="margin-bottom: 5px; color: #80674F;">
                No hay stock del perfume
            </p>

            <strong style="color: #594333; font-size: 19px;">
                ${nombre}
            </strong>

            <p style="margin-top: 12px; color: #80674F;">
                ¡Pronto estará disponible!
            </p>
        `,
        confirmButtonText: "Entendido",
        confirmButtonColor: "#80674F",
        background: "#F3EADF",
        color: "#594333"
    });
}

// ========================================
// AGREGAR AL CARRITO
// ========================================

function agregarAlCarrito(perfume) {

    if (!CLAVE_CARRITO) {

        Swal.fire({
            icon: "warning",
            title: "Iniciá sesión",
            text: "Tenés que iniciar sesión para agregar perfumes al carrito.",
            confirmButtonColor: "#493524",
            background: "#faf7f1",
            color: "#33271d"
        });

        return false;
    }

    const carrito = obtenerCarrito();

    const productoExistente = carrito.find(
        producto => Number(producto.productoId) === Number(perfume.productoId)
    );

    // Comprobar stock disponible

    if (perfume.stock <= 0) {

        mostrarAlertaSinStock(perfume.nombre);

        return false;
    }

    // No permitir agregar más unidades que las disponibles

    if (
        productoExistente &&
        productoExistente.cantidad >= perfume.stock
    ) {

        Swal.fire({
            icon: "warning",
            title: "Stock insuficiente",
            html: `
                <p style="color: #80674F;">
                    No quedan más unidades disponibles de
                </p>

                <strong style="color: #594333; font-size: 19px;">
                    ${perfume.nombre}
                </strong>
            `,
            confirmButtonText: "Entendido",
            confirmButtonColor: "#80674F",
            background: "#F3EADF",
            color: "#594333"
        });

        return false;
    }

    if (productoExistente) {

        productoExistente.cantidad++;

    } else {

        carrito.push({
            productoId: perfume.productoId,
            nombre: perfume.nombre,
            marca: perfume.marca,
            precio: perfume.precio,
            imagen: perfume.imagen,
            stock: perfume.stock,
            cantidad: 1
        });
    }

    guardarCarrito(carrito);
    actualizarContador();

    return true;
}

// ========================================
// MOSTRAR MENSAJE DE ERROR
// ========================================

function mostrarProductoNoEncontrado(titulo, descripcion = "") {

    detalle.innerHTML = `
        <div class="perfume-no-encontrado">
            <h2>${titulo}</h2>
            ${descripcion ? `<p>${descripcion}</p>` : ""}
            <a href="index.html#catalogo" class="boton-volver">
                Volver al catálogo
            </a>
        </div>
    `;
}

// ========================================
// CARGAR DETALLE DEL PERFUME
// ========================================

async function cargarDetallePerfume() {

    if (!detalle) return;

    if (!nombreBuscado) {

        mostrarProductoNoEncontrado("Perfume no especificado");
        return;
    }

    try {

        // Obtener productos de la API

        const respuesta = await fetch(`${API}/todos`);

        if (!respuesta.ok) {
            throw new Error("La API no respondió correctamente.");
        }

        const datos = await respuesta.json();

        // Aceptar tanto una lista directa como una lista dentro de data

        const productos = Array.isArray(datos)
            ? datos
            : obtenerPropiedad(datos, "data", "items", "productos", "result");

        if (!Array.isArray(productos)) {
            throw new Error("La API no devolvió una lista válida de productos.");
        }

        // Buscar el perfume por nombre

        const perfumeEncontrado = productos.find(producto => {

            const nombre = obtenerPropiedad(producto, "nombre");

            return String(nombre || "").trim().toLowerCase() ===
                nombreBuscado.trim().toLowerCase();
        });

        if (!perfumeEncontrado) {

            document.title = "Perfume no encontrado | Emprendimiento May";

            mostrarProductoNoEncontrado("No encontramos ese perfume");
            return;
        }

        // Adaptar los datos de SQL

        const marcaObjeto = obtenerPropiedad(perfumeEncontrado, "marca");

        const perfume = {

            productoId: obtenerPropiedad(
                perfumeEncontrado,
                "productoId"
            ),

            nombre: obtenerPropiedad(
                perfumeEncontrado,
                "nombre"
            ) || "Perfume sin nombre",

            marca:
                obtenerPropiedad(marcaObjeto, "nombre") ||
                (typeof marcaObjeto === "string" ? marcaObjeto : "") ||
                "",

            precio: Number(
                obtenerPropiedad(perfumeEncontrado, "precio")
            ) || 0,

            categoria: obtenerPropiedad(
                perfumeEncontrado,
                "categoria"
            ) || "",

            descripcion: obtenerPropiedad(
                perfumeEncontrado,
                "descripcion"
            ) || "Descubrí esta fragancia de nuestra colección.",

            imagen: obtenerPropiedad(
                perfumeEncontrado,
                "imagen"
            ) || "",

            stock: Number(
                obtenerPropiedad(perfumeEncontrado, "stock")
            ) || 0
        };

        document.title = perfume.nombre + " | Emprendimiento May";

        // ========================================
        // CREAR ESTRUCTURA DEL PRODUCTO
        // ========================================

        const seccion = document.createElement("section");
        seccion.className = "producto-detalle";

        // IMAGEN

        const foto = document.createElement("div");
        foto.className = "detalle-foto";

        const imagen = document.createElement("img");
        imagen.id = "imagen-perfume";
        imagen.src = perfume.imagen;

        foto.style.setProperty(
            "--imagen-fondo",
            `url("${perfume.imagen}")`
        );

        imagen.alt = perfume.nombre;
        imagen.loading = "eager";

        imagen.addEventListener("error", () => {

            imagen.style.display = "none";

            foto.style.background = `
                radial-gradient(
                    ellipse at center,
                    #f7f1e9 0%,
                    #e2d6c7 100%
                )
            `;
        });

        const ayuda = document.createElement("p");
        ayuda.className = "ayuda-zoom";
        ayuda.textContent = "Clic para ampliar ⤢";

        foto.append(imagen, ayuda);

        // INFORMACIÓN DEL PERFUME

        const panelDatos = document.createElement("div");
        panelDatos.className = "detalle-datos";

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

        // PRECIO

        const textoPrecio = document.createElement("p");
        textoPrecio.className = "texto-precio";
        textoPrecio.textContent = "Precio";

        const precioEl = document.createElement("p");
        precioEl.className = "detalle-precio";
        precioEl.textContent = perfume.precio.toLocaleString("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0
        });

        // ========================================
        // BOTONES
        // ========================================

        const botones = document.createElement("div");
        botones.className = "botones-detalle";

        const volver = document.createElement("a");
        volver.className = "boton-volver";
        volver.href = "index.html#catalogo";
        volver.textContent = "← Volver al catálogo";

        const botonCarrito = document.createElement("button");
        botonCarrito.className = "boton-carrito";
        botonCarrito.type = "button";

        if (perfume.stock <= 0) {

            botonCarrito.textContent = "Sin stock";
            botonCarrito.disabled = true;

        } else {

            botonCarrito.innerHTML = "<span>🛒</span> Agregar al carrito";

            botonCarrito.addEventListener("click", () => {

                const agregado = agregarAlCarrito(perfume);

                if (agregado) {
                    window.location.href = "carrito.html";
                }
            });
        }

        botones.append(volver, botonCarrito);

        // ========================================
        // UNIR LOS ELEMENTOS
        // ========================================

        panelDatos.append(
            marcaEl,
            titulo,
            categoriaEl,
            descripcionEl,
            separador,
            textoPrecio,
            precioEl,
            botones
        );

        seccion.append(foto, panelDatos);

        detalle.replaceChildren(seccion);

        // Mostrar alerta automáticamente si no hay stock

        if (perfume.stock <= 0) {
            mostrarAlertaSinStock(perfume.nombre);
        }

        // ========================================
        // ZOOM DE IMAGEN
        // ========================================

        const zoom = document.createElement("div");
        zoom.className = "zoom-overlay";

        const cerrar = document.createElement("button");
        cerrar.className = "cerrar-zoom";
        cerrar.type = "button";
        cerrar.textContent = "×";
        cerrar.setAttribute("aria-label", "Cerrar imagen ampliada");

        const imagenAmpliada = document.createElement("img");
        imagenAmpliada.src = perfume.imagen;
        imagenAmpliada.alt = perfume.nombre;

        const textoZoom = document.createElement("p");
        textoZoom.textContent =
            perfume.nombre + " · Clic afuera para cerrar";

        zoom.append(cerrar, imagenAmpliada, textoZoom);
        document.body.appendChild(zoom);

        function cerrarZoom() {

            zoom.classList.remove("activo");
            document.body.classList.remove("zoom-abierto");
        }

        imagen.addEventListener("click", () => {

            if (!imagen.src || imagen.style.display === "none") return;

            zoom.classList.add("activo");
            document.body.classList.add("zoom-abierto");
        });

        ayuda.addEventListener("click", () => {

            if (imagen.style.display === "none") return;

            zoom.classList.add("activo");
            document.body.classList.add("zoom-abierto");
        });

        cerrar.addEventListener("click", cerrarZoom);

        zoom.addEventListener("click", (e) => {

            if (e.target === zoom) {
                cerrarZoom();
            }
        });

        document.addEventListener("keydown", (e) => {

            if (e.key === "Escape" && zoom.classList.contains("activo")) {
                cerrarZoom();
            }
        });

    } catch (error) {

        console.error("Error al cargar detalle:", error);

        mostrarProductoNoEncontrado(
            "Error de conexión con el servidor",
            "Revisá si la API está funcionando correctamente."
        );
    }
}

// ========================================
// INICIAR
// ========================================

cargarDetallePerfume();

onAuthStateChanged(auth, (usuario) => {

    if (usuario) {
        CLAVE_CARRITO = `carritoMay_${usuario.uid}`;
    } else {
        CLAVE_CARRITO = null;
    }

    actualizarContador();
});
