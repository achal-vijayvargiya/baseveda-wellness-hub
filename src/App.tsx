import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Splash from "./pages/Splash";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import NewClient from "./pages/NewClient";
import EditClient from "./pages/EditClient";
import ClientDetails from "./pages/ClientDetails";
import NCPProcessPage from "./pages/NCPProcessPage";
import DietPlanView from "./pages/DietPlanView";
import ComprehensiveHealthProfile from "./pages/ComprehensiveHealthProfile";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Splash />} />
          <Route path="/login" element={<Login />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/new-client" element={<NewClient />} />
          <Route path="/client/:id" element={<ClientDetails />} />
          <Route path="/client/:id/edit" element={<EditClient />} />
          <Route path="/client/:clientId/ncp-process" element={<NCPProcessPage />} />
          <Route path="/client/:clientId/assessment/:assessmentId/ncp-process" element={<NCPProcessPage />} />
          <Route path="/client/:clientId/comprehensive-profile" element={<ComprehensiveHealthProfile />} />
          <Route path="/diet-plan/:id" element={<DietPlanView />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
