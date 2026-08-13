import { Navigate, Route, Routes } from "react-router-dom";
import GuestOrderPage from "./pages/Guest/GuestOrderPage";
import KitchenPage from "./pages/Kitchen/KitchenPage";
import FloorPage from "./pages/Floor/FloorPage";
import Home from "./pages/Home";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/guest/:token" element={<GuestOrderPage />} />
      <Route path="/kitchen" element={<KitchenPage />} />
      <Route path="/floor" element={<FloorPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
