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
                var producto = await _context.Productos
                    .FindAsync(detalle.ProductoId);

                if (producto == null)
                    return false;

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
            await _context.SaveChangesAsync();

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

            // Validar que el usuario exista y sea empleado
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

                if (producto.Stock < detalle.Cantidad)
                    throw new Exception("Stock insuficiente. Stock actual: " + producto.Stock);

                var detalleVenta = new DetalleVenta
                {
                    ProductoId = producto.ProductoId,
                    Cantidad = detalle.Cantidad,
                    PrecioUnitario = producto.Precio
                };

                nuevaVenta.Total += producto.Precio * detalle.Cantidad;

                nuevaVenta.DetalleVenta.Add(detalleVenta);

                producto.Stock -= detalle.Cantidad;
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
            return await _context.Ventas.Include(v => v.DetalleVenta)
                                        .ToListAsync();
        }

        public async Task<Venta?> GetVentasByIdAsync(int id)
        {
            return await _context.Ventas.Include(v => v.DetalleVenta)
                                        .FirstOrDefaultAsync(v => v.VentaId == id);
        }

        public async Task<bool> UpdateAsync(int id, UpdatePedidoDTO pedido)
        {
            var existente = await _context.Pedidos.FindAsync(id);

            if (existente == null)
                return false;

            existente.Estado = pedido.Estado;

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

    }
}
