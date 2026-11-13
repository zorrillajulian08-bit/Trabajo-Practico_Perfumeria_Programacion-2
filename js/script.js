
import { db } from "../js/firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";


// ========================================
// PRODUCTOS ORIGINALES
// ========================================

const perfumesOriginales = [
    {
        nombre: "Afnan 9PM",
        marca: "Afnan",
        precio: 65000,
        categoria: "masculino",
        imagen: "images/9pm.jpg"
    },
    {
        nombre: "Sauvage",
        marca: "Dior",
        precio: 150000,
        categoria: "masculino",
        imagen: "images/SauvageDior.jpg"
    },
    {
        nombre: "Good Girl",
        marca: "Carolina Herrera",
        precio: 180000,
        categoria: "femenino",
        imagen: "images/GoodGirl.jpg"
    },
    {
        nombre: "Baccarat Rouge 540",
        marca: "Maison Francis Kurkdjian",
        precio: 350000,
        categoria: "unisex",
        imagen: "images/Baccarat.jpg"
    }
];


// ========================================
// ELEMENTOS DEL HTML
// ========================================

const catalogo = document.getElementById("productos");
const buscador = document.getElementById("buscador");
const categoria = document.getElementById("categoria");


// ========================================
// LISTA GENERAL DE PERFUMES
// ========================================

let perfumes = [...perfumesOriginales];


// ========================================
// MOSTRAR PRODUCTOS
// ========================================

function mostrarPerfumes(lista) {

    if (!catalogo) {
        console.error("No se encontró el contenedor de productos.");
        return;
    }

    catalogo.innerHTML = "";

    if (lista.length === 0) {
        catalogo.innerHTML = "<p class='cargando-productos'>No se encontraron perfumes.</p>";
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
        }).format(perfume.precio || 0);

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
// FILTRAR PRODUCTOS
// ========================================

function filtrarPerfumes() {

    const texto = buscador.value.toLowerCase().trim();
    const seleccion = categoria.value.toLowerCase();

    const resultado = perfumes.filter((perfume) => {

        const coincideTexto =
            perfume.nombre.toLowerCase().includes(texto) ||
            perfume.marca.toLowerCase().includes(texto);

        const coincideCategoria =
            seleccion === "" ||
            seleccion === "todas" ||
            seleccion === "todos" ||
            (perfume.categoria || "").toLowerCase().trim() === seleccion;

        return coincideTexto && coincideCategoria;

    });

    mostrarPerfumes(resultado);

}


// ========================================
// ABRIR DETALLE DEL PERFUME
// ========================================

function verPerfume(nombre) {

    window.location.href =
        "perfume.html?nombre=" + encodeURIComponent(nombre);

}


// ========================================
// CARGAR PRODUCTOS DESDE FIREBASE
// ========================================

async function cargarProductos() {

    try {

        const referencia = collection(db, "productos");
        const resultado = await getDocs(referencia);

        const perfumesFirebase = resultado.docs.map((documento) => {

            const producto = documento.data();

            return {
                nombre: producto.nombre || "",
                marca: producto.marca || "",
                precio: Number(producto.precio) || 0,
                categoria: (producto.categoria || "").toLowerCase(),
                imagen: producto.imagen || "",
                descripcion: producto.descripcion || ""
            };

        });

        // COMBINAR PRODUCTOS ORIGINALES Y FIREBASE

        perfumes = [
            ...perfumesOriginales,
            ...perfumesFirebase
        ];

        filtrarPerfumes();

    } catch (error) {

        console.error("Error al cargar productos de Firebase:", error);

        // SI FIREBASE FALLA, MOSTRAR LOS PRODUCTOS ORIGINALES

        perfumes = [...perfumesOriginales];

        filtrarPerfumes();

    }

}


// ========================================
// BUSCADOR Y CATEGORÍAS
// ========================================

if (buscador && categoria) {

    buscador.addEventListener("input", filtrarPerfumes);

    categoria.addEventListener("change", filtrarPerfumes);

}


// ========================================
// ELEGIR CATEGORÍAS DESDE OTROS BOTONES
// ========================================

window.elegirCategoria = function(valor) {

    if (!categoria) return;

    // Buscar la opción del <select> sin importar mayúsculas/minúsculas.
    // Si se asigna un valor que no coincide EXACTAMENTE con ninguna opción,
    // el select queda vacío ("") y el filtro no muestra ningún perfume.
    const opcion = Array.from(categoria.options).find(
        (o) => o.value.toLowerCase() === valor.toLowerCase()
    );

    categoria.value = opcion ? opcion.value : "Todas";

    filtrarPerfumes();

    document.getElementById("catalogo")?.scrollIntoView({ behavior: "smooth" });

};


// ========================================
// INICIAR CATÁLOGO
// ========================================

mostrarPerfumes(perfumes);

cargarProductos();

// ========================================
// ACTUALIZAR CONTADOR DEL CARRITO
// ========================================

function actualizarContadorCarrito() {

    const contador = document.getElementById("contador-carrito");

    if (!contador) return;

    const carrito = JSON.parse(localStorage.getItem("carritoMay")) || [];

    const cantidad = carrito.reduce((total, producto) => {
        return total + (Number(producto.cantidad) || 1);
    }, 0);

    contador.textContent = cantidad;
}

// Actualizar al cargar la página
actualizarContadorCarrito();

// Actualizar cuando se vuelve a la pestaña
window.addEventListener("pageshow", actualizarContadorCarrito);

// Actualizar si cambia el carrito desde otra pestaña
window.addEventListener("storage", actualizarContadorCarrito);