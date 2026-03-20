import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "next-themes";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { AppProvider } from "@/contexts/AppContext";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import Dashboard from "./pages/Dashboard";
import MasterResume from "./pages/MasterResume";
import TailoredResumes from "./pages/TailoredResumes";
import TailoredResumeBuilder from "./pages/TailoredResumeBuilder";
import ResumePreview from "./pages/ResumePreview";
import Applications from "./pages/Applications";
import ApplicationDetail from "./pages/ApplicationDetail";
import Documents from "./pages/Documents";
import Settings from "./pages/Settings";
import JobSearch from "./pages/JobSearch";
import JobDetail from "./pages/JobDetail";
import SavedJobs from "./pages/SavedJobs";
import ReviewQueue from "./pages/ReviewQueue";
import ActivityLogs from "./pages/ActivityLogs";
import Notifications from "./pages/Notifications";
import AutomationSettings from "./pages/AutomationSettings";
import AssistedApply from "./pages/AssistedApply";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isOnboarded } = useAuth();
  if (!isAuthenticated) return <Navigate to="/auth" replace />;
  if (!isOnboarded) return <Navigate to="/onboarding" replace />;
  return <>{children}</>;
}

function AppRoutes() {
  const { isAuthenticated } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/auth"} replace />} />
      <Route path="/auth" element={<Auth />} />
      <Route path="/onboarding" element={<Onboarding />} />
      {/* Phase 1 */}
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/master-resume" element={<ProtectedRoute><MasterResume /></ProtectedRoute>} />
      <Route path="/tailored-resumes" element={<ProtectedRoute><TailoredResumes /></ProtectedRoute>} />
      <Route path="/tailored-resumes/new" element={<ProtectedRoute><TailoredResumeBuilder /></ProtectedRoute>} />
      <Route path="/resume-preview/:id" element={<ProtectedRoute><ResumePreview /></ProtectedRoute>} />
      <Route path="/applications" element={<ProtectedRoute><Applications /></ProtectedRoute>} />
      <Route path="/applications/:id" element={<ProtectedRoute><ApplicationDetail /></ProtectedRoute>} />
      <Route path="/documents" element={<ProtectedRoute><Documents /></ProtectedRoute>} />
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      {/* Phase 2 */}
      <Route path="/jobs" element={<ProtectedRoute><JobSearch /></ProtectedRoute>} />
      <Route path="/jobs/:id" element={<ProtectedRoute><JobDetail /></ProtectedRoute>} />
      <Route path="/saved-jobs" element={<ProtectedRoute><SavedJobs /></ProtectedRoute>} />
      <Route path="/review-queue" element={<ProtectedRoute><ReviewQueue /></ProtectedRoute>} />
      {/* Phase 3 */}
      <Route path="/activity-logs" element={<ProtectedRoute><ActivityLogs /></ProtectedRoute>} />
      <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
      <Route path="/automation-settings" element={<ProtectedRoute><AutomationSettings /></ProtectedRoute>} />
      <Route path="/assisted-apply/:id" element={<ProtectedRoute><AssistedApply /></ProtectedRoute>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <AppProvider>
              <AppRoutes />
            </AppProvider>
          </AuthProvider>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
