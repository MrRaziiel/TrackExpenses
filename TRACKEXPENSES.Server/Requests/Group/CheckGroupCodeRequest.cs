using System.ComponentModel;
using System.ComponentModel.DataAnnotations;

namespace TRACKEXPENSES.Server.Requests.Group
{
    public class CheckGroupCodeRequest
    {
        [DefaultValue("****************")]
        public string? Code { get; set; }
    }
}
