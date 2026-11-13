import { Navigate, Route, Routes } from "react-router";
import { AppLayout } from "./components/AppLayout";
import { ChamadosPage } from "./pages/ChamadosPage";
import { LoginPage } from "./pages/LoginPage";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LoginPage />} />
      <Route element={<AppLayout />}>
        <Route path="/chamados" element={<ChamadosPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
