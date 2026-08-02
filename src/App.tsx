import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { AuthProvider } from "@/auth/AuthProvider";
import SiteLayout from "@/components/layout/SiteLayout";
import ScrollToTop from "@/components/layout/ScrollToTop";
import { lazy, Suspense } from "react";
import ErrorBoundary from "@/components/common/ErrorBoundary";

// Public site routes (lazy-loaded)
const Home = lazy(() => import("./pages/Home"));
const About = lazy(() => import("./pages/About"));
const Services = lazy(() => import("./pages/Services"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const ProjectDetails = lazy(() => import("./pages/ProjectDetails"));
const Team = lazy(() => import("./pages/Team"));
const Testimonials = lazy(() => import("./pages/Testimonials"));
const Questionnaire = lazy(() => import("./pages/Questionnaire"));
const Payment = lazy(() => import("./pages/Payment"));
const Packages = lazy(() => import("./pages/Packages"));
const Configurator = lazy(() => import("./pages/Configurator"));
const Contact = lazy(() => import("./pages/Contact"));
const AdminLogin = lazy(() => import("./pages/AdminLogin"));
const CustomerArea = lazy(() => import("./pages/CustomerArea"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));
const OfficeSession = lazy(() => import("./pages/OfficeSession"));
const OfficeSessionReport = lazy(() => import("./pages/OfficeSessionReport"));

// Admin Dashboard routes (lazy-loaded)
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const DashboardHome = lazy(() => import("./pages/admin/DashboardHome"));
const PageSectionsManager = lazy(() => import("./pages/admin/PageSectionsManager"));
const ServicesManager = lazy(() => import("./pages/admin/ServicesManager"));
const ProjectsManager = lazy(() => import("./pages/admin/ProjectsManager"));
const TeamManager = lazy(() => import("./pages/admin/TeamManager"));
const ClientsManager = lazy(() => import("./pages/admin/ClientsManager"));
const ContactManager = lazy(() => import("./pages/admin/ContactManager"));
const PackagesManager = lazy(() => import("./pages/admin/PackagesManager"));
const UnlocksManager = lazy(() => import("./pages/admin/UnlocksManager"));
const RolesManager = lazy(() => import("./pages/admin/RolesManager"));
const SelectionsManager = lazy(() => import("./pages/admin/SelectionsManager"));
const QuestionnairesManager = lazy(() => import("./pages/admin/QuestionnairesManager"));
const UsersManager = lazy(() => import("./pages/admin/UsersManager"));
const SettingsPage = lazy(() => import("./pages/admin/SettingsPage"));
const SystemStats = lazy(() => import("./pages/admin/SystemStats"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,   // 10 minutes
      refetchOnWindowFocus: false,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
            <ErrorBoundary>
              <Suspense fallback={<div className="h-screen w-screen flex items-center justify-center text-[#0C363A] bg-[#f8f5ee] font-arabic font-bold">جاري التحميل...</div>}>
                <Routes>
                  {/* Public site routes */}
                  <Route element={<SiteLayout />}>
                    <Route path="/" element={<Home />} />
                    <Route path="/about" element={<Navigate to="/" replace />} />
                    <Route path="/services" element={<Services />} />
                    <Route path="/portfolio" element={<Portfolio />} />
                    <Route path="/portfolio/:id" element={<ProjectDetails />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/testimonials" element={<Testimonials />} />
                    <Route path="/questionnaire" element={<Questionnaire />} />
                    <Route path="/payment" element={<Payment />} />
                    <Route path="/packages" element={<Packages />} />
                    <Route path="/packages/:id/configurator" element={<Configurator />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/customer" element={<CustomerArea />} />
                    <Route path="/office-session" element={<OfficeSession />} />
                    <Route path="/office-session/report/:id" element={<OfficeSessionReport />} />
                  </Route>

                  {/* Auth */}
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin/login" element={<AdminLogin />} />

                  {/* Admin Dashboard (new modular layout) */}
                  <Route path="/admin" element={<AdminLayout />}>
                    <Route index element={<DashboardHome />} />
                    <Route path="pages/:slug" element={<PageSectionsManager />} />
                    <Route path="services" element={<ServicesManager />} />
                    <Route path="projects" element={<ProjectsManager />} />
                    <Route path="team" element={<TeamManager />} />
                    <Route path="clients" element={<ClientsManager />} />
                    <Route path="contact" element={<ContactManager />} />
                    <Route path="packages" element={<PackagesManager />} />
                    <Route path="unlocks" element={<UnlocksManager />} />
                    <Route path="users" element={<UsersManager />} />
                    <Route path="selections" element={<SelectionsManager />} />
                    <Route path="questionnaires" element={<QuestionnairesManager />} />
                    <Route path="roles" element={<RolesManager />} />
                    <Route path="settings" element={<SettingsPage />} />
                    <Route path="system-stats" element={<SystemStats />} />
                  </Route>

                  <Route path="*" element={<NotFound />} />
                </Routes>
              </Suspense>
            </ErrorBoundary>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
