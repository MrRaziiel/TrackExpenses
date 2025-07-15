import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PieChart, Shield, TrendingUp } from 'lucide-react';
import { useContext } from "react";
import { useTheme } from '../Theme/Theme';
import AuthContext from "../Authentication/AuthContext";
import { Navigate } from "react-router-dom";


  
function Welcome() {
  const { theme } = useTheme();
  const { isAuthenticated } = useContext(AuthContext);

  if (isAuthenticated)  return <Navigate to="/Dashboard" replace />;

  return (
    <div className="space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-6">
        <h1 className="text-4xl md:text-6xl font-bold" style={{ color: theme?.colors?.text?.primary }}>
          Take Control of Your <span className="text-blue-500">Finances</span>
        </h1>
        <p className="text-xl" style={{ color: theme?.colors?.text?.secondary }}>
          Track your expenses, monitor your income, and achieve your financial goals with our comprehensive financial management platform.
        </p>
        <Link
          to="/Register"
          className="inline-flex items-center px-6 py-3 text-lg font-medium text-white rounded-lg hover:bg-blue-600 transition-colors"
          style={{ backgroundColor: theme?.colors?.primary?.main }}
        >
          Get Started
          <ArrowRight className="ml-2 h-5 w-5" />
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8 mt-12">
        <div className="p-6 bg-white rounded-xl shadow-md" style={{ backgroundColor: theme?.colors?.background?.paper }}>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <PieChart className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: theme?.colors?.text?.primary }}>Expense Tracking</h3>
          <p style={{ color: theme?.colors?.text?.secondary }}>
            Keep track of every penny with our intuitive expense tracking system.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md" style={{ backgroundColor: theme?.colors?.background?.paper }}>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <TrendingUp className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: theme?.colors?.text?.primary }}>Income Management</h3>
          <p style={{ color: theme?.colors?.text?.secondary }}>
            Monitor your income sources and analyze your earning patterns.
          </p>
        </div>

        <div className="p-6 bg-white rounded-xl shadow-md" style={{ backgroundColor: theme?.colors?.background?.paper }}>
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
            <Shield className="h-6 w-6 text-blue-500" />
          </div>
          <h3 className="text-xl font-semibold mb-2" style={{ color: theme?.colors?.text?.primary }}>Secure Platform</h3>
          <p style={{ color: theme?.colors?.text?.secondary }}>
            Your financial data is protected with industry-standard security measures.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Welcome;