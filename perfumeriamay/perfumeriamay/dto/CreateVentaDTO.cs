namespace perfumeriamay.dto
{
    public class CreateVentaDTO
    {
        public int? PedidoId { get; set; }

        public int EmpleadoId { get; set; }

        public List<CreateDetalleVentaDTO> Detalles { get; set; }
            = new List<CreateDetalleVentaDTO>();
    }
}
