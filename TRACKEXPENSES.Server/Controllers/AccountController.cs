using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Web;
using TRACKEXPENSES.Server.Data;
using TRACKEXPENSES.Server.Models;
using TRACKEXPENSES.Server.Requests.Group;
using TRACKEXPENSES.Server.Requests.User;
using TRACKEXPENSES.Server.Services;
using TRACKEXPENSES.Server.ViewModels;



namespace TRACKEXPENSES.Server.Controllers
{

    [ApiController]
    [Route("api/User")]

    public class AccountController(RoleManager<IdentityRole> roleManager, UserManager<User> userManager,
        FinancasDbContext context, IConfiguration configuration,
        JwtService jwtService, Services.IEmailSender emailSender, ICodeGroupService codeService) : Controller
    {
        private readonly RoleManager<IdentityRole> _roleManager = roleManager;
        private readonly UserManager<User> _userManager = userManager;
        private readonly FinancasDbContext _context = context;
        private readonly IConfiguration _configuration = configuration;
        private readonly JwtService _jwtService = jwtService;
        private readonly Services.IEmailSender _emailSender = emailSender;
        private readonly ICodeGroupService _codeService = codeService;

        public sealed record RefreshRequest(string RefreshToken);


        public record ResetPasswordRequest(string Email, string Token, string NewPassword);

        [HttpPost("Register")]
        public async Task<IActionResult> Register([FromBody] RegisterViewModel model)
        {

            if (!ModelState.IsValid) return BadRequest(ModelState);

            var value = await _codeService.CheckGroupCodeAsync(new CheckGroupCodeRequest() { Code = model.CodeInvite });
            var response = "USER"; 

            var user = CreateUserFromRegister.fromRegister(model);

            string role = response.ToString();

            var result = await _userManager.CreateAsync(user, user.Password);
            if (!result.Succeeded) return BadRequest(result.Errors);

            await _context.UsersList.AddAsync(user);
            await _userManager.AddToRoleAsync(user, role);
            await _context.SaveChangesAsync();
            var baseURL = _configuration["EmailConfiguration:URL"];
            var endpoint_Activation_Account = _configuration["EmailConfiguration:Endpoint_Activation_Account"];
            var endpoint_Endpoint_delete_Account = _configuration["EmailConfiguration:Endpoint_delete_Account"];

            var token = await _userManager.GenerateEmailConfirmationTokenAsync(user);
            

            var url_Activation = $"{baseURL}{endpoint_Activation_Account}?email={HttpUtility.UrlEncode(user.Email)}&token={HttpUtility.UrlEncode(token)}";
            var url_Delete = $"{baseURL}{endpoint_Endpoint_delete_Account}?email={HttpUtility.UrlEncode(user.Email)}&token={HttpUtility.UrlEncode(token)}";
            var html = $@"
<!DOCTYPE html>
<html lang='en'>
<body style='margin:0; padding:0; font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color:#f9fafb; color:#111827;'>

  <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f9fafb; padding:40px 0;'>
    <tr>
      <td align='center'>
        <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);'>
          <!-- Header -->
          <tr>
            <td style='background:linear-gradient(90deg, #2563EB, #1E40AF); padding:20px; text-align:center;'>
              <h1 style='margin:0; font-size:24px; color:#ffffff;'>Welcome to TRACKEXPENSES 🎉</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style='padding:30px;'>
              <p style='font-size:16px; color:#374151;'>
                Hello and welcome! Your account has been created successfully. To start using all features of TRACKEXPENSES, please confirm your email address.
              </p>

              <div style='text-align:center; margin:30px 0;'>
                <a href='{url_Activation}' target='_blank' style='background:#2563EB; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-size:16px; font-weight:600; display:inline-block;'>
                  Activate My Account
                </a>
              </div>

              <p style='font-size:14px; color:#6B7280;'>
                If you did not create this account, you can delete it safely by clicking the link below:
              </p>

              <p style='text-align:center; margin-top:10px;'>
                <a href='{url_Delete}' target='_blank' style='color:#DC2626; font-weight:600; text-decoration:none;'>
                  Delete Account
                </a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style='background:#f3f4f6; padding:20px; text-align:center; font-size:12px; color:#6B7280;'>
              © {DateTime.Now.Year} TRACKEXPENSES. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</body>
</html>";

            await _emailSender.SendAsync(user.Email!, "Activation", html);
            return Created();
        }



        [HttpPost("EmailCheckInDb")]
        public async Task<IActionResult> EmailCheckInDb([FromBody] string email)
        {
            if (string.IsNullOrEmpty(email)) return BadRequest(false);
            var user = await _userManager.FindByNameAsync(email);
            var exists = user != null;
            return Ok(exists);

        }


        [HttpGet("GetProfile")]
        [Authorize]
        public async Task<IActionResult> GetProfile([FromQuery] UserEmailRequest request)
        {
            var userEmail = request.UserEmail;
            if (userEmail == null) return NotFound("No Email entered");

            var existUser = await _context.Users.Include(user => user.Expenses).SingleOrDefaultAsync(c => c.Email == userEmail);
            if (existUser == null) return NotFound("No user found");


            return Ok(existUser);
        }

        [Authorize]
        [HttpPut("EditUser")]
        public async Task<IActionResult> EditUser([FromBody] UserUpdateViewModel UserToEdit)
        {

            if (UserToEdit == null) return NotFound("No user found");

            var existUser = await _context.Users.Include(user => user.Expenses).SingleOrDefaultAsync(c => c.Email == UserToEdit.Email);
            if (existUser == null) return NotFound("No user found");

            UserToEdit.CopyTo(existUser);
            _context.Users.Update(existUser);
            _context.SaveChanges();
            return Ok("User Updated");

        }

        [Authorize]
        [HttpPost("UploadProfileImage/{id}")]
        public async Task<IActionResult> UploadProfileImage(string id, IFormFile photo)
        {
            if (string.IsNullOrWhiteSpace(id))
                return BadRequest("Invalid user ID.");



            var user = await _context.Users
                .SingleOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return NotFound("User not found");

            if (photo == null || photo.Length == 0)
            {
                await DeleteProfileImage(id);
            }
            else
            {

            }
            var extension = Path.GetExtension(photo.FileName);
            if (string.IsNullOrWhiteSpace(extension))
                return BadRequest("File must have an extension.");

            var folderName = Path.Combine("Images", "Users", id, "Profile");
            var rootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderName);
            Directory.CreateDirectory(rootPath);

            var fileName = id + extension;
            var fullPath = Path.Combine(rootPath, fileName);
            var relativePath = Path.Combine(folderName, fileName).Replace("\\", "/");

            ImageDB imageRecord = null;

            if (!string.IsNullOrEmpty(user.ProfileImageId))
            {
                imageRecord = await _context.ImagesDB
                    .SingleOrDefaultAsync(i => i.Id.ToString() == user.ProfileImageId);

                if (imageRecord != null)
                {
                    // Apaga imagem anterior
                    var oldPath = Path.Combine(rootPath, id + imageRecord.Extension);
                    if (System.IO.File.Exists(oldPath))
                        System.IO.File.Delete(oldPath);

                    // Atualiza extensão e nome
                    imageRecord.Extension = extension;
                    imageRecord.Name = relativePath;

                    _context.ImagesDB.Update(imageRecord);
                }
            }

            if (imageRecord == null)
            {
                imageRecord = new ImageDB
                {
                    Name = relativePath,
                    Extension = extension
                };

                await _context.ImagesDB.AddAsync(imageRecord);
                user.ProfileImageId = imageRecord.Id.ToString();
            }

