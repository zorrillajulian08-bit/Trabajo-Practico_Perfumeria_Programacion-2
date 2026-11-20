
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace perfumeriamay.Security
{
    public class FirebaseAuthenticationHandler
        : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        private readonly IConfiguration _configuration;

        public FirebaseAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder,
            IConfiguration configuration)
            : base(options, logger, encoder)
        {
            _configuration = configuration;
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            if (!Request.Headers.TryGetValue("Authorization", out var authorizationHeader))
                return AuthenticateResult.NoResult();

            var header = authorizationHeader.ToString();

            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
                return AuthenticateResult.NoResult();

            var token = header.Substring("Bearer ".Length).Trim();

            if (string.IsNullOrWhiteSpace(token))
                return AuthenticateResult.Fail("El token está vacío.");

            try
            {
                var projectId = "emprendimiento-may";

                var metadataAddress =
                    $"https://securetoken.google.com/{projectId}/.well-known/openid-configuration";

                var configurationManager =
                    new Microsoft.IdentityModel.Protocols.ConfigurationManager
                    <Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfiguration>(
                        metadataAddress,
                        new Microsoft.IdentityModel.Protocols.OpenIdConnect.OpenIdConnectConfigurationRetriever()
                    );

                var config = await configurationManager.GetConfigurationAsync(
                    Context.RequestAborted
                );

                var validationParameters = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidIssuer = $"https://securetoken.google.com/{projectId}",

                    ValidateAudience = true,
                    ValidAudience = projectId,

                    ValidateLifetime = true,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKeys = config.SigningKeys,

                    ClockSkew = TimeSpan.FromMinutes(5)
                };

                var tokenHandler = new JwtSecurityTokenHandler();

                var principal = tokenHandler.ValidateToken(
                    token,
                    validationParameters,
                    out _
                );

                var ticket = new AuthenticationTicket(principal, Scheme.Name);

                return AuthenticateResult.Success(ticket);
            }
            catch (Exception)
            {
                return AuthenticateResult.Fail("El token de Firebase no es válido.");
            }
        }
    }
}
