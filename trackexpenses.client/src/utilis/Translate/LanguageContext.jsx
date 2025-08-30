import React, { createContext, useContext, useState, useEffect } from 'react';

const LanguageContext = createContext();

const translations = {
  en: {
    common: {
      dashboard: 'Dashboard',
      expenses: 'Expenses',
      incomes: 'Incomes',
      users: 'Users',
      settings: 'Settings',
      logout: 'Logout',
      save: 'Save',
      cancel: 'Cancel',
      search: 'Search',
      filter: 'Filter',
      add: 'Add',
      total: 'Total',
      overview: 'Overview',
      amount: 'Amount',
      date: 'Date',
      category: 'Category',
      description: 'Description',
      source: 'Source',
      status: 'Status',
      actions: 'Actions',
      login: 'Login',
      searchExpenses: 'Search expenses...',
      searchIncomes: 'Search incomes...',
      expense: 'Expense',
      income: 'Income',
      expensesOverview: 'Expenses Overview',
      incomeOverview: 'Income Overview',
      totalExpenses: 'Total Expenses',
      totalIncome: 'Total Income',
      allRightsReserved: 'All rights reserved',
      privacyPolicy: 'Privacy Policy',
      termsOfService: 'Terms of Service',
      contact: 'Contact',
      name: 'Name',
      firstName: 'First Name',
      familyName: 'Family Name',
      email: 'Email',
      user: "User",
      add_user: "Add a user", 
      clear: "Clear",
      all: "All",
      searchUsers: "Type to search users...",
      fullName: "Full Name",
      group: "Group",
      birthday: "Birthday",
      earnings: "Earnings",
      earning: "Earning",
      calendar: "Calendar",
      options: "Options",
      option: "option"

    },
    settings: {
      appearance: 'Appearance',
      themeMode: 'Theme Mode',
      light: 'Light',
      dark: 'Dark',
      preferences: 'Preferences',
      language: 'Language',
      notifications: 'Notifications',
      security: 'Security',
    },
    categories: {
      food: 'Food',
      transport: 'Transport',
      entertainment: 'Entertainment',
      bills: 'Bills',
      others: 'Others',
      salary: 'Salary',
      freelance: 'Freelance',
      investments: 'Investments',
    },
  },
  pt: {
    common: {
      dashboard: 'Painel',
      expenses: 'Despesas',
      incomes: 'Receitas',
      users: 'Utilizadores',
      settings: 'Configurações',
      logout: 'Sair',
      save: 'Salvar',
      cancel: 'Cancelar',
      search: 'Pesquisar',
      filter: 'Filtrar',
      add: 'Adicionar',
      total: 'Total',
      overview: 'Visão Geral',
      amount: 'Valor',
      date: 'Data',
      category: 'Categoria',
      description: 'Descrição',
      source: 'Fonte',
      status: 'Status',
      actions: 'Ações',
      login: 'Entrar',
      searchExpenses: 'Pesquisar despesas...',
      searchIncomes: 'Pesquisar receitas...',
      expense: 'Despesa',
      income: 'Receita',
      expensesOverview: 'Visão Geral das Despesas',
      incomeOverview: 'Visão Geral das Receitas',
      totalExpenses: 'Total de Despesas',
      totalIncome: 'Total de Receitas',
      allRightsReserved: 'Todos os direitos reservados',
      privacyPolicy: 'Política de Privacidade',
      termsOfService: 'Termos de Serviço',
      contact: 'Contato',
      name: 'Nome',
      email: 'E-mail'
    },
    settings: {
      appearance: 'Aparência',
      themeMode: 'Modo do Tema',
      light: 'Claro',
      dark: 'Escuro',
      preferences: 'Preferências',
      language: 'Idioma',
      notifications: 'Notificações',
      security: 'Segurança',
    },
    categories: {
      food: 'Alimentação',
      transport: 'Transporte',
      entertainment: 'Entretenimento',
      bills: 'Contas',
      others: 'Outros',
      salary: 'Salário',
      freelance: 'Freelancer',
      investments: 'Investimentos',
    },
  },
  es: {
    common: {
      dashboard: 'Panel',
      expenses: 'Gastos',
      incomes: 'Ingresos',
      users: 'Usuarios',
      settings: 'Ajustes',
      logout: 'Cerrar sesión',
      save: 'Guardar',
      cancel: 'Cancelar',
      search: 'Buscar',
      filter: 'Filtrar',
      add: 'Añadir',
      total: 'Total',
      overview: 'Resumen',
      amount: 'Monto',
      date: 'Fecha',
      category: 'Categoría',
      description: 'Descripción',
      source: 'Fuente',
      status: 'Estado',
      actions: 'Acciones',
      login: 'Iniciar sesión',
      searchExpenses: 'Buscar gastos...',
      searchIncomes: 'Buscar ingresos...',
      expense: 'Gasto',
      income: 'Ingreso',
      expensesOverview: 'Resumen de Gastos',
      incomeOverview: 'Resumen de Ingresos',
      totalExpenses: 'Total de Gastos',
      totalIncome: 'Total de Ingresos',
      allRightsReserved: 'Todos los derechos reservados',
      privacyPolicy: 'Política de Privacidad',
      termsOfService: 'Términos de Servicio',
      contact: 'Contacto',
      name: 'Nombre',
      email: 'Correo electrónico'
    },
    settings: {
      appearance: 'Apariencia',
      themeMode: 'Modo de tema',
      light: 'Claro',
      dark: 'Oscuro',
      preferences: 'Preferencias',
      language: 'Idioma',
      notifications: 'Notificaciones',
      security: 'Seguridad',
    },
    categories: {
      food: 'Comida',
      transport: 'Transporte',
      entertainment: 'Entretenimiento',
      bills: 'Facturas',
      others: 'Otros',
      salary: 'Salario',
      freelance: 'Freelance',
      investments: 'Inversiones',
    },
  },
  fr: {
    common: {
      dashboard: 'Tableau de bord',
      expenses: 'Dépenses',
      incomes: 'Revenus',
      users: 'Utilisateurs',
      settings: 'Paramètres',
      logout: 'Déconnexion',
      save: 'Enregistrer',
      cancel: 'Annuler',
      search: 'Rechercher',
      filter: 'Filtrer',
      add: 'Ajouter',
      total: 'Total',
      overview: 'Aperçu',
      amount: 'Montant',
      date: 'Date',
      category: 'Catégorie',
      description: 'Description',
      source: 'Source',
      status: 'Statut',
      actions: 'Actions',
      login: 'Connexion',
      searchExpenses: 'Rechercher des dépenses...',
      searchIncomes: 'Rechercher des revenus...',
      expense: 'Dépense',
      income: 'Revenu',
      expensesOverview: 'Aperçu des Dépenses',
      incomeOverview: 'Aperçu des Revenus',
      totalExpenses: 'Total des Dépenses',
      totalIncome: 'Total des Revenus',
      allRightsReserved: 'Tous droits réservés',
      privacyPolicy: 'Politique de Confidentialité',
      termsOfService: 'Conditions d\'Utilisation',
      contact: 'Contact',
      name: 'Nom',
      email: 'E-mail'
    },
    settings: {
      appearance: 'Apparence',
      themeMode: 'Mode thème',
      light: 'Clair',
      dark: 'Sombre',
      preferences: 'Préférences',
      language: 'Langue',
      notifications: 'Notifications',
      security: 'Sécurité',
    },
    categories: {
      food: 'Nourriture',
      transport: 'Transport',
      entertainment: 'Divertissement',
      bills: 'Factures',
      others: 'Autres',
      salary: 'Salaire',
      freelance: 'Freelance',
      investments: 'Investissements',
    },
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    const savedLanguage = localStorage.getItem('language');
    return savedLanguage || 'en';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key) => {
    const keys = key.split('.');
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
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}