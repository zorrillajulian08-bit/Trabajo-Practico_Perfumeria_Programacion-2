
using Microsoft.EntityFrameworkCore;
using perfumeriamay.Implementations;
using perfumeriamay.interfaces;
using perfumeriamay.Models;
using perfumeriamay.services.Implementations;
using perfumeriamay.services.interfaces;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;

var builder = WebApplication.CreateBuilder(args);

// Identificación del proyecto Firebase
var firebaseProjectId = "emprendimiento-may";

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

// Autenticación con Firebase sin credencial privada
builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.Authority =
            $"https://securetoken.google.com/{firebaseProjectId}";

        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer =
                $"https://securetoken.google.com/{firebaseProjectId}",

            ValidateAudience = true,
            ValidAudience = firebaseProjectId,

            ValidateLifetime = true
        };
    });

builder.Services.AddAuthorization();

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler =
            System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
    });

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// SQL Server
builder.Services.AddDbContext<PerfumeriaEmprendimientoMayContext>(options =>
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("defaultconnection")
    )
);

// Servicios
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

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
