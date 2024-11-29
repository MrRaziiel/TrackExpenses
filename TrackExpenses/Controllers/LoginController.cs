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


    }
}