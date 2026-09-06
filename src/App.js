import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ToastProvider } from "./contexts/ToastContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { AuthProvider } from "./contexts/AuthContext";

import MainLayout from "./components/layout/MainLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";
import ServerUnreachable from "./pages/ServerUnreachable";
import Dashboard from "./pages/Dashboard";
import Task from "./pages/Task";
import TaskProfile from "./pages/TaskProfile";
import SentApprovals from "./pages/SentApprovals";
import Profile from "./pages/Profile";
import Firms from "./pages/Firms";
import Ledger from "./pages/Ledger";
import Billing from "./pages/Billing";

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" replace />} />
              <Route path="/login" element={<Login />} />
              <Route path="/server-error" element={<ServerUnreachable />} />

              <Route element={<ProtectedRoute />}>
                <Route element={<MainLayout />}>
                  <Route path="/dashboard" element={<Dashboard />} />
                  <Route path="/tasks" element={<Task />} />
                  <Route path="/sent-approvals" element={<SentApprovals />} />
                  <Route path="/tasks/:taskId" element={<TaskProfile />} />
                  <Route path="/tasks/:taskId/:tab" element={<TaskProfile />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/firms" element={<Firms />} />
                  <Route path="/billing" element={<Billing />} />
                  <Route path="/ledger" element={<Ledger />} />
                </Route>
              </Route>

              <Route path="/404" element={<NotFound />} />
              <Route path="*" element={<Navigate to="/404" replace />} />
            </Routes>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;
