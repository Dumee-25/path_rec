import { useNavigate } from "react-router-dom";
import { Button } from "../components";
import { useDocumentTitle } from "../hooks/useDocumentTitle";

export function NotFound() {
  const navigate = useNavigate();
  useDocumentTitle("Page Not Found");

  return (
    <div className="app-page app-landing">
      <div className="app-intro">
        <h1 className="section-title">Page Not Found</h1>
        <p className="body-lg app-lead">That page does not exist. You can start the recommendation from the beginning.</p>
        <Button onClick={() => navigate("/")}>Go to Home</Button>
      </div>
    </div>
  );
}
