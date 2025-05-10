
export function pageConfigurations(){
    const firstConfigurationPage =
    [
    { label: "Email", lower: "email", placeholder: "me@example.org", Required: true, type: "email" , value: "" },
    { label: "Password", lower: "password", placeholder: "****************", Required: true, type: "password", pattern: "(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}", value: "" },
    { label: "ConfirmPassword", lower: "confirmpassword", placeholder: "****************", Required: true, type: "password", pattern:"", value: "" },
    ]
    const secondconfigurationPage = 
    [
    { label: "FirstName", lower: "firstname", placeholder: "First Name", Required: true, type: "text" , pattern:"", value: "" },
    { label: "FamilyName", lower: "familyname", placeholder: "Family Name", Required: true, type: "text", pattern:"", value: "" },
    { label: "Date", lower: "date", placeholder: "Date", Required: false, type: "date" , pattern:"", value: "" },
    { label: "Phone", lower: "phone", placeholder: "Phone", Required: false, type: "tel", pattern:"[0-9]{3}-[0-9]{2}-[0-9]{3}", value: "" },
    { label: "Photopath", lower: "Photopath", placeholder: "Photopath", Required: false, pattern:"", value: "" },
    { label: "GroupCode", lower: "groupcode", placeholder: "Group Code", type: "Text" , Required: false, pattern:"", value: "" },
  ]
}


export function getPasswordValidation(password) {
  return [
    {
      label: "Password must be at least 16 characters ",
      rule: password.length >= 16,
      error: "❌",
      valid: "✅"
    },
    {
      label: "Password must have 1 lowercase character ",
      rule: /[a-z]/.test(password),
      error: "❌",
      valid: "✅"
    },
    {
      label: "Password must have 1 uppercase character ",
      rule: /[A-Z]/.test(password),
      error: "❌",
      valid: "✅"
    },
    {
      label: "Password must have 1 digit ",
      rule: /\d/.test(password),
      error: "❌",
      valid: "✅"
    },
    {
      label: "Password must have at least 1 special character ",
      rule: /[^a-zA-Z0-9]/.test(password),
      error: "❌",
      valid: "✅"
    },
  ];
}

