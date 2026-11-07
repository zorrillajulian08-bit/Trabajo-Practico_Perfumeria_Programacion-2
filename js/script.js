import { db } from "../js/firebase.js";

import {
    collection,
    getDocs
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

// PRODUCTOS ORIGINALES

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

// ELEMENTOS DEL HTML

const catalogo = document.getElementById("catalogo");
const buscador = document.getElementById("buscador");
const categoria = document.getElementById("categoria");

// LISTA GENERAL DE PERFUMES

let perfumes = [...perfumesOriginales];

// MOSTRAR PRODUCTOS

function mostrarPerfumes(lista) {

    catalogo.innerHTML = "";

    if (lista.length === 0) {
        catalogo.innerHTML = "<p>No se encontraron perfumes.</p>";
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

// FILTRAR PRODUCTOS

function filtrarPerfumes() {

    const texto = buscador.value.toLowerCase().trim();
    const seleccion = categoria.value.toLowerCase();

    const resultado = perfumes.filter((perfume) => {

        const coincideTexto =
            perfume.nombre.toLowerCase().includes(texto) ||
            perfume.marca.toLowerCase().includes(texto);

        const coincideCategoria =
            seleccion === "todos" ||
            perfume.categoria.toLowerCase() === seleccion;

        return coincideTexto && coincideCategoria;

    });

    mostrarPerfumes(resultado);
}

// ABRIR DETALLE DEL PERFUME

function verPerfume(nombre) {

    window.location.href =
        "perfume.html?nombre=" + encodeURIComponent(nombre);

}

// CARGAR PRODUCTOS DESDE FIRESTORE

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

        // COMBINAR PRODUCTOS ORIGINALES Y DE FIREBASE

        perfumes = [
            ...perfumesOriginales,
            ...perfumesFirebase
        ];

        filtrarPerfumes();

    } catch (error) {

        console.error("Error al cargar productos de Firebase:", error);

        // SI FIREBASE FALLA, SE MUESTRAN LOS PRODUCTOS ORIGINALES

        mostrarPerfumes(perfumesOriginales);

    }

}

// BUSCADOR Y CATEGORÍAS

buscador.addEventListener("input", filtrarPerfumes);

categoria.addEventListener("change", filtrarPerfumes);

// PERMITIR ELEGIR CATEGORÍAS DESDE OTROS BOTONES

window.elegirCategoria = function(valor) {
    categoria.value = valor.toLowerCase();
    filtrarPerfumes();
};

// INICIAR CATÁLOGO

mostrarPerfumes(perfumes);
cargarProductos();
