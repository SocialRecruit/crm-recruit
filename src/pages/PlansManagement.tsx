import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/lib/api";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  MoreHorizontal,
  Crown,
  Users,
  FileText,
  Upload,
  Mail,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Plan {
  id: string;
  name: string;
  displayName: string;
  price: number;
  currency: string;
  billing: "monthly" | "yearly";
  trialDays: number;
  isActive: boolean;
  features: {
    maxUsers: number;
    maxPages: number;
    maxUploads: number;
    maxSubmissions: number;
    customDomain: boolean;
    apiAccess: boolean;
    prioritySupport: boolean;
    whiteLabel: boolean;
    analytics: boolean;
    exportData: boolean;
    sso: boolean;
    multiLanguage: boolean;
  };
  created_at: string;
}

interface Feature {
  key: string;
  name: string;
  description: string;
  type: "boolean" | "number";
  category: "limits" | "features" | "support";
}

const AVAILABLE_FEATURES: Feature[] = [
  {
    key: "maxUsers",
    name: "Max. Benutzer",
    description: "Maximale Anzahl Benutzer pro Tenant",
    type: "number",
    category: "limits",
  },
  {
    key: "maxPages",
    name: "Max. Landing Pages",
    description: "Maximale Anzahl Landing Pages",
    type: "number",
    category: "limits",
  },
  {
    key: "maxUploads",
    name: "Max. Uploads (GB)",
    description: "Maximaler Upload-Speicher in GB",
    type: "number",
    category: "limits",
  },
  {
    key: "maxSubmissions",
    name: "Max. Bewerbungen/Monat",
    description: "Maximale Anzahl Formular-Einreichungen pro Monat",
    type: "number",
    category: "limits",
  },
  {
    key: "customDomain",
    name: "Custom Domain",
    description: "Eigene Domain verwenden",
    type: "boolean",
    category: "features",
  },
  {
    key: "apiAccess",
    name: "API-Zugriff",
    description: "REST API für Integrationen",
    type: "boolean",
    category: "features",
  },
  {
    key: "whiteLabel",
    name: "White Label",
    description: "Eigenes Branding ohne System-Logo",
    type: "boolean",
    category: "features",
  },
  {
    key: "analytics",
    name: "Erweiterte Analytics",
    description: "Detaillierte Statistiken und Reports",
    type: "boolean",
    category: "features",
  },
  {
    key: "exportData",
    name: "Daten-Export",
    description: "Export aller Daten in verschiedenen Formaten",
    type: "boolean",
    category: "features",
  },
  {
    key: "sso",
    name: "Single Sign-On",
    description: "SSO-Integration (SAML, OAuth)",
    type: "boolean",
    category: "features",
  },
  {
    key: "multiLanguage",
    name: "Mehrsprachigkeit",
    description: "Unterstützung für multiple Sprachen",
    type: "boolean",
    category: "features",
  },
  {
    key: "prioritySupport",
    name: "Priority Support",
    description: "Priorisierter E-Mail und Telefon-Support",
    type: "boolean",
    category: "support",
  },
];

