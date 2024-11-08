﻿using Microsoft.AspNetCore.Identity;
using System.ComponentModel;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using System.Runtime.CompilerServices;

namespace TrackExpenses.Models
{
    public class GroupOfClients
    {
        [Key]
        public int Id { get; set; }

        [MaxLength(250)]
        public required string Name { get; set; }

        public string? CodeInvite { get; set; }

        // Propriedade de navegação para os clientes relacionados
        public ICollection<Client>? Clients { get; set; }
    }

    public class Client : IdentityUser
    {

        [MaxLength(250)]
        public required string FirstName { get; set; }

        [MaxLength(250)]
        public required string LastName { get; set; }

        public DateTime Birthday { get; set; }


        [PasswordPropertyText]
        public required string Password { get; set; }

        public string? PhotoPath { get; set; }

        public int? GroupId { get; set; }

        [ForeignKey("GroupId")]
        public GroupOfClients? GroupOfClients { get; set; } 
    }


    //public String LoginProcess(String clientEmail, String strPassword)
    //{
    //    String message = "";
    //    //my connection string
    //    SqlConnection con = new(System.Configuration.ConfigurationManager.ConnectionStrings["connectionString"].ConnectionString);
    //    SqlCommand cmd = new("Select * from Clients where clientEmail=@Email", con);
    //    cmd.Parameters.AddWithValue("@Êmail", clientEmail);
    //    try
    //    {
    //        con.Open();
    //        SqlDataReader reader = cmd.ExecuteReader();
    //        if (reader.Read())
    //        {
    //            Boolean login = (strPassword.Equals(reader["Password"].ToString(), StringComparison.InvariantCulture)) ? true : false;
    //            if (login)
    //            {
    //                message = "1";
    //                clientEmail = reader["Email"].ToString();

    //            }
    //            else
    //                message = "Invalid Credentials";
    //        }
    //        else
    //            message = "Invalid Credentials";

    //        reader.Close();
    //        reader.Dispose();
    //        cmd.Dispose();
    //        con.Close();
    //    }
    //    catch (Exception ex)
    //    {
    //        message = ex.Message.ToString() + "Error.";

    //    }
    //    return message;
    //}



}

