
namespace TRACKEXPENSES.Server.Models
{
    public class ImageDB
    {
        public ImageDB()
        {
        }

        public ImageDB(string path, string extensions)
        {
            Name = path;
            Extension = extensions;
        }

        public string Id { get; set; } = Guid.NewGuid().ToString();

        public string Name { get; set; } = string.Empty;

        public string Extension { get; set; } = string.Empty;
    }
}
