import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Home } from "lucide-react";
import { Link } from "react-router-dom";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname,
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-accent/5 flex items-center justify-center">
      <div className="max-w-lg text-center space-y-8 px-4">
        <div className="space-y-4">
          <div className="text-7xl md:text-8xl font-bold bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
            404
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">Page Not Found</h1>
          <p className="text-lg text-muted-foreground">
            We couldn't find the page you're looking for. It might have been moved or deleted.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button asChild variant="outline" className="gap-2">
            <Link to="/">
              <ChevronLeft className="h-4 w-4" />
              Go Back
            </Link>
          </Button>
          <Button asChild className="gap-2">
            <Link to="/">
              <Home className="h-4 w-4" />
              Back to Home
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
