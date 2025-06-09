import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { api, FormSubmission, LandingPage } from "@/lib/api";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
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
import {
  ArrowLeft,
  Eye,
  Trash2,
  MoreHorizontal,
  Download,
  Mail,
  Calendar,
  Filter,
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

const Submissions = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<FormSubmission[]>([]);
  const [pages, setPages] = useState<LandingPage[]>([]);
  const [selectedPageId, setSelectedPageId] = useState<string>("all");
  const [selectedSubmission, setSelectedSubmission] =
    useState<FormSubmission | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    loadData();
  }, [selectedPageId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [submissionsData, pagesData] = await Promise.all([
        api.getSubmissions(
          selectedPageId === "all" ? undefined : parseInt(selectedPageId),
        ),
        api.getPages(),
      ]);

      // Demo data for submissions when in demo mode
      if (localStorage.getItem("demo_mode") === "true") {
        const demoSubmissions: FormSubmission[] = [
          {
            id: 1,
            page_id: 1,
            data: {
              name: "Max Mustermann",
              email: "max.mustermann@email.de",
              phone: "+49 123 456789",
              message:
                "Ich interessiere mich sehr für die Stelle als Museumsmitarbeiter. Ich habe Erfahrung in der Kulturbranche und würde gerne Teil Ihres Teams werden.",
            },
            created_at: new Date(
              Date.now() - 2 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
          {
            id: 2,
            page_id: 1,
            data: {
              name: "Anna Schmidt",
              email: "anna.schmidt@email.de",
              phone: "+49 987 654321",
              message:
                "Hallo, ich bin Kunsthistorikerin und suche eine neue Herausforderung im Museumsbereich.",
            },
            created_at: new Date(
              Date.now() - 5 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
          {
            id: 3,
            page_id: 1,
            data: {
              name: "Thomas Weber",
              email: "t.weber@email.de",
              phone: "+49 555 123456",
              message:
                "Ich habe bereits 3 Jahre Erfahrung in einem anderen Museum und möchte mich bei Ihnen bewerben.",
            },
            created_at: new Date(
              Date.now() - 7 * 24 * 60 * 60 * 1000,
            ).toISOString(),
          },
        ];
        setSubmissions(demoSubmissions);
      } else {
        setSubmissions(submissionsData);
      }

      setPages(pagesData);
    } catch (err) {
      setError("Fehler beim Laden der Bewerbungen");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubmission = async (id: number) => {
    if (
      window.confirm(
        "Sind Sie sicher, dass Sie diese Bewerbung löschen möchten?",
      )
    ) {
      try {
        if (localStorage.getItem("demo_mode") !== "true") {
          await api.deleteSubmission(id);
        }
        setSubmissions(submissions.filter((s) => s.id !== id));
      } catch (err) {
        setError("Fehler beim Löschen der Bewerbung");
      }
    }
  };

  const exportSubmissions = () => {
    const csvContent = [
      ["Datum", "Seite", "Name", "E-Mail", "Telefon", "Nachricht"],
      ...submissions.map((sub) => [
        new Date(sub.created_at).toLocaleDateString("de-DE"),
        pages.find((p) => p.id === sub.page_id)?.title || "Unbekannt",
        sub.data.name || sub.data.vollständiger_name || "",
        sub.data.email || sub.data["e-mail-adresse"] || "",
        sub.data.phone || sub.data.telefonnummer || "",
        sub.data.message || sub.data.motivationsschreiben || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `bewerbungen_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const renderSubmissionData = (data: Record<string, any>) => {
    return Object.entries(data).map(([key, value]) => (
      <div key={key} className="mb-3">
        <dt className="font-semibold text-gray-700 capitalize">
          {key.replace(/_/g, " ").replace(/([a-z])([A-Z])/g, "$1 $2")}:
        </dt>
        <dd className="text-gray-900 mt-1">
          {typeof value === "string" && value.length > 100 ? (
            <div className="bg-gray-50 p-3 rounded border">{value}</div>
          ) : (
            value
          )}
        </dd>
      </div>
    ));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Lade Bewerbungen...</p>
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
                    <ArrowLeft className="h-4 w-4" />
                    Zurück zum Dashboard
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        <main className="flex-1 p-6">
          <div className="max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h1 className="text-3xl font-bold">Bewerbungen</h1>
                <p className="text-gray-600 mt-1">
                  Verwalten Sie alle eingegangenen Bewerbungen
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Select
                  value={selectedPageId}
                  onValueChange={setSelectedPageId}
                >
                  <SelectTrigger className="w-64">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter nach Seite" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Seiten</SelectItem>
                    {pages.map((page) => (
                      <SelectItem key={page.id} value={page.id.toString()}>
                        {page.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={exportSubmissions} variant="outline">
                  <Download className="mr-2 h-4 w-4" />
                  Exportieren
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive" className="mb-6">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Gesamt Bewerbungen
                  </CardTitle>
                  <Mail className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{submissions.length}</div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Heute</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      submissions.filter(
                        (s) =>
                          new Date(s.created_at).toDateString() ===
                          new Date().toDateString(),
                      ).length
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Diese Woche
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {
                      submissions.filter((s) => {
                        const submissionDate = new Date(s.created_at);
                        const weekAgo = new Date();
                        weekAgo.setDate(weekAgo.getDate() - 7);
                        return submissionDate >= weekAgo;
                      }).length
                    }
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Aktive Seiten
                  </CardTitle>
                  <Eye className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {pages.filter((p) => p.status === "published").length}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Bewerbungsübersicht</CardTitle>
                <CardDescription>
                  Alle eingegangenen Bewerbungen im Überblick
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Landing Page</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>E-Mail</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {submissions.map((submission) => (
                      <TableRow key={submission.id}>
                        <TableCell>
                          {new Date(submission.created_at).toLocaleDateString(
                            "de-DE",
                          )}
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary">
                            {pages.find((p) => p.id === submission.page_id)
                              ?.title || "Unbekannt"}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">
                          {submission.data.name ||
                            submission.data.vollständiger_name ||
                            "Nicht angegeben"}
                        </TableCell>
                        <TableCell>
                          {submission.data.email ||
                            submission.data["e-mail-adresse"] ||
                            "Nicht angegeben"}
                        </TableCell>
                        <TableCell>
                          <Badge variant="default">Neu</Badge>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <Dialog>
                                <DialogTrigger asChild>
                                  <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    Details anzeigen
                                  </DropdownMenuItem>
                                </DialogTrigger>
                                <DialogContent className="max-w-2xl">
                                  <DialogHeader>
                                    <DialogTitle>Bewerbungsdetails</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                      <div>
                                        <strong>Datum:</strong>{" "}
                                        {new Date(
                                          submission.created_at,
                                        ).toLocaleString("de-DE")}
                                      </div>
                                      <div>
                                        <strong>Landing Page:</strong>{" "}
                                        {
                                          pages.find(
                                            (p) => p.id === submission.page_id,
                                          )?.title
                                        }
                                      </div>
                                    </div>
                                    <hr />
                                    <dl className="space-y-3">
                                      {renderSubmissionData(submission.data)}
                                    </dl>
                                  </div>
                                </DialogContent>
                              </Dialog>
                              <DropdownMenuItem
                                onClick={() =>
                                  handleDeleteSubmission(submission.id)
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

                {submissions.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>Noch keine Bewerbungen eingegangen</p>
                    <p className="text-sm">
                      Bewerbungen erscheinen hier, sobald Besucher Ihre
                      Formulare ausfüllen.
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
};

export default Submissions;
