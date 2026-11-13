using perfumeriamay.dto;
using perfumeriamay.interfaces;
using perfumeriamay.Models;
using perfumeriamay.services.interfaces;

namespace perfumeriamay.services.Implementations
{
    public class PerfumeriaService : IPerfumeriaService
    {
        private readonly IPerfumeriaRepository _repository;

        public PerfumeriaService(IPerfumeriaRepository repository)
        {
            _repository = repository;
        }

        public async Task<bool> ActualizarPerfumeAsync(int id, UpdateProductoDTO producto)
        {
            if (string.IsNullOrWhiteSpace(producto.Nombre))
            {
                return false;
            }

            if (producto.Precio <= 0)
            {
                return false;
            }

            if (producto.Stock < 0)
            {
                return false;
            }

            return await _repository.UpdatePerfume(id, producto);
        }

        public async Task<bool> AgregarperfumeAsync(CreateProductoDTO producto)
        {
            if (producto == null)
            {
                return false;
            }

            if (string.IsNullOrWhiteSpace(producto.Nombre))
            {
                return false;
            }

            if (producto.Precio <= 0)
            {
                return false;
            }

            if (producto.Stock < 0)
            {
                return false;
            }

            if (producto.MarcaId <= 0)
            {
                return false;
            }

            if (producto.Categoria != "Masculino" &&
                producto.Categoria != "Femenino" &&
                producto.Categoria != "Unisex")
            {
                return false;
            }

            return await _repository.AddperfumeAsync(producto);
        }

        public async Task<bool> EliminarPerfumeAsync(int id)
        {
            if (id <= 0)
            {
                return false;
            }

            return await _repository.DeletePerfumeAsync(id);
        }

        public async Task<List<Producto>> ObtenerTodosAsync()
        {
            return await _repository.GetAllAsync();
        }

        public async Task<List<Marca>> ObtenerMarcasAsync()
        {
            return await _repository.GetMarcasAsync();
        }

        public async Task<bool> EliminarMarcaAsync(int id)
        {
            if (id <= 0)
                return false;

            return await _repository.DeleteMarcaAsync(id);
        }

        public async Task<bool> ActualizarMarcaAsync(int id, UpdateMarca marca)
        {
            if (marca == null)
                return false;

            if (id <= 0)
                return false;

            if (string.IsNullOrWhiteSpace(marca.Nombre))
                return false;

            return await _repository.UpdateMarcaAsync(id, marca);
        }

        public async Task<bool> AgregarMarcaAsync(CreateMarcaDTO marca)
        {
            if (marca == null)
                return false;

            if (string.IsNullOrWhiteSpace(marca.Nombre))
                return false;

            return await _repository.AddMarcaAsync(marca);
        }

        public async Task<List<Pedido>> ObtenerPedidos()
        {
            return await _repository.GetPedidos();
        }

        public async Task<Pedido?> ObtenerPorIdAsync(int id)
        {
            if (id <= 0)
                return null;

            return await _repository.GetByIdAsync(id);

        }

        public async Task<bool> AgregarPedidoAsync(CreatePedidoDTO pedido)
        {
            if (pedido == null)
                return false;

            if (pedido.UsuarioId <= 0)
                return false;

            if (pedido.Detalles == null || pedido.Detalles.Count == 0)
                return false;

            foreach (var detalle in pedido.Detalles)
            {
                if (detalle.ProductoId <= 0 || detalle.Cantidad <= 0)
                    return false;
            }

            if (pedido.Detalles
                .GroupBy(d => d.ProductoId)
                .Any(g => g.Count() > 1))
                return false;

            return await _repository.AddAsync(pedido);
        }

        public async Task<bool> ActualizarPedidoAsync(int id, UpdatePedidoDTO pedido)
        {
            if (id <= 0 || pedido == null)
                return false;

            if (string.IsNullOrWhiteSpace(pedido.Estado))
                return false;

            return await _repository.UpdateAsync(id, pedido);
        }

