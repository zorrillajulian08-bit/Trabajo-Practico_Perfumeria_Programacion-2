using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using perfumeriamay.dto;
using perfumeriamay.interfaces;
using perfumeriamay.Models;


namespace perfumeriamay.Implementations
{
    public class PerfumeriaRepository : IPerfumeriaRepository
    {
        private readonly PerfumeriaEmprendimientoMayContext _context;

        public PerfumeriaRepository(PerfumeriaEmprendimientoMayContext context)
        {
            _context = context;
        }


        public async Task<bool> AddAsync(CreatePedidoDTO pedido)
        { 
            if (pedido == null || pedido.Detalles == null || !pedido.Detalles.Any())
                return false;

            var usuarioExiste = await _context.Usuarios
                .AnyAsync(u => u.UsuarioId == pedido.UsuarioId);

            if (!usuarioExiste)
                return false;

            var nuevoPedido = new Pedido
            {
                UsuarioId = pedido.UsuarioId,
                Fecha = DateTime.Now,
                Estado = "Pendiente",
                Total = 0
            };

            foreach (var detalle in pedido.Detalles)
            {
                if (detalle.Cantidad <= 0)
                    return false;

                var producto = await _context.Productos
                    .FindAsync(detalle.ProductoId);

                if (producto == null || producto.Stock < detalle.Cantidad)
                    return false;

                // Descontamos el stock
                producto.Stock -= detalle.Cantidad;

                var subtotal = producto.Precio * detalle.Cantidad;

                nuevoPedido.Total += subtotal;

                nuevoPedido.DetallePedidos.Add(new DetallePedido
                {
                    ProductoId = producto.ProductoId,
                    Cantidad = detalle.Cantidad,
                    PrecioUnitario = producto.Precio
                });
            }

            await _context.Pedidos.AddAsync(nuevoPedido);

            Console.WriteLine("========== PRUEBA DE STOCK ==========");

            foreach (var detalle in pedido.Detalles)
            {
                var productoGuardado = await _context.Productos
                    .FindAsync(detalle.ProductoId);

                Console.WriteLine($"Producto ID: {detalle.ProductoId}");
                Console.WriteLine($"Stock antes de guardar: {productoGuardado?.Stock}");
            }

            await _context.SaveChangesAsync();

            Console.WriteLine("========== PEDIDO GUARDADO ==========");

            return true;
        }
        

        public async Task<bool> AddMarcaAsync(CreateMarcaDTO marca)
        {
            var nuevaMarca = new Marca
            {
                Nombre = marca.Nombre,
                Descripcion = marca.Descripcion,
                Activa = true,
                FechaRegistro = DateTime.Now
            };

            await _context.Marcas.AddAsync(nuevaMarca);
            await _context.SaveChangesAsync();

            return true;


        }

        public async Task<bool> AddperfumeAsync(CreateProductoDTO producto)
        {
            if (producto == null)
                return false;

            if (string.IsNullOrWhiteSpace(producto.Nombre))
                return false;

            if (producto.Precio <= 0)
                return false;

            if (producto.Stock < 0)
                return false;

            if (producto.MarcaId <= 0)
                return false;

            if (producto.Categoria != "Masculino" &&
                producto.Categoria != "Femenino" &&
                producto.Categoria != "Unisex")
                return false;

            var nuevoProducto = new Producto
            {
                Nombre = producto.Nombre,
                MarcaId = producto.MarcaId,
                Precio = producto.Precio,
                Categoria = producto.Categoria,
                Stock = producto.Stock,
                Imagen = producto.Imagen,
                Descripcion = producto.Descripcion
            };

            await _context.Productos.AddAsync(nuevoProducto);
            return await _context.SaveChangesAsync() > 0;
        }

        public async Task<bool> CreateVentaAsync(CreateVentaDTO venta)
        {
            if (venta == null)
                throw new Exception("La venta llegó vacía.");

            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.UsuarioId == venta.EmpleadoId);

            if (usuario == null || usuario.Rol != "Empleado")
                throw new Exception("No se puede asignar una venta a un usuario que no sea empleado.");

            if (venta.Detalles == null || !venta.Detalles.Any())
                throw new Exception("La venta no tiene detalles.");

            var nuevaVenta = new Venta
            {
                PedidoId = venta.PedidoId,
                EmpleadoId = venta.EmpleadoId,
                Fecha = DateTime.Now,
                Total = 0
            };

            foreach (var detalle in venta.Detalles)
            {
                var producto = await _context.Productos
                    .FirstOrDefaultAsync(p => p.ProductoId == detalle.ProductoId);

                if (producto == null)
                    throw new Exception("No existe el producto.");

                if (detalle.Cantidad <= 0)
                    throw new Exception("La cantidad debe ser mayor a cero.");

                var detalleVenta = new DetalleVenta
                {
                    ProductoId = producto.ProductoId,
                    Cantidad = detalle.Cantidad,
                    PrecioUnitario = producto.Precio
                };

                nuevaVenta.Total += producto.Precio * detalle.Cantidad;

                nuevaVenta.DetalleVenta.Add(detalleVenta);
            }

