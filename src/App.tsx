import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ThemeProvider";
import Landing from "./pages/Landing";
import { LoginPage, SignupPage } from "./pages/Auth";
import Profile from "./pages/Profile";
import Search from "./pages/Search";
import News from "./pages/News";
import StockDetail from "./pages/StockDetail";
import NotFound from "./pages/NotFound.tsx";

const App = () => (
  <ThemeProvider>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/dashboard" element={<Navigate to="/dashboard/profile" replace />} />
          <Route path="/dashboard/profile" element={<Profile />} />
          <Route path="/dashboard/search" element={<Search />} />
          <Route path="/dashboard/news" element={<News />} />
          <Route path="/dashboard/stock/:symbol" element={<StockDetail />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </ThemeProvider>
);

export default App;
