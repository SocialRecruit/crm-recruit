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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Plus,
  Settings,
  Users,
  Building2,
  BarChart3,
  LogOut,
  MoreHorizontal,
  Edit,
  Trash2,
  UserPlus,
  LogIn,
  Shield,
  TrendingUp,
  Eye,
  Crown,
  Loader2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  domain?: string;
  status: "active" | "inactive" | "suspended";
  plan: "free" | "basic" | "pro" | "enterprise";
  user_count: number;
  page_count: number;
  submission_count: number;
  max_users: number;
  max_pages: number;
  created_at: string;
  settings: any;
  branding: any;
}

interface Stats {
  total_tenants: number;
  active_tenants: number;
  total_users: number;
  total_pages: number;
  total_submissions: number;
  plans: Record<string, number>;
  recent_tenants: Array<{
    id: number;
    name: string;
    subdomain: string;
    status: string;
    created_at: string;
  }>;
}

const SuperAdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTenant, setNewTenant] = useState({
    name: "",
    subdomain: "",
    domain: "",
    plan: "free",
    admin_email: "",
    admin_password: "",
    admin_username: "admin",
  });

  useEffect(() => {
    if (user?.role !== "super_admin") {
      navigate("/login");
      return;
    }
    loadData();
  }, [user, navigate]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [tenantsData, statsData] = await Promise.all([
        api.getSuperAdminTenants(),
        api.getSuperAdminStats(),
      ]);

      setTenants(tenantsData);
      setStats(statsData);
    } catch (err) {
      setError("Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();

    console.log("=== CREATING TENANT DEBUG ===");
    console.log("New tenant data:", newTenant);
    console.log("Demo mode:", localStorage.getItem("demo_mode"));
    console.log("Auth token:", localStorage.getItem("auth_token"));

    // Validierung
    if (
      !newTenant.name ||
      !newTenant.subdomain ||
      !newTenant.admin_email ||
      !newTenant.admin_password
    ) {
      const missingFields = [];
      if (!newTenant.name) missingFields.push("Name");
      if (!newTenant.subdomain) missingFields.push("Subdomain");
      if (!newTenant.admin_email) missingFields.push("Admin E-Mail");
      if (!newTenant.admin_password) missingFields.push("Admin Passwort");

      setError(`Fehlende Pflichtfelder: ${missingFields.join(", ")}`);
      return;
    }

    // Subdomain validation
    if (!/^[a-z0-9-]+$/.test(newTenant.subdomain)) {
      setError(
        "Subdomain darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten",
      );
      return;
    }

    // Check if subdomain already exists
    const existingTenant = tenants.find(
      (t) => t.subdomain === newTenant.subdomain,
    );
    if (existingTenant) {
      setError(`Subdomain "${newTenant.subdomain}" ist bereits vergeben`);
      return;
    }

    try {
      setError("");
      setLoading(true);

      console.log("=== API CALL START ===");
      const createdTenant = await api.createTenant(newTenant);
      console.log("=== TENANT CREATED ===", createdTenant);

      // Add tenant to local state immediately
      setTenants((prevTenants) => {
        const updated = [...prevTenants, createdTenant];
        console.log("Updated tenants list:", updated);
        return updated;
      });

      // Update stats
      if (stats) {
        setStats({
          ...stats,
          total_tenants: stats.total_tenants + 1,
          active_tenants: stats.active_tenants + 1,
        });
      }

      // Reset form
      const resetData = {
        name: "",
        subdomain: "",
        domain: "",
        plan: "free",
        admin_email: "",
        admin_password: "",
        admin_username: "admin",
      };

      setNewTenant(resetData);
      setShowCreateDialog(false);
      setError("");

      // Success notification
      alert(
        `✅ Tenant "${createdTenant.name}" wurde erfolgreich erstellt!\n\n` +
          `Subdomain: ${createdTenant.subdomain}\n` +
          `Admin Login: ${newTenant.admin_username}\n` +
          `Plan: ${createdTenant.plan}`,
      );
    } catch (err) {
      console.error("=== CREATE TENANT ERROR ===", err);
      console.error(
        "Error stack:",
        err instanceof Error ? err.stack : "No stack",
      );

      setError(
        `Fehler beim Erstellen: ${err instanceof Error ? err.message : "Unbekannter Fehler"}`,
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTenant = async (id: number, name: string) => {
    if (
      window.confirm(
        `Sind Sie sicher, dass Sie den Tenant "${name}" löschen möchten? Diese Aktion kann nicht rückgängig gemacht werden.`,
      )
    ) {
      try {
        await api.deleteTenant(id);
        await loadData();
      } catch (err) {
        setError("Fehler beim Löschen des Tenants");
      }
    }
  };

  const handleImpersonateTenant = async (id: number) => {
    try {
      console.log("=== IMPERSONATING TENANT ===");
      console.log("Tenant ID:", id);
      console.log("Current user:", user);
      console.log("Demo mode:", localStorage.getItem("demo_mode"));

      // Debug localStorage content
      console.log(
        "Custom tenants in localStorage:",
        localStorage.getItem("demo_custom_tenants"),
      );

      const tenant = tenants.find((t) => t.id === id);
      console.log("Target tenant from state:", tenant);

      // Also check if tenant exists in fresh API call
      const allTenants = await api.getSuperAdminTenants();
      const tenantFromAPI = allTenants.find((t) => t.id === id);
      console.log("Target tenant from API:", tenantFromAPI);
      console.log("All tenants from API:", allTenants);

      setError("");
      setLoading(true);

      const response = await api.impersonateTenant(id);
      console.log("Impersonation response:", response);

      // Update auth token
      localStorage.setItem("auth_token", response.token);
      localStorage.setItem("user_type", "tenant_admin");

      console.log("Navigating to tenant dashboard...");

      // Force page reload to ensure clean state
      window.location.href = "/dashboard";
    } catch (err) {
      console.error("=== IMPERSONATION ERROR ===", err);
      setError(
        `Fehler beim Einloggen in Tenant: ${err instanceof Error ? err.message : "Unbekannter Fehler"}`,
      );
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const getPlanColor = (plan: string) => {
    const colors = {
      free: "secondary",
      basic: "default",
      pro: "default",
      enterprise: "default",
    };
    return colors[plan as keyof typeof colors] || "secondary";
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: "default",
      inactive: "secondary",
      suspended: "destructive",
    };
    return colors[status as keyof typeof colors] || "secondary";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Lade Super Admin Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Super Admin Dashboard
            </h1>
            <p className="text-gray-600">
              Willkommen, {user?.username} - System Administrator
            </p>
          </div>
          <div className="flex items-center gap-4">
            {localStorage.getItem("demo_mode") === "true" && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    localStorage.removeItem("demo_custom_tenants");
                    window.location.reload();
                  }}
                >
                  Debug: Clear Demo Data
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    console.log("=== DEBUG INFO ===");
                    console.log(
                      "Custom tenants:",
                      localStorage.getItem("demo_custom_tenants"),
                    );
                    console.log("Current tenants state:", tenants);
                    loadData(); // Refresh data
                  }}
                >
                  Debug: Refresh
                </Button>
              </>
            )}
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Abmelden
            </Button>
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Stats Overview */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gesamt Tenants
                  </CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.total_tenants}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {stats.active_tenants} aktiv
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Benutzer
                  </CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_users}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Landing Pages
                  </CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total_pages}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Bewerbungen
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.total_submissions}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Aktive Tenants
                  </CardTitle>
                  <Shield className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {stats.active_tenants}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          <div className="flex justify-between items-center mb-6">
            <div></div>
            <div className="flex gap-2">
              <Button variant="outline" asChild>
                <Link to="/super-admin/plans">
                  <Crown className="mr-2 h-4 w-4" />
                  Plan Management
                </Link>
              </Button>
            </div>
          </div>

          <Tabs defaultValue="tenants" className="space-y-6">
            <TabsList>
              <TabsTrigger value="tenants">Tenant Management</TabsTrigger>
              <TabsTrigger value="stats">Statistiken</TabsTrigger>
            </TabsList>

            <TabsContent value="tenants">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle>Tenants</CardTitle>
                      <CardDescription>
                        Verwalten Sie alle Tenants im System
                      </CardDescription>
                    </div>
                    <Dialog
                      open={showCreateDialog}
                      onOpenChange={setShowCreateDialog}
                    >
                      <DialogTrigger asChild>
                        <Button>
                          <Plus className="mr-2 h-4 w-4" />
                          Neuer Tenant
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-2xl">
                        <DialogHeader>
                          <DialogTitle>Neuen Tenant erstellen</DialogTitle>
                          <DialogDescription>
                            Erstellen Sie einen neuen Tenant mit Administrator
                          </DialogDescription>
                        </DialogHeader>
                        <form
                          onSubmit={handleCreateTenant}
                          className="space-y-4"
                        >
                          {error && (
                            <Alert variant="destructive">
                              <AlertDescription>{error}</AlertDescription>
                            </Alert>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="name">Firmenname *</Label>
                              <Input
                                id="name"
                                value={newTenant.name}
                                onChange={(e) =>
                                  setNewTenant({
                                    ...newTenant,
                                    name: e.target.value,
                                  })
                                }
                                placeholder="z.B. Musterfirma GmbH"
                                required
                              />
                            </div>
                            <div>
                              <Label htmlFor="subdomain">Subdomain *</Label>
                              <Input
                                id="subdomain"
                                value={newTenant.subdomain}
                                onChange={(e) => {
                                  const value = e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9-]/g, "");
                                  setNewTenant({
                                    ...newTenant,
                                    subdomain: value,
                                  });
                                }}
                                placeholder="firma"
                                required
                                pattern="[a-z0-9-]+"
                                title="Nur Kleinbuchstaben, Zahlen und Bindestriche erlaubt"
                              />
                              <p className="text-xs text-gray-500 mt-1">
                                URL: {newTenant.subdomain || "subdomain"}
                                .beispiel.de
                              </p>
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="domain">
                              Custom Domain (optional)
                            </Label>
                            <Input
                              id="domain"
                              value={newTenant.domain}
                              onChange={(e) =>
                                setNewTenant({
                                  ...newTenant,
                                  domain: e.target.value,
                                })
                              }
                              placeholder="www.firma.de"
                            />
                          </div>

                          <div>
                            <Label htmlFor="plan">Plan</Label>
                            <Select
                              value={newTenant.plan}
                              onValueChange={(value) =>
                                setNewTenant({ ...newTenant, plan: value })
                              }
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="free">Free</SelectItem>
                                <SelectItem value="basic">Basic</SelectItem>
                                <SelectItem value="pro">Pro</SelectItem>
                                <SelectItem value="enterprise">
                                  Enterprise
                                </SelectItem>
                              </SelectContent>
                            </Select>
                          </div>

                          <div className="border-t pt-4">
                            <h4 className="font-medium mb-3">
                              Tenant Administrator
                            </h4>
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="admin_username">
                                  Admin Benutzername *
                                </Label>
                                <Input
                                  id="admin_username"
                                  value={newTenant.admin_username}
                                  onChange={(e) =>
                                    setNewTenant({
                                      ...newTenant,
                                      admin_username: e.target.value,
                                    })
                                  }
                                  placeholder="admin"
                                  required
                                />
                              </div>
                              <div>
                                <Label htmlFor="admin_email">
                                  Admin E-Mail *
                                </Label>
                                <Input
                                  id="admin_email"
                                  type="email"
                                  value={newTenant.admin_email}
                                  onChange={(e) =>
                                    setNewTenant({
                                      ...newTenant,
                                      admin_email: e.target.value,
                                    })
                                  }
                                  placeholder="admin@firma.de"
                                  required
                                />
                              </div>
                            </div>
                            <div className="mt-4">
                              <Label htmlFor="admin_password">
                                Admin Passwort *
                              </Label>
                              <Input
                                id="admin_password"
                                type="password"
                                value={newTenant.admin_password}
                                onChange={(e) =>
                                  setNewTenant({
                                    ...newTenant,
                                    admin_password: e.target.value,
                                  })
                                }
                                placeholder="Mindestens 8 Zeichen"
                                minLength={8}
                                required
                              />
                            </div>
                          </div>

                          <div className="flex justify-end space-x-2 pt-4">
                            <Button
                              type="button"
                              variant="outline"
                              onClick={() => {
                                setShowCreateDialog(false);
                                setError("");
                              }}
                              disabled={loading}
                            >
                              Abbrechen
                            </Button>
                            <Button type="submit" disabled={loading}>
                              {loading ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Erstelle...
                                </>
                              ) : (
                                <>
                                  <Plus className="mr-2 h-4 w-4" />
                                  Tenant erstellen
                                </>
                              )}
                            </Button>
                          </div>
                        </form>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Name</TableHead>
                        <TableHead>Subdomain</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Plan</TableHead>
                        <TableHead>Benutzer</TableHead>
                        <TableHead>Seiten</TableHead>
                        <TableHead>Erstellt</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {tenants.map((tenant) => (
                        <TableRow key={tenant.id}>
                          <TableCell className="font-medium">
                            {tenant.name}
                          </TableCell>
                          <TableCell>
                            <code className="text-sm bg-gray-100 px-1 rounded">
                              {tenant.subdomain}
                            </code>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getStatusColor(tenant.status)}>
                              {tenant.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={getPlanColor(tenant.plan)}>
                              {tenant.plan}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {tenant.user_count} / {tenant.max_users}
                          </TableCell>
                          <TableCell>
                            {tenant.page_count} / {tenant.max_pages}
                          </TableCell>
                          <TableCell>
                            {new Date(tenant.created_at).toLocaleDateString(
                              "de-DE",
                            )}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" className="h-8 w-8 p-0">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setActionLoading(tenant.id);
                                    handleImpersonateTenant(tenant.id);
                                  }}
                                  disabled={actionLoading === tenant.id}
                                >
                                  {actionLoading === tenant.id ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  ) : (
                                    <LogIn className="mr-2 h-4 w-4" />
                                  )}
                                  Als Tenant einloggen
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    alert(
                                      `Tenant Details:\n\nName: ${tenant.name}\nSubdomain: ${tenant.subdomain}\nPlan: ${tenant.plan}\nStatus: ${tenant.status}\nBenutzer: ${tenant.user_count}/${tenant.max_users}\nSeiten: ${tenant.page_count}/${tenant.max_pages}`,
                                    );
                                  }}
                                >
                                  <Eye className="mr-2 h-4 w-4" />
                                  Details anzeigen
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    alert("Tenant bearbeiten coming soon...");
                                  }}
                                >
                                  <Edit className="mr-2 h-4 w-4" />
                                  Bearbeiten
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleDeleteTenant(tenant.id, tenant.name)
                                  }
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Löschen
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Stats Tab */}
            <TabsContent value="stats">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Plan-Verteilung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.plans && (
                      <div className="space-y-3">
                        {Object.entries(stats.plans).map(([plan, count]) => (
                          <div
                            key={plan}
                            className="flex items-center justify-between"
                          >
                            <div className="flex items-center gap-2">
                              <Badge variant={getPlanColor(plan)}>{plan}</Badge>
                            </div>
                            <div className="font-semibold">{count}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Neueste Tenants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {stats?.recent_tenants && (
                      <div className="space-y-3">
                        {stats.recent_tenants.map((tenant) => (
                          <div
                            key={tenant.id}
                            className="flex items-center justify-between p-3 border rounded"
                          >
                            <div>
                              <div className="font-medium">{tenant.name}</div>
                              <div className="text-sm text-gray-500">
                                {tenant.subdomain}
                              </div>
                            </div>
                            <div className="text-sm text-gray-500">
                              {new Date(tenant.created_at).toLocaleDateString(
                                "de-DE",
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
