import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RoleRoute } from "./routes/RoleRoute";
import { PortalRedirect } from "./routes/PortalRedirect";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PortalRedirect />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />

        <Route element={<ProtectedRoute />}>
          <Route path="/admin" element={<RoleRoute allowedRoles={["ADMIN"]} />}>
            <Route index element={<AdminDashboard />} />
          </Route>

          <Route path="/rsm" element={<RoleRoute allowedRoles={["RSM"]} />}>
            <Route index element={<RSMDashboard />} />
          </Route>

          <Route path="/tsm" element={<RoleRoute allowedRoles={["GT_TSM", "MT_TSM"]} />}>
            <Route index element={<TSMDashboard />} />
          </Route>

          <Route path="/mtsr" element={<RoleRoute allowedRoles={["MTSR"]} />}>
            <Route index element={<MTSRDashboard />} />
          </Route>

          <Route path="/asr" element={<RoleRoute allowedRoles={["ASR"]} />}>
            <Route index element={<ASRDashboard />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;