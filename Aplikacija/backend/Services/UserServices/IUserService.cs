namespace backend.Services.UserServices;

public interface IUserService
{
    string GetRank(int userPoints, int userRank, int totalRanked);
}