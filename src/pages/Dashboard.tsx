import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, TrendingUp, Calendar, Activity, Loader2 } from "lucide-react";
import { platformClientApi, platformAuthApi, PlatformClientResponse } from "@/lib/platform-api";
import { toast } from "sonner";

const Dashboard = () => {
  const navigate = useNavigate();
  const [clients, setClients] = useState<PlatformClientResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchClients();
  }, []);

  const fetchClients = async () => {
    try {
      setIsLoading(true);
      const data = await platformClientApi.list();
      setClients(data);
    } catch (error: any) {
      console.error("Failed to fetch clients:", error);
      toast.error(error.message || "Failed to load clients");
      
      // If unauthorized, redirect to login
      if (error.message?.includes("401") || error.message?.includes("credentials")) {
        platformAuthApi.logout();
        navigate("/login");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    platformAuthApi.logout();
    toast.success("Logged out successfully");
    navigate("/login");
  };

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  const getFullName = (client: PlatformClientResponse) => {
    return client.name;
  };

  const getClientAge = (client: PlatformClientResponse) => {
    // Platform clients have age field directly
    return client.age ?? null;
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">Aahaar</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl"
            >
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Doctor Profile Summary */}
        <div className="wellness-card wellness-gradient">
          <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                DR
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-2">
              <h2 className="text-3xl font-semibold">Dr. Rajesh Kumar</h2>
              <p className="text-muted-foreground">
                Certified Clinical Nutritionist & Wellness Consultant
              </p>
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-sm">
                  <Activity className="w-4 h-4 text-primary" />
                  <span className="font-medium">{clients.length} {clients.length === 1 ? 'Client' : 'Clients'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-medium">Holistic Nutrition</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">Wellness Consultant</span>
                </div>
              </div>
            </div>

            <Button 
              className="rounded-xl h-11 gap-2" 
              size="lg"
              onClick={() => navigate("/new-client")}
            >
              <UserPlus className="w-4 h-4" />
              Add New Client
            </Button>
          </div>
        </div>

        {/* Client List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-2xl font-semibold">Your Clients</h3>
            <p className="text-sm text-muted-foreground">
              {clients.length} {clients.length === 1 ? 'client' : 'clients'}
            </p>
          </div>

          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}

          {/* Empty State */}
          {!isLoading && clients.length === 0 && (
            <div className="wellness-card text-center py-12">
              <div className="max-w-sm mx-auto space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <UserPlus className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-xl font-semibold">No clients!</h3>
                <p className="text-muted-foreground">
                  Get started by adding your first client to begin their wellness journey.
                </p>
                <Button 
                  className="rounded-xl mt-4" 
                  onClick={() => navigate("/new-client")}
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add Your First Client
                </Button>
              </div>
            </div>
          )}

          {/* Client Grid */}
          {!isLoading && clients.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {clients.map((client) => {
                const age = getClientAge(client);
                const fullName = getFullName(client);
                
                return (
                  <div
                    key={client.id}
                    className="wellness-card cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform"
                    onClick={() => navigate(`/client/${client.id}`)}
                  >
                    <div className="flex items-start gap-4">
                      <Avatar className="w-14 h-14 border-2 border-primary/20">
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(fullName)}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-lg truncate">{fullName}</h4>
                        <p className="text-sm text-muted-foreground">
                          {age ? `${age} years old` : 'Age not specified'}
                        </p>

                        {client.location && (
                          <p className="text-xs text-muted-foreground mt-1 truncate">
                            {client.location}
                          </p>
                        )}

                        <div className="mt-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                            Active Client
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
