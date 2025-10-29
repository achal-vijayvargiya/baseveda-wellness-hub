import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import splashBg from "@/assets/baseveda-splash.jpg";

const Splash = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/login");
    }, 2500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{
        backgroundImage: `url(${splashBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/50 to-background/80" />
      
      <div className="relative z-10 text-center space-y-6 animate-in fade-in duration-1000">
        <h1 className="text-6xl md:text-7xl font-bold text-primary tracking-tight">
          BaseVeda
        </h1>
        <p className="text-xl md:text-2xl text-muted-foreground font-light italic">
          Balance begins with awareness
        </p>
      </div>

      <div className="absolute bottom-12 left-1/2 -translate-x-1/2 animate-pulse">
        <div className="w-2 h-2 rounded-full bg-primary/50" />
      </div>
    </div>
  );
};

export default Splash;
