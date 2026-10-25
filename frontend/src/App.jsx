import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Layouts
import PublicLayout from './layouts/PublicLayout';
import CustomerLayout from './layouts/CustomerLayout';
import AdminLayout from './layouts/AdminLayout';

// Public Pages
import HomePage from './pages/public/HomePage';
import ServicesPage from './pages/public/ServicesPage';
import AboutPage from './pages/public/AboutPage';
import ContactPage from './pages/public/ContactPage';

// Auth Pages
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';

// Customer Pages
import CustomerDashboardPage from './pages/customer/DashboardPage';
import BikesPage from './pages/customer/BikesPage';
import BookServicePage from './pages/customer/BookServicePage';
import MyBookingsPage from './pages/customer/MyBookingsPage';
import ServiceTrackingPage from './pages/customer/ServiceTrackingPage';
import ServiceHistoryPage from './pages/customer/ServiceHistoryPage';
import InvoicesPage from './pages/customer/InvoicesPage';
import ReviewsPage from './pages/customer/ReviewsPage';
import ProfilePage from './pages/customer/ProfilePage';
import NotificationsPage from './pages/customer/NotificationsPage';

// Admin Pages
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminCustomersPage from './pages/admin/AdminCustomersPage';
import AdminBikesPage from './pages/admin/AdminBikesPage';
import AdminBookingsPage from './pages/admin/AdminBookingsPage';
import AdminWalkInPage from './pages/admin/AdminWalkInPage';
import AdminJobCardsPage from './pages/admin/AdminJobCardsPage';
import AdminMechanicsPage from './pages/admin/AdminMechanicsPage';
import AdminServicesPage from './pages/admin/AdminServicesPage';
import AdminInventoryPage from './pages/admin/AdminInventoryPage';
import AdminBillingPage from './pages/admin/AdminBillingPage';
import AdminPaymentsPage from './pages/admin/AdminPaymentsPage';
import AdminExpensesPage from './pages/admin/AdminExpensesPage';
import AdminReviewsPage from './pages/admin/AdminReviewsPage';
import AdminReportsPage from './pages/admin/AdminReportsPage';
import AdminSettingsPage from './pages/admin/AdminSettingsPage';

// Protected Route Helpers
function CustomerRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-xs">Loading session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

function AdminRoute({ children }) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  if (loading) return <div className="p-12 text-center text-xs">Loading session...</div>;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!isAdmin) return <Navigate to="/customer" replace />;
  return children;
}

export default function App() {
  const { isAuthenticated } = useAuth();

  return (
    <Routes>
      {/* Public Pages */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/services" element={<ServicesPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route
          path="/book-service"
          element={
            isAuthenticated ? <Navigate to="/customer/book" replace /> : <Navigate to="/login" replace />
          }
        />
      </Route>

      {/* Authentication Pages */}
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />

      {/* Customer Portal (Protected) */}
      <Route
        path="/customer"
        element={
          <CustomerRoute>
            <CustomerLayout />
          </CustomerRoute>
        }
      >
        <Route index element={<CustomerDashboardPage />} />
        <Route path="bikes" element={<BikesPage />} />
        <Route path="book" element={<BookServicePage />} />
        <Route path="bookings" element={<MyBookingsPage />} />
        <Route path="tracking" element={<ServiceTrackingPage />} />
        <Route path="history" element={<ServiceHistoryPage />} />
        <Route path="invoices" element={<InvoicesPage />} />
        <Route path="reviews" element={<ReviewsPage />} />
        <Route path="profile" element={<ProfilePage />} />
        <Route path="notifications" element={<NotificationsPage />} />
      </Route>

      {/* Admin Portal (Protected) */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboardPage />} />
        <Route path="customers" element={<AdminCustomersPage />} />
        <Route path="bikes" element={<AdminBikesPage />} />
        <Route path="bookings" element={<AdminBookingsPage />} />
        <Route path="walk-in" element={<AdminWalkInPage />} />
        <Route path="job-cards" element={<AdminJobCardsPage />} />
        <Route path="mechanics" element={<AdminMechanicsPage />} />
        <Route path="services" element={<AdminServicesPage />} />
        <Route path="inventory" element={<AdminInventoryPage />} />
        <Route path="billing" element={<AdminBillingPage />} />
        <Route path="payments" element={<AdminPaymentsPage />} />
        <Route path="expenses" element={<AdminExpensesPage />} />
        <Route path="reviews" element={<AdminReviewsPage />} />
        <Route path="reports" element={<AdminReportsPage />} />
        <Route path="settings" element={<AdminSettingsPage />} />
      </Route>

      {/* 404 Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