            _context.Ventas.Add(nuevaVenta);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteAsync(int id)
        {
            var pedido = await _context.Pedidos
        .Include(p => p.DetallePedidos)
        .FirstOrDefaultAsync(p => p.PedidoId == id);

            if (pedido == null)
                return false;

            _context.DetallePedidos.RemoveRange(pedido.DetallePedidos);

            _context.Pedidos.Remove(pedido);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteMarcaAsync(int id)
        {
            var marcas = await _context.Marcas.FirstOrDefaultAsync(p => p.MarcaId == id);

            if (marcas == null)
            {
                return false;
            }
            _context.Marcas.Remove(marcas);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeletePerfumeAsync(int id)
        {
            var producto = await _context.Productos
       .FirstOrDefaultAsync(p => p.ProductoId == id);

            if (producto == null)
            {
                return false;
            }

            // Comprobar si aparece en pedidos
            var tienePedidos = await _context.DetallePedidos
                .AnyAsync(d => d.ProductoId == id);

            if (tienePedidos)
            {
                return false;
            }

            // Comprobar si aparece en ventas
            var tieneVentas = await _context.DetalleVentas
                .AnyAsync(d => d.ProductoId == id);

            if (tieneVentas)
            {
                return false;
            }

            _context.Productos.Remove(producto);

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteVentaAsync(int id)
        {
            var venta = await _context.Ventas
           .Include(v => v.DetalleVenta)
           .FirstOrDefaultAsync(v => v.VentaId == id);

            if (venta == null)
                return false;

            foreach (var detalle in venta.DetalleVenta)
            {
                var producto = await _context.Productos
                    .FirstOrDefaultAsync(p => p.ProductoId == detalle.ProductoId);

                if (producto != null)
                {
                    producto.Stock += detalle.Cantidad;
                }
            }

            _context.DetalleVentas.RemoveRange(venta.DetalleVenta);

            _context.Ventas.Remove(venta);

            await _context.SaveChangesAsync();

            return true;

        }

        public async Task<List<Producto>> GetAllAsync()
        {
            return await _context.Productos.ToListAsync();
        }

        public async Task<Pedido?> GetByIdAsync(int id)
        {
            return await _context.Pedidos.Include(p => p.DetallePedidos)
                                         .FirstOrDefaultAsync(p => p.PedidoId == id);
        }

        public async Task<List<Marca>> GetMarcasAsync()
        {
            return await _context.Marcas.ToListAsync();
        }

        public async Task<List<Pedido>> GetPedidos()
        {
            return await _context.Pedidos.Include(p => p.DetallePedidos)
                                         .ToListAsync();
        }

        public async Task<List<Venta>> GetVentasAsync()
        {
            return await _context.Ventas
        .Include(v => v.DetalleVenta)
            .ThenInclude(d => d.Producto)
        .ToListAsync();
        }

        public async Task<Venta?> GetVentasByIdAsync(int id)
        {
            return await _context.Ventas.Include(v => v.DetalleVenta)
                                        .FirstOrDefaultAsync(v => v.VentaId == id);
        }

        public async Task<bool> UpdateAsync(int id,UpdatePedidoDTO pedido,string firebaseUid)
        {
            if (pedido == null || string.IsNullOrWhiteSpace(firebaseUid))
                return false;

            var existente = await _context.Pedidos
                .Include(p => p.DetallePedidos)
                .FirstOrDefaultAsync(p => p.PedidoId == id);

            if (existente == null)
                return false;

            // Convertimos los estados a minúsculas solo para compararlos.
            string estadoAnterior = existente.Estado?.Trim().ToLowerInvariant() ?? "";
            string nuevoEstado = pedido.Estado?.Trim().ToLowerInvariant() ?? "";

            // No permitir cancelar un pedido confirmado.
            if (estadoAnterior == "confirmado" && nuevoEstado == "cancelado")
                return false;

            // No permitir confirmar un pedido cancelado.
            if (estadoAnterior == "cancelado" && nuevoEstado == "confirmado")
                return false;

            // Si se confirma el pedido, creamos la venta.
            if (nuevoEstado == "confirmado")
            {
                // Buscamos al empleado que está realizando la operación.
                var empleado = await _context.Usuarios
                    .FirstOrDefaultAsync(u => u.FirebaseUid == firebaseUid);

                if (empleado == null ||
                    !string.Equals(
                        empleado.Rol,
                        "Empleado",
                        StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }

                // Comprobamos que el pedido no tenga ya una venta.
                bool ventaExistente = await _context.Ventas
                    .AnyAsync(v => v.PedidoId == id);

                if (!ventaExistente)
                {
                    var nuevaVenta = new Venta
                    {
                        PedidoId = existente.PedidoId,
                        EmpleadoId = empleado.UsuarioId,
                        Fecha = DateTime.Now,
                        Total = existente.Total
                    };

                    // Copiamos los detalles del pedido a la venta.
                    foreach (var detalle in existente.DetallePedidos)
                    {
                        nuevaVenta.DetalleVenta.Add(new DetalleVenta
                        {
                            ProductoId = detalle.ProductoId,
                            Cantidad = detalle.Cantidad,
                            PrecioUnitario = detalle.PrecioUnitario
                        });
                    }

                    await _context.Ventas.AddAsync(nuevaVenta);
                }
            }

            // Si se cancela el pedido, devolvemos las unidades al stock.
            if (nuevoEstado == "cancelado" && estadoAnterior != "cancelado")
            {
                foreach (var detalle in existente.DetallePedidos)
                {
                    var producto = await _context.Productos
                        .FindAsync(detalle.ProductoId);

                    if (producto != null)
                        producto.Stock += detalle.Cantidad;
                }
            }

            // Guardamos el estado original con su mayúscula inicial.
            existente.Estado = pedido.Estado.Trim();

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdateMarcaAsync(int id, UpdateMarca marca)
        {
            var marcaExistente = await _context.Marcas.FindAsync(id);

            if (marcaExistente == null)
                return false;

            marcaExistente.Nombre = marca.Nombre;
            marcaExistente.Descripcion = marca.Descripcion;
            marcaExistente.Activa = marca.Activa;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> UpdatePerfume(int id, UpdateProductoDTO producto)
        {
            var productoExistente = await _context.Productos
         .FirstOrDefaultAsync(p => p.ProductoId == id);

            if (productoExistente == null)
            {
                return false;
            }

            productoExistente.Nombre = producto.Nombre;
            productoExistente.MarcaId = producto.MarcaId;
            productoExistente.Precio = producto.Precio;
            productoExistente.Categoria = producto.Categoria;
            productoExistente.Stock = producto.Stock;
            productoExistente.Imagen = producto.Imagen;
            productoExistente.Descripcion = producto.Descripcion;

            await _context.SaveChangesAsync();

            return true;
        }
        // USUARIOS

        public async Task<List<Usuario>> GetUsuariosAsync()
        {
            return await _context.Usuarios.ToListAsync();
        }

        public async Task<Usuario?> GetUsuarioByIdAsync(int id)
        {
            return await _context.Usuarios
                .FirstOrDefaultAsync(u => u.UsuarioId == id);
        }

        public async Task<bool> UpdateUsuarioAsync(int id, UpdateUsuariosDTO usuario)
        {
            if (usuario == null)
                return false;

            var usuarioExistente = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.UsuarioId == id);

            if (usuarioExistente == null)
                return false;

            if (string.IsNullOrWhiteSpace(usuario.Nombre))
                return false;

            if (string.IsNullOrWhiteSpace(usuario.Email))
                return false;

            if (usuario.Rol == null)
                return false;

            if (usuario.Rol.ToLower() != "empleado" &&
                usuario.Rol.ToLower() != "cliente")
                return false;

            usuarioExistente.Nombre = usuario.Nombre;
            usuarioExistente.Email = usuario.Email;
            usuarioExistente.Rol = usuario.Rol;

            await _context.SaveChangesAsync();

            return true;
        }

        public async Task<bool> DeleteUsuarioAsync(int id)
        {
            var usuario = await _context.Usuarios
                .FirstOrDefaultAsync(u => u.UsuarioId == id);

            if (usuario == null)
                return false;

            // No eliminar usuarios que tengan pedidos o ventas asociados
            var tienePedidos = await _context.Pedidos
                .AnyAsync(p => p.UsuarioId == id);

            var tieneVentas = await _context.Ventas
                .AnyAsync(v => v.EmpleadoId == id);

            if (tienePedidos || tieneVentas)
                return false;

            _context.Usuarios.Remove(usuario);

            await _context.SaveChangesAsync();

            return true;
        }
        public async Task<bool> AddUsuarioAsync(CreateUsuarioDTO usuario)
        {
            var nuevoUsuario = new Usuario
            {
                FirebaseUid = usuario.FirebaseUid,
                Nombre = usuario.Nombre,
                Email = usuario.Email,
                Rol = "Cliente",
                FechaRegistro = DateTime.Now
            };

            await _context.Usuarios.AddAsync(nuevoUsuario);

            return await _context.SaveChangesAsync() > 0;
        }
        public async Task<List<Pedido>> GetPedidosPorFirebaseUidAsync(string firebaseUid)
        {
            var usuario = await _context.Usuarios
        .FirstOrDefaultAsync(u => u.FirebaseUid == firebaseUid);

            if (usuario == null)
                return new List<Pedido>();

            return await _context.Pedidos
                .Include(p => p.DetallePedidos)
                    .ThenInclude(d => d.Producto)
                .Where(p => p.UsuarioId == usuario.UsuarioId)
                .OrderByDescending(p => p.Fecha)
                .ToListAsync();
        }

    }
}
