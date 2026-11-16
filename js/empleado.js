import { auth } from "./firebase.js";

import {
    onAuthStateChanged,
    signOut
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";


// ==========================================
// CONFIGURACIÓN DE LA API
// ==========================================

const API = "https://localhost:7177/api/Perfumeria";


// ==========================================
// ELEMENTOS DEL HTML
// ==========================================

const formulario = document.getElementById("form-producto");
const listaProductos = document.getElementById("lista-productos");
const contadorProductos = document.getElementById("contador-productos");
const mensaje = document.getElementById("mensaje-producto");

const botonAgregar = formulario.querySelector(".boton-agregar");
const botonCerrarSesion = document.getElementById("cerrar-sesion");

const inputImagen = document.getElementById("imagen");
const vistaPrevia = document.getElementById("vista-previa");

const inputNombre = document.getElementById("nombre");
const inputMarca = document.getElementById("marca");
const inputPrecio = document.getElementById("precio");
const inputCategoria = document.getElementById("categoria");
const inputStock = document.getElementById("stock");
const inputDescripcion = document.getElementById("descripcion");


// ==========================================
// ELEMENTOS DE USUARIOS
// ==========================================

const modalEditarUsuario = document.getElementById("modal-editar-usuario");
const formularioEditarUsuario = document.getElementById("form-editar-usuario");
const inputNuevoNombre = document.getElementById("nuevo-nombre-usuario");
const mensajeEditarUsuario = document.getElementById("mensaje-editar-usuario");

const botonCerrarModalUsuario = document.getElementById("cerrar-modal-usuario");
const botonCancelarEditarUsuario = document.getElementById("cancelar-editar-usuario");
const botonGuardarEditarUsuario = document.getElementById("guardar-editar-usuario");

const listaUsuarios = document.getElementById("lista-usuarios");
const mensajeUsuarios = document.getElementById("mensaje-usuarios");


// ==========================================
// ELEMENTOS DEL MODAL DE ELIMINACIÓN
// ==========================================

const modalEliminar = document.getElementById("modal-eliminar");
const textoModal = document.getElementById("modal-mensaje");

const botonConfirmarEliminar = document.getElementById("confirmar-eliminar");
const botonCancelarEliminar = document.getElementById("cancelar-eliminar");


// ==========================================
// ELEMENTOS DE PEDIDOS Y VENTAS
// ==========================================

const listaPedidos = document.getElementById("lista-pedidos-empleado");

const canvasMasVendidos = document.getElementById("grafico-mas-vendidos");
const canvasTortaMasVendidos = document.getElementById("grafico-torta-mas-vendidos");

const botonesFiltros = document.querySelectorAll(
    ".filtros-pedidos .filtro-btn"
);


// ==========================================
// VARIABLES
// ==========================================

let productoEditandoId = null;
let productosGuardados = new Map();
let marcasGuardadas = new Map();
let usuarioEditando = null;

let resolverModal = null;

let pedidosGlobales = [];
let filtroActualPedidos = "todos";

let graficoMasVendidos = null;
let graficoTortaMasVendidos = null;


// ==========================================
// FUNCIÓN AUXILIAR PARA OBTENER PROPIEDADES
// ==========================================

function obtenerPropiedad(objeto, ...nombres) {

    if (!objeto) return undefined;

    for (const nombre of nombres) {

        if (objeto[nombre] !== undefined && objeto[nombre] !== null) {
            return objeto[nombre];
        }

        const clave = Object.keys(objeto).find(
            k => k.toLowerCase() === nombre.toLowerCase()
        );

        if (clave) {
            return objeto[clave];
        }
    }

    return undefined;
}


// ==========================================
// OBTENER LISTAS DE RESPUESTAS DE LA API
// ==========================================

function obtenerLista(datos) {

    if (Array.isArray(datos)) {
        return datos;
    }

    if (!datos || typeof datos !== "object") {
        return [];
    }

    const posiblesListas = [
        "data",
        "items",
        "result",
        "pedidos",
        "ventas",
        "productos",
        "usuarios",
        "marcas"
    ];

    for (const propiedad of posiblesListas) {

        const valor = obtenerPropiedad(datos, propiedad);

        if (Array.isArray(valor)) {
            return valor;
        }
    }

    return [];
}


// ==========================================
// FUNCIÓN AUXILIAR PARA LA API
// ==========================================

async function solicitarAPI(url, opciones = {}, requiereToken = false) {

    const headers = {
        ...(opciones.headers || {})
    };

    if (requiereToken) {

        const usuario = auth.currentUser;

        if (!usuario) {
            throw new Error("No hay un usuario autenticado.");
        }

        const token = await usuario.getIdToken();

        headers.Authorization = `Bearer ${token}`;
    }

    const respuesta = await fetch(url, {
        ...opciones,
        headers
    });

    const contenido = await respuesta.text();

    let resultado = contenido;

    try {
        resultado = contenido ? JSON.parse(contenido) : null;
    } catch {
        resultado = contenido;
    }

    if (!respuesta.ok) {

        const mensajeError =
            resultado?.mensaje ||
            resultado?.message ||
            (typeof resultado === "string" ? resultado : null) ||
            `Error en la solicitud: ${respuesta.status}`;

        throw new Error(mensajeError);
    }

    return resultado;
}


// ==========================================
// FORMATEAR PRECIOS
// ==========================================

function formatearPrecio(precio) {

    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(Number(precio) || 0);

}


// ==========================================
// EVITAR INSERTAR HTML NO CONFIABLE
// ==========================================

function escaparHTML(texto) {

    return String(texto).replace(/[&<>"']/g, caracter => {

        const entidades = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#39;"
        };

        return entidades[caracter];

    });

}


// ==========================================
// MODAL DE ELIMINACIÓN
// ==========================================

