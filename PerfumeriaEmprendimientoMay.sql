-- 1. CREAR BASE DE DATOS
IF DB_ID('PerfumeriaEmprendimientoMay') IS NULL
BEGIN
    CREATE DATABASE PerfumeriaEmprendimientoMay;
END
GO

USE PerfumeriaEmprendimientoMay;
GO

/* =====================================================
   2. TABLA USUARIOS
   ===================================================== */

CREATE TABLE Usuarios
(
    UsuarioId INT IDENTITY(1,1) NOT NULL,
    FirebaseUid NVARCHAR(128) NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Email NVARCHAR(150) NOT NULL,
    Rol NVARCHAR(20) NOT NULL,
    FechaRegistro DATETIME2 NOT NULL
        CONSTRAINT DF_Usuarios_FechaRegistro DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_Usuarios PRIMARY KEY (UsuarioId)
);
GO

CREATE UNIQUE INDEX UQ_Usuarios_Email
ON Usuarios(Email);

CREATE UNIQUE INDEX UQ_Usuarios_FirebaseUid
ON Usuarios(FirebaseUid);
GO

/* =====================================================
   3. TABLA MARCAS
   ===================================================== */

CREATE TABLE Marcas
(
    MarcaId INT IDENTITY(1,1) NOT NULL,
    Nombre NVARCHAR(100) NOT NULL,
    Descripcion NVARCHAR(300) NULL,
    Activa BIT NOT NULL
        CONSTRAINT DF_Marcas_Activa DEFAULT (1),
    FechaRegistro DATETIME2 NOT NULL
        CONSTRAINT DF_Marcas_FechaRegistro DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_Marcas PRIMARY KEY (MarcaId)
);
GO

CREATE UNIQUE INDEX UQ_Marcas_Nombre
ON Marcas(Nombre);
GO

/* =====================================================
   4. TABLA PRODUCTOS
   ===================================================== */

CREATE TABLE Productos
(
    ProductoId INT IDENTITY(1,1) NOT NULL,
    MarcaId INT NOT NULL,
    Nombre NVARCHAR(150) NOT NULL,
    Precio DECIMAL(12,2) NOT NULL,
    Categoria NVARCHAR(20) NOT NULL,
    Stock INT NOT NULL,
    Imagen NVARCHAR(500) NULL,
    Descripcion NVARCHAR(1000) NULL,
    FechaRegistro DATETIME2 NOT NULL
        CONSTRAINT DF_Productos_FechaRegistro DEFAULT (SYSDATETIME()),

    CONSTRAINT PK_Productos PRIMARY KEY (ProductoId),

    CONSTRAINT FK_Productos_Marcas
        FOREIGN KEY (MarcaId)
        REFERENCES Marcas(MarcaId)
);
GO

CREATE INDEX IX_Productos_MarcaId
ON Productos(MarcaId);
GO

/* =====================================================
   5. TABLA PEDIDOS
   ===================================================== */

CREATE TABLE Pedidos
(
    PedidoId INT IDENTITY(1,1) NOT NULL,
    UsuarioId INT NOT NULL,
    Fecha DATETIME2 NOT NULL
        CONSTRAINT DF_Pedidos_Fecha DEFAULT (SYSDATETIME()),
    Estado NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Pedidos_Estado DEFAULT ('pendiente'),
    Total DECIMAL(12,2) NOT NULL,

    CONSTRAINT PK_Pedidos PRIMARY KEY (PedidoId),

    CONSTRAINT FK_Pedidos_Usuarios
        FOREIGN KEY (UsuarioId)
        REFERENCES Usuarios(UsuarioId)
);
GO

CREATE INDEX IX_Pedidos_UsuarioId
ON Pedidos(UsuarioId);
GO

/* =====================================================
   6. TABLA VENTAS
   ===================================================== */

