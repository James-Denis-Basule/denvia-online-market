import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import HomePage from "../pages/HomePage";
import BusinessesPage from "../pages/BusinessesPage";
import BusinessDetailPage from "../pages/BusinessDetailPage";
import BusinessManagementPage from "../pages/BusinessManagementPage";
import BusinessCreatePage from "../pages/BusinessCreatePage";
import BusinessEditPage from "../pages/BusinessEditPage";
import OrganizationCreatePage from "../pages/OrganizationCreatePage";
import OrganizationManagementPage from "../pages/OrganizationManagementPage";
import ProductsPage from "../pages/ProductsPage";
import MarketplacePage from "../pages/MarketplacePage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import AccountTypesPage from "../pages/AccountTypesPage";
import VerifyEmailPage from "../pages/VerifyEmailPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import DashboardPage from "../pages/DashboardPage";
import ServiceManagementPage from "../pages/ServiceManagementPage";
import ServiceCreatePage from "../pages/ServiceCreatePage";
import ServiceEditPage from "../pages/ServiceEditPage";
import ChatPage from "../pages/ChatPage";
import CartPage from "../pages/CartPage";
import CheckoutPage from "../pages/CheckoutPage";
import OrdersPage from "../pages/OrdersPage";
import OrderDetailPage from "../pages/OrderDetailPage";

import ProtectedRoute from "./ProtectedRoute";
import GuestOnlyRoute from "./GuestOnlyRoute";
import BusinessRoute from "./BusinessRoute";
import BusinessAccountRoute from "./BusinessAccountRoute";

const pageTitles: Record<string, string> = {
  "/": "DOM | Home",
  "/businesses": "DOM | Businesses",
  "/businesses/manage": "DOM | Manage Businesses",
  "/businesses/create": "DOM | Create Business",
  "/businesses/edit": "DOM | Edit Business",
  "/organizations/create": "DOM | Create Organization",
  "/organizations": "DOM | Organizations",
  "/products": "DOM | Products",
  "/marketplace": "DOM | Marketplace",
  "/login": "DOM | Login",
  "/account-types": "DOM | Account Types",
  "/register": "DOM | Register",
  "/verify-email": "DOM | Verify Email",
  "/forgot-password": "DOM | Forgot Password",
  "/reset-password": "DOM | Reset Password",
  "/dashboard": "DOM | Dashboard",
  "/chat": "DOM | AI Assistant",
  "/cart": "DOM | Cart",
  "/checkout": "DOM | Checkout",
  "/orders": "DOM | Orders",
  "/services/edit": "DOM | Edit Service",
};

function PageTitle() {
  const location = useLocation();
  let title = pageTitles[location.pathname];

  if (location.pathname.startsWith("/orders/")) {
    title = "DOM | Order Details";
  }

  if (location.pathname.startsWith("/businesses/")) {
    const segment = location.pathname.split("/")[2];

    if (segment && !["manage", "create", "edit"].includes(segment)) {
      title = "DOM | Business Details";
    }
  }

  return <title>{title ?? "DOM | Denvia Online Market"}</title>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <PageTitle />

      <Routes>
        <Route element={<MainLayout />}>
          {/* Public pages */}
          <Route path="/" element={<HomePage />} />
          <Route path="/businesses" element={<BusinessesPage />} />
          <Route
            path="/businesses/:id"
            element={<BusinessDetailPage />}
          />
          <Route path="/products" element={<ProductsPage />} />
<Route path="/marketplace" element={<MarketplacePage />} />

          {/* Guest-only pages */}
          <Route element={<GuestOnlyRoute />}>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/account-types" element={<AccountTypesPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            <Route
              path="/forgot-password"
              element={<ForgotPasswordPage />}
            />
            <Route
              path="/reset-password"
              element={<ResetPasswordPage />}
            />
          </Route>

          {/* Guest cart and checkout */}
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />

          {/* Authenticated pages */}
          <Route element={<ProtectedRoute />}>
            {/* Customer pages */}
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/orders/:orderId" element={<OrderDetailPage />} />

            {/* Business-account-only pages */}
            <Route element={<BusinessAccountRoute />}>
              <Route
                path="/businesses/create"
                element={<BusinessCreatePage />}
              />

              <Route
                path="/organizations/create"
                element={<OrganizationCreatePage />}
              />

              <Route
                path="/organizations/:id"
                element={<OrganizationManagementPage />}
              />
            </Route>

            {/* Existing business required */}
            <Route element={<BusinessRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/chat" element={<ChatPage />} />

              <Route path="/services/create" element={<ServiceCreatePage />} />

              <Route
                path="/services/edit/:serviceId"
                element={<ServiceEditPage />}
              />

              <Route
                path="/services/manage"
                element={<ServiceManagementPage />}
              />

              <Route
                path="/businesses/manage"
                element={<BusinessManagementPage />}
              />
              <Route
                path="/businesses/edit/:id"
                element={<BusinessEditPage />}
              />
            </Route>
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;
