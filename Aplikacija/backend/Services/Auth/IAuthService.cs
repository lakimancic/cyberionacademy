using backend.DTOs.Auth;

namespace backend.Services.Auth;

public enum RegisterResponse {
    EmailExists,
    UsernameExists,
    Created
}

public interface IAuthService
{
    Task<RegisterResponse> RegisterAsync(RegisterDto request);
    Task<TokenResponseDto?> LoginAsync(LoginDto request);
    Task<TokenResponseDto?> RefreshTokensAsync(RefreshTokenDto request);
}