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
import ProvincesPage from "./pages/ProvincesPage";
import NearbyPage from "./pages/NearbyPage";
import SearchPage from "./pages/SearchPage";
import ReviewsPage from "./pages/ReviewsPage";
import FoodwallPage from "./pages/FoodwallPage";
import RegisterRestaurantPage from "./pages/RegisterRestaurantPage";
import AdminPage from "./pages/admin/AdminPage";
import AdminRestaurantsPage from "./pages/admin/AdminRestaurantsPage";
import AdminRestaurantEditPage from "./pages/admin/AdminRestaurantEditPage";
import AdminImportPage from "./pages/admin/AdminImportPage";
import AdminClaimsPage from "./pages/admin/AdminClaimsPage";
import AdminReviewsPage from "./pages/admin/AdminReviewsPage";
import AdminAdsPage from "./pages/admin/AdminAdsPage";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import FAQPage from "./pages/FAQPage";
import BlogPage from "./pages/BlogPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import CookiesPage from "./pages/CookiesPage";
import NewRestaurantsPage from "./pages/NewRestaurantsPage";
import TopRatedPage from "./pages/TopRatedPage";
import ClaimRestaurantPage from "./pages/ClaimRestaurantPage";
import OwnerDashboardPage from "./pages/OwnerDashboardPage";
import { ScrollToTop } from "./components/ScrollToTop";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <HelmetProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/ontdek" element={<DiscoverPage />} />
            <Route path="/keukens" element={<CuisinesPage />} />
            <Route path="/keukens/:cuisineSlug" element={<CuisinesPage />} />
            <Route path="/provincies" element={<ProvincesPage />} />
            <Route path="/in-de-buurt" element={<NearbyPage />} />
            <Route path="/zoeken" element={<SearchPage />} />
            <Route path="/reviews" element={<ReviewsPage />} />
            <Route path="/foodwall" element={<FoodwallPage />} />
            <Route path="/aanmelden" element={<RegisterRestaurantPage />} />
            <Route path="/claimen" element={<ClaimRestaurantPage />} />
            <Route path="/claimen/:citySlug/:restaurantSlug" element={<ClaimRestaurantPage />} />
            <Route path="/eigenaar" element={<OwnerDashboardPage />} />
            <Route path="/nieuw" element={<NewRestaurantsPage />} />
            <Route path="/top" element={<TopRatedPage />} />
            <Route path="/over" element={<AboutPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/blog" element={<BlogPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/voorwaarden" element={<TermsPage />} />
            <Route path="/cookies" element={<CookiesPage />} />
            <Route path="/favorieten" element={<FavoritesPage />} />
            <Route path="/profiel" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="/admin/restaurants" element={<AdminRestaurantsPage />} />
            <Route path="/admin/restaurants/:id/edit" element={<AdminRestaurantEditPage />} />
            <Route path="/admin/import" element={<AdminImportPage />} />
            <Route path="/admin/claims" element={<AdminClaimsPage />} />
            <Route path="/admin/reviews" element={<AdminReviewsPage />} />
            <Route path="/admin/advertenties" element={<AdminAdsPage />} />
            <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
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