CREATE TABLE Ventas
(
    VentaId INT IDENTITY(1,1) NOT NULL,
    PedidoId INT NULL,
    EmpleadoId INT NOT NULL,
    Fecha DATETIME2 NOT NULL
        CONSTRAINT DF_Ventas_Fecha DEFAULT (SYSDATETIME()),
    Total DECIMAL(12,2) NOT NULL,

    CONSTRAINT PK_Ventas PRIMARY KEY (VentaId),

    CONSTRAINT FK_Ventas_Empleados
        FOREIGN KEY (EmpleadoId)
        REFERENCES Usuarios(UsuarioId),

    CONSTRAINT FK_Ventas_Pedidos
        FOREIGN KEY (PedidoId)
        REFERENCES Pedidos(PedidoId)
);
GO

CREATE INDEX IX_Ventas_EmpleadoId
ON Ventas(EmpleadoId);
GO

/* =====================================================
   7. TABLA DETALLE PEDIDOS
   ===================================================== */

CREATE TABLE DetallePedidos
(
    DetallePedidoId INT IDENTITY(1,1) NOT NULL,
    PedidoId INT NOT NULL,
    ProductoId INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(12,2) NOT NULL,

    CONSTRAINT PK_DetallePedidos
        PRIMARY KEY (DetallePedidoId),

    CONSTRAINT FK_DetallePedidos_Pedidos
        FOREIGN KEY (PedidoId)
        REFERENCES Pedidos(PedidoId),

    CONSTRAINT FK_DetallePedidos_Productos
        FOREIGN KEY (ProductoId)
        REFERENCES Productos(ProductoId)
);
GO

CREATE INDEX IX_DetallePedidos_PedidoId
ON DetallePedidos(PedidoId);
GO

/* =====================================================
   8. TABLA DETALLE VENTAS
   ===================================================== */

CREATE TABLE DetalleVentas
(
    DetalleVentaId INT IDENTITY(1,1) NOT NULL,
    VentaId INT NOT NULL,
    ProductoId INT NOT NULL,
    Cantidad INT NOT NULL,
    PrecioUnitario DECIMAL(12,2) NOT NULL,

    CONSTRAINT PK_DetalleVentas
        PRIMARY KEY (DetalleVentaId),

    CONSTRAINT FK_DetalleVentas_Ventas
        FOREIGN KEY (VentaId)
        REFERENCES Ventas(VentaId),

    CONSTRAINT FK_DetalleVentas_Productos
        FOREIGN KEY (ProductoId)
        REFERENCES Productos(ProductoId)
);
GO

CREATE INDEX IX_DetalleVentas_VentaId
ON DetalleVentas(VentaId);
GO

/* =====================================================
   9. INSERTAR MARCAS
   ===================================================== */

INSERT INTO Marcas (Nombre, Descripcion)
VALUES
('Afnan', 'Marca de perfumería'),
('Dior', 'Marca de perfumería'),
('Carolina Herrera', 'Marca de perfumería'),
('Maison Francis Kurkdjian', 'Marca de perfumería');
GO

/* =====================================================
   10. INSERTAR PRODUCTOS
   ===================================================== */

INSERT INTO Productos
    (MarcaId, Nombre, Precio, Categoria, Stock, Imagen, Descripcion)
VALUES
(
    (SELECT MarcaId FROM Marcas WHERE Nombre = 'Afnan'),
    'Afnan 9PM',
    65000,
    'Masculino',
    0,
    'images/9pm.jpg',
    'Una fragancia moderna, intensa y con personalidad.'
),
(
    (SELECT MarcaId FROM Marcas WHERE Nombre = 'Dior'),
    'Sauvage',
    150000,
    'Masculino',
    0,
    'images/SauvageDior.jpg',
    'Un aroma fresco y amaderado de estilo elegante.'
),
(
    (SELECT MarcaId FROM Marcas WHERE Nombre = 'Carolina Herrera'),
    'Good Girl',
    180000,
    'Femenino',
    0,
    'images/GoodGirl.jpg',
    'Una fragancia sofisticada con una identidad única.'
),
(
    (SELECT MarcaId FROM Marcas WHERE Nombre = 'Maison Francis Kurkdjian'),
    'Baccarat Rouge 540',
    350000,
    'Unisex',
    0,
    'images/Baccarat.jpg',
    'Una fragancia envolvente y elegante.'
);
GO
