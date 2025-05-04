import React from 'react';
import { useTheme } from '../Theme/Theme';

function GlobalStyles() {
  const { theme, isDarkMode } = useTheme();

  return (
    <style jsx global>{`
      :root {
        --color-primary: ${theme?.colors?.primary?.main};
        --color-primary-light: ${theme?.colors?.primary?.light};
        --color-primary-dark: ${theme?.colors?.primary?.dark};
        --color-secondary: ${theme?.colors?.secondary?.main};
        --color-secondary-light: ${theme?.colors?.secondary?.light};
        --color-secondary-dark: ${theme?.colors?.secondary?.dark};
        --color-background: ${theme?.colors?.background?.default};
        --color-paper: ${theme?.colors?.background?.paper};
        --color-text: ${theme?.colors?.text?.primary};
        --color-text-secondary: ${theme?.colors?.text?.secondary};
        --color-success: ${theme?.colors?.success?.main};
        --color-success-light: ${theme?.colors?.success?.light};
        --color-error: ${theme?.colors?.error?.main};
        --color-error-light: ${theme?.colors?.error?.light};
      }

      * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
      }

      body {
        font-family: 'Inter var', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 
          'Helvetica Neue', Arial, sans-serif;
        background-color: var(--color-background);
        color: var(--color-text);
        line-height: 1.5;
        transition: all 0.3s ease;
      }

      h1, h2, h3, h4, h5, h6 {
        color: var(--color-text);
        font-weight: 600;
        line-height: 1.25;
      }

      input, select, textarea {
        font-family: inherit;
        background-color: var(--color-paper);
        color: var(--color-text);
        border-color: var(--color-secondary-light);
      }

      button {
        transition: all 0.3s ease;
      }

      table {
        color: var(--color-text);
      }

      th {
        color: var(--color-text-secondary);
      }

      td {
        color: var(--color-text);
      }

      .bg-white {
        background-color: var(--color-paper) !important;
      }

      .text-gray-500 {
        color: var(--color-text-secondary) !important;
      }

      .text-gray-600 {
        color: var(--color-text-secondary) !important;
      }

      .text-gray-700 {
        color: var(--color-text) !important;
      }

      .text-gray-900 {
        color: var(--color-text) !important;
      }

      .border-gray-300 {
        border-color: var(--color-secondary-light) !important;
      }

      .hover\:bg-gray-50:hover {
        background-color: var(--color-secondary-light) !important;
      }

      .bg-gray-50 {
        background-color: var(--color-secondary-light) !important;
      }

      .dark {
        color-scheme: dark;
      }

      @media (max-width: ${theme?.breakpoints?.sm}) {
        .container {
          padding-left: 1rem;
          padding-right: 1rem;
        }
      }

      /* Tailwind UI Custom Styles */
      .form-input,
      .form-textarea,
      .form-select,
      .form-multiselect {
        @apply rounded-md shadow-sm border-gray-300 focus:border-primary-500 focus:ring focus:ring-primary-200 focus:ring-opacity-50;
      }

      .btn {
        @apply inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2;
      }

      .btn-primary {
        @apply text-white bg-primary-600 hover:bg-primary-700 focus:ring-primary-500;
      }

      .btn-secondary {
        @apply text-primary-700 bg-primary-100 hover:bg-primary-200 focus:ring-primary-500;
      }

      .card {
        @apply bg-white shadow-sm rounded-lg overflow-hidden;
      }

      .card-header {
        @apply px-4 py-5 border-b border-gray-200 sm:px-6;
      }

      .card-body {
        @apply px-4 py-5 sm:p-6;
      }

      .input-group {
        @apply space-y-1;
      }

      .input-label {
        @apply block text-sm font-medium text-gray-700;
      }

      .table-container {
        @apply shadow overflow-hidden border-b border-gray-200 sm:rounded-lg;
      }

      .table-header {
        @apply bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider;
      }

      .table-cell {
        @apply px-6 py-4 whitespace-nowrap text-sm text-gray-500;
      }

      .badge {
        @apply inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium;
      }

      .badge-success {
        @apply bg-green-100 text-green-800;
      }

      .badge-error {
        @apply bg-red-100 text-red-800;
      }
    `}</style>
  );
}

export default GlobalStyles;