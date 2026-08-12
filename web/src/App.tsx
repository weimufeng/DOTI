import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AnalyticsListener } from "./components/AnalyticsListener";
import { Landing } from "./pages/Landing";
import { Quiz } from "./pages/Quiz";
import { Result } from "./pages/Result";

/** Vite `BASE_URL` ends with `/`; React Router basename should not. */
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || undefined;

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <AnalyticsListener />
      <div className="app-shell">
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/quiz" element={<Quiz />} />
          <Route path="/result" element={<Result />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

