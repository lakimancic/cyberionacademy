namespace backend.Services.UserServices;

public class UserService : IUserService
{
    public string GetRank(int userPoints, int userRank, int totalRanked)
    {
        if (userPoints >= 100000 && userRank == 1)
            return "God of Hacking";
        else if (userPoints >= 100000 && userRank <= Math.Min(100, totalRanked / 100))
            return "Divine Hacker";
        else if (userPoints >= 50000 && userRank <= totalRanked / 20)
            return "Legendary Hacker";
        else if (userPoints >= 20000 && userRank <= totalRanked / 5)
            return "Elite Hacker";
        else if (userPoints >= 10000 && userRank <= totalRanked * 2 / 5)
            return "Pro Hacker";
        else if (userPoints >= 5000 && userRank <= totalRanked * 3 / 5)
            return "Hacker";
        else if (userPoints >= 1000 && userRank <= totalRanked * 4 / 5)
            return "Script Kiddie";
        else if (userPoints > 0)
            return "Newbie";
        else
            return "Unranked";
    }
}