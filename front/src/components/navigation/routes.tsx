import { Routes, Route, Navigate } from "react-router-dom";
import Index from "@/pages/Index";
import NotFound from "@/pages/NotFound";
import { useAuthStore } from "@/store/authStore";
import Home from "@/pages/home";

const ScreenRoutes = () => {
    const isAuthenticated = useAuthStore(
        (state) => state.isAuthenticated
    );

    return (
        <Routes>
            {/* Initial page */}
            <Route path="/" element={<Home />} />

            {/* Interview page */}
            <Route
                path="/interview"
                element={
                    isAuthenticated ? (
                        <Index />
                    ) : (
                        <Navigate to="/" replace />
                    )
                }
            />

            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default ScreenRoutes;
