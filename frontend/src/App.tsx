import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider } from "./auth/AuthContext";
import { ThemeProvider } from "./theme/ThemeProvider";
import ProtectedRoute from "./auth/ProtectedRoute";
import AppLayout from "./components/AppLayout";
import LensFilter from "./components/LensFilter";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import OAuthCallbackPage from "./pages/OAuthCallbackPage";
import FilesPage from "./pages/FilesPage";
import FoldersPage from "./pages/FoldersPage";
import RecentPage from "./pages/RecentPage";
import StarredPage from "./pages/StarredPage";
import TrashPage from "./pages/TrashPage";
import PhotosPage from "./pages/PhotosPage";
import SharedPage from "./pages/SharedPage";
import PublicSharePage from "./pages/PublicSharePage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <LensFilter />
        <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            <Route path="/s/:token" element={<PublicSharePage />} />

            {/* Protected app shell */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<FilesPage />} />
                <Route path="/folders" element={<FoldersPage />} />
                <Route path="/folder/:id" element={<FilesPage />} />
                <Route path="/photos" element={<PhotosPage />} />
                <Route path="/shared" element={<SharedPage />} />
                <Route path="/recent" element={<RecentPage />} />
                <Route path="/starred" element={<StarredPage />} />
                <Route path="/trash" element={<TrashPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster richColors position="bottom-right" theme="system" />
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}
