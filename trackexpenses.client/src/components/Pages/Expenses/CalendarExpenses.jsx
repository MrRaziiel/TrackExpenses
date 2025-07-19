import React, { useEffect, useState, useContext } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import AuthContext from '../../Authentication/AuthContext';
import apiCall from '../../../hooks/apiCall';
import { useTheme } from '../../Theme/Theme';
import { useLanguage } from '../../../utilis/Translate/LanguageContext';

function CalendarExpenses() {
  const { auth } = useContext(AuthContext);
  const { theme } = useTheme();
  const { t } = useLanguage();
  const [expenseDates, setExpenseDates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiCall.get(`Expenses/GetFutureExpenseDates?email=${auth.email}`);
        setExpenseDates(res.data?.$values || []);
      } catch (err) {
        console.error('Failed to fetch future expense dates', err);
      }
    };
    fetchData();
  }, [auth.email]);

  const getTileContent = ({ date, view }) => {
    if (view !== 'month') return null;
    const formattedDate = date.toISOString().split('T')[0];
    const matches = Array.isArray(expenseDates)
      ? expenseDates.filter(e => e.date.split('T')[0] === formattedDate)
      : [];
    if (matches.length > 0) {
      return (
        <div className="text-xs text-red-600 mt-1">
          {matches.length} {t('common.expense')}{matches.length > 1 ? 's' : ''}
        </div>
      );
    }
    return null;
  };

  const handleDateClick = (value) => {
    setSelectedDate(value);
  };

  const selectedExpenses = Array.isArray(expenseDates)
    ? expenseDates.filter(e => e.date.split('T')[0] === selectedDate?.toISOString().split('T')[0])
    : [];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold" style={{ color: theme?.colors?.text?.primary }}>
          {t('common.expenseCalendar') || 'Expense Calendar'}
        </h1>
      </div>

      <div className="w-full bg-white rounded-xl shadow-md p-4">
        <Calendar
          onChange={handleDateClick}
          tileContent={getTileContent}
          value={selectedDate}
          className="w-full"
        />
      </div>

      {selectedDate && (
        <div className="mt-6">
          <h2 className="text-xl font-semibold mb-2">
            {t('common.expensesOn') || 'Expenses on'} {selectedDate.toLocaleDateString()}:
          </h2>
          {selectedExpenses.length === 0 ? (
            <p className="text-gray-500">{t('common.noExpenses') || 'No expenses'}</p>
          ) : (
            <ul className="list-disc pl-5 space-y-1">
              {selectedExpenses.map((e, index) => (
                <li key={index}>
                  <strong>{e.name}</strong> – {e.category} – {e.value.toFixed(2)}€
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

export default CalendarExpenses;
