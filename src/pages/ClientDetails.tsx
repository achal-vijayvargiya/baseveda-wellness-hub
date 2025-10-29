import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  ArrowLeft,
  Calendar,
  Target,
  Utensils,
  FileText,
  TrendingUp,
  Heart,
  Leaf,
} from "lucide-react";

const ClientDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  // Mock client data
  const client = {
    id: parseInt(id || "1"),
    name: "Priya Sharma",
    age: 32,
    gender: "Female",
    healthGoals: ["Weight Management", "Energy Boost", "Better Digestion"],
    dietaryPreferences: ["Vegetarian", "Gluten-Free"],
    currentPlan: "Balanced Vegan Diet with Intermittent Fasting",
    nextReview: "March 15, 2025",
    startDate: "January 1, 2025",
    progress: 85,
    measurements: {
      weight: "65 kg",
      height: "165 cm",
      bmi: "23.9",
    },
  };

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
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/dashboard")}
              className="rounded-xl"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Client Profile</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Client Info Card */}
        <div className="wellness-card wellness-gradient">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <Avatar className="w-24 h-24 border-4 border-primary/20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {getInitials(client.name)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-3xl font-semibold">{client.name}</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-muted-foreground">
                  <span>{client.age} years • {client.gender}</span>
                  <span>•</span>
                  <span>Client since {client.startDate}</span>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 pt-4 border-t border-border/50">
                <div>
                  <p className="text-sm text-muted-foreground">Weight</p>
                  <p className="text-lg font-semibold">{client.measurements.weight}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Height</p>
                  <p className="text-lg font-semibold">{client.measurements.height}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">BMI</p>
                  <p className="text-lg font-semibold">{client.measurements.bmi}</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <Button className="rounded-xl">Edit Profile</Button>
              <Button variant="outline" className="rounded-xl">
                Message Client
              </Button>
            </div>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Health Goals */}
          <div className="wellness-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Target className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Health Goals</h3>
            </div>
            <div className="space-y-2">
              {client.healthGoals.map((goal, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                >
                  <Heart className="w-4 h-4 text-primary" />
                  <span>{goal}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Dietary Preferences */}
          <div className="wellness-card">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-xl bg-primary/10">
                <Leaf className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-xl font-semibold">Dietary Preferences</h3>
            </div>
            <div className="flex flex-wrap gap-2">
              {client.dietaryPreferences.map((pref, index) => (
                <span
                  key={index}
                  className="px-4 py-2 rounded-full bg-primary/10 text-primary font-medium"
                >
                  {pref}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Diet Details Section */}
        <div className="wellness-card">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 rounded-xl bg-primary/10">
              <Utensils className="w-5 h-5 text-primary" />
            </div>
            <h3 className="text-2xl font-semibold">Diet Details</h3>
          </div>

          <div className="space-y-6">
            {/* Current Plan */}
            <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/5 to-accent/5 border border-border/50">
              <h4 className="font-semibold text-lg mb-2">Current Nutrition Plan</h4>
              <p className="text-muted-foreground mb-4">{client.currentPlan}</p>
              
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" />
                <span>Next review scheduled: <strong className="text-foreground">{client.nextReview}</strong></span>
              </div>
            </div>

            {/* Progress */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  <span className="font-semibold">Overall Progress</span>
                </div>
                <span className="text-2xl font-bold text-primary">{client.progress}%</span>
              </div>
              <div className="w-full bg-secondary rounded-full h-3 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all duration-500"
                  style={{ width: `${client.progress}%` }}
                />
              </div>
            </div>

            {/* Action Button */}
            <Button className="w-full rounded-xl h-12 text-base gap-2" size="lg">
              <FileText className="w-5 h-5" />
              View Detailed Report
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ClientDetails;
