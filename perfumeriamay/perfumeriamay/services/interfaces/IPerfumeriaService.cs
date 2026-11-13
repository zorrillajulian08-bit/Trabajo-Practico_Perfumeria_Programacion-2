using perfumeriamay.dto;
using perfumeriamay.Models;

namespace perfumeriamay.services.interfaces
{
    public interface IPerfumeriaService
    {
        public Task<List<Producto>> ObtenerTodosAsync();

        public Task<List<Marca>> ObtenerMarcasAsync();

        public Task<bool> ActualizarMarcaAsync(int id, UpdateMarca marca);

        public Task<bool> EliminarMarcaAsync(int id);

        public Task<bool> AgregarperfumeAsync(CreateProductoDTO producto);

        public Task<bool> AgregarMarcaAsync(CreateMarcaDTO marca);

        public Task<bool> EliminarPerfumeAsync(int id);

        Task<bool> ActualizarPerfumeAsync(int id, UpdateProductoDTO producto);

        public Task<List<Pedido>> ObtenerPedidos();
        public Task<Pedido?> ObtenerPorIdAsync(int id);
        public Task<bool> AgregarPedidoAsync(CreatePedidoDTO pedido);
        public Task<bool> ActualizarPedidoAsync(int id, UpdatePedidoDTO pedido);
        public Task<bool> EliminarPedidoAsync(int id);

        public Task<List<Venta>> GetVentasAsync();

        public Task<Venta?> GetVentasByIdAsync(int id);

        public Task<bool> CreateVentaAsync(CreateVentaDTO venta);

        public Task<bool> DeleteVentaAsync(int id);

        public Task<List<Usuario>> ObtenerUsuariosAsync();

        public Task<Usuario?> ObtenerUsuarioPorIdAsync(int id);

        public Task<bool> AgregarUsuarioAsync(CreateUsuarioDTO usuario);

        public Task<bool> ActualizarUsuarioAsync(int id, UpdateUsuariosDTO usuario);

        public Task<bool> EliminarUsuarioAsync(int id);

        public Task<List<Pedido>> ObtenerPedidosPorFirebaseUidAsync(string firebaseUid);
    }
}
