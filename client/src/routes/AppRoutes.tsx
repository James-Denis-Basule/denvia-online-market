import { BrowserRouter, Route, Routes } from 'react-router-dom';

import MainLayout from '../layouts/MainLayout';

import HomePage from '../pages/HomePage';
import BusinessesPage from '../pages/BusinessesPage';
import ProductsPage from '../pages/ProductsPage';
import LoginPage from '../pages/LoginPage';
import RegisterPage from '../pages/RegisterPage';
import DashboardPage from '../pages/DashboardPage';
import ChatPage from '../pages/ChatPage';
import CartPage from '../pages/CartPage';
import CheckoutPage from '../pages/CheckoutPage';
import OrdersPage from '../pages/OrdersPage';
import OrderDetailPage from '../pages/OrderDetailPage';

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/businesses" element={<BusinessesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/orders/:orderId" element={<OrderDetailPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/chat" element={<ChatPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRoutes;