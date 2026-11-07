
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
// ELEMENTOS DEL MODAL DE USUARIOS
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
// VARIABLES
// ==========================================

let productoEditandoId = null;

let productosGuardados = new Map();

let marcasGuardadas = new Map();

let usuarioEditando = null;


// ==========================================
// ELEMENTOS DEL MODAL DE ELIMINACIÓN
// ==========================================

const modalEliminar = document.getElementById("modal-eliminar");
const textoModal = document.getElementById("modal-mensaje");

const botonConfirmarEliminar = document.getElementById("confirmar-eliminar");
const botonCancelarEliminar = document.getElementById("cancelar-eliminar");

let resolverModal = null;


// ==========================================
// FUNCIÓN AUXILIAR PARA LA API
// ==========================================

async function solicitarAPI(url, opciones = {}) {

    const respuesta = await fetch(url, opciones);

    if (!respuesta.ok) {

        const error = await respuesta.text();

        throw new Error(
            error || `Error en la solicitud: ${respuesta.status}`
        );
    }

    const contenido = await respuesta.text();

    if (!contenido) {
        return null;
    }

    try {
        return JSON.parse(contenido);
    } catch {
        return contenido;
    }
}


// ==========================================
// ABRIR MODAL DE ELIMINACIÓN
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


// ==========================================
// CERRAR MODAL DE ELIMINACIÓN
// ==========================================

function cerrarModalEliminar(confirmado) {

    modalEliminar.classList.remove("activo");
    modalEliminar.setAttribute("aria-hidden", "true");

    if (resolverModal) {
        resolverModal(confirmado);
        resolverModal = null;
    }
}


// ==========================================
// EVENTOS DEL MODAL DE ELIMINACIÓN
// ==========================================

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

document.addEventListener("keydown", (e) => {

    if (
        e.key === "Escape" &&
        modalEliminar.classList.contains("activo")
    ) {
        cerrarModalEliminar(false);
    }

});


// ==========================================
// BOTÓN CANCELAR EDICIÓN DE PRODUCTOS
// ==========================================

const botonCancelar = document.createElement("button");

botonCancelar.type = "button";
botonCancelar.textContent = "CANCELAR EDICIÓN";
botonCancelar.className = "boton-cancelar";
botonCancelar.style.display = "none";

formulario.appendChild(botonCancelar);


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

        const usuarios = await solicitarAPI(`${API}/usuarios`);

        const usuarioSQL = usuarios.find(
            u => u.firebaseUid === usuario.uid
        );

        if (
            !usuarioSQL ||
            usuarioSQL.rol?.toLowerCase() !== "empleado"
        ) {

            await signOut(auth);

            window.location.href = "login.html";

            return;
        }

        await cargarMarcas();
        await cargarProductos();
        await cargarUsuarios();

    } catch (error) {

        console.error("Error al verificar empleado:", error);

        mensaje.textContent =
            "No se pudo verificar el acceso al panel.";

    }

});


// ==========================================
// CARGAR MARCAS DESDE SQL SERVER
// ==========================================

