
using Microsoft.EntityFrameworkCore;
using perfumeriamay.Implementations;
using perfumeriamay.interfaces;
using perfumeriamay.Models;
using perfumeriamay.services.Implementations;
using perfumeriamay.services.interfaces;

var builder = WebApplication.CreateBuilder(args);

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("PermitirFrontend", policy =>
    {
        policy
            .AllowAnyOrigin()
            .AllowAnyHeader()
            .AllowAnyMethod();
    });
});

// Servicios
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddDbContext<PerfumeriaEmprendimientoMayContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("defaultconnection")
    )
);

builder.Services.AddScoped<IPerfumeriaRepository, PerfumeriaRepository>();
builder.Services.AddScoped<IPerfumeriaService, PerfumeriaService>();

var app = builder.Build();

// Swagger
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();

app.UseCors("PermitirFrontend");

app.UseAuthorization();

app.MapControllers();

app.Run();
