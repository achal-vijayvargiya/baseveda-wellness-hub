import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, Check, Loader2, User, Heart, Activity, Brain, Pill, Utensils, Moon } from "lucide-react";
// TODO: ⚠️ DEPRECATED - This component uses legacy APIs.
// This page should be replaced with the NCP workflow in NewClient.tsx.
// Platform workflow: NewClient creates Intake → Assessment with assessment_snapshot.
// This legacy comprehensive health profile flow is not part of Platform NCP architecture.
import { clientApi, comprehensiveHealthProfileApi } from "@/lib/api";

interface BasicProfile {
  age?: number;
  gender?: string;
  height_cm?: number;
  weight_kg?: number;
  target_weight_kg?: number;
}

interface Goals {
  primary_goal?: string;
  secondary_goals?: string[];
}

interface MedicalConditions {
  conditions?: string[];
  severity?: Record<string, string>;
}

interface Medication {
  name: string;
  timing?: string;
}

interface Ayurveda {
  prakriti?: string;
  dosha_imbalance?: string[];
  agni?: string;
}

interface GutHealth {
  bloating?: boolean;
  constipation?: boolean;
  acidity?: boolean;
  gas?: boolean;
  stool_type?: number;
  food_intolerance?: string[];
}

interface Lifestyle {
  region?: string;
  meal_timing?: string;
  spicy_tolerance?: string;
  sleep_hours?: number;
  stress?: string;
}

interface ComprehensiveHealthProfileData {
  client_id: number;
  basic_profile?: BasicProfile;
  activity_level?: string;
  goals?: Goals;
  medical_conditions?: MedicalConditions;
  allergies?: string[];
  medications?: Medication[];
  supplements?: string[];
  ayurveda?: Ayurveda;
  gut_health?: GutHealth;
  dietary_preferences?: string[];
  lifestyle?: Lifestyle;
}

const ComprehensiveHealthProfile = () => {
  const navigate = useNavigate();
  const { clientId } = useParams<{ clientId: string }>();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState<ComprehensiveHealthProfileData>({
    client_id: clientId ? parseInt(clientId) : 0,
    basic_profile: {},
    goals: {},
    medical_conditions: {},
    medications: [],
    ayurveda: {},
    gut_health: {},
    lifestyle: {},
  });

  const steps = [
    { number: 1, title: "Basic Profile", icon: User },
    { number: 2, title: "Activity & Goals", icon: Activity },
    { number: 3, title: "Medical Conditions", icon: Heart },
    { number: 4, title: "Allergies & Medications", icon: Pill },
    { number: 5, title: "Ayurveda", icon: Brain },
    { number: 6, title: "Gut Health", icon: Activity },
    { number: 7, title: "Diet & Lifestyle", icon: Utensils },
  ];

  const progress = (currentStep / steps.length) * 100;

  const handleNext = () => {
    setCurrentStep((prev) => Math.min(prev + 1, steps.length));
  };

  const handlePrevious = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      if (!formData.client_id) {
        toast({
          title: "Error",
          description: "Client ID is required",
          variant: "destructive",
        });
        return;
      }

      // Send comprehensive data to backend
      await comprehensiveHealthProfileApi.create(formData);

      toast({
        title: "Success!",
        description: "Comprehensive health profile saved successfully.",
      });

      navigate(`/client/${formData.client_id}`);
    } catch (error: any) {
      console.error("Error saving profile:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return <BasicProfileStep formData={formData} setFormData={setFormData} />;
      case 2:
        return <ActivityGoalsStep formData={formData} setFormData={setFormData} />;
      case 3:
        return <MedicalConditionsStep formData={formData} setFormData={setFormData} />;
      case 4:
        return <AllergiesMedicationsStep formData={formData} setFormData={setFormData} />;
      case 5:
        return <AyurvedaStep formData={formData} setFormData={setFormData} />;
      case 6:
        return <GutHealthStep formData={formData} setFormData={setFormData} />;
      case 7:
        return <DietLifestyleStep formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <h1 className="text-2xl font-bold text-primary">Comprehensive Health Profile</h1>
            <div className="w-32" />
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Progress value={progress} className="h-2 mb-8" />

        <Card className="wellness-card">
          <CardHeader>
            <CardTitle className="text-2xl">{steps[currentStep - 1].title}</CardTitle>
            <CardDescription>Step {currentStep} of {steps.length}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">{renderStepContent()}</CardContent>
        </Card>

        <div className="flex items-center justify-between mt-8">
          <Button variant="outline" onClick={handlePrevious} disabled={currentStep === 1 || loading} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          {currentStep < steps.length ? (
            <Button onClick={handleNext} disabled={loading} className="gap-2">
              Next
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleSubmit} disabled={loading} className="gap-2">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Check className="h-4 w-4" />
                  Save Profile
                </>
              )}
            </Button>
          )}
        </div>
      </main>
    </div>
  );
};

