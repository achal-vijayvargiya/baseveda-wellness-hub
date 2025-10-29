import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, TrendingUp, Calendar, Activity } from "lucide-react";

const Dashboard = () => {
  const navigate = useNavigate();

  const mockClients = [
    { id: 1, name: "Priya Sharma", age: 32, status: "Active", progress: 85 },
    { id: 2, name: "Arjun Patel", age: 45, status: "Review Due", progress: 70 },
    { id: 3, name: "Meera Reddy", age: 28, status: "Active", progress: 92 },
    { id: 4, name: "Vikram Singh", age: 38, status: "New Client", progress: 45 },
    { id: 5, name: "Ananya Iyer", age: 52, status: "Active", progress: 78 },
  ];

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-primary">BaseVeda</h1>
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/login")}
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
                  <span className="font-medium">{mockClients.length} Active Clients</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-medium">89% Success Rate</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Calendar className="w-4 h-4 text-primary" />
                  <span className="font-medium">15 Years Experience</span>
                </div>
              </div>
            </div>

            <Button className="rounded-xl h-11 gap-2" size="lg">
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
              {mockClients.length} total clients
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {mockClients.map((client) => (
              <div
                key={client.id}
                className="wellness-card cursor-pointer hover:scale-[1.02] active:scale-[0.98]"
                onClick={() => navigate(`/client/${client.id}`)}
              >
                <div className="flex items-start gap-4">
                  <Avatar className="w-14 h-14 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(client.name)}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-lg truncate">{client.name}</h4>
                    <p className="text-sm text-muted-foreground">{client.age} years old</p>

                    <div className="mt-3 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-medium">{client.progress}%</span>
                      </div>
                      <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all duration-500"
                          style={{ width: `${client.progress}%` }}
                        />
                      </div>
                    </div>

                    <div className="mt-3">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {client.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
