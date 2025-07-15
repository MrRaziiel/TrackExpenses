import React, { useContext, useState, useEffect } from 'react';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { useTheme } from '../../Theme/Theme';
import { useLanguage } from '../../../utilis/Translate/LanguageContext';

ChartJS.register(ArcElement, Tooltip, Legend);

function Dashboard() {
  const { theme } = useTheme();
  const { t } = useLanguage();

  const colors = {
    error: theme?.colors?.error?.main || '#FF6B6B',
    primary: theme?.colors?.primary?.main || '#4361EE',
    secondary: theme?.colors?.secondary?.main || '#3F37C9',
    success: theme?.colors?.success?.main || '#4CAF50',
    text: {
      primary: theme?.colors?.text?.primary || '#1A1A1A',
      secondary: theme?.colors?.text?.secondary || '#666666'
    },
    background: {
      paper: theme?.colors?.background?.paper || '#FFFFFF'
    }
  };

  const expensesData = {
    labels: [
      t('categories.food'),
      t('categories.transport'),
      t('categories.entertainment'),
      t('categories.bills'),
      t('categories.others')
    ],
    datasets: [
      {
        data: [300, 2000, 200, 400, 100],
        backgroundColor: [
          colors.error,
          colors.primary,
          colors.secondary,
          colors.success,
          colors.secondary
        ],
        hoverBackgroundColor: [
          colors.error,
          colors.primary,
          colors.secondary,
          colors.success,
          colors.secondary
        ]
      }
    ]
  };

  const incomesData = {
    labels: [
      t('categories.salary'),
      t('categories.freelance'),
      t('categories.investments'),
      t('categories.others')
    ],
    datasets: [
      {
        data: [3000, 500, 200, 100],
        backgroundColor: [
          colors.success,
          colors.primary,
          colors.secondary,
          colors.error
        ],
        hoverBackgroundColor: [
          colors.success,
          colors.primary,
          colors.secondary,
          colors.error
        ]
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: {
          color: colors.text.primary
        }
      }
    }
  };

  return (
        <div className="space-y-6">
      <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold" style={{ color: theme?.colors?.text?.primary }}>
        {t('common.dashboard')}
      </h1>
          </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div style={{ backgroundColor: colors.background.paper }} className="p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text.primary }}>
            {t('common.expensesOverview')}
          </h2>
          <div className="h-64">
            <Doughnut data={expensesData} options={chartOptions} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold" style={{ color: colors.text.secondary }}>
              {t('common.totalExpenses')}
            </p>
            <p className="text-2xl font-bold" style={{ color: colors.error }}>
              $1,150
            </p>
          </div>
        </div>

        <div style={{ backgroundColor: colors.background.paper }} className="p-6 rounded-xl shadow-md">
          <h2 className="text-xl font-semibold mb-4" style={{ color: colors.text.primary }}>
            {t('common.incomeOverview')}
          </h2>
          <div className="h-64">
            <Doughnut data={incomesData} options={chartOptions} />
          </div>
          <div className="mt-4 text-center">
            <p className="text-lg font-semibold" style={{ color: colors.text.secondary }}>
              {t('common.totalIncome')}
            </p>
            <p className="text-2xl font-bold" style={{ color: colors.success }}>
              $3,800
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
