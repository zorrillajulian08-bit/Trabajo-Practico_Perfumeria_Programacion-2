using FirebaseAdmin.Auth;
using Microsoft.AspNetCore.Authentication;
using Microsoft.Extensions.Options;
using System.Security.Claims;
using System.Text.Encodings.Web;

namespace perfumeriamay.Security
{
    public class FirebaseAuthenticationHandler
        : AuthenticationHandler<AuthenticationSchemeOptions>
    {
        public FirebaseAuthenticationHandler(
            IOptionsMonitor<AuthenticationSchemeOptions> options,
            ILoggerFactory logger,
            UrlEncoder encoder)
            : base(options, logger, encoder)
        {
        }

        protected override async Task<AuthenticateResult> HandleAuthenticateAsync()
        {
            // Buscar el token en el encabezado Authorization
            if (!Request.Headers.TryGetValue("Authorization", out var authorizationHeader))
            {
                return AuthenticateResult.NoResult();
            }

            var header = authorizationHeader.ToString();

            if (!header.StartsWith("Bearer ", StringComparison.OrdinalIgnoreCase))
            {
                return AuthenticateResult.NoResult();
            }

            var token = header.Substring("Bearer ".Length).Trim();

            if (string.IsNullOrWhiteSpace(token))
            {
                return AuthenticateResult.Fail("El token está vacío.");
            }

            try
            {
                // Firebase comprueba que el token sea válido
                var decodedToken = await FirebaseAuth.DefaultInstance
                    .VerifyIdTokenAsync(token);

                var claims = new List<Claim>
                {
                    new Claim(ClaimTypes.NameIdentifier, decodedToken.Uid)
                };

                if (decodedToken.Claims.TryGetValue("email", out var email))
                {
                    claims.Add(new Claim(ClaimTypes.Email, email.ToString()!));
                }

                var identity = new ClaimsIdentity(claims, Scheme.Name);
                var principal = new ClaimsPrincipal(identity);
                var ticket = new AuthenticationTicket(principal, Scheme.Name);

                return AuthenticateResult.Success(ticket);
            }
            catch (FirebaseAuthException)
            {
                return AuthenticateResult.Fail("El token de Firebase no es válido.");
            }
            catch (Exception)
            {
                return AuthenticateResult.Fail("No se pudo verificar el token.");
            }
        }
    }
}