const perfumes = [
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

const catalogo = document.getElementById("catalogo");
const buscador = document.getElementById("buscador");
const categoria = document.getElementById("categoria");

function mostrarPerfumes(lista) {
    catalogo.innerHTML = "";

    if (lista.length === 0) {
        catalogo.innerHTML = "<p>No se encontraron perfumes.</p>";
        return;
    }

    lista.forEach(function(perfume) {
        catalogo.innerHTML += `
            <article class="producto"
                onclick="verPerfume('${perfume.nombre}')"
                tabindex="0"
                role="link"
                onkeydown="if(event.key === 'Enter') verPerfume('${perfume.nombre}')">

                <img src="${perfume.imagen}" alt="${perfume.nombre}">

                <h3>${perfume.nombre}</h3>

                <p class="marca">${perfume.marca}</p>

                <p class="precio">
                    $${perfume.precio.toLocaleString("es-AR")}
                </p>
            </article>
        `;
    });
}

function filtrarPerfumes() {
    const texto = buscador.value.toLowerCase();
    const seleccion = categoria.value;

    const resultado = perfumes.filter(function(perfume) {
        const coincideTexto =
            perfume.nombre.toLowerCase().includes(texto) ||
            perfume.marca.toLowerCase().includes(texto);

        const coincideCategoria =
            seleccion === "todos" ||
            perfume.categoria === seleccion;

        return coincideTexto && coincideCategoria;
    });

    mostrarPerfumes(resultado);
}

function verPerfume(nombre) {
    window.location.href =
        "perfume.html?nombre=" + encodeURIComponent(nombre);
}

buscador.addEventListener("input", filtrarPerfumes);
categoria.addEventListener("change", filtrarPerfumes);

mostrarPerfumes(perfumes);
function elegirCategoria(valor) {
    categoria.value = valor;
    filtrarPerfumes();
}