function abrirModalEliminar(nombre) {

    textoModal.textContent =
        `¿Estás seguro de que querés eliminar "${nombre}"? Esta acción no se puede deshacer.`;

    modalEliminar.classList.add("activo");
    modalEliminar.setAttribute("aria-hidden", "false");

    return new Promise((resolve) => {
        resolverModal = resolve;
    });
}


function cerrarModalEliminar(confirmado) {

    modalEliminar.classList.remove("activo");
    modalEliminar.setAttribute("aria-hidden", "true");

    if (resolverModal) {
        resolverModal(confirmado);
        resolverModal = null;
    }
}


botonConfirmarEliminar.addEventListener("click", () => {
    cerrarModalEliminar(true);
});

botonCancelarEliminar.addEventListener("click", () => {
    cerrarModalEliminar(false);
});

modalEliminar.addEventListener("click", (e) => {

    if (e.target === modalEliminar) {
        cerrarModalEliminar(false);
    }

});


// ==========================================
// CANCELAR EDICIÓN DE PRODUCTOS
// ==========================================

const botonCancelar = document.createElement("button");

botonCancelar.type = "button";
botonCancelar.textContent = "CANCELAR EDICIÓN";
botonCancelar.className = "boton-cancelar";
botonCancelar.style.display = "none";

formulario.appendChild(botonCancelar);

botonCancelar.addEventListener("click", cancelarEdicion);


// ==========================================
// VISTA PREVIA DE IMAGEN
// ==========================================

inputImagen.addEventListener("input", () => {

    const url = inputImagen.value.trim();

    if (url) {
        vistaPrevia.src = url;
        vistaPrevia.style.display = "block";
    } else {
        vistaPrevia.style.display = "none";
        vistaPrevia.src = "";
    }

});

vistaPrevia.addEventListener("error", () => {
    vistaPrevia.style.display = "none";
});


// ==========================================
// VERIFICAR SI EL USUARIO ES EMPLEADO
// ==========================================

onAuthStateChanged(auth, async (usuario) => {

    if (!usuario) {
        window.location.href = "login.html";
        return;
    }

    try {

        const respuestaUsuarios = await solicitarAPI(`${API}/usuarios`);
        const usuarios = obtenerLista(respuestaUsuarios);

        const usuarioSQL = usuarios.find(
            u => obtenerPropiedad(u, "firebaseUid") === usuario.uid
        );

        const rol = obtenerPropiedad(usuarioSQL, "rol");

        if (!usuarioSQL || String(rol).toLowerCase() !== "empleado") {

            await signOut(auth);

            window.location.href = "login.html";

            return;
        }

        await cargarMarcas();
        await cargarProductos();
        await cargarUsuarios();
        await cargarPedidos();
        await cargarVentas();

    } catch (error) {

        console.error("Error al verificar empleado:", error);

        mensaje.textContent =
            "No se pudo verificar el acceso al panel. Revisá la conexión con la API.";

    }

});


// ==========================================
// CARGAR MARCAS
// ==========================================

async function cargarMarcas() {

    try {

        inputMarca.innerHTML = `
            <option value="">Cargando marcas...</option>
        `;

        const respuesta = await solicitarAPI(`${API}/Marcas`);
        const marcas = obtenerLista(respuesta);

        marcasGuardadas.clear();

        inputMarca.innerHTML = `
            <option value="">Seleccionar marca</option>
        `;

        marcas.forEach(marca => {

            const id = Number(obtenerPropiedad(marca, "marcaId"));
            const activa = obtenerPropiedad(marca, "activa");

            marcasGuardadas.set(id, marca);

            if (activa === false) {
                return;
            }

            const opcion = document.createElement("option");

            opcion.value = id;
            opcion.textContent = obtenerPropiedad(marca, "nombre") || "";

            inputMarca.appendChild(opcion);

        });

        if (inputMarca.options.length === 1) {

            inputMarca.innerHTML = `
                <option value="">No hay marcas activas</option>
            `;

        }

    } catch (error) {

        console.error("Error al cargar marcas:", error);

        inputMarca.innerHTML = `
            <option value="">No se pudieron cargar las marcas</option>
        `;

        throw error;
    }

}


// ==========================================
// CARGAR PRODUCTOS
// ==========================================

async function cargarProductos() {

    try {

        listaProductos.innerHTML = `
            <tr>
                <td colspan="6">Cargando productos...</td>
            </tr>
        `;

        const respuesta = await solicitarAPI(`${API}/todos`);
        const productos = obtenerLista(respuesta);

        listaProductos.innerHTML = "";

        contadorProductos.textContent = productos.length;

        productosGuardados.clear();

        if (productos.length === 0) {

            listaProductos.innerHTML = `
                <tr>
                    <td colspan="6">Todavía no hay productos registrados.</td>
                </tr>
            `;

            return;
        }

        productos.forEach(producto => {

            const id = Number(obtenerPropiedad(producto, "productoId"));
            const marcaId = Number(obtenerPropiedad(producto, "marcaId"));

            productosGuardados.set(id, producto);

            const fila = document.createElement("tr");

            const nombre = document.createElement("td");
            nombre.textContent = obtenerPropiedad(producto, "nombre") || "";

            const marca = document.createElement("td");

            const marcaProducto = marcasGuardadas.get(marcaId);

            marca.textContent =
                obtenerPropiedad(marcaProducto, "nombre") || "Sin marca";

            const precio = document.createElement("td");
            precio.textContent = formatearPrecio(
                obtenerPropiedad(producto, "precio")
            );

            const categoria = document.createElement("td");
            categoria.textContent =
                obtenerPropiedad(producto, "categoria") || "";

            const stock = document.createElement("td");
            stock.textContent =
                obtenerPropiedad(producto, "stock") ?? 0;

            const acciones = document.createElement("td");


            // EDITAR

            const botonEditar = document.createElement("button");

            botonEditar.type = "button";
            botonEditar.textContent = "Editar";
            botonEditar.className = "boton-editar";

            botonEditar.addEventListener("click", () => {
                editarProducto(id);
            });


            // ELIMINAR

            const botonEliminar = document.createElement("button");

            botonEliminar.type = "button";
            botonEliminar.textContent = "Eliminar";
            botonEliminar.className = "boton-eliminar";

            botonEliminar.addEventListener("click", () => {
                eliminarProducto(id);
            });

            acciones.append(botonEditar, botonEliminar);

            fila.append(
                nombre,
                marca,
                precio,
                categoria,
                stock,
                acciones
            );

            listaProductos.appendChild(fila);

        });

    } catch (error) {

        console.error("Error al cargar productos:", error);

        listaProductos.innerHTML = `
            <tr>
                <td colspan="6">No se pudieron cargar los productos.</td>
            </tr>
        `;

    }

}


