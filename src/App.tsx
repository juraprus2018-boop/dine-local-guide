import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import CityPage from "./pages/CityPage";
import RestaurantPage from "./pages/RestaurantPage";
import AuthPage from "./pages/AuthPage";
import FavoritesPage from "./pages/FavoritesPage";
import ProfilePage from "./pages/ProfilePage";
import DiscoverPage from "./pages/DiscoverPage";
import CuisinesPage from "./pages/CuisinesPage";
import AdminPage from "./pages/admin/AdminPage";
import AdminRestaurantsPage from "./pages/admin/AdminRestaurantsPage";
import AdminRestaurantEditPage from "./pages/admin/AdminRestaurantEditPage";
import AdminImportPage from "./pages/admin/AdminImportPage";
import AdminClaimsPage from "./pages/admin/AdminClaimsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/ontdek" element={<DiscoverPage />} />
            <Route path="/keukens" element={<CuisinesPage />} />
            <Route path="/keukens/:cuisineSlug" element={<CuisinesPage />} />
            <Route path="/favorieten" element={<FavoritesPage />} />
            <Route path="/profiel" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/restaurants" element={<AdminRestaurantsPage />} />
            <Route path="/admin/restaurants/:id/edit" element={<AdminRestaurantEditPage />} />
            <Route path="/admin/import" element={<AdminImportPage />} />
            <Route path="/admin/claims" element={<AdminClaimsPage />} />
            <Route path="/:citySlug" element={<CityPage />} />
            <Route path="/:citySlug/:restaurantSlug" element={<RestaurantPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </HelmetProvider>
  </QueryClientProvider>
);

export default App;
