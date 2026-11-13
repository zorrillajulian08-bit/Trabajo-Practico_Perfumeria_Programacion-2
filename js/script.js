
import { auth } from "./firebase.js";

import {
    onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

const API = "https://localhost:7177/api/Perfumeria";

const catalogo = document.getElementById("productos");
const buscador = document.getElementById("buscador");

let perfumes = [];
let categoriaSeleccionada = "todas";
let CLAVE_CARRITO = null;

// ========================================
// NORMALIZAR TEXTOS
// ========================================

function normalizarTexto(texto) {
    return String(texto || "")
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .trim();
}

// ========================================
// MOSTRAR PRODUCTOS
// ========================================

function mostrarPerfumes(lista) {
    if (!catalogo) return;

    catalogo.innerHTML = "";

    if (lista.length === 0) {
        catalogo.innerHTML = `
            <p class="cargando-productos">
                No se encontraron perfumes.
            </p>
        `;
        return;
    }

    lista.forEach((perfume) => {
        const tarjeta = document.createElement("article");
        tarjeta.className = "producto";
        tarjeta.setAttribute("tabindex", "0");
        tarjeta.setAttribute("role", "link");

        const imagen = document.createElement("img");
        imagen.src = perfume.imagen;
        imagen.alt = perfume.nombre;

        const nombre = document.createElement("h3");
        nombre.textContent = perfume.nombre;

        const marca = document.createElement("p");
        marca.className = "marca";
        marca.textContent = perfume.marca;

        const precio = document.createElement("p");
        precio.className = "precio";
        precio.textContent = new Intl.NumberFormat("es-AR", {
            style: "currency",
            currency: "ARS",
            maximumFractionDigits: 0
        }).format(perfume.precio);

        tarjeta.append(imagen, nombre, marca, precio);

        tarjeta.addEventListener("click", () => {
            verPerfume(perfume.nombre);
        });

        tarjeta.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                verPerfume(perfume.nombre);
            }
        });

        catalogo.appendChild(tarjeta);
    });
}

// ========================================
// BUSCADOR Y FILTROS
// ========================================

function filtrarPerfumes() {
    const texto = normalizarTexto(buscador?.value || "");
    const categoria = normalizarTexto(categoriaSeleccionada);

    const resultado = perfumes.filter((perfume) => {
        const nombre = normalizarTexto(perfume.nombre);
        const marca = normalizarTexto(perfume.marca);
        const genero = normalizarTexto(perfume.categoria);

        const coincideTexto =
            nombre.includes(texto) ||
            marca.includes(texto);

        const coincideCategoria =
            categoria === "todas" ||
            genero === categoria;

        return coincideTexto && coincideCategoria;
    });

    mostrarPerfumes(resultado);
}

// ========================================
// BOTONES DE CATEGORÍAS
// ========================================

window.elegirCategoria = function (valor) {
    categoriaSeleccionada = normalizarTexto(valor);

    filtrarPerfumes();

    document.getElementById("catalogo")?.scrollIntoView({
        behavior: "smooth"
    });
};

// ========================================
// ABRIR DETALLE DEL PERFUME
// ========================================

function verPerfume(nombre) {
    window.location.href =
        "perfume.html?nombre=" + encodeURIComponent(nombre);
}

// ========================================
// CARGAR PRODUCTOS DESDE LA API
// ========================================

async function cargarProductos() {
    try {
        const respuesta = await fetch(`${API}/todos`);

        if (!respuesta.ok) {
            throw new Error("Error al obtener los productos");
        }

        const datos = await respuesta.json();

        perfumes = datos.map((item) => ({
            productoId: item.productoId,
            nombre: item.nombre || "",
            marca: item.marca?.nombre || item.marca || "",
            precio: Number(item.precio) || 0,
            categoria: item.categoria || "",
            imagen: item.imagen || "",
            descripcion: item.descripcion || ""
        }));

        filtrarPerfumes();

    } catch (error) {
        console.error("Error al cargar productos:", error);

        if (catalogo) {
            catalogo.innerHTML = `
                <p class="cargando-productos">
                    No se pudieron cargar los productos.
                    Revisá si la API está funcionando.
                </p>
            `;
        }
    }
}

// ========================================
// EVENTO DEL BUSCADOR
// ========================================

if (buscador) {
    buscador.addEventListener("input", filtrarPerfumes);
}

// ========================================
// CONTADOR DEL CARRITO
// ========================================

function actualizarContadorCarrito() {
    const contador = document.getElementById("contador-carrito");

    if (!contador) return;

    // Si no hay usuario, el carrito está vacío.
    if (!CLAVE_CARRITO) {
        contador.textContent = 0;
        return;
    }

    try {
        const carrito = JSON.parse(
            localStorage.getItem(CLAVE_CARRITO)
        ) || [];

        const cantidad = carrito.reduce((total, producto) => {
            return total + (Number(producto.cantidad) || 0);
        }, 0);

        contador.textContent = cantidad;

    } catch (error) {
        console.error("Error al actualizar el contador del carrito:", error);
        contador.textContent = 0;
    }
}

// ========================================
// CONTADOR DE PEDIDOS
// ========================================

async function actualizarContadorPedidos() {
    const contador = document.getElementById("contador-pedidos");

    if (!contador) return;

    try {
        // Esperar a que Firebase identifique al usuario.
        const usuario = await new Promise((resolve) => {
            const cancelar = onAuthStateChanged(auth, (usuarioActual) => {
                cancelar();
                resolve(usuarioActual);
            });
        });

        if (!usuario) {
            contador.textContent = 0;
            return;
        }

        // Obtener el token de autenticación.
        const token = await usuario.getIdToken();

        // Consultar los pedidos del usuario.
        const respuesta = await fetch(`${API}/pedidos/mis-pedidos`, {
            headers: {
                Authorization: `Bearer ${token}`
            }
        });

        if (!respuesta.ok) {
            throw new Error("No se pudieron obtener los pedidos.");
        }

        const datos = await respuesta.json();

        const pedidos = Array.isArray(datos)
    ? datos
    : datos.pedidos || datos.data || datos.$values || [];;

    const pedidosPendientes = pedidos.filter((pedido) =>
    String(pedido.estado ?? pedido.Estado ?? "").trim().toLowerCase() === "pendiente"
);

        contador.textContent = pedidosPendientes.length;

    } catch (error) {
        console.error("Error al actualizar el contador de pedidos:", error);
        contador.textContent = 0;
    }
}

// ========================================
// ESCUCHAR CAMBIOS DE SESIÓN
// ========================================

onAuthStateChanged(auth, (usuario) => {

    if (usuario) {
        CLAVE_CARRITO = `carritoMay_${usuario.uid}`;
    } else {
        CLAVE_CARRITO = null;
    }

    actualizarContadorCarrito();
});

// ========================================
// INICIAR
// ========================================

cargarProductos();
actualizarContadorPedidos();

window.addEventListener("pageshow", () => {
    actualizarContadorCarrito();
    actualizarContadorPedidos();
});
