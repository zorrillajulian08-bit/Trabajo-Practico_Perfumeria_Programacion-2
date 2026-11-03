const perfumes = [
  { nombre: "Afnan 9PM", marca: "Afnan", precio: 65000, categoria: "Masculino", imagen: "images/9pm.jpg", descripcion: "Una fragancia moderna, intensa y con personalidad." },
  { nombre: "Sauvage", marca: "Dior", precio: 150000, categoria: "Masculino", imagen: "images/SauvageDior.jpg", descripcion: "Un aroma fresco y amaderado de estilo elegante." },
  { nombre: "Good Girl", marca: "Carolina Herrera", precio: 180000, categoria: "Femenino", imagen: "images/GoodGirl.jpg", descripcion: "Una fragancia sofisticada con una identidad única." },
  { nombre: "Baccarat Rouge 540", marca: "Maison Francis Kurkdjian", precio: 350000, categoria: "Unisex", imagen: "images/Baccarat.jpg", descripcion: "Una fragancia envolvente y elegante." }
];

const contenedor = document.getElementById("productos");
const buscador = document.getElementById("buscador");
const categoria = document.getElementById("categoria");
const sinResultados = document.getElementById("sin-resultados");

function mostrarPerfumes(lista) {
  contenedor.replaceChildren();
  lista.forEach(function (perfume) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "producto";
    const enlace = document.createElement("a");
    enlace.className = "producto-enlace";
    enlace.href = "perfume.html?nombre=" + encodeURIComponent(perfume.nombre);
    const imagen = document.createElement("img");
    imagen.src = perfume.imagen;
    imagen.alt = perfume.nombre;
    const info = document.createElement("div");
    info.className = "producto-info";
    const marca = document.createElement("p");
    marca.className = "producto-marca";
    marca.textContent = perfume.marca;
    const nombre = document.createElement("h3");
    nombre.textContent = perfume.nombre;
    const precio = document.createElement("p");
    precio.className = "producto-precio";
    precio.textContent = "$" + perfume.precio.toLocaleString("es-AR");
    const ver = document.createElement("span");
    ver.className = "ver-detalle";
    ver.textContent = "Ver perfume →";
    info.append(marca, nombre, precio, ver);
    enlace.append(imagen, info);
    tarjeta.appendChild(enlace);
    contenedor.appendChild(tarjeta);
  });
  sinResultados.hidden = lista.length > 0;
}

function filtrarPerfumes() {
  const texto = buscador.value.trim().toLowerCase();
  const tipo = categoria.value;
  const filtrados = perfumes.filter(function (p) {
    return (p.nombre.toLowerCase().includes(texto) || p.marca.toLowerCase().includes(texto))
      && (tipo === "Todos" || p.categoria === tipo);
  });
  mostrarPerfumes(filtrados);
}
buscador.addEventListener("input", filtrarPerfumes);
categoria.addEventListener("change", filtrarPerfumes);
mostrarPerfumes(perfumes);
