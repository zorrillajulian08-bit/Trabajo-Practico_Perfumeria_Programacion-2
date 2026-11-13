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
const listaMasVendidos = document.getElementById("lista-mas-vendidos");

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

    // Solamente enviamos el token cuando el endpoint lo requiere.

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

    if (!respuesta.ok) {

        const error = await respuesta.text();

        throw new Error(
            error || `Error en la solicitud: ${respuesta.status}`
        );
    }

    const contenido = await respuesta.text();

    if (!contenido) return null;

    try {
        return JSON.parse(contenido);
    } catch {
        return contenido;
    }
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

        // Cargar toda la información del panel.

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

    const confirmar = await abrirModalEliminar(
        obtenerPropiedad(producto, "nombre") || "este producto"
    );

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

        mensaje.textContent =
            "Producto eliminado correctamente.";

        await cargarProductos();

    } catch (error) {

        console.error("Error al eliminar:", error);

        mensaje.textContent =
            error.message ||
            "No se pudo eliminar el producto. Puede estar relacionado con pedidos o ventas.";

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

        // Este endpoint tiene [Authorize], por eso enviamos el token.

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

        selectorEstado.style.padding = "7px";

        const estadosDisponibles = [
            "Pendiente",
            "Confirmado",
            "Cancelado",
            "Entregado"
        ];

        // Si el pedido tiene otro estado, también lo mostramos.

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

        celdaAcciones.appendChild(selectorEstado);

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
// CAMBIAR ESTADO DEL PEDIDO
// ==========================================

async function cambiarEstadoPedido(
    idPedido,
    nuevoEstado,
    selector,
    estadoAnterior
) {

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
            }
        );

        alert("Estado actualizado correctamente.");

        await cargarPedidos();

    } catch (error) {

        console.error("Error al cambiar estado:", error);

        alert(
            error.message ||
            "No se pudo actualizar el estado del pedido."
        );

        selector.value = estadoAnterior;

        selector.disabled = false;

    }

}


// ==========================================
// CARGAR VENTAS
// ==========================================

async function cargarVentas() {

    try {

        listaMasVendidos.innerHTML = `
            <tr>
                <td colspan="3">Cargando estadísticas...</td>
            </tr>
        `;

        const respuesta = await solicitarAPI(`${API}/ventas`);

        const ventas = obtenerLista(respuesta);

        renderizarMasVendidos(ventas);

    } catch (error) {

        console.error("Error al cargar ventas:", error);

        listaMasVendidos.innerHTML = `
            <tr>
                <td colspan="3">
                    No se pudieron cargar las estadísticas.
                    Revisá el endpoint /ventas.
                </td>
            </tr>
        `;

    }

}


// ==========================================
// PRODUCTOS MÁS VENDIDOS
// ==========================================

function renderizarMasVendidos(ventas) {

    listaMasVendidos.innerHTML = "";

    if (!ventas || ventas.length === 0) {

        listaMasVendidos.innerHTML = `
            <tr>
                <td colspan="3">Todavía no hay ventas registradas.</td>
            </tr>
        `;

        return;
    }

    const ranking = new Map();

    ventas.forEach(venta => {

        // Algunas respuestas pueden traer el ranking ya calculado.

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


        // Obtener detalles de la venta.

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


        // Alternativa si la API devuelve ventas individuales.

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


    // Ordenar de mayor a menor cantidad vendida.

    const productosOrdenados = Array.from(ranking.values())
        .sort((a, b) => b.cantidad - a.cantidad);


    if (productosOrdenados.length === 0) {

        listaMasVendidos.innerHTML = `
            <tr>
                <td colspan="3">
                    Hay ventas registradas, pero la API no está devolviendo
                    los detalles necesarios para calcular los productos vendidos.
                </td>
            </tr>
        `;

        return;
    }


    productosOrdenados.forEach(producto => {

        const fila = document.createElement("tr");

        const nombre = document.createElement("td");
        nombre.textContent = producto.nombre;

        const cantidad = document.createElement("td");
        cantidad.textContent = producto.cantidad;

        const recaudacion = document.createElement("td");
        recaudacion.textContent =
            formatearPrecio(producto.recaudacion);

        fila.append(
            nombre,
            cantidad,
            recaudacion
        );

        listaMasVendidos.appendChild(fila);

    });

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