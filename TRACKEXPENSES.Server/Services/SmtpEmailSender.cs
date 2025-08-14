using Microsoft.Extensions.Options;
using System.Net;
using System.Net.Mail;

namespace TRACKEXPENSES.Server.Services
{
    public class SmtpEmailSender : IEmailSender
    {
        private readonly SmtpOptions _options;

        public SmtpEmailSender(IOptions<SmtpOptions> options)
        {
            _options = options.Value;
        }

        public async Task SendAsync(string toEmail, string subject, string htmlBody)
        {
            using var client = new SmtpClient(_options.Host, _options.Port)
            {
                EnableSsl = _options.UseSsl,
                Credentials = new NetworkCredential(_options.User, _options.Password)
            };

            var mail = new MailMessage()
            {
                From = new MailAddress(_options.From, _options.FromName),
                Subject = subject,
                Body = htmlBody,
                IsBodyHtml = true
            };
            mail.To.Add(toEmail);

            await client.SendMailAsync(mail);
        }
    }

    public class SmtpOptions
    {
        public string Host { get; set; } = string.Empty;
        public int Port { get; set; }
        public bool UseSsl { get; set; }
        public string User { get; set; } = string.Empty;
        public string Password { get; set; } = string.Empty;
        public string From { get; set; } = string.Empty;
        public string FromName { get; set; } = string.Empty;
    }
}
