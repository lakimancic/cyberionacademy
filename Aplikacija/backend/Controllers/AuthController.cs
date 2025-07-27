using backend.DTOs.Auth;
using backend.Services.Auth;

namespace backend.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController(IAuthService authService) : ControllerBase
{
    [HttpPost("Register")]
    public async Task<ActionResult<JsonContent>> Register(RegisterDto request)
    {
        var result = await authService.RegisterAsync(request);

        return result switch
        {
            RegisterResponse.EmailExists => BadRequest(new { Error = "Email address is already in use" }),
            RegisterResponse.UsernameExists => BadRequest(new { Error = "Username is already in use" }),
            RegisterResponse.Created => Ok(new { Message = "Registered successfully" }),
            _ => StatusCode(500, new { Error = "Unknown error occurred" })
        };
    }

    [HttpPost("Login")]
    public async Task<ActionResult<TokenResponseDto>> Login(LoginDto request)
    {
        var result = await authService.LoginAsync(request);
        if (result is null)
            return BadRequest(new { Error = "Invalid email or password" });

        return Ok(result);
    }

    [HttpPost("RefreshToken")]
    public async Task<ActionResult<TokenResponseDto>> RefreshToken(RefreshTokenDto request)
    {
        var result = await authService.RefreshTokensAsync(request);
        if (result is null || result.AccessToken is null || result.RefreshToken is null)
            return Unauthorized(new { Error = "Invalid refresh token" });

        return Ok(result);
    }
}