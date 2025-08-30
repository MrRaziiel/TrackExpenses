using System.Threading.Tasks;
using TRACKEXPENSES.Server.Requests.Group;

namespace TRACKEXPENSES.Server.Services
{
    public interface ICodeGroupService
    {
        Task<bool?> CheckGroupCodeAsync(CheckGroupCodeRequest request);
    }
}