async function cargarMarcas() {

    try {

        inputMarca.innerHTML = `
            <option value="">Cargando marcas...</option>
        `;

        const marcas = await solicitarAPI(`${API}/Marcas`);

        marcasGuardadas.clear();

        inputMarca.innerHTML = `
            <option value="">Seleccionar marca</option>
        `;

        marcas.forEach(marca => {

            marcasGuardadas.set(marca.marcaId, marca);

            if (!marca.activa) {
                return;
            }

            const opcion = document.createElement("option");

            opcion.value = marca.marcaId;
            opcion.textContent = marca.nombre;

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
// CARGAR PRODUCTOS DESDE SQL SERVER
// ==========================================

async function cargarProductos() {

    try {

        listaProductos.innerHTML = `
            <tr>
                <td colspan="6">Cargando productos...</td>
            </tr>
        `;

        const productos = await solicitarAPI(`${API}/todos`);

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

            productosGuardados.set(producto.productoId, producto);

            const fila = document.createElement("tr");

            const nombre = document.createElement("td");
            nombre.textContent = producto.nombre || "";

            const marca = document.createElement("td");

            const marcaProducto = marcasGuardadas.get(producto.marcaId);

            marca.textContent =
                marcaProducto?.nombre || "Sin marca";

            const precio = document.createElement("td");
            precio.textContent = formatearPrecio(producto.precio);

            const categoria = document.createElement("td");
            categoria.textContent = producto.categoria || "";

            const stock = document.createElement("td");
            stock.textContent = producto.stock ?? 0;

            const acciones = document.createElement("td");


            // BOTÓN EDITAR

            const botonEditar = document.createElement("button");

            botonEditar.type = "button";
            botonEditar.textContent = "Editar";
            botonEditar.className = "boton-editar";

            botonEditar.addEventListener("click", () => {
                editarProducto(producto.productoId);
            });


            // BOTÓN ELIMINAR

            const botonEliminar = document.createElement("button");

            botonEliminar.type = "button";
            botonEliminar.textContent = "Eliminar";
            botonEliminar.className = "boton-eliminar";

            botonEliminar.addEventListener("click", () => {
                eliminarProducto(producto.productoId);
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
// CARGAR USUARIOS DESDE SQL SERVER
// ==========================================

async function cargarUsuarios() {

    try {

        listaUsuarios.innerHTML = `
            <tr>
                <td colspan="6">Cargando usuarios...</td>
            </tr>
        `;

        const usuarios = await solicitarAPI(`${API}/usuarios`);

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

            const fila = document.createElement("tr");

            const fecha = usuario.fechaRegistro
                ? new Date(usuario.fechaRegistro).toLocaleDateString("es-AR")
                : "Sin fecha";

            const id = document.createElement("td");
            id.textContent = usuario.usuarioId;

            const nombre = document.createElement("td");
            nombre.textContent = usuario.nombre || "";

            const email = document.createElement("td");
            email.textContent = usuario.email || "";

            const rol = document.createElement("td");
            rol.textContent = usuario.rol || "";

            const fechaRegistro = document.createElement("td");
            fechaRegistro.textContent = fecha;

            const acciones = document.createElement("td");


            // BOTÓN EDITAR USUARIO

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

            const rolActual = (usuario.rol || "").toLowerCase();

            selectorRol.value =
                rolActual === "empleado" ? "Empleado" : "Cliente";


            // BOTÓN GUARDAR ROL

            const botonGuardarRol = document.createElement("button");

            botonGuardarRol.type = "button";
            botonGuardarRol.textContent = "Guardar rol";
            botonGuardarRol.className = "boton-editar";

            botonGuardarRol.addEventListener("click", async () => {

                const nuevoRol = selectorRol.value;
                const rolAnterior = usuario.rol;

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
                        `${API}/usuarios/${usuario.usuarioId}`,
                        {
                            method: "PUT",

                            headers: {
                                "Content-Type": "application/json"
                            },

                            body: JSON.stringify({
                                nombre: usuario.nombre,
                                email: usuario.email,
                                rol: nuevoRol
                            })
                        }
                    );

                    mensajeUsuarios.textContent =
                        `¡El rol de ${usuario.nombre} se actualizó correctamente!`;

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
// ABRIR MODAL PARA EDITAR USUARIO
// ==========================================

function editarUsuario(usuario) {

    usuarioEditando = usuario;

    inputNuevoNombre.value = usuario.nombre || "";

    mensajeEditarUsuario.textContent = "";

    modalEditarUsuario.hidden = false;

    inputNuevoNombre.focus();

}


// ==========================================
// CERRAR MODAL DE USUARIO
// ==========================================

function cerrarModalUsuario() {

    modalEditarUsuario.hidden = true;

    formularioEditarUsuario.reset();

    mensajeEditarUsuario.className = "";
    mensajeEditarUsuario.textContent = "";

    usuarioEditando = null;

    botonGuardarEditarUsuario.disabled = false;
    botonGuardarEditarUsuario.textContent = "Guardar cambios";
}


// ==========================================
// EVENTOS DEL MODAL DE USUARIOS
// ==========================================

botonCerrarModalUsuario.addEventListener("click", cerrarModalUsuario);

botonCancelarEditarUsuario.addEventListener("click", cerrarModalUsuario);

modalEditarUsuario.addEventListener("click", (e) => {

    if (e.target === modalEditarUsuario) {
        cerrarModalUsuario();
    }

});

document.addEventListener("keydown", (e) => {

    if (e.key === "Escape" && !modalEditarUsuario.hidden) {
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
            `${API}/usuarios/${usuarioEditando.usuarioId}`,
            {
                method: "PUT",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    nombre: nuevoNombre,
                    email: usuarioEditando.email,
                    rol: usuarioEditando.rol
                })
            }
        );

        await cargarUsuarios();

        mensajeEditarUsuario.className = "mensaje-exito-usuario";

        mensajeEditarUsuario.innerHTML = `
            <span class="icono-exito-usuario">✓</span>
            <span>¡Usuario actualizado correctamente!</span>
        `;

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
// FORMATEAR PRECIOS
// ==========================================

function formatearPrecio(precio) {

    return new Intl.NumberFormat("es-AR", {
        style: "currency",
        currency: "ARS",
        maximumFractionDigits: 0
    }).format(precio || 0);

}


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

        mensaje.textContent = "Seleccioná una categoría válida.";

        return false;
    }

    const marca = marcasGuardadas.get(producto.marcaId);

    const productoOriginal = productoEditandoId !== null
        ? productosGuardados.get(productoEditandoId)
        : null;

    const conservaMarcaActual =
        productoOriginal &&
        productoOriginal.marcaId === producto.marcaId;

    if (!marca || (!marca.activa && !conservaMarcaActual)) {

        mensaje.textContent = "Seleccioná una marca activa.";

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

    botonAgregar.disabled = true;
    botonAgregar.textContent = "GUARDANDO...";

    try {

        if (productoEditandoId !== null) {

            // ACTUALIZAR PRODUCTO EN SQL SERVER

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

            // AGREGAR PRODUCTO EN SQL SERVER

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

        if (productoEditandoId === null) {
            botonAgregar.textContent = "AGREGAR PRODUCTO →";
        } else {
            botonAgregar.textContent = "GUARDAR CAMBIOS";
        }

    }

});


// ==========================================
// PREPARAR EDICIÓN DE PRODUCTO
// ==========================================

function editarProducto(id) {

    const producto = productosGuardados.get(id);

    if (!producto) return;

    productoEditandoId = id;

    inputNombre.value = producto.nombre || "";

    inputMarca.value = producto.marcaId;

    // Si la marca está inactiva, agregarla temporalmente.

    if (!inputMarca.value && producto.marcaId) {

        const marca = marcasGuardadas.get(producto.marcaId);

        const opcion = document.createElement("option");

        opcion.value = producto.marcaId;
        opcion.textContent = marca?.nombre || "Marca actual";
        opcion.selected = true;

        inputMarca.appendChild(opcion);
    }

    inputPrecio.value = producto.precio ?? "";

    inputCategoria.value = producto.categoria || "";

    inputStock.value = producto.stock ?? 0;

    inputImagen.value = producto.imagen || "";

    inputDescripcion.value = producto.descripcion || "";

    if (producto.imagen) {

        vistaPrevia.src = producto.imagen;
        vistaPrevia.style.display = "block";

    } else {

        vistaPrevia.src = "";
        vistaPrevia.style.display = "none";

    }

    botonAgregar.textContent = "GUARDAR CAMBIOS";

    botonCancelar.style.display = "block";

    mensaje.textContent =
        "Estás editando: " + producto.nombre;

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

    // Quitar opciones temporales de marcas inactivas.

    Array.from(inputMarca.options).forEach(opcion => {

        const marcaId = Number(opcion.value);

        if (
            marcaId &&
            marcasGuardadas.has(marcaId) &&
            !marcasGuardadas.get(marcaId).activa
        ) {
            opcion.remove();
        }

    });

}


// ==========================================
// EVENTO CANCELAR EDICIÓN
// ==========================================

botonCancelar.addEventListener("click", cancelarEdicion);


// ==========================================
// ELIMINAR PRODUCTO
// ==========================================

async function eliminarProducto(id) {

    const producto = productosGuardados.get(id);

    if (!producto) return;

    const confirmar = await abrirModalEliminar(producto.nombre);

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
