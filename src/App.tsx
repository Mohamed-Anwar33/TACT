import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LanguageProvider } from "@/i18n/LanguageProvider";
import { AuthProvider } from "@/auth/AuthProvider";
import SiteLayout from "@/components/layout/SiteLayout";
import ScrollToTop from "@/components/layout/ScrollToTop";
import Home from "./pages/Home";
import About from "./pages/About";
import Services from "./pages/Services";
import Portfolio from "./pages/Portfolio";
import ProjectDetails from "./pages/ProjectDetails";
import Team from "./pages/Team";
import Testimonials from "./pages/Testimonials";
import Questionnaire from "./pages/Questionnaire";
import Payment from "./pages/Payment";
import Packages from "./pages/Packages";
import Configurator from "./pages/Configurator";
import Contact from "./pages/Contact";
import AdminLogin from "./pages/AdminLogin";
import CustomerArea from "./pages/CustomerArea";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

// New Admin Dashboard (modular)
import AdminLayout from "./pages/admin/AdminLayout";
import DashboardHome from "./pages/admin/DashboardHome";
import PageSectionsManager from "./pages/admin/PageSectionsManager";
import ServicesManager from "./pages/admin/ServicesManager";
import ProjectsManager from "./pages/admin/ProjectsManager";
import TeamManager from "./pages/admin/TeamManager";
import ClientsManager from "./pages/admin/ClientsManager";
import ContactManager from "./pages/admin/ContactManager";
import PackagesManager from "./pages/admin/PackagesManager";
import UnlocksManager from "./pages/admin/UnlocksManager";
import RolesManager from "./pages/admin/RolesManager";
import SelectionsManager from "./pages/admin/SelectionsManager";
import QuestionnairesManager from "./pages/admin/QuestionnairesManager";
import UsersManager from "./pages/admin/UsersManager";

import SettingsPage from "./pages/admin/SettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <LanguageProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
            <ScrollToTop />
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
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
