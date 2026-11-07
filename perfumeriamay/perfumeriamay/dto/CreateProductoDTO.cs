namespace perfumeriamay.dto
{
    public class CreateProductoDTO
    {
        public string? Nombre { get; set; }
        public int MarcaId { get; set; }
        public decimal Precio { get; set; }
        public string? Categoria { get; set; }
        public int Stock { get; set; }
        public string? Imagen { get; set; }
        public string? Descripcion { get; set; }
    }
}
