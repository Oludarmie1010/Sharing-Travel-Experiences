import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../store/auth.js";

export default function ProtectedRoute() {
  const { isAuthed } = useAuth();
  return isAuthed ? <Outlet /> : <Navigate to="/login" replace />;
}