        public async Task<bool> EliminarPedidoAsync(int id)
        {
            if (id <= 0)
                return false;

            return await _repository.DeleteAsync(id);
        }

        public async Task<List<Venta>> GetVentasAsync()
        {
            return await _repository.GetVentasAsync();
        }

        public async Task<Venta?> GetVentasByIdAsync(int id)
        {
            return await _repository.GetVentasByIdAsync(id);
        }

        public async Task<bool> CreateVentaAsync(CreateVentaDTO venta)
        {
            if (venta == null)
                return false;



            return await _repository.CreateVentaAsync(venta);
        }

        public async Task<bool> DeleteVentaAsync(int id)
        {
            if (id <= 0)
                return false;

            return await _repository.DeleteVentaAsync(id);
        }


        public async Task<List<Usuario>> ObtenerUsuariosAsync()
        {
            return await _repository.GetUsuariosAsync();
        }

        public async Task<Usuario?> ObtenerUsuarioPorIdAsync(int id)
        {
            if (id <= 0)
                return null;

            return await _repository.GetUsuarioByIdAsync(id);
        }

        public async Task<bool> ActualizarUsuarioAsync(int id, UpdateUsuariosDTO usuario)
        {
            if (id <= 0 || usuario == null)
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

            return await _repository.UpdateUsuarioAsync(id, usuario);
        }

        public async Task<bool> EliminarUsuarioAsync(int id)
        {
            if (id <= 0)
                return false;

            return await _repository.DeleteUsuarioAsync(id);
        }
        public async Task<bool> AgregarUsuarioAsync(CreateUsuarioDTO usuario)
        {

            if (usuario == null)
                return false;

            // Validar campos obligatorios
            if (string.IsNullOrWhiteSpace(usuario.FirebaseUid) ||
                string.IsNullOrWhiteSpace(usuario.Nombre) ||
                string.IsNullOrWhiteSpace(usuario.Email))
                return false;

            // Limpiar espacios
            usuario.FirebaseUid = usuario.FirebaseUid.Trim();
            usuario.Nombre = usuario.Nombre.Trim();
            usuario.Email = usuario.Email.Trim().ToLowerInvariant();

            // Validar longitudes
            if (usuario.FirebaseUid.Length > 128)
                return false;

            if (usuario.Nombre.Length > 100)
                return false;

            if (usuario.Email.Length > 150)
                return false;

            // Validar formato del email
            if (!System.Text.RegularExpressions.Regex.IsMatch(
                usuario.Email,
                @"^[^@\s]+@[^@\s]+\.[^@\s]+$"))
                return false;

            // Obtener usuarios registrados
            var usuarios = await _repository.GetUsuariosAsync();

            // Comprobar UID duplicado
            if (usuarios.Any(u => u.FirebaseUid == usuario.FirebaseUid))
                return false;

            // Comprobar email duplicado
            if (usuarios.Any(u =>
                u.Email.Equals(usuario.Email, StringComparison.OrdinalIgnoreCase)))
                return false;

            // Guardar usuario
            return await _repository.AddUsuarioAsync(usuario);
        
        
        }
        public async Task<List<Pedido>> ObtenerPedidosPorFirebaseUidAsync(string firebaseUid)
        {
            // Validar que el UID no sea nulo ni vacío
            if (string.IsNullOrWhiteSpace(firebaseUid))
                return new List<Pedido>();

            // Limpiar espacios
            firebaseUid = firebaseUid.Trim();

            // Validar longitud máxima de Firebase UID
            if (firebaseUid.Length > 128)
                return new List<Pedido>();

            // Consultar pedidos
            var pedidos = await _repository.GetPedidosPorFirebaseUidAsync(firebaseUid);

            // Validar resultado
            if (pedidos == null)
                return new List<Pedido>();

            return pedidos;
        }

    }
}
