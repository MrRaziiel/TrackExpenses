import React, { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    app: {
      name: "TRACKEXPENSES",
    },
    common: {
      dashboard: "Dashboard",
      expenses: "Expenses",
      incomes: "Incomes",
      users: "Users",
      settings: "Settings",
      logout: "Logout",
      save: "Save",
      cancel: "Cancel",
      search: "Search",
      filter: "Filter",
      add: "Add",
      total: "Total",
      overview: "Overview",
      amount: "Amount",
      date: "Date",
      category: "Category",
      description: "Description",
      source: "Source",
      status: "Status",
      actions: "Actions",
      login: "Login",
      searchExpenses: "Search expenses...",
      searchIncomes: "Search incomes...",
      expense: "Expense",
      income: "Income",
      expensesOverview: "Expenses Overview",
      incomeOverview: "Income Overview",
      totalExpenses: "Total Expenses",
      totalIncome: "Total Income",
      allRightsReserved: "All rights reserved",
      privacyPolicy: "Privacy Policy",
      termsOfService: "Terms of Service",
      contact: "Contact",
      name: "Name",
      firstName: "First Name",
      familyName: "Family Name",
      email: "Email",
      user: "User",
      add_user: "Add a user",
      clear: "Clear",
      all: "All",
      allGroups: "All Groups",
      searchUsers: "Type to search users...",
      fullName: "Full Name",
      group: "Group",
      birthday: "Birthday",
      earnings: "Earnings",
      earning: "Earning",
      calendar: "Calendar",
      options: "Options",
      option: "option",
      forgotPassword: "Forgot Password?",
      password: "Password",
      noAccount: "Don't have an account? Sign Up",
      back: "Back",
      value: "Value",
      notpayed: "Remaining",
      premium: "Premium",
      editProfile: "Edit Profile",
      navigation: "Navigation",
      admin: "Admin",
      adminGroup: "Admin Group",
      account: "Account",
      menu: "Menu",
      save_Changes: "Save Changes",
      phone_number: "Phone number",
      save_Change: "Save Changes",
      new_Password: "New Password",
      new_password: "New Password",
      member: "Member",
      not_provided: "Not Provided",
      signingIn: "Signing in…",
      saving: "Saving…",
      retry: "Retry",
      try_again: "Try again",
      loading: "Loading…",
      click_to_change_photo: "Click to change photo",
      photo_alt: "Profile photo",
      remove_photo: "Remove photo",
      roles: "Roles",
      no_Provide: "No Provide",
      groups: "Groups",
      group_list: "List",
      group_admin: "Admin"
    },
    settings: {
      appearance: "Appearance",
      themeMode: "Theme Mode",
      light: "Light",
      dark: "Dark",
      preferences: "Preferences",
      language: "Language",
      notifications: "Notifications",
      security: "Security",
    },
    categories: {
      food: "Food",
      transport: "Transport",
      entertainment: "Entertainment",
      bills: "Bills",
      others: "Others",
      salary: "Salary",
      freelance: "Freelance",
      investments: "Investments",
    },
    auth: {
      loginTitle: "LOGIN",
      forgotTitle: "Forgot your password?",
      forgotSubtitle:
        "No worries! Enter your email and we’ll send you a reset link.",
      sendEmail: "Send email",
      sending: "Sending...",
      rememberPassword: " Remember your password?",
      backToSignIn: "Back to sign in",
      firstName: "First Name",
      familyName: "Family Name",
      confirmPassword: "Confirm Password",
      next: "Next",
      alreadyAccount: "Already have an account? Sign in",
      createTitle: "Create your account",
      createSubtitle: "Just one more step to complete your registration",
      loginSubtitle: "Enter your credentials to access your account",
      firstNamePH: "Enter your First Name...",
      familyNamePH: "Enter your First Name...",
      date: "BirthDay",
      phone: "Phone",
      CodeInvite: "Code Invite",
      inviteCodePH: "Group Code",
      inviteHelp:"You can ask your financial administrator that is already registered to give you. <br /><b>Leave blank if you don't have a group code (you can add or change anytime)</b>",
      createAccount: "Create Account!",
      addUser: {
      title: "Add user"
      },
    },
  profile: {
      title: "Profile",
      edit_Profile: "Edit Profile",
      no_Group_Members: "No group members",
      group_Members: "Group members",
      personal_information: "Personal Information",
      click_To_Change_Picture: "Click on your profile picture to change it",
      not_provided: "Not provided",
      group_information: "Group Information",
      group_name: "Group Name",
      invite_code: "Invite Code",
      copy_invite_code: "Copy invite code",
      group_role: "Group Role",
      group_members: "Group Members",
      no_group_members: "No group members",
      remove_member: "Remove member",
      password_leave_empty: "Leave empty to keep current password",
      retry_loading_profile: "Retry loading profile",
  enter_first_name: "Enter first name",
  enter_family_name: "Enter family name",
  email: "Email",
  enter_phone_number: "Enter phone number",
  hide_password: "Hide password",
  show_password: "Show password",
  image_invalid_format: "Invalid image format. Use JPG or PNG.",
  image_too_large: "Image is too large (max 5 MB).",
  image_upload_error: "We couldn't upload your image. Please try again.",
  image_error_prefix: "Error:"
  },
    placeholders: {
      email: "Enter your email...",
      password: "Enter your password...",
    },
    session:{
      almostExpire: "Session almost expiring",
      chose_Renew_Or_Logout:"Do you want to renew your session or end it?",
      time_Left: "Remaining time",
      logout: "Log out",
      renew: "Renew"
    }
    ,
    fields: {
      firstName: "First Name",
      firstNamePh: "First Name",
      familyName: "Family Name",
      familyNamePh: "Family Name",
      email: "Email",
      emailPh: "me@example.org",
      birthday: "Birthday",
      birthdayPh: "Date",
      telephone: "Phone",
      telephonePh: "000000000",
      password: "Password",
      passwordPh: "****************",
      confirmPassword: "Confirm Password",
      confirmPasswordPh: "****************"
    },
    errors: {
      firstNameRequired: "First name is required.",
      familyNameRequired: "Family name is required.",
      emailRequired: "Email is required.",
      emailInvalid: "Invalid email format.",
      emailCheckFailed: "Error while verifying email.",
      emailAlreadyRegistered: "Email already registered.",
      passwordRequired: "Password is required.",
      confirmPasswordRequired: "Confirm password is required.",
      passwordsDontMatch: "Passwords do not match.",
      registerFailed: "Error while registering user.",
      couldnt_load_profile: "We couldn't load your profile. Please try again.",
      couldnt_save_changes: "We couldn't save your changes. Please try again.",
    },
    password: {
      length: "Length: ",
      okLen: "ok (≥8)",
      errLen: "min 8 chars",
      upper: "Uppercase: ",
      needUpper: "need A-Z",
      lower: "Lowercase: ",
      needLower: "need a-z",
      number: "Number: ",
      needNumber: "need 0-9",
      symbol: "Symbol: ",
      needSymbol: "need a symbol"
    },
  premium: {
  title: "Premium",
  free: "Free",
  premium: "Premium",
  perMonth: "/month",
  mostPopular: "Most popular",
  active: "Active",
  upgrade: "Upgrade to Premium",
  manage: "Manage Subscription",
  cancel: "Cancel Premium",
  canceling: "Canceling...",
  enabling: "Enabling...",
  currentPlan: "Current plan",
  chooseFree: "Switch to Free",
  footer: "You can cancel anytime from your account settings.",
  features: {
    expenseTracking: "Expense tracking",
    monthlySummary: "Monthly summary",
    export: "Export",
    groupSharing: "Group sharing",
    prioritySupport: "Priority support"
  },
  errors: {
    enableFail: "Failed to enable premium.",
    cancelFail: "Failed to cancel premium."
  },
}
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem("language");
    return savedLanguage || "en";
  });

  useEffect(() => {
    localStorage.setItem("language", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split(".");
    let value = translations[language];
    for (const k of keys) {
      value = value?.[k];
    }
    return value || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}
