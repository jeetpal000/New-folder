import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import FloatingParticles from "./FloatingParticles/FloatingPartcles";

const NotFound = () => {
  useEffect(() => {
    document.title = "Page Not Found 404!!";
  }, []);
  const navigate = useNavigate();
  const dots = Array.from({ length: 80 });

  return (
    <main className="relative flex flex-col gap-6 w-screen h-screen items-center justify-center overflow-hidden bg-linear from-(--gradient-1) via-(--gradient-2) to-(--gradient-3)">
      {/* Floating dots */}
      <FloatingParticles />

      {/* Main content */}
      <h1 className="relative z-10 text-(--primary) text-6xl font-extrabold drop-shadow-lg">
        404 - Page Not Found
      </h1>

      <p className="relative z-10 text-(--warning) text-lg">
        Oops! This page not exist..
      </p>

      <div className="relative z-10 flex items-center gap-4 mt-4">
        <button
          className="px-4 py-2 rounded bg-(--primary) text-white font-bold shadow-lg hover:scale-105 transition-transform"
          onClick={() => navigate("/")}
        >
          Home Page
        </button>

        <button
          onClick={() => window.history.back()}
          className="px-4 py-2 rounded border border-(--primary) text-(--primary) font-bold hover:bg-(--primary) hover:text-white transition-all"
        >
          Back
        </button>
      </div>
    </main>
  );
};

export default NotFound;