// Step 1: Basic Profile
const BasicProfileStep = ({
  formData,
  setFormData,
}: {
  formData: ComprehensiveHealthProfileData;
  setFormData: React.Dispatch<React.SetStateAction<ComprehensiveHealthProfileData>>;
}) => {
  return (
    <div className="grid gap-6">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="age">Age</Label>
          <Input
            id="age"
            type="number"
            min="0"
            max="150"
            value={formData.basic_profile?.age || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                basic_profile: { ...formData.basic_profile, age: parseInt(e.target.value) || undefined },
              })
            }
            placeholder="Age in years"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Gender</Label>
          <Select
            value={formData.basic_profile?.gender || ""}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                basic_profile: { ...formData.basic_profile, gender: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="height_cm">Height (cm)</Label>
          <Input
            id="height_cm"
            type="number"
            min="0"
            step="0.1"
            value={formData.basic_profile?.height_cm || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                basic_profile: { ...formData.basic_profile, height_cm: parseFloat(e.target.value) || undefined },
              })
            }
            placeholder="Height in cm"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="weight_kg">Current Weight (kg)</Label>
          <Input
            id="weight_kg"
            type="number"
            min="0"
            step="0.1"
            value={formData.basic_profile?.weight_kg || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                basic_profile: { ...formData.basic_profile, weight_kg: parseFloat(e.target.value) || undefined },
              })
            }
            placeholder="Weight in kg"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="target_weight_kg">Target Weight (kg)</Label>
          <Input
            id="target_weight_kg"
            type="number"
            min="0"
            step="0.1"
            value={formData.basic_profile?.target_weight_kg || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                basic_profile: { ...formData.basic_profile, target_weight_kg: parseFloat(e.target.value) || undefined },
              })
            }
            placeholder="Target weight"
          />
        </div>
      </div>
    </div>
  );
};

