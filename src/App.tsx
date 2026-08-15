import { Navigate, Route, Routes } from "react-router-dom";
import StorefrontLayout from "./pages/Storefront/StorefrontLayout";
import LandingScreen from "./pages/Storefront/LandingScreen";
import MenuScreen from "./pages/Storefront/MenuScreen";
import ItemDetailScreen from "./pages/Storefront/ItemDetailScreen";
import CartScreen from "./pages/Storefront/CartScreen";
import CheckoutForm from "./pages/Storefront/CheckoutForm";
import OrderStatusPage from "./pages/Storefront/OrderStatusPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/r/:slug" element={<StorefrontLayout />}>
        <Route index element={<LandingScreen />} />
        <Route path="menu" element={<MenuScreen />} />
        <Route path="menu/:itemId" element={<ItemDetailScreen />} />
        <Route path="cart" element={<CartScreen />} />
        <Route path="checkout" element={<CheckoutForm />} />
        <Route path="order/:orderId" element={<OrderStatusPage />} />
      </Route>
      <Route path="/dashboard/:slug" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