            // Salva nova imagem no disco
            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await photo.CopyToAsync(stream);
            }

            _context.Users.Update(user);
            await _context.SaveChangesAsync();

            return Ok(new { partialPath = relativePath });
        }


        [Authorize]
        [HttpGet("GetPhotoProfileAndName/{email}")]
        public async Task<IActionResult> GetPhotoProfile(string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Invalid user ID");

            var existUser = await _context.Users
                .SingleOrDefaultAsync(c => c.Email == email);

            if (existUser == null)
                return NotFound("User not found");

            var FirstName = existUser.FirstName;
            var FamilyName = existUser.FamilyName;
            var PhotoPath = "";
            ImageDB? imageBd = null;

            if (existUser.ProfileImageId != "No_image.jpg")
                imageBd = await _context.ImagesDB.SingleOrDefaultAsync(imgId => imgId.Id == existUser.ProfileImageId);

            if (imageBd != null)
                PhotoPath = imageBd.Name;

            return Ok(new { FirstName = FirstName, FamilyName = FamilyName, PhotoPath = PhotoPath });

        }

        [HttpPost("Forgot-password")]
        public async Task<IActionResult> ForgotPassword([FromBody] string Email)
        {
            if (string.IsNullOrWhiteSpace(Email)) return BadRequest("Email é obrigatório.");

            var user = await _userManager.FindByEmailAsync(Email);
            if (user == null) return NotFound("User not found");

            var token = await _userManager.GeneratePasswordResetTokenAsync(user);

            var baseURL = _configuration["EmailConfiguration:URL"];
            var endpoint = _configuration["EmailConfiguration:Endpoint_Recover"];

            var url = $"{baseURL}{endpoint}?email={HttpUtility.UrlEncode(user.Email)}&token={HttpUtility.UrlEncode(token)}";

            var html = $@"
<!DOCTYPE html>
<html lang='en'>
<body style='margin:0; padding:0; font-family:Segoe UI, Roboto, Helvetica, Arial, sans-serif; background-color:#f9fafb; color:#111827;'>

  <table width='100%' cellpadding='0' cellspacing='0' style='background-color:#f9fafb; padding:40px 0;'>
    <tr>
      <td align='center'>
        <table width='600' cellpadding='0' cellspacing='0' style='background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.1);'>
          
          <!-- Header -->
          <tr>
            <td style='background:linear-gradient(90deg, #2563EB, #1E40AF); padding:20px; text-align:center;'>
              <h1 style='margin:0; font-size:24px; color:#ffffff;'>Reset your password 🔒</h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style='padding:30px;'>
              <p style='font-size:16px; color:#374151;'>
                Hello,
              </p>

              <p style='font-size:16px; color:#374151;'>
                We received a request to reset your password. Click the button below to set a new one:
              </p>

              <div style='text-align:center; margin:30px 0;'>
                <a href='{url}' target='_blank' style='background:#2563EB; color:#ffffff; text-decoration:none; padding:12px 24px; border-radius:8px; font-size:16px; font-weight:600; display:inline-block;'>
                  Reset Password
                </a>
              </div>

              <p style='font-size:14px; color:#6B7280;'>
                If you did not request this, you can safely ignore this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style='background:#f3f4f6; padding:20px; text-align:center; font-size:12px; color:#6B7280;'>
              © {DateTime.Now.Year} TRACKEXPENSES. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

</body>
</html>";


            await _emailSender.SendAsync(user.Email!, "Recuperar palavra-passe", html);
            return Ok(new { message = "Se o e-mail existir e estiver confirmado, enviaremos instruções." });
        }

        // 2) Confirmar reset: o frontend envia Email, Token e a nova password
        [HttpPost("Reset-password")]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Email) || string.IsNullOrWhiteSpace(request.Token) || string.IsNullOrWhiteSpace(request.NewPassword))
                return BadRequest("Dados inválidos.");

            var user = await _userManager.FindByEmailAsync(request.Email);
            if (user == null)
            {
                // Não revelar detalhes
                return BadRequest("Não foi possível redefinir a palavra-passe.");
            }

            var result = await _userManager.ResetPasswordAsync(user, request.Token, request.NewPassword);
            if (!result.Succeeded)
            {
                return BadRequest(new { errors = result.Errors.Select(e => e.Description) });
            }

            return Ok(new { message = user });
        }

        [HttpPost("Test-email")]
        public async Task<IActionResult> TestEmail(string to)
        {

            var html = $@"aaaaaaaaa";

            await _emailSender.SendAsync(to, "Teste", html);
            return Ok(new { message = "Email enviado" });
        }

        [NonAction]
        public async Task<bool> DeleteProfileImage(string id)
        {
            if (string.IsNullOrWhiteSpace(id))
                return false;


            var user = await _context.Users
                .SingleOrDefaultAsync(u => u.Id == id);

            if (user == null)
                return false;

            var folderName = Path.Combine("Images", "Users", id, "Profile");
            var rootPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", folderName);

            if (!Directory.Exists(rootPath)) return false;


            Directory.Delete(rootPath, true);
            return true;
        }



        [HttpPost("Refresh-token")]
        public async Task<IActionResult> Refresh([FromBody] RefreshRequest req)
        {
            var tokens = await _jwtService.RefreshAsync(req.RefreshToken, HttpContext);
            if (tokens is null) return Unauthorized();
            return Ok(tokens); // { accessToken, refreshToken }
        }

        [HttpPost("Logout")]
        public async Task<IActionResult> Logout([FromBody] RefreshRequest req)
        {
            await _jwtService.RevokeAsync(req.RefreshToken);
            return NoContent();
        }
        [HttpPost("Login")]
        public async Task<IActionResult> Login([FromBody] LoginViewModel model)
        {
            var res = await _jwtService.Authenticate(model, HttpContext);
            if (res is null) return Unauthorized();
            return Ok(res); // contém AccessToken, RefreshToken, etc
        }

        [HttpPost("ActivationAccount")]
        public async Task<IActionResult> ActivationAccount([FromBody] UserEmailRequest request)
        {
            if (request is null) return BadRequest("Email not found!");
            var user = await _userManager.FindByEmailAsync(request.UserEmail);
            if (user is null) return BadRequest("User not found!");

            var confirm = await _userManager.ConfirmEmailAsync(user, request.Token);
            if (!confirm.Succeeded) return BadRequest("Activation error");

            return Ok("Activated!");
        }

        [HttpPost("DeleteAccount")]
        public async Task<IActionResult> DeleteAccount([FromBody] UserEmailRequest request)
        {
            if (request is null) return BadRequest("Email not found!");
            var user = await _userManager.FindByEmailAsync(request.UserEmail);
            if (user is null) return BadRequest("User not found!");
            
            var confirm = await _userManager.DeleteAsync(user);

            if (confirm is null) return BadRequest("Delete user error");

            return Ok("Delete!");

        }

    }
}


