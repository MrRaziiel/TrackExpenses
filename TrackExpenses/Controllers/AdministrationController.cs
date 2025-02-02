﻿using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.ComponentModel.DataAnnotations;
using TrackExpenses.Data;
using TrackExpenses.Models;
using TrackExpenses.ViewModels;


namespace TrackExpenses.Controllers
{
    public class AdministrationController : Controller
    {
        private readonly RoleManager<IdentityRole> _roleManager;
        private readonly UserManager<Client> _userManager;
        private readonly FinancasDbContext _context;

        public AdministrationController(RoleManager<IdentityRole> roleManager, UserManager<Client> userManager, FinancasDbContext context)
        {
            _roleManager = roleManager;
            _userManager = userManager;
            _context = context;
        }
        [HttpGet]
        public IActionResult CreateRole()
        {
            return View();
        }

        [HttpPost]
        public async Task<IActionResult> CreateRole(CreateRoleViewModel roleModel)
        {
            if (ModelState.IsValid)
            {
                // Check if the role already exists
                bool roleExists = await _roleManager.RoleExistsAsync(roleModel.RoleName);
                if (roleExists)
                {
                    ModelState.AddModelError("", "Role Already Exists");
                }
                else
                {
                    // Create the role
                    // We just need to specify a unique role name to create a new role
                    IdentityRole identityRole = new ()
                    {
                        Name = roleModel?.RoleName
                    };

                    // Saves the role in the underlying AspNetRoles table
                    IdentityResult result = await _roleManager.CreateAsync(identityRole);

                    if (result.Succeeded)
                    {
                        return RedirectToAction("Index", "Home");
                    }

                    foreach (IdentityError error in result.Errors)
                    {
                        ModelState.AddModelError("", error.Description);
                    }
                }
            }

            return View(roleModel);
        }

        [HttpGet]
        public async Task<IActionResult> ListRoles()
        {
            List<IdentityRole> roles = await _roleManager.Roles.ToListAsync();
            var newList = roles.OrderBy(x => x.Name).ToList();
            return View(newList);
        }
        [HttpGet]
        public async Task<IActionResult> EditRole(string roleId)
        {
            //First Get the role information from the database
            IdentityRole role = await _roleManager.FindByIdAsync(roleId);
            if (role == null)
            {
                // Handle the scenario when the role is not found
                return View("Error");
            }

            //Populate the EditRoleViewModel from the data retrived from the database
            var model = new EditRoleViewModel
            {
                Id = role.Id,
                RoleName = role.Name
                // You can add other properties here if needed
            };

            return View(model);
        }
        [HttpPost]
        public async Task<IActionResult> EditRole(EditRoleViewModel model)
        {
            if (ModelState.IsValid)
            {
                var role = await _roleManager.FindByIdAsync(model.Id);
                if (role == null)
                {
                    // Handle the scenario when the role is not found
                    ViewBag.ErrorMessage = $"Role with Id = {model.Id} cannot be found";
                    return View("NotFound");
                }
                else
                {
                    role.Name = model.RoleName;
                    // Update other properties if needed

                    var result = await _roleManager.UpdateAsync(role);
                    if (result.Succeeded)
                    {

                        return RedirectToAction("ListRoles"); // Redirect to the roles list
                    }

                    foreach (var error in result.Errors)
                    {
                        ModelState.AddModelError("", error.Description);
                    }

                    return View(model);
                }
            }

            return View(model);
        }
        [HttpPost]
        public async Task<IActionResult> DeleteRole(string roleId)
        {
            var role = await _roleManager.FindByIdAsync(roleId);
            if (role == null)
            {
                // Role not found, handle accordingly
                ViewBag.ErrorMessage = $"Role with Id = {roleId} cannot be found";
                return View("NotFound");
            }

            var result = await _roleManager.DeleteAsync(role);
            if (result.Succeeded)
            {
                // Role deletion successful
                return RedirectToAction("ListRoles"); // Redirect to the roles list page
            }

            foreach (var error in result.Errors)
            {
                ModelState.AddModelError("", error.Description);
            }

            // If we reach here, something went wrong, return to the view
            return View("ListRoles", await _roleManager.Roles.ToListAsync());
        }

        [HttpGet]
        public IActionResult ListClients()
        {
            var allClients =  _context.Clients.Include(client => client.GroupOfClients).ToList();
            if (allClients == null) return View();
            
            return View(allClients);
       

        }

        
        [HttpGet]
        public IActionResult EditClient(string? id)
        {
            {
                if (id == null) return View();
                
                //editing  -> load an expense by Id
                var clientInDB = _context.Clients.SingleOrDefault(client => client.Id.Equals(id));

                if (clientInDB == null) return View();

                var model = AdminClientUpdateViewModel.FromClient(clientInDB);
                if (clientInDB.ProfileImageId != null)
                {
                    var imageBd = _context.ImagesDB.SingleOrDefault(imgId => imgId.Id.Equals(clientInDB.ProfileImageId));
                    var rootPath = Path.Combine("/","images", "Users");

                    if (imageBd != null)
                    {
                        var nameWithExtensio = imageBd.Name + imageBd.Extension;
                        model.ProfileImagePath = Path.Combine(rootPath,imageBd.Name, nameWithExtensio);
                    }
                    else
                    {
                        model.ProfileImagePath = Path.Combine(rootPath,"No_image.jpg");
                    }
                }
                return View(model)
            }
        }

        [HttpPost] 
        public IActionResult EditClientForm(AdminClientUpdateViewModel model, IFormFile? Image) //Editing Client
        {
            var clientInDB = _context.Clients.SingleOrDefault(client => client.Id == model.Id);
            if (Image != null)
            {
                // Save the image to a file or process it as needed
                var extension = Path.GetExtension(Image.FileName); // Use the original file name

                string nameNewFile = clientInDB.Id + extension;
                var foldPath = Path.Combine(nameNewFile, nameNewFile);

                var uploadPath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", "images", "Users", clientInDB.Id);



                // Construct the file path
                var fileExist = System.IO.File.Exists(uploadPath);
              
                ImageDB.UpdateProfileImgDb(uploadPath, nameNewFile, Image);
                if (!fileExist) {
                    
                    ImageDB newImage = new ImageDB(clientInDB.Id, extension);
                    clientInDB.ProfileImageId = newImage.Id;
                    _context.ImagesDB.Add(newImage);
                }


            }
            if (ModelState.IsValid)
            {

                model.CopyTo(clientInDB);

                _context.Clients.Update(clientInDB);
                _context.SaveChanges();

            }

            
   
            //_context.SaveChanges();
            return RedirectToAction("ListClients");
        }


        public async Task<IActionResult> DeleteClient(string Id)
        {
            var existClient = _context.Clients.Include(client => client.Expenses).SingleOrDefault(c => c.Id == Id);
            if(existClient.Expenses.Count >0)
            {
                foreach(var clientExpense in existClient.Expenses)
                {
                    var bdExpense = _context.Expenses.FirstOrDefault(exp => exp.Id == clientExpense.Id);
                    if(bdExpense != null)
                    {
                        _context.Expenses.Remove(bdExpense);
                    }
                        
                }
                await _context.SaveChangesAsync();
            }
            if (existClient != null)
            {
                _context.Clients.Remove(existClient);
            }
            await _context.SaveChangesAsync();
            return RedirectToAction("ListClients");

        }
    }

}