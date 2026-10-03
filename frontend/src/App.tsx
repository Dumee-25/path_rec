import { Route, Routes } from "react-router-dom";
import { Layout } from "./components/Layout";
import { Home } from "./pages/Home";
import { NotFound } from "./pages/NotFound";
import { Questionnaire } from "./pages/Questionnaire";
import { Results } from "./pages/Results";

export function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="questions/:number" element={<Questionnaire />} />
        <Route path="results" element={<Results />} />
        <Route path="*" element={<NotFound />} />
      </Route>
    </Routes>
  );
}
