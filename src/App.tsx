import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import Entrenamiento from "./pages/Entrenamiento";
import Profesionales from "./pages/Profesionales";
import Configuracion from "./pages/Configuracion";
import Login from "./pages/Login";
import NotFound from "./pages/NotFound";

// Admin pages
import { AdminLayout } from "./components/admin/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminEjercicios from "./pages/admin/AdminEjercicios";
import AdminRutinas from "./pages/admin/AdminRutinas";
import AdminProgramas from "./pages/admin/AdminProgramas";
import AdminAgenda from "./pages/admin/AdminAgenda";
import AdminAlianzas from "./pages/admin/AdminAlianzas";
import AdminSoporte from "./pages/admin/AdminSoporte";
import AdminUsuarios from "./pages/admin/AdminUsuarios";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner 
        theme="dark"
        toastOptions={{
          style: {
            background: "hsl(192 40% 12%)",
            border: "1px solid hsl(192 30% 20%)",
            color: "hsl(180 20% 95%)",
          },
        }}
      />
      <BrowserRouter>
        <Routes>
          {/* User App Routes */}
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/entrenamiento" element={<Entrenamiento />} />
          <Route path="/profesionales" element={<Profesionales />} />
          <Route path="/configuracion" element={<Configuracion />} />
          
          {/* Admin Panel Routes */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<AdminDashboard />} />
            <Route path="ejercicios" element={<AdminEjercicios />} />
            <Route path="rutinas" element={<AdminRutinas />} />
            <Route path="programas" element={<AdminProgramas />} />
            <Route path="agenda" element={<AdminAgenda />} />
            <Route path="alianzas" element={<AdminAlianzas />} />
            <Route path="soporte" element={<AdminSoporte />} />
            <Route path="usuarios" element={<AdminUsuarios />} />
          </Route>
          
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
