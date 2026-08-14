import { Navigate, Route, Routes } from "react-router-dom";
import StorefrontPage from "./pages/Storefront/StorefrontPage";
import OrderStatusPage from "./pages/Storefront/OrderStatusPage";
import DashboardPage from "./pages/Dashboard/DashboardPage";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/r/:slug" element={<StorefrontPage />} />
      <Route path="/r/:slug/order/:orderId" element={<OrderStatusPage />} />
      <Route path="/dashboard/:slug" element={<DashboardPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