// ==========================================
// CARGAR USUARIOS
// ==========================================

async function cargarUsuarios() {

    try {

        listaUsuarios.innerHTML = `
            <tr>
                <td colspan="6">Cargando usuarios...</td>
            </tr>
        `;

        const respuesta = await solicitarAPI(`${API}/usuarios`);
        const usuarios = obtenerLista(respuesta);

        listaUsuarios.innerHTML = "";
        mensajeUsuarios.textContent = "";

        if (usuarios.length === 0) {

            listaUsuarios.innerHTML = `
                <tr>
                    <td colspan="6">Todavía no hay usuarios registrados.</td>
                </tr>
            `;

            return;
        }

        usuarios.forEach(usuario => {

            const idUsuario = obtenerPropiedad(usuario, "usuarioId");

            const fila = document.createElement("tr");

            const fechaValor = obtenerPropiedad(usuario, "fechaRegistro");

            const fecha = fechaValor
                ? new Date(fechaValor).toLocaleDateString("es-AR")
                : "Sin fecha";

            const id = document.createElement("td");
            id.textContent = idUsuario;

            const nombre = document.createElement("td");
            nombre.textContent = obtenerPropiedad(usuario, "nombre") || "";

            const email = document.createElement("td");
            email.textContent = obtenerPropiedad(usuario, "email") || "";

            const rol = document.createElement("td");
            rol.textContent = obtenerPropiedad(usuario, "rol") || "";

            const fechaRegistro = document.createElement("td");
            fechaRegistro.textContent = fecha;

            const acciones = document.createElement("td");


            // EDITAR USUARIO

            const botonEditar = document.createElement("button");

            botonEditar.type = "button";
            botonEditar.textContent = "Editar";
            botonEditar.className = "boton-editar";

            botonEditar.addEventListener("click", () => {
                editarUsuario(usuario);
            });


            // SELECTOR DE ROL

            const selectorRol = document.createElement("select");

            selectorRol.className = "selector-rol";

            const opcionCliente = document.createElement("option");
            opcionCliente.value = "Cliente";
            opcionCliente.textContent = "Cliente";

            const opcionEmpleado = document.createElement("option");
            opcionEmpleado.value = "Empleado";
            opcionEmpleado.textContent = "Empleado";

            selectorRol.append(opcionCliente, opcionEmpleado);

            const rolActual = String(
                obtenerPropiedad(usuario, "rol") || ""
            ).toLowerCase();

            selectorRol.value =
                rolActual === "empleado" ? "Empleado" : "Cliente";


            // GUARDAR ROL

            const botonGuardarRol = document.createElement("button");

            botonGuardarRol.type = "button";
            botonGuardarRol.textContent = "Guardar rol";
            botonGuardarRol.className = "boton-editar";

            botonGuardarRol.addEventListener("click", async () => {

                const nuevoRol = selectorRol.value;
                const rolAnterior = obtenerPropiedad(usuario, "rol");

                if (nuevoRol === rolAnterior) {

                    mensajeUsuarios.textContent =
                        "El usuario ya tiene ese rol.";

                    return;
                }

                botonGuardarRol.disabled = true;
                botonGuardarRol.textContent = "Guardando...";

                mensajeUsuarios.textContent = "";

                try {

                    await solicitarAPI(
                        `${API}/usuarios/${idUsuario}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                nombre: obtenerPropiedad(usuario, "nombre"),
                                email: obtenerPropiedad(usuario, "email"),
                                rol: nuevoRol
                            })
                        }
                    );

                    mensajeUsuarios.textContent =
                        `¡El rol de ${obtenerPropiedad(usuario, "nombre")} se actualizó correctamente!`;

                    await cargarUsuarios();

                } catch (error) {

                    console.error("Error al cambiar el rol:", error);

                    mensajeUsuarios.textContent =
                        error.message || "No se pudo actualizar el rol.";

                    botonGuardarRol.disabled = false;
                    botonGuardarRol.textContent = "Guardar rol";

                }

            });

            acciones.append(
                botonEditar,
                selectorRol,
                botonGuardarRol
            );

            fila.append(
                id,
                nombre,
                email,
                rol,
                fechaRegistro,
                acciones
            );

            listaUsuarios.appendChild(fila);

        });

    } catch (error) {

        console.error("Error al cargar usuarios:", error);

        listaUsuarios.innerHTML = `
            <tr>
                <td colspan="6">No se pudieron cargar los usuarios.</td>
            </tr>
        `;

        mensajeUsuarios.textContent = error.message;

    }

}


// ==========================================
// EDITAR USUARIO
// ==========================================

function editarUsuario(usuario) {

    usuarioEditando = usuario;

    inputNuevoNombre.value =
        obtenerPropiedad(usuario, "nombre") || "";

    mensajeEditarUsuario.textContent = "";

    modalEditarUsuario.hidden = false;

    inputNuevoNombre.focus();

}


function cerrarModalUsuario() {

    modalEditarUsuario.hidden = true;

    formularioEditarUsuario.reset();

    mensajeEditarUsuario.className = "";
    mensajeEditarUsuario.textContent = "";

    usuarioEditando = null;

    botonGuardarEditarUsuario.disabled = false;
    botonGuardarEditarUsuario.textContent = "Guardar cambios";

}


botonCerrarModalUsuario.addEventListener("click", cerrarModalUsuario);

botonCancelarEditarUsuario.addEventListener("click", cerrarModalUsuario);

modalEditarUsuario.addEventListener("click", (e) => {

    if (e.target === modalEditarUsuario) {
        cerrarModalUsuario();
    }

});


// ==========================================
// GUARDAR CAMBIOS DEL USUARIO
// ==========================================

formularioEditarUsuario.addEventListener("submit", async (e) => {

    e.preventDefault();

    if (!usuarioEditando) return;

    const nuevoNombre = inputNuevoNombre.value.trim();

    if (!nuevoNombre) {

        mensajeEditarUsuario.textContent =
            "Ingresá un nombre válido.";

        return;
    }

    botonGuardarEditarUsuario.disabled = true;
    botonGuardarEditarUsuario.textContent = "Guardando...";

    mensajeEditarUsuario.textContent = "";

    try {

        await solicitarAPI(
            `${API}/usuarios/${obtenerPropiedad(usuarioEditando, "usuarioId")}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nombre: nuevoNombre,
                    email: obtenerPropiedad(usuarioEditando, "email"),
                    rol: obtenerPropiedad(usuarioEditando, "rol")
                })
            }
        );

        await cargarUsuarios();

        mensajeEditarUsuario.className = "mensaje-exito-usuario";

        mensajeEditarUsuario.textContent =
            "¡Usuario actualizado correctamente!";

        botonGuardarEditarUsuario.disabled = true;
        botonGuardarEditarUsuario.textContent = "Guardado";

        setTimeout(() => {
            cerrarModalUsuario();
        }, 1500);

    } catch (error) {

        console.error("Error al actualizar usuario:", error);

        mensajeEditarUsuario.textContent = error.message;

        botonGuardarEditarUsuario.disabled = false;
        botonGuardarEditarUsuario.textContent = "Guardar cambios";

    }

});


// ==========================================
// OBTENER DATOS DEL FORMULARIO
// ==========================================

function obtenerDatosFormulario() {

    return {

        nombre: inputNombre.value.trim(),

        marcaId: Number(inputMarca.value),

        precio: Number(inputPrecio.value),

        categoria: inputCategoria.value,

        stock: Number(inputStock.value),

        imagen: inputImagen.value.trim(),

        descripcion: inputDescripcion.value.trim()

    };

}


// ==========================================
// VALIDAR DATOS DEL PRODUCTO
// ==========================================

function datosValidos(producto) {

    if (
        !producto.nombre ||
        !producto.marcaId ||
        !producto.categoria ||
        !producto.imagen ||
        !producto.descripcion ||
        !Number.isFinite(producto.precio) ||
        producto.precio <= 0 ||
        !Number.isInteger(producto.stock) ||
        producto.stock < 0
    ) {

        mensaje.textContent =
            "Completá correctamente todos los campos.";

        return false;
    }

    if (
        producto.categoria !== "Masculino" &&
        producto.categoria !== "Femenino" &&
        producto.categoria !== "Unisex"
    ) {

        mensaje.textContent =
            "Seleccioná una categoría válida.";

        return false;
    }

    const marca = marcasGuardadas.get(producto.marcaId);

    const productoOriginal = productoEditandoId !== null
        ? productosGuardados.get(productoEditandoId)
        : null;

    const conservaMarcaActual =
        productoOriginal &&
        Number(obtenerPropiedad(productoOriginal, "marcaId")) === producto.marcaId;

    if (!marca || (obtenerPropiedad(marca, "activa") === false && !conservaMarcaActual)) {

        mensaje.textContent =
            "Seleccioná una marca activa.";

        return false;
    }

    try {

        const url = new URL(producto.imagen);

        if (
            url.protocol !== "https:" &&
            url.protocol !== "http:"
        ) {

            mensaje.textContent =
                "Ingresá un enlace válido de imagen.";

            return false;
        }

    } catch {

        mensaje.textContent =
            "Ingresá una URL de imagen válida.";

        return false;
    }

    return true;

}


// ==========================================
// AGREGAR O EDITAR PRODUCTO
// ==========================================

formulario.addEventListener("submit", async (e) => {

    e.preventDefault();

    mensaje.textContent = "";

    const producto = obtenerDatosFormulario();

    if (!datosValidos(producto)) return;

    const estabaEditando = productoEditandoId !== null;

    botonAgregar.disabled = true;
    botonAgregar.textContent = "GUARDANDO...";

    try {

        if (estabaEditando) {

            await solicitarAPI(
                `${API}?id=${productoEditandoId}`,
                {
                    method: "PUT",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(producto)
                }
            );

            mensaje.textContent =
                "¡Producto actualizado correctamente!";

        } else {

            await solicitarAPI(
                API,
                {
                    method: "POST",

                    headers: {
                        "Content-Type": "application/json"
                    },

                    body: JSON.stringify(producto)
                }
            );

            mensaje.textContent =
                "¡Producto agregado correctamente!";

        }

        cancelarEdicion();

        await cargarProductos();

    } catch (error) {

        console.error("Error al guardar producto:", error);

        mensaje.textContent =
            error.message || "No se pudo guardar el producto.";

    } finally {

        botonAgregar.disabled = false;
        botonAgregar.textContent = "AGREGAR PRODUCTO →";

    }

});


// ==========================================
// PREPARAR EDICIÓN DE PRODUCTO
// ==========================================

function editarProducto(id) {

    const producto = productosGuardados.get(id);

    if (!producto) return;

    productoEditandoId = id;

    inputNombre.value =
        obtenerPropiedad(producto, "nombre") || "";

    const marcaId = Number(obtenerPropiedad(producto, "marcaId"));

    inputMarca.value = marcaId;

    if (!inputMarca.value && marcaId) {

        const marca = marcasGuardadas.get(marcaId);

        const opcion = document.createElement("option");

        opcion.value = marcaId;
        opcion.textContent =
            obtenerPropiedad(marca, "nombre") || "Marca actual";

        opcion.selected = true;

        inputMarca.appendChild(opcion);
    }

    inputPrecio.value =
        obtenerPropiedad(producto, "precio") ?? "";

    inputCategoria.value =
        obtenerPropiedad(producto, "categoria") || "";

    inputStock.value =
        obtenerPropiedad(producto, "stock") ?? 0;

    inputImagen.value =
        obtenerPropiedad(producto, "imagen") || "";

    inputDescripcion.value =
        obtenerPropiedad(producto, "descripcion") || "";

    if (inputImagen.value) {

        vistaPrevia.src = inputImagen.value;
        vistaPrevia.style.display = "block";

    } else {

        vistaPrevia.src = "";
        vistaPrevia.style.display = "none";

    }

    botonAgregar.textContent = "GUARDAR CAMBIOS";

    botonCancelar.style.display = "block";

    mensaje.textContent =
        "Estás editando: " + inputNombre.value;

    formulario.scrollIntoView({
        behavior: "smooth",
        block: "center"
    });

}


// ==========================================
// CANCELAR EDICIÓN DE PRODUCTO
// ==========================================

function cancelarEdicion() {

    productoEditandoId = null;

    formulario.reset();

    vistaPrevia.src = "";
    vistaPrevia.style.display = "none";

    botonAgregar.textContent = "AGREGAR PRODUCTO →";

    botonCancelar.style.display = "none";

    Array.from(inputMarca.options).forEach(opcion => {

        const marcaId = Number(opcion.value);
        const marca = marcasGuardadas.get(marcaId);

        if (marca && obtenerPropiedad(marca, "activa") === false) {
            opcion.remove();
        }

    });

}


// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

async function eliminarProducto(id) {

    const producto = productosGuardados.get(id);

    if (!producto) return;

    const nombreProducto =
        obtenerPropiedad(producto, "nombre") || "este producto";

    const confirmar = await abrirModalEliminar(nombreProducto);

    if (!confirmar) return;

    try {

        await solicitarAPI(
            `${API}/${id}`,
            {
                method: "DELETE"
            }
        );

        if (productoEditandoId === id) {
            cancelarEdicion();
        }

        await cargarProductos();

        await Swal.fire({
            title: "¡Producto eliminado!",
            text: "El perfume se eliminó correctamente.",
            icon: "success",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#80674F",
            background: "#F3EADF",
            color: "#594333"
        });

        mensaje.textContent = "";

    } catch (error) {

        console.error("Error al eliminar:", error);

        await Swal.fire({
            title: "No se puede eliminar",
            text: error.message || "Este perfume está relacionado con pedidos o ventas y no se puede eliminar.",
            icon: "warning",
            confirmButtonText: "Entendido",
            confirmButtonColor: "#80674F",
            background: "#F3EADF",
            color: "#594333"
        });

    }

}


// ==========================================
// CARGAR PEDIDOS
// ==========================================

async function cargarPedidos() {

    try {

        listaPedidos.innerHTML = `
            <tr>
                <td colspan="5">Cargando pedidos...</td>
            </tr>
        `;

        const respuesta = await solicitarAPI(
            `${API}/pedidos`,
            {},
            true
        );

        pedidosGlobales = obtenerLista(respuesta);

        configurarFiltrosPedidos();

        renderizarPedidos(pedidosGlobales, filtroActualPedidos);

    } catch (error) {

        console.error("Error al cargar pedidos:", error);

        listaPedidos.innerHTML = `
            <tr>
                <td colspan="5">
                    No se pudieron cargar los pedidos.
                    Revisá la consola y el endpoint /pedidos.
                </td>
            </tr>
        `;

    }

}


// ==========================================
// CONFIGURAR FILTROS DE PEDIDOS
// ==========================================

function configurarFiltrosPedidos() {

    botonesFiltros.forEach(boton => {

        boton.onclick = () => {

            botonesFiltros.forEach(b => {
                b.classList.remove("activo");
            });

            boton.classList.add("activo");

            filtroActualPedidos = boton.dataset.estado;

            renderizarPedidos(
                pedidosGlobales,
                filtroActualPedidos
            );

        };

    });

}


// ==========================================
// NORMALIZAR ESTADO
// ==========================================

function normalizarEstado(estado) {

    return String(estado || "")
        .trim()
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");

}


// ==========================================
// COMPROBAR FILTRO DE PEDIDOS
// ==========================================

function coincideFiltro(estado, filtro) {

    const estadoNormalizado = normalizarEstado(estado);

    if (filtro === "todos") {
        return true;
    }

    if (filtro === "activo") {
        return [
            "activo",
            "activa",
            "en proceso",
            "confirmado",
            "confirmada"
        ].includes(estadoNormalizado);
    }

    if (filtro === "pendiente") {
        return estadoNormalizado === "pendiente";
    }

    if (filtro === "cancelado") {
        return [
            "cancelado",
            "cancelada"
        ].includes(estadoNormalizado);
    }

    return estadoNormalizado === filtro;

}


// ==========================================
// RENDERIZAR PEDIDOS
// ==========================================

function renderizarPedidos(pedidos, estadoFiltro) {

    listaPedidos.innerHTML = "";

    const filtrados = pedidos.filter(pedido => {

        const estado = obtenerPropiedad(pedido, "estado");

        return coincideFiltro(estado, estadoFiltro);

    });

    if (filtrados.length === 0) {

        listaPedidos.innerHTML = `
            <tr>
                <td colspan="5">
                    No hay pedidos en esta categoría.
                </td>
            </tr>
        `;

        return;
    }

    filtrados.forEach(pedido => {

        const id = obtenerPropiedad(
            pedido,
            "pedidoId",
            "idPedido",
            "id"
        );

        const fechaValor = obtenerPropiedad(pedido, "fecha");

        const fecha = fechaValor
            ? new Date(fechaValor).toLocaleDateString("es-AR")
            : "Sin fecha";

        const estado = obtenerPropiedad(pedido, "estado") || "Pendiente";

        const total = obtenerPropiedad(pedido, "total") ?? 0;

        const fila = document.createElement("tr");

        const celdaId = document.createElement("td");
        celdaId.textContent = `#${id ?? ""}`;

        const celdaFecha = document.createElement("td");
        celdaFecha.textContent = fecha;

        const celdaEstado = document.createElement("td");

        const etiquetaEstado = document.createElement("span");

        etiquetaEstado.className =
            `badge-estado estado-${normalizarEstado(estado).replace(/\s+/g, "-")}`;

        etiquetaEstado.textContent = estado;

        celdaEstado.appendChild(etiquetaEstado);

        const celdaTotal = document.createElement("td");
        celdaTotal.textContent = formatearPrecio(total);

        const celdaAcciones = document.createElement("td");

        const selectorEstado = document.createElement("select");

        selectorEstado.className = "selector-estado";

        const estadosDisponibles = [
            "Pendiente",
            "Confirmado",
            "Cancelado",
            "Entregado"
        ];

        if (
            !estadosDisponibles.some(
                e => normalizarEstado(e) === normalizarEstado(estado)
            )
        ) {
            estadosDisponibles.push(estado);
        }

        estadosDisponibles.forEach(nombreEstado => {

            const opcion = document.createElement("option");

            opcion.value = nombreEstado;
            opcion.textContent = nombreEstado;

            selectorEstado.appendChild(opcion);

        });

        selectorEstado.value = estado;

        selectorEstado.addEventListener("change", async () => {

            if (id === undefined || id === null) {
                alert("No se encontró el ID del pedido.");
                return;
            }

            await cambiarEstadoPedido(
                id,
                selectorEstado.value,
                selectorEstado,
                estado
            );

        });


        // BOTÓN VER DETALLE

        const botonDetalle = document.createElement("button");

        botonDetalle.type = "button";
        botonDetalle.textContent = "Ver detalle";
        botonDetalle.className = "boton-editar";

        botonDetalle.addEventListener("click", () => {
            verDetallePedido(id);
        });

        celdaAcciones.append(
            botonDetalle,
            selectorEstado
        );

        fila.append(
            celdaId,
            celdaFecha,
            celdaEstado,
            celdaTotal,
            celdaAcciones
        );

        listaPedidos.appendChild(fila);

    });

}


// ==========================================
// VER DETALLE DE UN PEDIDO
// ==========================================

async function verDetallePedido(idPedido) {

    try {

        const pedido = await solicitarAPI(
            `${API}/pedidos/${idPedido}`,
            {},
            true
        );

        if (!pedido) {
            throw new Error("No se encontró el pedido.");
        }

        const detalles = obtenerPropiedad(
            pedido,
            "detallePedidos",
            "detalles"
        ) || [];

        const estado = obtenerPropiedad(pedido, "estado") || "Sin estado";

        const fechaValor = obtenerPropiedad(pedido, "fecha");

        const fecha = fechaValor
            ? new Date(fechaValor).toLocaleDateString("es-AR")
            : "Sin fecha";

        const total = obtenerPropiedad(pedido, "total") || 0;

        if (detalles.length === 0) {

            await Swal.fire({
                title: `Pedido #${idPedido}`,
                text: "Este pedido no tiene productos registrados.",
                icon: "info",
                confirmButtonColor: "#80674F",
                background: "#F3EADF",
                color: "#594333"
            });

            return;
        }

        const filas = detalles.map(detalle => {

            const producto = obtenerPropiedad(
                detalle,
                "producto"
            );

            const nombre = obtenerPropiedad(
                producto,
                "nombre"
            ) || "Producto sin nombre";

            const cantidad = Number(
                obtenerPropiedad(detalle, "cantidad")
            ) || 0;

            const precio = Number(
                obtenerPropiedad(detalle, "precioUnitario")
            ) || 0;

            const subtotal = cantidad * precio;

            return `
                <tr>
                    <td style="padding: 10px; border-bottom: 1px solid #D8C7B3;">
                        ${escaparHTML(nombre)}
                    </td>

                    <td style="padding: 10px; border-bottom: 1px solid #D8C7B3;">
                        ${cantidad}
                    </td>

                    <td style="padding: 10px; border-bottom: 1px solid #D8C7B3;">
                        ${formatearPrecio(precio)}
                    </td>

                    <td style="padding: 10px; border-bottom: 1px solid #D8C7B3;">
                        ${formatearPrecio(subtotal)}
                    </td>
                </tr>
            `;

        }).join("");

        await Swal.fire({

            title: `Detalle del pedido #${idPedido}`,

            html: `
                <div style="text-align: left;">

                    <p>
                        <strong>Fecha:</strong> ${escaparHTML(fecha)}
                    </p>

                    <p>
                        <strong>Estado:</strong> ${escaparHTML(estado)}
                    </p>

                    <div style="overflow-x: auto; margin-top: 20px;">

                        <table style="
                            width: 100%;
                            border-collapse: collapse;
                            font-size: 13px;
                        ">

                            <thead>
                                <tr style="background: #E8D9C8;">
                                    <th style="padding: 10px;">Producto</th>
                                    <th style="padding: 10px;">Cantidad</th>
                                    <th style="padding: 10px;">Precio</th>
                                    <th style="padding: 10px;">Subtotal</th>
                                </tr>
                            </thead>

                            <tbody>
                                ${filas}
                            </tbody>

                        </table>

                    </div>

                    <h3 style="
                        text-align: right;
                        margin-top: 20px;
                        color: #594333;
                    ">
                        Total: ${formatearPrecio(total)}
                    </h3>

                </div>
            `,

            confirmButtonText: "Cerrar",

            confirmButtonColor: "#80674F",

            background: "#F3EADF",

            color: "#594333",

            width: "750px"

        });

    } catch (error) {

        console.error("Error al obtener el detalle del pedido:", error);

        await Swal.fire({
            title: "No se pudo cargar el pedido",
            text: error.message || "Ocurrió un error al consultar el detalle.",
            icon: "error",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#80674F",
            background: "#F3EADF",
            color: "#594333"
        });

    }

}


// ==========================================
// CAMBIAR ESTADO DEL PEDIDO
// ==========================================

async function cambiarEstadoPedido(
    idPedido,
    nuevoEstado,
    selector,
    estadoAnterior
) {

    const confirmacion = await Swal.fire({
        title: "¿Cambiar estado del pedido?",
        html: `¿Querés cambiar el pedido <strong>#${idPedido}</strong> de <strong>${estadoAnterior}</strong> a <strong>${nuevoEstado}</strong>?`,
        icon: "question",
        showCancelButton: true,
        confirmButtonText: "Sí, cambiar estado",
        cancelButtonText: "Cancelar",
        confirmButtonColor: "#80674F",
        cancelButtonColor: "#a8a29e",
        background: "#F3EADF",
        color: "#594333",
        reverseButtons: true
    });

    if (!confirmacion.isConfirmed) {
        selector.value = estadoAnterior;
        return;
    }

    selector.disabled = true;

    try {

        await solicitarAPI(
            `${API}/pedidos/${idPedido}`,
            {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    estado: nuevoEstado
                })
            },
            true
        );

        await cargarPedidos();

        if (normalizarEstado(nuevoEstado) === "confirmado") {
            await cargarVentas();
        }

        await cargarProductos();

        await Swal.fire({
            title: "¡Estado actualizado!",
            html: `El pedido <strong>#${idPedido}</strong> cambió correctamente de <strong>${estadoAnterior}</strong> a <strong>${nuevoEstado}</strong>.`,
            icon: "success",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#80674F",
            background: "#F3EADF",
            color: "#594333"
        });

    } catch (error) {

        console.error("Error al cambiar estado:", error);

        selector.value = estadoAnterior;
        selector.disabled = false;

        await Swal.fire({
            title: "No se pudo cambiar el estado",
            text: error.message || "Ocurrió un error al actualizar el pedido.",
            icon: "error",
            confirmButtonText: "Aceptar",
            confirmButtonColor: "#80674F",
            background: "#F3EADF",
            color: "#594333"
        });

    }

}


