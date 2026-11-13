
using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Mvc;
using perfumeriamay.dto;
using perfumeriamay.interfaces;
using perfumeriamay.Models;
using perfumeriamay.services.interfaces;

namespace perfumeriamay.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PerfumeriaController : ControllerBase
    {
        private readonly IPerfumeriaService _service;

        public PerfumeriaController(IPerfumeriaService service)
        {
            _service = service;
        }

        // =========================
        // GET
        // =========================

        // PRODUCTOS
        [HttpGet("todos")]
        public async Task<IActionResult> GetAll()
        {
            var resultado = await _service.ObtenerTodosAsync();
            return Ok(resultado);
        }

        // MARCAS
        [HttpGet("Marcas")]
        public async Task<IActionResult> GetMarcas()
        {
            var marcas = await _service.ObtenerMarcasAsync();
            return Ok(marcas);
        }

        // PEDIDOS DEL USUARIO
        [Authorize]
        [HttpGet("pedidos/mis-pedidos")]
        public async Task<IActionResult> GetMisPedidos()
        {
            var firebaseUid = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(firebaseUid))
                return Unauthorized();

            var pedidos = await _service.ObtenerPedidosPorFirebaseUidAsync(firebaseUid);

            return Ok(pedidos);
        }

        // TODOS LOS PEDIDOS (SOLO EMPLEADOS)
        [Authorize]
        [HttpGet("pedidos")]
        public async Task<IActionResult> GetPedidos()
        {
            var firebaseUid = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(firebaseUid))
                return Unauthorized();

            var usuarios = await _service.ObtenerUsuariosAsync();

            var usuario = usuarios.FirstOrDefault(
                u => u.FirebaseUid == firebaseUid
            );

            if (usuario == null ||
                !string.Equals(
                    usuario.Rol,
                    "Empleado",
                    StringComparison.OrdinalIgnoreCase))
            {
                return Forbid();
            }

            var pedidos = await _service.ObtenerPedidos();

            return Ok(pedidos);
        }

        // PEDIDO POR ID
        [HttpGet("pedidos/{id}")]
        public async Task<IActionResult> GetPedidosById(int id)
        {
            var result = await _service.ObtenerPorIdAsync(id);

            if (result == null)
                return NotFound($"No se ha encontrado el pedido con ID {id}.");

            return Ok(result);
        }

        // VENTAS
        [HttpGet("ventas")]
        public async Task<IActionResult> GetVentas()
        {
            var ventas = await _service.GetVentasAsync();
            return Ok(ventas);
        }

        [HttpGet("ventas/{id}")]
        public async Task<IActionResult> GetVentaById(int id)
        {
            var venta = await _service.GetVentasByIdAsync(id);

            if (venta == null)
                return NotFound("Venta no encontrada.");

            return Ok(venta);
        }

        // USUARIOS
        [HttpGet("usuarios")]
        public async Task<IActionResult> GetUsuarios()
        {
            var usuarios = await _service.ObtenerUsuariosAsync();
            return Ok(usuarios);
        }

        [HttpGet("usuarios/{id}")]
        public async Task<IActionResult> GetUsuarioById(int id)
        {
            var usuario = await _service.ObtenerUsuarioPorIdAsync(id);

            if (usuario == null)
                return NotFound("Usuario no encontrado.");

            return Ok(usuario);
        }

        // =========================
        // POST
        // =========================

        // PRODUCTOS
        [HttpPost]
        public async Task<IActionResult> AddProducto(
            [FromBody] CreateProductoDTO producto)
        {
            var resultado = await _service.AgregarperfumeAsync(producto);

            if (!resultado)
                return BadRequest(
                    "No se pudo agregar el producto. Verificá los datos.");

            return Ok("Producto agregado correctamente.");
        }

        // MARCAS
        [HttpPost("Marcas")]
        public async Task<IActionResult> AddMarca(
            [FromBody] CreateMarcaDTO marca)
        {
            var resultado = await _service.AgregarMarcaAsync(marca);

            if (!resultado)
                return BadRequest("No se pudo agregar la marca.");

            return Ok("Marca agregada correctamente.");
        }

        // PEDIDOS
        [HttpPost("pedidos")]
        public async Task<IActionResult> AddPedido(
            [FromBody] CreatePedidoDTO pedido)
        {
            var resultado = await _service.AgregarPedidoAsync(pedido);

            if (!resultado)
                return BadRequest(
                    "No se pudo crear el pedido. Verificá los datos.");

            return Ok("Pedido creado correctamente.");
        }

        // VENTAS
        [HttpPost("ventas")]
        public async Task<IActionResult> CreateVenta(
            [FromBody] CreateVentaDTO venta)
        {
            if (venta == null)
                return BadRequest("Datos inválidos.");

            var resultado = await _service.CreateVentaAsync(venta);

            if (!resultado)
                return BadRequest(
                    "No se pudo registrar la venta. Verificá los productos, las cantidades y el stock.");

            return Ok("Venta registrada correctamente.");
        }

        // USUARIOS
        [Authorize]
        [HttpPost("usuarios")]
        public async Task<IActionResult> AgregarUsuario(
            [FromBody] CreateUsuarioDTO usuario)
        {
            if (usuario == null)
                return BadRequest("Los datos del usuario son obligatorios.");

            var firebaseUid = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrWhiteSpace(firebaseUid))
                return Unauthorized("No se pudo identificar al usuario.");

            var emailToken = User.FindFirstValue(ClaimTypes.Email);

            if (string.IsNullOrWhiteSpace(emailToken))
                return Unauthorized("El token no contiene un email válido.");

            if (!string.Equals(
                usuario.Email?.Trim(),
                emailToken.Trim(),
                StringComparison.OrdinalIgnoreCase))
            {
                return BadRequest("El email enviado no coincide con el usuario autenticado.");
            }

            usuario.FirebaseUid = firebaseUid;

            try
            {
                var resultado = await _service.AgregarUsuarioAsync(usuario);

                if (!resultado)
                    return BadRequest("No se pudo registrar el usuario.");

                return Ok("Usuario registrado correctamente.");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // =========================
        // PUT
        // =========================

        // PRODUCTOS
        [HttpPut]
        public async Task<IActionResult> UpdateProducto(
            int id,
            [FromBody] UpdateProductoDTO producto)
        {
            var resultado =
                await _service.ActualizarPerfumeAsync(id, producto);

            if (!resultado)
                return BadRequest(
                    "No se pudo actualizar el producto. Verificá los datos.");

            return Ok("Producto actualizado correctamente.");
        }

        // MARCAS
        [HttpPut("Marca/{id}")]
        public async Task<IActionResult> UpdateMarca(
            int id,
            [FromBody] UpdateMarca marca)
        {
            var resultado = await _service.ActualizarMarcaAsync(id, marca);

            if (!resultado)
                return BadRequest(
                    "No se pudo actualizar la marca. Verificá los datos.");

            return Ok("Marca actualizada correctamente.");
        }

        // PEDIDOS
        [Authorize]
        [HttpPut("pedidos/{id}")]
        public async Task<IActionResult> UpdatePedido(
    int id,
    [FromBody] UpdatePedidoDTO pedido)
        {
            // Obtener el UID del empleado autenticado mediante Firebase.
            var firebaseUid = User.FindFirstValue(ClaimTypes.NameIdentifier);

            if (string.IsNullOrEmpty(firebaseUid))
                return Unauthorized("No se pudo identificar al empleado.");

            var resultado = await _service.ActualizarPedidoAsync(
                id,
                pedido,
                firebaseUid
            );

            if (!resultado)
                return BadRequest("No se pudo actualizar el pedido.");

            return Ok("Pedido actualizado correctamente.");
        }

        // USUARIOS
        [HttpPut("usuarios/{id}")]
        public async Task<IActionResult> UpdateUsuario(
            int id,
            [FromBody] UpdateUsuariosDTO usuario)
        {
            try
            {
                var resultado = await _service.ActualizarUsuarioAsync(id, usuario);

                if (!resultado)
                    return BadRequest(
                        "No se pudo actualizar el usuario. Verificá los datos.");

                return Ok("Usuario actualizado correctamente.");
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // =========================
        // DELETE
        // =========================

        // PRODUCTOS
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeletePerfume(int id)
        {
            var resultado = await _service.EliminarPerfumeAsync(id);

            if (!resultado)
            {
                return BadRequest(new
                {
                    mensaje = "No se puede eliminar este perfume porque tiene ventas registradas. El historial de ventas debe conservarse."
                });
            }

            return Ok(new
            {
                mensaje = "Producto eliminado correctamente."
            });
        }

        // MARCAS
        [HttpDelete("Marcas/{id}")]
        public async Task<IActionResult> DeleteMarca(int id)
        {
            var resultado = await _service.EliminarMarcaAsync(id);

            if (!resultado)
                return BadRequest("No se pudo eliminar la marca.");

            return Ok("Marca eliminada correctamente.");
        }

        // PEDIDOS
        [HttpDelete("pedidos/{id}")]
        public async Task<IActionResult> DeletePedido(int id)
        {
            var resultado = await _service.EliminarPedidoAsync(id);

            if (!resultado)
                return BadRequest("No se pudo eliminar el pedido.");

            return Ok("Pedido eliminado correctamente.");
        }

        // VENTAS
        [HttpDelete("ventas/{id}")]
        public async Task<IActionResult> DeleteVenta(int id)
        {
            var resultado = await _service.DeleteVentaAsync(id);

            if (!resultado)
                return NotFound("Venta no encontrada.");

            return Ok("Venta eliminada correctamente.");
        }

        // USUARIOS
        [HttpDelete("usuarios/{id}")]
        public async Task<IActionResult> DeleteUsuario(int id)
        {
            var resultado = await _service.EliminarUsuarioAsync(id);

            if (!resultado)
                return BadRequest(
                    "No se pudo eliminar el usuario. Puede tener pedidos o ventas asociados.");

            return Ok("Usuario eliminado correctamente.");
        }
    }
}