// Step 2: Activity & Goals
const ActivityGoalsStep = ({
  formData,
  setFormData,
}: {
  formData: ComprehensiveHealthProfileData;
  setFormData: React.Dispatch<React.SetStateAction<ComprehensiveHealthProfileData>>;
}) => {
  const availableGoals = [
    "Fat Loss",
    "Weight Gain",
    "Muscle Gain",
    "Gut Healing",
    "Muscle Building",
    "Better Digestion",
    "Increased Energy",
    "Stress Management",
    "Better Sleep",
    "Hormonal Balance",
    "Immunity Boost",
    "Disease Management",
    "General Wellness",
    "Diabetic Weight Loss",
    "Detox",
    "Endurance",
    "Balanced Diet",
  ];

  const [selectedSecondaryGoals, setSelectedSecondaryGoals] = useState<string[]>(
    formData.goals?.secondary_goals || []
  );

  const toggleSecondaryGoal = (goal: string) => {
    const newGoals = selectedSecondaryGoals.includes(goal)
      ? selectedSecondaryGoals.filter((g) => g !== goal)
      : [...selectedSecondaryGoals, goal];
    setSelectedSecondaryGoals(newGoals);
    setFormData({
      ...formData,
      goals: { ...formData.goals, secondary_goals: newGoals },
    });
  };

  return (
    <div className="grid gap-6">
      <div className="space-y-2">
        <Label htmlFor="activity_level">Activity Level</Label>
        <Select
          value={formData.activity_level || ""}
          onValueChange={(value) => setFormData({ ...formData, activity_level: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select activity level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Sedentary">Sedentary (little or no exercise)</SelectItem>
            <SelectItem value="Light">Light (1-3 days/week)</SelectItem>
            <SelectItem value="Moderate">Moderate (3-5 days/week)</SelectItem>
            <SelectItem value="Active">Active (6-7 days/week)</SelectItem>
            <SelectItem value="Very Active">Very Active (athlete level)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="primary_goal">Primary Goal</Label>
        <Select
          value={formData.goals?.primary_goal || ""}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              goals: { ...formData.goals, primary_goal: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select primary goal" />
          </SelectTrigger>
          <SelectContent>
            {availableGoals.map((goal) => (
              <SelectItem key={goal} value={goal}>
                {goal}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Secondary Goals (Select multiple)</Label>
        <div className="flex flex-wrap gap-2 p-3 rounded-md border min-h-[60px]">
          {selectedSecondaryGoals.map((goal) => (
            <Badge key={goal} variant="secondary" className="gap-1">
              {goal}
              <span className="cursor-pointer" onClick={() => toggleSecondaryGoal(goal)}>×</span>
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availableGoals
            .filter((goal) => goal !== formData.goals?.primary_goal)
            .map((goal) => (
              <Button
                key={goal}
                type="button"
                size="sm"
                variant={selectedSecondaryGoals.includes(goal) ? "default" : "outline"}
                onClick={() => toggleSecondaryGoal(goal)}
                className="justify-start"
              >
                {goal}
              </Button>
            ))}
        </div>
      </div>
    </div>
  );
};

// Step 3: Medical Conditions
const MedicalConditionsStep = ({
  formData,
  setFormData,
}: {
  formData: ComprehensiveHealthProfileData;
  setFormData: React.Dispatch<React.SetStateAction<ComprehensiveHealthProfileData>>;
}) => {
  const commonConditions = [
    "PCOS",
    "Thyroid",
    "IBS",
    "IBD",
    "Diabetes",
    "Hypertension",
    "CKD",
    "Fatty Liver",
    "Heart Disease",
    "Arthritis",
    "Anemia",
    "Gastritis",
    "Acidity",
    "Obesity",
    "Osteoporosis",
  ];

  const [selectedConditions, setSelectedConditions] = useState<string[]>(
    formData.medical_conditions?.conditions || []
  );
  const [severities, setSeverities] = useState<Record<string, string>>(
    formData.medical_conditions?.severity || {}
  );

  const toggleCondition = (condition: string) => {
    const newConditions = selectedConditions.includes(condition)
      ? selectedConditions.filter((c) => c !== condition)
      : [...selectedConditions, condition];
    
    setSelectedConditions(newConditions);
    
    if (!newConditions.includes(condition)) {
      const newSeverities = { ...severities };
      delete newSeverities[condition];
      setSeverities(newSeverities);
    } else {
      setSeverities({ ...severities, [condition]: "moderate" });
    }
    
    setFormData({
      ...formData,
      medical_conditions: {
        conditions: newConditions,
        severity: severities,
      },
    });
  };

  const updateSeverity = (condition: string, severity: string) => {
    const newSeverities = { ...severities, [condition]: severity };
    setSeverities(newSeverities);
    setFormData({
      ...formData,
      medical_conditions: {
        ...formData.medical_conditions,
        severity: newSeverities,
      },
    });
  };

  return (
    <div className="grid gap-6">
      <div className="space-y-3">
        <Label>Medical Conditions</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {commonConditions.map((condition) => (
            <div key={condition} className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id={condition}
                  checked={selectedConditions.includes(condition)}
                  onCheckedChange={() => toggleCondition(condition)}
                />
                <Label htmlFor={condition} className="cursor-pointer">
                  {condition}
                </Label>
              </div>
              {selectedConditions.includes(condition) && (
                <Select
                  value={severities[condition] || "moderate"}
                  onValueChange={(value) => updateSeverity(condition, value)}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mild">Mild</SelectItem>
                    <SelectItem value="moderate">Moderate</SelectItem>
                    <SelectItem value="severe">Severe</SelectItem>
                  </SelectContent>
                </Select>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Step 4: Allergies & Medications
const AllergiesMedicationsStep = ({
  formData,
  setFormData,
}: {
  formData: ComprehensiveHealthProfileData;
  setFormData: React.Dispatch<React.SetStateAction<ComprehensiveHealthProfileData>>;
}) => {
  const commonAllergens = [
    "Gluten",
    "Dairy",
    "Peanut",
    "Tree Nuts",
    "Soy",
    "Egg",
    "Fish",
    "Shellfish",
    "Sesame",
    "Lactose",
  ];

  const [selectedAllergies, setSelectedAllergies] = useState<string[]>(formData.allergies || []);
  const [medications, setMedications] = useState<Medication[]>(formData.medications || []);
  const [supplements, setSupplements] = useState<string[]>(formData.supplements || []);
  const [newMedication, setNewMedication] = useState({ name: "", timing: "" });
  const [newSupplement, setNewSupplement] = useState("");

  const toggleAllergy = (allergy: string) => {
    const newAllergies = selectedAllergies.includes(allergy)
      ? selectedAllergies.filter((a) => a !== allergy)
      : [...selectedAllergies, allergy];
    setSelectedAllergies(newAllergies);
    setFormData({ ...formData, allergies: newAllergies });
  };

  const addMedication = () => {
    if (newMedication.name) {
      const newMeds = [...medications, { ...newMedication }];
      setMedications(newMeds);
      setFormData({ ...formData, medications: newMeds });
      setNewMedication({ name: "", timing: "" });
    }
  };

  const removeMedication = (index: number) => {
    const newMeds = medications.filter((_, i) => i !== index);
    setMedications(newMeds);
    setFormData({ ...formData, medications: newMeds });
  };

  const addSupplement = () => {
    if (newSupplement && !supplements.includes(newSupplement)) {
      const newSupps = [...supplements, newSupplement];
      setSupplements(newSupps);
      setFormData({ ...formData, supplements: newSupps });
      setNewSupplement("");
    }
  };

  const removeSupplement = (supplement: string) => {
    const newSupps = supplements.filter((s) => s !== supplement);
    setSupplements(newSupps);
    setFormData({ ...formData, supplements: newSupps });
  };

  return (
    <div className="grid gap-6">
      <div className="space-y-3">
        <Label>Allergies</Label>
        <div className="flex flex-wrap gap-2">
          {selectedAllergies.map((allergy) => (
            <Badge key={allergy} variant="secondary" className="gap-1">
              {allergy}
              <span className="cursor-pointer" onClick={() => toggleAllergy(allergy)}>×</span>
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-2">
          {commonAllergens.map((allergy) => (
            <Button
              key={allergy}
              type="button"
              size="sm"
              variant={selectedAllergies.includes(allergy) ? "default" : "outline"}
              onClick={() => toggleAllergy(allergy)}
            >
              {allergy}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        <Label>Medications</Label>
        {medications.map((med, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input value={med.name} disabled className="flex-1" />
            <Input value={med.timing || ""} disabled className="flex-1" />
            <Button type="button" variant="outline" size="sm" onClick={() => removeMedication(index)}>
              Remove
            </Button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input
            placeholder="Medication name"
            value={newMedication.name}
            onChange={(e) => setNewMedication({ ...newMedication, name: e.target.value })}
          />
          <Select
            value={newMedication.timing}
            onValueChange={(value) => setNewMedication({ ...newMedication, timing: value })}
          >
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Timing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="morning_with_food">Morning with food</SelectItem>
              <SelectItem value="morning_empty_stomach">Morning empty stomach</SelectItem>
              <SelectItem value="afternoon">Afternoon</SelectItem>
              <SelectItem value="evening">Evening</SelectItem>
              <SelectItem value="night">Night</SelectItem>
              <SelectItem value="as_prescribed">As prescribed</SelectItem>
            </SelectContent>
          </Select>
          <Button type="button" onClick={addMedication}>Add</Button>
        </div>
      </div>

      <div className="space-y-3">
        <Label>Supplements</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {supplements.map((supp) => (
            <Badge key={supp} variant="secondary" className="gap-1">
              {supp}
              <span className="cursor-pointer" onClick={() => removeSupplement(supp)}>×</span>
            </Badge>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Supplement name"
            value={newSupplement}
            onChange={(e) => setNewSupplement(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addSupplement()}
          />
          <Button type="button" onClick={addSupplement}>Add</Button>
        </div>
      </div>
    </div>
  );
};

// Step 5: Ayurveda
const AyurvedaStep = ({
  formData,
  setFormData,
}: {
  formData: ComprehensiveHealthProfileData;
  setFormData: React.Dispatch<React.SetStateAction<ComprehensiveHealthProfileData>>;
}) => {
  const [doshaImbalance, setDoshaImbalance] = useState<string[]>(formData.ayurveda?.dosha_imbalance || []);

  const toggleDoshaImbalance = (dosha: string) => {
    const newImbalance = doshaImbalance.includes(dosha)
      ? doshaImbalance.filter((d) => d !== dosha)
      : [...doshaImbalance, dosha];
    setDoshaImbalance(newImbalance);
    setFormData({
      ...formData,
      ayurveda: { ...formData.ayurveda, dosha_imbalance: newImbalance },
    });
  };

  return (
    <div className="grid gap-6">
      <div className="space-y-2">
        <Label htmlFor="prakriti">Prakriti (Constitution)</Label>
        <Select
          value={formData.ayurveda?.prakriti || ""}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              ayurveda: { ...formData.ayurveda, prakriti: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select prakriti" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Vata">Vata</SelectItem>
            <SelectItem value="Pitta">Pitta</SelectItem>
            <SelectItem value="Kapha">Kapha</SelectItem>
            <SelectItem value="Vata-Pitta">Vata-Pitta</SelectItem>
            <SelectItem value="Vata-Kapha">Vata-Kapha</SelectItem>
            <SelectItem value="Pitta-Kapha">Pitta-Kapha</SelectItem>
            <SelectItem value="Tridosha">Tridosha (Balanced)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label>Dosha Imbalance (Select if any)</Label>
        <div className="flex gap-2">
          {["Vata ↑", "Pitta ↑", "Kapha ↑"].map((dosha) => (
            <Button
              key={dosha}
              type="button"
              variant={doshaImbalance.includes(dosha) ? "default" : "outline"}
              onClick={() => toggleDoshaImbalance(dosha)}
            >
              {dosha}
            </Button>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="agni">Agni (Digestive Fire)</Label>
        <Select
          value={formData.ayurveda?.agni || ""}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              ayurveda: { ...formData.ayurveda, agni: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select agni state" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="Sama">Sama (Balanced)</SelectItem>
            <SelectItem value="Tikshna">Tikshna (Sharp/Overactive)</SelectItem>
            <SelectItem value="Manda">Manda (Slow/Weak)</SelectItem>
            <SelectItem value="Vishama">Vishama (Irregular)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

// Step 6: Gut Health
const GutHealthStep = ({
  formData,
  setFormData,
}: {
  formData: ComprehensiveHealthProfileData;
  setFormData: React.Dispatch<React.SetStateAction<ComprehensiveHealthProfileData>>;
}) => {
  const [foodIntolerances, setFoodIntolerances] = useState<string[]>(
    formData.gut_health?.food_intolerance || []
  );
  const [newIntolerance, setNewIntolerance] = useState("");

  const commonIntolerances = ["Dairy", "Beans", "Lactose", "FODMAP", "Gluten", "Histamine"];

  const toggleIntolerance = (intolerance: string) => {
    const newIntolerances = foodIntolerances.includes(intolerance)
      ? foodIntolerances.filter((i) => i !== intolerance)
      : [...foodIntolerances, intolerance];
    setFoodIntolerances(newIntolerances);
    setFormData({
      ...formData,
      gut_health: { ...formData.gut_health, food_intolerance: newIntolerances },
    });
  };

  const addCustomIntolerance = () => {
    if (newIntolerance && !foodIntolerances.includes(newIntolerance)) {
      const newIntolerances = [...foodIntolerances, newIntolerance];
      setFoodIntolerances(newIntolerances);
      setFormData({
        ...formData,
        gut_health: { ...formData.gut_health, food_intolerance: newIntolerances },
      });
      setNewIntolerance("");
    }
  };

  return (
    <div className="grid gap-6">
      <div className="space-y-4">
        <Label>Gut Health Symptoms</Label>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="bloating"
              checked={formData.gut_health?.bloating || false}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  gut_health: { ...formData.gut_health, bloating: checked as boolean },
                })
              }
            />
            <Label htmlFor="bloating">Bloating</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="constipation"
              checked={formData.gut_health?.constipation || false}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  gut_health: { ...formData.gut_health, constipation: checked as boolean },
                })
              }
            />
            <Label htmlFor="constipation">Constipation</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="acidity"
              checked={formData.gut_health?.acidity || false}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  gut_health: { ...formData.gut_health, acidity: checked as boolean },
                })
              }
            />
            <Label htmlFor="acidity">Acidity</Label>
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="gas"
              checked={formData.gut_health?.gas || false}
              onCheckedChange={(checked) =>
                setFormData({
                  ...formData,
                  gut_health: { ...formData.gut_health, gas: checked as boolean },
                })
              }
            />
            <Label htmlFor="gas">Gas</Label>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stool_type">Stool Type (Bristol Stool Scale 1-7)</Label>
        <Select
          value={formData.gut_health?.stool_type?.toString() || ""}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              gut_health: { ...formData.gut_health, stool_type: parseInt(value) || undefined },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stool type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 - Separate hard lumps</SelectItem>
            <SelectItem value="2">2 - Sausage-shaped, lumpy</SelectItem>
            <SelectItem value="3">3 - Like a sausage with cracks</SelectItem>
            <SelectItem value="4">4 - Like a sausage, smooth and soft</SelectItem>
            <SelectItem value="5">5 - Soft blobs with clear edges</SelectItem>
            <SelectItem value="6">6 - Fluffy pieces, mushy</SelectItem>
            <SelectItem value="7">7 - Watery, no solid pieces</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-3">
        <Label>Food Intolerances</Label>
        <div className="flex flex-wrap gap-2 mb-2">
          {foodIntolerances.map((intolerance) => (
            <Badge key={intolerance} variant="secondary" className="gap-1">
              {intolerance}
              <span className="cursor-pointer" onClick={() => toggleIntolerance(intolerance)}>×</span>
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 mb-2">
          {commonIntolerances.map((intolerance) => (
            <Button
              key={intolerance}
              type="button"
              size="sm"
              variant={foodIntolerances.includes(intolerance) ? "default" : "outline"}
              onClick={() => toggleIntolerance(intolerance)}
            >
              {intolerance}
            </Button>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Add custom intolerance"
            value={newIntolerance}
            onChange={(e) => setNewIntolerance(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && addCustomIntolerance()}
          />
          <Button type="button" onClick={addCustomIntolerance}>Add</Button>
        </div>
      </div>
    </div>
  );
};

// Step 7: Diet & Lifestyle
const DietLifestyleStep = ({
  formData,
  setFormData,
}: {
  formData: ComprehensiveHealthProfileData;
  setFormData: React.Dispatch<React.SetStateAction<ComprehensiveHealthProfileData>>;
}) => {
  const [dietaryPreferences, setDietaryPreferences] = useState<string[]>(
    formData.dietary_preferences || []
  );

  const availablePreferences = [
    "Vegetarian",
    "Non-Vegetarian",
    "Vegan",
    "Eggetarian",
    "Low-FODMAP",
    "Keto",
    "Paleo",
    "Mediterranean",
    "Gluten-Free",
    "Dairy-Free",
  ];

  const togglePreference = (preference: string) => {
    const newPreferences = dietaryPreferences.includes(preference)
      ? dietaryPreferences.filter((p) => p !== preference)
      : [...dietaryPreferences, preference];
    setDietaryPreferences(newPreferences);
    setFormData({ ...formData, dietary_preferences: newPreferences });
  };

  return (
    <div className="grid gap-6">
      <div className="space-y-3">
        <Label>Dietary Preferences</Label>
        <div className="flex flex-wrap gap-2 p-3 rounded-md border min-h-[60px]">
          {dietaryPreferences.map((pref) => (
            <Badge key={pref} variant="secondary" className="gap-1">
              {pref}
              <span className="cursor-pointer" onClick={() => togglePreference(pref)}>×</span>
            </Badge>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
          {availablePreferences.map((pref) => (
            <Button
              key={pref}
              type="button"
              size="sm"
              variant={dietaryPreferences.includes(pref) ? "default" : "outline"}
              onClick={() => togglePreference(pref)}
              className="justify-start"
            >
              {pref}
            </Button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Select
            value={formData.lifestyle?.region || ""}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                lifestyle: { ...formData.lifestyle, region: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select region" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="North India">North India</SelectItem>
              <SelectItem value="South India">South India</SelectItem>
              <SelectItem value="East India">East India</SelectItem>
              <SelectItem value="West India">West India</SelectItem>
              <SelectItem value="Central India">Central India</SelectItem>
              <SelectItem value="Northeast India">Northeast India</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="meal_timing">Meal Timing</Label>
          <Select
            value={formData.lifestyle?.meal_timing || ""}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                lifestyle: { ...formData.lifestyle, meal_timing: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select meal timing" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="early">Early (before 7 AM breakfast)</SelectItem>
              <SelectItem value="normal">Normal (7-9 AM breakfast)</SelectItem>
              <SelectItem value="late">Late (after 9 AM breakfast)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="spicy_tolerance">Spicy Tolerance</Label>
          <Select
            value={formData.lifestyle?.spicy_tolerance || ""}
            onValueChange={(value) =>
              setFormData({
                ...formData,
                lifestyle: { ...formData.lifestyle, spicy_tolerance: value },
              })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select spicy tolerance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low">Low</SelectItem>
              <SelectItem value="medium">Medium</SelectItem>
              <SelectItem value="high">High</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sleep_hours">Sleep Hours</Label>
          <Input
            id="sleep_hours"
            type="number"
            min="0"
            max="24"
            value={formData.lifestyle?.sleep_hours || ""}
            onChange={(e) =>
              setFormData({
                ...formData,
                lifestyle: { ...formData.lifestyle, sleep_hours: parseInt(e.target.value) || undefined },
              })
            }
            placeholder="Hours of sleep per night"
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="stress">Stress Level</Label>
        <Select
          value={formData.lifestyle?.stress || ""}
          onValueChange={(value) =>
            setFormData({
              ...formData,
              lifestyle: { ...formData.lifestyle, stress: value },
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select stress level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low</SelectItem>
            <SelectItem value="medium">Medium</SelectItem>
            <SelectItem value="high">High</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

export default ComprehensiveHealthProfile;

