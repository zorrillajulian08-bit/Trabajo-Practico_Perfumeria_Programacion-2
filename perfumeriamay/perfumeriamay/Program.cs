using Microsoft.EntityFrameworkCore;
using perfumeriamay.Implementations;
using perfumeriamay.interfaces;
using perfumeriamay.Models;
using perfumeriamay.services.Implementations;
using perfumeriamay.services.interfaces;
using FirebaseAdmin;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Authentication;
using perfumeriamay.Security;

var builder = WebApplication.CreateBuilder(args);

// Configuración de Firebase
var credentialPath = builder.Configuration["Firebase:CredentialPath"];

if (string.IsNullOrWhiteSpace(credentialPath) || !File.Exists(credentialPath))
{
    throw new Exception("No se encontró el archivo de credenciales de Firebase.");
}

FirebaseApp.Create(new AppOptions
{
    Credential = CredentialFactory
    .FromFile<ServiceAccountCredential>(credentialPath)
    .ToGoogleCredential()
});

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

// Autenticación con Firebase
builder.Services
    .AddAuthentication("Firebase")
    .AddScheme<AuthenticationSchemeOptions, FirebaseAuthenticationHandler>(
        "Firebase", options => { });

builder.Services.AddAuthorization();

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

app.UseAuthentication();

app.UseAuthorization();

app.MapControllers();

app.Run();
