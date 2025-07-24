using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using Microsoft.IdentityModel.Tokens;
using backend.DTOs.Auth;

namespace backend.Services.Auth;

public class AuthService(ApplicationDbContext context, IConfiguration configuration) : IAuthService
{
    public async Task<TokenResponseDto?> LoginAsync(LoginDto request)
    {
        var user = await context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);

        if (user is null)
            return null;

        if (!BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
            return null;

        return await CreateTokenResponse(user);
    }

    private async Task<TokenResponseDto> CreateTokenResponse(User user)
    {
        return new TokenResponseDto
        {
            AccessToken = CreateToken(user),
            RefreshToken = await GenerateAndSaveRefreshTokenAsync(user)
        };
    }

    public async Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenDto request)
    {
        var user = await ValidateRefreshTokenAsync(request.UserId, request.RefreshToken);

        if (user is null)
            return null;

        return await CreateTokenResponse(user);
    }

    private async Task<User?> ValidateRefreshTokenAsync(int userId, string refreshToken)
    {
        var user = await context.Users.FindAsync(userId);
        if (user is null || user.RefreshToken != refreshToken
            || user.RefreshTokenExpiryTime <= DateTime.UtcNow)
            return null;

        return user;
    }

    public async Task<RegisterResponse> RegisterAsync(RegisterDto request)
    {
        if (await context.Users.AnyAsync(u => u.Email == request.Email))
            return RegisterResponse.EmailExists;

        if (await context.Users.AnyAsync(u => u.Username == request.Username))
            return RegisterResponse.UsernameExists;

        var user = new User
        {
            Email = request.Email,
            Username = request.Username,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password),
            FullName = request.FullName,
            Country = request.Country
        };
        context.Users.Add(user);
        await context.SaveChangesAsync();

        return RegisterResponse.Created;
    }
    
    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private async Task<string> GenerateAndSaveRefreshTokenAsync(User user)
    {
        var refreshToken = GenerateRefreshToken();
        user.RefreshToken = refreshToken;
        user.RefreshTokenExpiryTime = DateTime.UtcNow.AddDays(7);
        await context.SaveChangesAsync();
        return refreshToken;
    }

    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new(ClaimTypes.Name, user.Username),
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(ClaimTypes.Role, user.Role.ToString())
        };

        var key = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(configuration.GetValue<string>("AppSettings:Token")!));

        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha512);

        var tokenDescriptor = new JwtSecurityToken(
            issuer: configuration.GetValue<string>("AppSettings:Issuer"),
            audience: configuration.GetValue<string>("AppSettings:Audience"),
            claims: claims,
            expires: DateTime.UtcNow.AddDays(1),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(tokenDescriptor);
    }
}