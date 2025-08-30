namespace TRACKEXPENSES.Server.Services;

using TRACKEXPENSES.Server.Requests.Group;
using System.Threading.Tasks;

public interface IGroupRegistrationService
{
    /// <summary>
    /// Faz o “join” a um grupo via código de convite.
    /// Retorna:
    ///  - "USER" se não há código de convite
    ///  - "GROUPMEMBER" se entrou no grupo
    ///  - null se o código é inválido
    /// </summary>
    Task<string?> RegisterGroupAsync(GroupRegisterRequest request);
}
