import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, Tenant } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Building2, Shield } from "lucide-react";

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [selectedTenant, setSelectedTenant] = useState("");
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    loadTenants();
  }, []);

  const loadTenants = async () => {
    try {
      const tenantsData = await api.getAvailableTenants();
      setTenants(tenantsData);
      if (tenantsData.length === 1) {
        setSelectedTenant(tenantsData[0].id.toString());
      }
    } catch (err) {
      // If can't load tenants, might be demo mode or super admin
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Check if it's super admin login
      if (username === "superadmin") {
        setIsSuperAdmin(true);
        await login(username, password);
        navigate("/super-admin");
      } else {
        // Regular tenant login
        if (!selectedTenant && tenants.length > 1) {
          setError("Bitte wählen Sie einen Tenant aus");
          setLoading(false);
          return;
        }

        const loginData = {
          username,
          password,
          tenant_id: selectedTenant ? parseInt(selectedTenant) : undefined,
        };

        await login(
          loginData.username,
          loginData.password,
          loginData.tenant_id,
        );
        navigate("/dashboard");
      }
    } catch (err) {
      setError("Ungültige Anmeldedaten");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Social Recruiting CRM
          </CardTitle>
          <CardDescription className="text-center">
            Melden Sie sich an, um Ihre Landing Pages zu verwalten
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Tenant Selection - only show if multiple tenants and not super admin */}
            {tenants.length > 1 && !isSuperAdmin && (
              <div className="space-y-2">
                <Label htmlFor="tenant">Organisation</Label>
                <Select
                  value={selectedTenant}
                  onValueChange={setSelectedTenant}
                >
                  <SelectTrigger>
                    <Building2 className="mr-2 h-4 w-4" />
                    <SelectValue placeholder="Organisation auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {tenants.map((tenant) => (
                      <SelectItem key={tenant.id} value={tenant.id.toString()}>
                        <div className="flex items-center gap-2">
                          <div>
                            <div className="font-medium">{tenant.name}</div>
                            <div className="text-sm text-gray-500">
                              {tenant.subdomain}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="username">Benutzername</Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value);
                  setIsSuperAdmin(e.target.value === "superadmin");
                }}
                required
                disabled={loading}
                placeholder={
                  isSuperAdmin ? "Super Administrator" : "Ihr Benutzername"
                }
              />
              {isSuperAdmin && (
                <div className="flex items-center gap-1 text-xs text-blue-600">
                  <Shield className="h-3 w-3" />
                  Super Administrator Modus
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Passwort</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                placeholder={
                  isSuperAdmin ? "Super Admin Passwort" : "Ihr Passwort"
                }
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anmelden
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;
