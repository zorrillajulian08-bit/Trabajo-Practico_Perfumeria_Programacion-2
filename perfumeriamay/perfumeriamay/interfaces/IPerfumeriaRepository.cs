using perfumeriamay.Models;
using perfumeriamay.dto;

namespace perfumeriamay.interfaces
{
    public interface IPerfumeriaRepository
    {
        public Task<List<Producto>> GetAllAsync();

        public Task<List<Marca>> GetMarcasAsync();

        public Task<bool> UpdateMarcaAsync(int id, UpdateMarca marca);

        public Task<bool> DeleteMarcaAsync(int id);

        public Task<bool> AddperfumeAsync(CreateProductoDTO producto);

        public Task<bool> AddMarcaAsync(CreateMarcaDTO marca);

        public Task<bool> DeletePerfumeAsync(int id);

        public Task<bool> UpdatePerfume(int id, UpdateProductoDTO producto);

        public Task<List<Pedido>> GetPedidos();
        public Task<Pedido?> GetByIdAsync(int id);
        public Task<bool> AddAsync(CreatePedidoDTO pedido);
        public Task<bool> UpdateAsync(int id, UpdatePedidoDTO pedido);
        public Task<bool> DeleteAsync(int id);


        public Task<List<Venta>> GetVentasAsync();

        public Task<Venta?> GetVentasByIdAsync(int id);

       public Task<bool> CreateVentaAsync(CreateVentaDTO venta);

       public Task<bool> DeleteVentaAsync(int id);

        public Task<List<Usuario>> GetUsuariosAsync();

        public Task<Usuario?> GetUsuarioByIdAsync(int id);

        public Task<bool> UpdateUsuarioAsync(int id, UpdateUsuariosDTO usuario);

        public Task<bool> DeleteUsuarioAsync(int id);
    }
}
