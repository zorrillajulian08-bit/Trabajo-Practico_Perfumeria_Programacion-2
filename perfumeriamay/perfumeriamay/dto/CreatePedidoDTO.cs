
namespace perfumeriamay.dto
 
{
    public class CreatePedidoDTO
    {
        public int UsuarioId { get; set; }

        public List<CreateDetallePedido>? Detalles { get; set; } = new List<CreateDetallePedido>();
    }
}