const PlansManagement = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [newPlan, setNewPlan] = useState<Partial<Plan>>({
    name: "",
    displayName: "",
    price: 0,
    currency: "EUR",
    billing: "monthly",
    trialDays: 14,
    isActive: true,
    features: {
      maxUsers: 5,
      maxPages: 10,
      maxUploads: 1,
      maxSubmissions: 100,
      customDomain: false,
      apiAccess: false,
      prioritySupport: false,
      whiteLabel: false,
      analytics: false,
      exportData: false,
      sso: false,
      multiLanguage: false,
    },
  });

  useEffect(() => {
    if (user?.role !== "super_admin") {
      navigate("/login");
      return;
    }
    loadPlans();
  }, [user, navigate]);

  const loadPlans = async () => {
    try {
      setLoading(true);
      // Demo data for now
      const demoPlans: Plan[] = [
        {
          id: "free",
          name: "free",
          displayName: "Free",
          price: 0,
          currency: "EUR",
          billing: "monthly",
          trialDays: 0,
          isActive: true,
          features: {
            maxUsers: 2,
            maxPages: 3,
            maxUploads: 0.5,
            maxSubmissions: 50,
            customDomain: false,
            apiAccess: false,
            prioritySupport: false,
            whiteLabel: false,
            analytics: false,
            exportData: false,
            sso: false,
            multiLanguage: false,
          },
          created_at: new Date().toISOString(),
        },
        {
          id: "basic",
          name: "basic",
          displayName: "Basic",
          price: 29,
          currency: "EUR",
          billing: "monthly",
          trialDays: 14,
          isActive: true,
          features: {
            maxUsers: 10,
            maxPages: 25,
            maxUploads: 5,
            maxSubmissions: 500,
            customDomain: false,
            apiAccess: true,
            prioritySupport: false,
            whiteLabel: false,
            analytics: true,
            exportData: true,
            sso: false,
            multiLanguage: false,
          },
          created_at: new Date().toISOString(),
        },
        {
          id: "pro",
          name: "pro",
          displayName: "Professional",
          price: 79,
          currency: "EUR",
          billing: "monthly",
          trialDays: 30,
          isActive: true,
          features: {
            maxUsers: 50,
            maxPages: 100,
            maxUploads: 20,
            maxSubmissions: 2000,
            customDomain: true,
            apiAccess: true,
            prioritySupport: true,
            whiteLabel: true,
            analytics: true,
            exportData: true,
            sso: false,
            multiLanguage: true,
          },
          created_at: new Date().toISOString(),
        },
        {
          id: "enterprise",
          name: "enterprise",
          displayName: "Enterprise",
          price: 199,
          currency: "EUR",
          billing: "monthly",
          trialDays: 30,
          isActive: true,
          features: {
            maxUsers: 999,
            maxPages: 999,
            maxUploads: 100,
            maxSubmissions: 10000,
            customDomain: true,
            apiAccess: true,
            prioritySupport: true,
            whiteLabel: true,
            analytics: true,
            exportData: true,
            sso: true,
            multiLanguage: true,
          },
          created_at: new Date().toISOString(),
        },
      ];

      setPlans(demoPlans);
    } catch (err) {
      setError("Fehler beim Laden der Pläne");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Demo implementation
      const plan: Plan = {
        id: newPlan.name || "new-plan",
        ...newPlan,
        created_at: new Date().toISOString(),
      } as Plan;

      setPlans([...plans, plan]);
      setShowCreateDialog(false);
      resetNewPlan();
    } catch (err) {
      setError("Fehler beim Erstellen des Plans");
    }
  };

  const handleUpdatePlan = async (plan: Plan) => {
    try {
      console.log("Updating plan:", plan);

      // Validation
      if (!plan.name || !plan.displayName) {
        setError("Name und Anzeigename sind erforderlich");
        return;
      }

      if (plan.price < 0) {
        setError("Preis kann nicht negativ sein");
        return;
      }

      // Update in demo mode or make API call
      setPlans(
        plans.map((p) =>
          p.id === plan.id
            ? { ...plan, updated_at: new Date().toISOString() }
            : p,
        ),
      );
      setEditingPlan(null);
      setError("");

      // Success message
      setTimeout(() => {
        alert(`✅ Plan "${plan.displayName}" wurde erfolgreich aktualisiert!`);
      }, 100);
    } catch (err) {
      console.error("Error updating plan:", err);
      setError("Fehler beim Aktualisieren des Plans");
    }
  };

  const handleDeletePlan = async (id: string, name: string) => {
    if (
      window.confirm(
        `Sind Sie sicher, dass Sie den Plan "${name}" löschen möchten?`,
      )
    ) {
      try {
        setPlans(plans.filter((p) => p.id !== id));
      } catch (err) {
        setError("Fehler beim Löschen des Plans");
      }
    }
  };

  const resetNewPlan = () => {
    setNewPlan({
      name: "",
      displayName: "",
      price: 0,
      currency: "EUR",
      billing: "monthly",
      trialDays: 14,
      isActive: true,
      features: {
        maxUsers: 5,
        maxPages: 10,
        maxUploads: 1,
        maxSubmissions: 100,
        customDomain: false,
        apiAccess: false,
        prioritySupport: false,
        whiteLabel: false,
        analytics: false,
        exportData: false,
        sso: false,
        multiLanguage: false,
      },
    });
  };

  const renderFeatureValue = (feature: Feature, value: any) => {
    if (feature.type === "boolean") {
      return value ? (
        <CheckCircle className="h-4 w-4 text-green-500" />
      ) : (
        <XCircle className="h-4 w-4 text-gray-300" />
      );
    }
    return value === 999 ? "Unbegrenzt" : value.toString();
  };

  const PlanEditor = ({
    plan,
    onSave,
    isEditing = false,
  }: {
    plan: Partial<Plan>;
    onSave: (plan: Plan) => void;
    isEditing?: boolean;
  }) => (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Plan ID *</Label>
          <Input
            id="name"
            value={plan.name || ""}
            onChange={(e) => {
              const value = e.target.value
                .toLowerCase()
                .replace(/[^a-z0-9_]/g, "");
              onSave({ ...plan, name: value } as Plan);
            }}
            placeholder="z.B. pro"
            required
            disabled={isEditing} // Plan ID should not be changeable when editing
          />
          {isEditing && (
            <p className="text-xs text-gray-500 mt-1">
              Plan ID kann bei bestehenden Plänen nicht geändert werden
            </p>
          )}
        </div>
        <div>
          <Label htmlFor="displayName">Anzeigename *</Label>
          <Input
            id="displayName"
            value={plan.displayName || ""}
            onChange={(e) =>
              onSave({ ...plan, displayName: e.target.value } as Plan)
            }
            placeholder="z.B. Professional"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label htmlFor="price">Preis *</Label>
          <Input
            id="price"
            type="number"
            value={plan.price || 0}
            onChange={(e) =>
              onSave({ ...plan, price: parseFloat(e.target.value) } as Plan)
            }
            min="0"
            step="0.01"
          />
        </div>
        <div>
          <Label htmlFor="currency">Währung</Label>
          <Input
            id="currency"
            value={plan.currency || "EUR"}
            onChange={(e) =>
              onSave({ ...plan, currency: e.target.value } as Plan)
            }
          />
        </div>
        <div>
          <Label htmlFor="trialDays">Test-Tage</Label>
          <Input
            id="trialDays"
            type="number"
            value={plan.trialDays || 0}
            onChange={(e) =>
              onSave({ ...plan, trialDays: parseInt(e.target.value) } as Plan)
            }
            min="0"
          />
        </div>
      </div>

      <div className="flex items-center space-x-2">
        <Switch
          id="isActive"
          checked={plan.isActive || false}
          onCheckedChange={(checked) =>
            onSave({ ...plan, isActive: checked } as Plan)
          }
        />
        <Label htmlFor="isActive">Plan ist aktiv</Label>
      </div>

      <div className="space-y-4">
        <h4 className="font-semibold">Features & Limits</h4>

        {["limits", "features", "support"].map((category) => (
          <div key={category} className="space-y-3">
            <h5 className="text-sm font-medium text-gray-700 capitalize">
              {category === "limits"
                ? "Limits"
                : category === "features"
                  ? "Features"
                  : "Support"}
            </h5>
            <div className="grid grid-cols-1 gap-3">
              {AVAILABLE_FEATURES.filter((f) => f.category === category).map(
                (feature) => (
                  <div
                    key={feature.key}
                    className="flex items-center justify-between p-3 border rounded"
                  >
                    <div>
                      <div className="font-medium">{feature.name}</div>
                      <div className="text-sm text-gray-500">
                        {feature.description}
                      </div>
                    </div>
                    <div className="w-32">
                      {feature.type === "boolean" ? (
                        <Switch
                          checked={
                            (plan.features as any)?.[feature.key] || false
                          }
                          onCheckedChange={(checked) => {
                            const updatedFeatures = {
                              ...plan.features,
                              [feature.key]: checked,
                            };
                            onSave({
                              ...plan,
                              features: updatedFeatures,
                            } as Plan);
                          }}
                        />
                      ) : (
                        <Input
                          type="number"
                          value={(plan.features as any)?.[feature.key] || 0}
                          onChange={(e) => {
                            const value = parseInt(e.target.value) || 0;
                            const updatedFeatures = {
                              ...plan.features,
                              [feature.key]: value,
                            };
                            onSave({
                              ...plan,
                              features: updatedFeatures,
                            } as Plan);
                          }}
                          min="0"
                        />
                      )}
                    </div>
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Lade Pläne...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={() => navigate("/super-admin")}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Zurück zum Dashboard
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Plan Management
              </h1>
              <p className="text-gray-600">
                Verwalten Sie Pläne, Features und Limits
              </p>
            </div>
          </div>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Neuer Plan
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Neuen Plan erstellen</DialogTitle>
                <DialogDescription>
                  Erstellen Sie einen neuen Pricing-Plan mit Features und Limits
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreatePlan}>
                <PlanEditor
                  plan={newPlan}
                  onSave={(plan) => setNewPlan(plan)}
                  isEditing={false}
                />
                <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowCreateDialog(false);
                      resetNewPlan();
                    }}
                  >
                    Abbrechen
                  </Button>
                  <Button type="submit">Plan erstellen</Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Plans Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {plans.map((plan) => (
              <Card key={plan.id} className={plan.isActive ? "" : "opacity-60"}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Crown className="h-5 w-5 text-yellow-500" />
                      <CardTitle className="text-lg">
                        {plan.displayName}
                      </CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            console.log("Opening edit dialog for plan:", plan);
                            setEditingPlan({ ...plan });
                          }}
                        >
                          <Edit className="mr-2 h-4 w-4" />
                          Bearbeiten
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => {
                            const updatedPlan = {
                              ...plan,
                              isActive: !plan.isActive,
                            };
                            handleUpdatePlan(updatedPlan);
                          }}
                        >
                          {plan.isActive ? (
                            <>
                              <XCircle className="mr-2 h-4 w-4" />
                              Deaktivieren
                            </>
                          ) : (
                            <>
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Aktivieren
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() =>
                            handleDeletePlan(plan.id, plan.displayName)
                          }
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Löschen
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold">
                      {plan.price === 0 ? "Kostenlos" : `${plan.price}€`}
                      {plan.price > 0 && (
                        <span className="text-sm font-normal">/Monat</span>
                      )}
                    </div>
                    {plan.trialDays > 0 && (
                      <Badge variant="secondary" className="text-xs">
                        <Clock className="mr-1 h-3 w-3" />
                        {plan.trialDays} Tage Test
                      </Badge>
                    )}
                    <Badge variant={plan.isActive ? "default" : "secondary"}>
                      {plan.isActive ? "Aktiv" : "Inaktiv"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        {plan.features.maxUsers === 999
                          ? "∞"
                          : plan.features.maxUsers}{" "}
                        User
                      </div>
                      <div className="flex items-center gap-1">
                        <FileText className="h-3 w-3" />
                        {plan.features.maxPages === 999
                          ? "∞"
                          : plan.features.maxPages}{" "}
                        Pages
                      </div>
                      <div className="flex items-center gap-1">
                        <Upload className="h-3 w-3" />
                        {plan.features.maxUploads === 999
                          ? "∞"
                          : plan.features.maxUploads}
                        GB
                      </div>
                      <div className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        {plan.features.maxSubmissions === 999
                          ? "∞"
                          : plan.features.maxSubmissions}
                        /Mo
                      </div>
                    </div>

                    <div className="pt-2 border-t space-y-1">
                      {plan.features.customDomain && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Custom Domain
                        </div>
                      )}
                      {plan.features.apiAccess && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          API Access
                        </div>
                      )}
                      {plan.features.prioritySupport && (
                        <div className="flex items-center gap-1 text-xs text-green-600">
                          <CheckCircle className="h-3 w-3" />
                          Priority Support
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Feature Comparison Table */}
          <Card>
            <CardHeader>
              <CardTitle>Feature-Vergleich</CardTitle>
              <CardDescription>
                Detaillierte Übersicht aller Plan-Features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Feature</TableHead>
                    {plans.map((plan) => (
                      <TableHead key={plan.id} className="text-center">
                        {plan.displayName}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {AVAILABLE_FEATURES.map((feature) => (
                    <TableRow key={feature.key}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{feature.name}</div>
                          <div className="text-sm text-gray-500">
                            {feature.description}
                          </div>
                        </div>
                      </TableCell>
                      {plans.map((plan) => (
                        <TableCell key={plan.id} className="text-center">
                          {renderFeatureValue(
                            feature,
                            (plan.features as any)[feature.key],
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Plan Dialog */}
      {editingPlan && (
        <Dialog open={!!editingPlan} onOpenChange={() => setEditingPlan(null)}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Plan bearbeiten: {editingPlan.displayName}
              </DialogTitle>
              <DialogDescription>
                Bearbeiten Sie Features, Limits und Einstellungen
              </DialogDescription>
            </DialogHeader>
            <PlanEditor
              plan={editingPlan}
              onSave={setEditingPlan}
              isEditing={true}
            />
            <div className="flex justify-end space-x-2 mt-6 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setEditingPlan(null)}
              >
                Abbrechen
              </Button>
              <Button onClick={() => handleUpdatePlan(editingPlan)}>
                Änderungen speichern
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PlansManagement;