// ==========================================
// CARGAR VENTAS REALES
// ==========================================

async function cargarVentas() {

    try {

        const respuesta = await solicitarAPI(`${API}/ventas`);

        const ventas = obtenerLista(respuesta);

        renderizarMasVendidos(ventas);

    } catch (error) {

        console.error("Error al cargar ventas:", error);

        if (graficoMasVendidos) {
            graficoMasVendidos.destroy();
            graficoMasVendidos = null;
        }

        if (graficoTortaMasVendidos) {
            graficoTortaMasVendidos.destroy();
            graficoTortaMasVendidos = null;
        }

        console.error("No se pudieron cargar las estadísticas de ventas.");

    }

}


// ==========================================
// PRODUCTOS MÁS VENDIDOS
// ==========================================

function renderizarMasVendidos(ventas) {

    // Destruir los gráficos anteriores para evitar duplicados

    if (graficoMasVendidos) {
        graficoMasVendidos.destroy();
        graficoMasVendidos = null;
    }

    if (graficoTortaMasVendidos) {
        graficoTortaMasVendidos.destroy();
        graficoTortaMasVendidos = null;
    }

    if (!ventas || ventas.length === 0) {
        console.log("Todavía no hay ventas registradas.");
        return;
    }

    const ranking = new Map();

    ventas.forEach(venta => {

        const nombreDirecto = obtenerPropiedad(
            venta,
            "nombrePerfume",
            "nombreProducto",
            "producto"
        );

        const cantidadDirecta = obtenerPropiedad(
            venta,
            "cantidadTotal",
            "cantidadVendida"
        );

        const recaudacionDirecta = obtenerPropiedad(
            venta,
            "recaudacionTotal"
        );


        // CASO 1: LA API YA DEVUELVE LOS PRODUCTOS AGRUPADOS

        if (
            typeof nombreDirecto === "string" &&
            cantidadDirecta !== undefined
        ) {

            const clave = nombreDirecto.toLowerCase();

            const existente = ranking.get(clave) || {
                nombre: nombreDirecto,
                cantidad: 0,
                recaudacion: 0
            };

            existente.cantidad += Number(cantidadDirecta) || 0;

            existente.recaudacion +=
                Number(recaudacionDirecta) || 0;

            ranking.set(clave, existente);

            return;
        }


        // CASO 2: LA VENTA CONTIENE UNA LISTA DE DETALLES

        const detalles = obtenerPropiedad(
            venta,
            "detalleVenta",
            "detalleVentas",
            "detalles",
            "items"
        );

        if (Array.isArray(detalles)) {

            detalles.forEach(detalle => {

                const productoId = Number(
                    obtenerPropiedad(detalle, "productoId")
                );

                const producto = productosGuardados.get(productoId);

                const productoAnidado = obtenerPropiedad(
                    detalle,
                    "producto"
                );

                const nombre =
                    obtenerPropiedad(productoAnidado, "nombre") ||
                    obtenerPropiedad(producto, "nombre") ||
                    "Producto sin nombre";

                const cantidad = Number(
                    obtenerPropiedad(detalle, "cantidad")
                ) || 0;

                const precioUnitario = Number(
                    obtenerPropiedad(detalle, "precioUnitario", "precio")
                ) || 0;

                const clave = String(productoId || nombre).toLowerCase();

                const existente = ranking.get(clave) || {
                    nombre,
                    cantidad: 0,
                    recaudacion: 0
                };

                existente.cantidad += cantidad;

                existente.recaudacion +=
                    cantidad * precioUnitario;

                ranking.set(clave, existente);

            });

            return;
        }


        // CASO 3: LA API DEVUELVE CADA DETALLE COMO UN REGISTRO INDIVIDUAL

        const productoId = Number(
            obtenerPropiedad(venta, "productoId")
        );

        const producto = productosGuardados.get(productoId);

        const productoAnidado = obtenerPropiedad(venta, "producto");

        const nombre =
            obtenerPropiedad(productoAnidado, "nombre") ||
            obtenerPropiedad(producto, "nombre") ||
            (typeof nombreDirecto === "string" ? nombreDirecto : null);

        if (!nombre) {
            return;
        }

        const cantidad = Number(
            obtenerPropiedad(venta, "cantidad")
        ) || 0;

        const precio = Number(
            obtenerPropiedad(venta, "precioUnitario", "precio")
        ) || 0;

        const clave = String(productoId || nombre).toLowerCase();

        const existente = ranking.get(clave) || {
            nombre,
            cantidad: 0,
            recaudacion: 0
        };

        existente.cantidad += cantidad;
        existente.recaudacion += cantidad * precio;

        ranking.set(clave, existente);

    });


    // ORDENAR PRODUCTOS DE MAYOR A MENOR CANTIDAD VENDIDA

    const productosOrdenados = Array.from(ranking.values())
        .sort((a, b) => b.cantidad - a.cantidad);


    if (productosOrdenados.length === 0) {
        console.log(
            "Hay ventas registradas, pero no se encontraron detalles para calcular los productos vendidos."
        );
        return;
    }


    // ==========================================
    // VERIFICAR DISPONIBILIDAD DE CHART.JS
    // ==========================================

    if (typeof Chart === "undefined") {
        console.error("Chart.js no está disponible.");
        return;
    }


    // ==========================================
    // GRÁFICO DE BARRAS
    // ==========================================

    if (canvasMasVendidos) {

        graficoMasVendidos = new Chart(canvasMasVendidos, {

            type: "bar",

            data: {

                labels: productosOrdenados.map(producto => producto.nombre),

                datasets: [

                    {
                        label: "Unidades vendidas",

                        data: productosOrdenados.map(producto => producto.cantidad),

                        backgroundColor: "#A88B6A",

                        borderColor: "#80674F",

                        borderWidth: 1,

                        borderRadius: 6

                    }

                ]

            },

            options: {

                indexAxis: "y",

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {
                        display: false
                    },

                    title: {

                        display: true,

                        text: "Ranking de perfumes más vendidos",

                        color: "#594333",

                        font: {
                            size: 16
                        }

                    }

                },

                scales: {

                    x: {

                        beginAtZero: true,

                        ticks: {
                            precision: 0
                        },

                        title: {
                            display: true,
                            text: "Unidades vendidas"
                        }

                    },

                    y: {

                        ticks: {
                            color: "#594333"
                        }

                    }

                }

            }

        });

    } else {

        console.error("No se encontró el canvas del gráfico de barras.");

    }


    // ==========================================
    // GRÁFICO DE TORTA
    // ==========================================

    if (canvasTortaMasVendidos) {

        graficoTortaMasVendidos = new Chart(canvasTortaMasVendidos, {

            type: "pie",

            data: {

                labels: productosOrdenados.map(producto => producto.nombre),

                datasets: [

                    {

                        label: "Unidades vendidas",

                        data: productosOrdenados.map(producto => producto.cantidad),

                        backgroundColor: [
                            "#80674F",
                            "#A88B6A",
                            "#C5AA8B",
                            "#D9C5AC",
                            "#E8D9C8",
                            "#B69A7A",
                            "#92775C",
                            "#D0B99D",
                            "#6F5844",
                            "#E2CEB6"
                        ],

                        borderColor: "#F3EADF",

                        borderWidth: 2

                    }

                ]

            },

            options: {

                responsive: true,

                maintainAspectRatio: false,

                plugins: {

                    legend: {

                        position: "bottom",

                        labels: {

                            color: "#594333",

                            padding: 15,

                            usePointStyle: true

                        }

                    },

                    title: {

                        display: true,

                        text: "Distribución de unidades vendidas",

                        color: "#594333",

                        font: {
                            size: 16
                        }

                    },

                    tooltip: {

                        callbacks: {

                            label: function(context) {

                                const cantidad = context.raw;

                                const total = context.dataset.data.reduce(
                                    (acumulado, valor) => acumulado + valor,
                                    0
                                );

                                const porcentaje = total > 0
                                    ? ((cantidad / total) * 100).toFixed(1)
                                    : 0;

                                return ` ${context.label}: ${cantidad} unidades (${porcentaje}%)`;

                            }

                        }

                    }

                }

            }

        });

    } else {

        console.error("No se encontró el canvas del gráfico de torta.");

    }

}


// ==========================================
// CERRAR SESIÓN
// ==========================================

botonCerrarSesion.addEventListener("click", async () => {

    try {

        await signOut(auth);

        window.location.href = "login.html";

    } catch (error) {

        console.error("Error al cerrar sesión:", error);

        mensaje.textContent =
            "No se pudo cerrar la sesión.";

    }

});


// ==========================================
// CERRAR MODALES CON ESCAPE
// ==========================================

document.addEventListener("keydown", (e) => {

    if (
        e.key === "Escape" &&
        modalEliminar.classList.contains("activo")
    ) {
        cerrarModalEliminar(false);
    }

    if (
        e.key === "Escape" &&
        !modalEditarUsuario.hidden
    ) {
        cerrarModalUsuario();
    }

});