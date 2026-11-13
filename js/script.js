// ========================================
// CONFIGURACIÓN DE LA API
// ========================================
const API = "https://localhost:7177/api/Perfumeria";

// ========================================
// ELEMENTOS DEL HTML
// ========================================
const catalogo = document.getElementById("productos");
const buscador = document.getElementById("buscador");
const categoria = document.getElementById("categoria");

// ========================================
// LISTA GENERAL DE PERFUMES
// ========================================
let perfumes = [];

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
            seleccion === "todas" ||
            seleccion === "todos" ||
            perfume.categoria.toLowerCase() === seleccion;

        return coincideTexto && coincideCategoria;
    });

    mostrarPerfumes(resultado);
}

// ========================================
// ABRIR DETALLE DEL PERFUME
// ========================================
function verPerfume(nombre) {
    window.location.href = "perfume.html?nombre=" + encodeURIComponent(nombre);
}

// ========================================
// CARGAR PRODUCTOS DESDE LA API SQL
// ========================================
async function cargarProductos() {
    try {
        const respuesta = await fetch(`${API}/todos`);
        if (!respuesta.ok) throw new Error("Error en la API");

        const datos = await respuesta.json();

        // Mapeamos los datos tal cual vienen de SQL
        perfumes = datos.map((item) => ({
            productoId: item.productoId,
            nombre: item.nombre,
            // Si la API devuelve el objeto "marca", extraemos el nombre. Si no, lo usamos directo.
            marca: item.marca?.nombre || item.marca || "",
            precio: Number(item.precio) || 0,
            categoria: (item.categoria || "").toLowerCase(),
            imagen: item.imagen || "",
            descripcion: item.descripcion || ""
        }));

        // Si el buscador y la categoria existen, filtramos
        if (buscador && categoria) {
            filtrarPerfumes();
        } else {
            mostrarPerfumes(perfumes);
        }

    } catch (error) {
        console.error("Error al cargar productos de SQL:", error);
        catalogo.innerHTML = "<p class='cargando-productos'>No se pudieron cargar los productos. Revisá si la API está corriendo.</p>";
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
    categoria.value = valor.toLowerCase();
    filtrarPerfumes();
};

// ========================================
// ACTUALIZAR CONTADORES (CARRITO Y PEDIDOS)
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

function actualizarContadorPedidos() {
    const contador = document.getElementById("contador-pedidos");
    if (!contador) return;
    // Como los pedidos ahora están en SQL, podríamos hacer un fetch, 
    // pero para no sobrecargar, lo dejamos en 0 o mostramos si hay algo en localStorage.
    // Si querés que cuente los pedidos reales, avisame y lo conectamos a GET /pedidos/mis-pedidos.
    contador.textContent = 0; 
}

// ========================================
// INICIAR
// ========================================
cargarProductos();
actualizarContadorCarrito();
actualizarContadorPedidos();

window.addEventListener("pageshow", () => {
    actualizarContadorCarrito();
    actualizarContadorPedidos();
});