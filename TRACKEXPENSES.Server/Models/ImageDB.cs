
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

        public string Name { get; set; }

        public string Extension { get; set; }

        public static string UpdateProfileImgDb(string uploadPath, string imagePath, IFormFile? Image)
        {
            if (!Directory.Exists(uploadPath)) Directory.CreateDirectory(uploadPath);

            var filePath = Path.Combine(uploadPath, imagePath);
            using (var stream = new FileStream(filePath, FileMode.Create))
            {
                Image.CopyTo(stream);
               
            }
            return filePath;


        }

    }

   
}
