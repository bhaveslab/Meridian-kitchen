import { Navigate, Route, Routes } from "react-router-dom";
import StorefrontLayout from "./pages/Storefront/StorefrontLayout";
import LandingScreen from "./pages/Storefront/LandingScreen";
import MenuScreen from "./pages/Storefront/MenuScreen";
import ItemDetailScreen from "./pages/Storefront/ItemDetailScreen";
import CartScreen from "./pages/Storefront/CartScreen";
import CheckoutForm from "./pages/Storefront/CheckoutForm";
import OrderStatusPage from "./pages/Storefront/OrderStatusPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";

// Single-restaurant launch: root redirects straight to that restaurant's
// storefront. Overridable via env so a future multi-restaurant deploy
// doesn't need a code change to point somewhere else.
const DEFAULT_RESTAURANT_SLUG = import.meta.env.VITE_DEFAULT_RESTAURANT_SLUG || "iyanus-kitchen";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to={`/r/${DEFAULT_RESTAURANT_SLUG}`} replace />} />
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
