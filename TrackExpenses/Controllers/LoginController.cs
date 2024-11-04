using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Microsoft.AspNetCore.Mvc;
using TrackExpenses.Models;
namespace MvcApplication1.Controllers
{
    public class LoginController : Controller
    {
        //
        // GET: /UserLogin/

        public ActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public ActionResult ClientLogin()
        {
            return View();
        }

        //This the Login method. It passes a object of my Model Class named "User".
        //[HttpPost]
        //public ActionResult ClientLogin(Client clients)
        //{
        //    if (ModelState.IsValid)
        //    {
        //        //message will collect the String value from the model method.
        //        String message = clients.LoginProcess(clients.Email, clients.Password);
        //        //RedirectToAction("actionName/ViewName_ActionResultMethodName", "ControllerName");
        //        if (message.Equals("1"))
        //        {
        //            //this will add cookies for the username.
        //            Response.Cookies.Add(new HttpCookie("Users1", clients.Email));
        //            //This is a different Controller for the User Homepage. Redirecting after successful process.
        //            return RedirectToAction("Home", "UserHome");
        //        }
        //        else
        //            ViewBag.ErrorMessage = message;
        //    }
        //    return View(clients);
        //}

    }
}