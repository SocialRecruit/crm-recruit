import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, LandingPage, User } from "@/lib/api";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Plus,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Users,
  FileText,
  BarChart3,
  LogOut,
  Settings,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarProvider,
} from "@/components/ui/sidebar";

const Dashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [pagesData, usersData] = await Promise.all([
        api.getPages(),
        user?.role === "admin" ? api.getUsers() : Promise.resolve([]),
      ]);
      setPages(pagesData);
      setUsers(usersData);
    } catch (err) {
      setError("Fehler beim Laden der Daten");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePage = async (id: number) => {
    if (
      window.confirm("Sind Sie sicher, dass Sie diese Seite löschen möchten?")
    ) {
      try {
        await api.deletePage(id);
        await loadData();
      } catch (err) {
        setError("Fehler beim Löschen der Seite");
      }
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Lade Dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gray-50">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b px-6 py-4">
            <h2 className="text-lg font-semibold">Social Recruiting CRM</h2>
            <p className="text-sm text-muted-foreground">
              Willkommen, {user?.username}
            </p>
          </SidebarHeader>
          <SidebarContent>
            <SidebarMenu className="px-4 py-2">
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/dashboard" className="flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/page-builder" className="flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Landing Pages
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              {user?.role === "admin" && (
                <SidebarMenuItem>
                  <SidebarMenuButton asChild>
                    <Link to="/users" className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Benutzerverwaltung
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              )}
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link to="/submissions" className="flex items-center gap-2">
                    <Settings className="h-4 w-4" />
                    Bewerbungen
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
              <SidebarMenuItem className="mt-auto">
                <SidebarMenuButton
                  onClick={handleLogout}
                  className="flex items-center gap-2 text-red-600 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Abmelden
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-3xl font-bold">Dashboard</h1>
              <Button asChild>
                <Link to="/page-builder/new">
                  <Plus className="mr-2 h-4 w-4" />
                  Neue Landing Page
                </Link>
              </Button>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gesamt Landing Pages
                  </CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{pages.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Veröffentlichte Seiten
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {pages.filter((p) => p.status === "published").length}
                  </div>
                </CardContent>
              </Card>

              {user?.role === "admin" && (
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Benutzer
                    </CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{users.length}</div>
                  </CardContent>
                </Card>
              )}
            </div>

            <Tabs defaultValue="pages" className="space-y-4">
              <TabsList>
                <TabsTrigger value="pages">Landing Pages</TabsTrigger>
                {user?.role === "admin" && (
                  <TabsTrigger value="users">Benutzer</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="pages">
                <Card>
                  <CardHeader>
                    <CardTitle>Landing Pages</CardTitle>
                    <CardDescription>
                      Verwalten Sie Ihre Landing Pages für Social Recruiting
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Titel</TableHead>
                          <TableHead>Slug</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Erstellt</TableHead>
                          <TableHead>Aktionen</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {pages.map((page) => (
                          <TableRow key={page.id}>
                            <TableCell className="font-medium">
                              {page.title}
                            </TableCell>
                            <TableCell>
                              <code className="text-sm bg-gray-100 px-1 rounded">
                                /jobs/{page.slug}
                              </code>
                            </TableCell>
                            <TableCell>
                              <Badge
                                variant={
                                  page.status === "published"
                                    ? "default"
                                    : "secondary"
                                }
                              >
                                {page.status === "published"
                                  ? "Veröffentlicht"
                                  : "Entwurf"}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {new Date(page.created_at).toLocaleDateString(
                                "de-DE",
                              )}
                            </TableCell>
                            <TableCell>
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                  >
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem asChild>
                                    <Link
                                      to={`/jobs/${page.slug}`}
                                      target="_blank"
                                    >
                                      <Eye className="mr-2 h-4 w-4" />
                                      Anzeigen
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem asChild>
                                    <Link to={`/page-builder/${page.id}`}>
                                      <Edit className="mr-2 h-4 w-4" />
                                      Bearbeiten
                                    </Link>
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleDeletePage(page.id)}
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

              {user?.role === "admin" && (
                <TabsContent value="users">
                  <Card>
                    <CardHeader>
                      <CardTitle>Benutzerverwaltung</CardTitle>
                      <CardDescription>
                        Verwalten Sie Benutzerkonten und Berechtigungen
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Benutzername</TableHead>
                            <TableHead>E-Mail</TableHead>
                            <TableHead>Rolle</TableHead>
                            <TableHead>Erstellt</TableHead>
                            <TableHead>Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {users.map((user) => (
                            <TableRow key={user.id}>
                              <TableCell className="font-medium">
                                {user.username}
                              </TableCell>
                              <TableCell>{user.email}</TableCell>
                              <TableCell>
                                <Badge
                                  variant={
                                    user.role === "admin"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {user.role === "admin"
                                    ? "Administrator"
                                    : "Benutzer"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {new Date(user.created_at).toLocaleDateString(
                                  "de-DE",
                                )}
                              </TableCell>
                              <TableCell>
                                <Button variant="ghost" size="sm">
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
            </Tabs>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;
