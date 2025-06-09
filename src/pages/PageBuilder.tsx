import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, LandingPage, ContentBlock } from "@/lib/api";
import ContentBlockEditor from "@/components/ContentBlocks";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Save,
  Eye,
  ArrowLeft,
  Plus,
  Type,
  FileText,
  Image as ImageIcon,
  Mouse,
  List,
  FormInput,
  Upload,
  Monitor,
  Smartphone,
} from "lucide-react";

const PageBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<LandingPage>({
    id: 0,
    title: "",
    slug: "",
    header_image: "",
    header_text: "",
    header_overlay_color: "#000000",
    header_overlay_opacity: 0.5,
    header_height: 400,
    content_blocks: [],
    status: "draft",
    user_id: 0,
    created_at: "",
    updated_at: "",
  });
  const [preview, setPreview] = useState(false);
  const [mobilePreview, setMobilePreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (id && id !== "new") {
      loadPage(parseInt(id));
    }
  }, [id]);

  const loadPage = async (pageId: number) => {
    try {
      setLoading(true);
      const pageData = await api.getPage(pageId);
      setPage(pageData);
    } catch (err) {
      setError("Fehler beim Laden der Seite");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError("");

      if (!page.title || !page.slug) {
        setError("Titel und Slug sind erforderlich");
        return;
      }

      if (id === "new") {
        const newPage = await api.createPage(page);
        navigate(`/page-builder/${newPage.id}`, { replace: true });
      } else {
        await api.updatePage(page.id, page);
      }

      setSuccess("Seite erfolgreich gespeichert");
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError("Fehler beim Speichern der Seite");
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[äöüß]/g, (match) => {
        const map: { [key: string]: string } = {
          ä: "ae",
          ö: "oe",
          ü: "ue",
          ß: "ss",
        };
        return map[match] || match;
      })
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();
  };

  const addContentBlock = (type: ContentBlock["type"]) => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      order: page.content_blocks.length + 1,
    };

    setPage({
      ...page,
      content_blocks: [...page.content_blocks, newBlock],
    });
  };

  const getDefaultContent = (type: ContentBlock["type"]) => {
    switch (type) {
      case "header":
        return { text: "Neue Überschrift" };
      case "text":
        return { text: "Neuer Textinhalt" };
      case "richtext":
        return { html: "<p>Rich Text Inhalt</p>" };
      case "image":
        return { url: "", alt: "" };
      case "button":
        return { text: "Button Text", url: "", variant: "default" };
      case "list":
        return { items: [{ emoji: "✅", text: "Listenpunkt 1" }] };
      case "form":
        return {
          title: "Bewerbungsformular",
          fields: [
            { label: "Name", type: "text", placeholder: "Ihr Name" },
            { label: "E-Mail", type: "email", placeholder: "ihre@email.de" },
          ],
        };
      default:
        return {};
    }
  };

  const updateContentBlock = (updatedBlock: ContentBlock) => {
    setPage({
      ...page,
      content_blocks: page.content_blocks.map((block) =>
        block.id === updatedBlock.id ? updatedBlock : block,
      ),
    });
  };

  const deleteContentBlock = (blockId: string) => {
    setPage({
      ...page,
      content_blocks: page.content_blocks.filter(
        (block) => block.id !== blockId,
      ),
    });
  };

  const renderPreview = () => {
    return (
      <div
        className={`mx-auto bg-white ${mobilePreview ? "max-w-sm" : "max-w-4xl"}`}
      >
        {/* Header */}
        <div
          className="relative bg-cover bg-center text-white"
          style={{
            backgroundImage: page.header_image
              ? `url(${page.header_image})`
              : undefined,
            height: `${page.header_height}px`,
            backgroundColor: !page.header_image ? "#f3f4f6" : undefined,
          }}
        >
          {page.header_image && (
            <div
              className="absolute inset-0"
              style={{
                backgroundColor: page.header_overlay_color,
                opacity: page.header_overlay_opacity,
              }}
            />
          )}
          <div className="relative z-10 flex items-center justify-center h-full p-8">
            <div className="text-center">
              <h1
                className={`font-bold mb-4 ${mobilePreview ? "text-2xl" : "text-4xl"}`}
              >
                {page.title || "Seitentitel"}
              </h1>
              {page.header_text && (
                <p
                  className={`${mobilePreview ? "text-sm" : "text-lg"} opacity-90`}
                >
                  {page.header_text}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className={`${mobilePreview ? "p-4 space-y-6" : "p-8 space-y-8"}`}>
          <div
            className={mobilePreview ? "space-y-6" : "grid grid-cols-2 gap-8"}
          >
            {page.content_blocks.map((block) => (
              <div
                key={block.id}
                className={
                  block.type === "header" && !mobilePreview ? "col-span-2" : ""
                }
              >
                <ContentBlockPreview block={block} mobile={mobilePreview} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <footer className="bg-gray-900 text-white p-8 text-center">
          <div className="max-w-4xl mx-auto space-y-4">
            <div className="flex justify-center space-x-8 text-sm">
              <a href="#" className="hover:text-gray-300">
                Impressum
              </a>
              <a href="#" className="hover:text-gray-300">
                Datenschutz
              </a>
            </div>
            <p className="text-gray-400 text-xs">
              © 2024 WWS-Strube. Alle Rechte vorbehalten.
            </p>
          </div>
        </footer>
      </div>
    );
  };

  if (loading && id !== "new") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Lade Seite...</p>
        </div>
      </div>
    );
  }

  if (preview) {
    return (
      <div className="min-h-screen bg-gray-100">
        <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
          <Button variant="outline" onClick={() => setPreview(false)}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Zurück zum Editor
          </Button>
          <div className="flex items-center gap-2">
            <Button
              variant={!mobilePreview ? "default" : "outline"}
              size="sm"
              onClick={() => setMobilePreview(false)}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            <Button
              variant={mobilePreview ? "default" : "outline"}
              size="sm"
              onClick={() => setMobilePreview(true)}
            >
              <Smartphone className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="p-6">{renderPreview()}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Dashboard
          </Button>
          <h1 className="text-xl font-semibold">
            {id === "new" ? "Neue Landing Page" : "Landing Page bearbeiten"}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => setPreview(true)}>
            <Eye className="mr-2 h-4 w-4" />
            Vorschau
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            Speichern
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive" className="m-6">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="m-6">
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      <div className="p-6">
        <div className="grid grid-cols-12 gap-6">
          {/* Editor Panel */}
          <div className="col-span-8">
            <Tabs defaultValue="content" className="space-y-6">
              <TabsList>
                <TabsTrigger value="content">Inhalt</TabsTrigger>
                <TabsTrigger value="settings">Einstellungen</TabsTrigger>
              </TabsList>

              <TabsContent value="content" className="space-y-6">
                {/* Content Blocks */}
                <Card>
                  <CardHeader>
                    <CardTitle>Inhaltsblöcke</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {page.content_blocks.map((block) => (
                      <ContentBlockEditor
                        key={block.id}
                        block={block}
                        onUpdate={updateContentBlock}
                        onDelete={deleteContentBlock}
                      />
                    ))}

                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" className="w-full">
                          <Plus className="mr-2 h-4 w-4" />
                          Neuen Abschnitt hinzufügen
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Abschnittstyp auswählen</DialogTitle>
                        </DialogHeader>
                        <div className="grid grid-cols-2 gap-4">
                          <Button
                            variant="outline"
                            onClick={() => addContentBlock("header")}
                          >
                            <Type className="mr-2 h-4 w-4" />
                            Überschrift
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => addContentBlock("text")}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Text
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => addContentBlock("richtext")}
                          >
                            <FileText className="mr-2 h-4 w-4" />
                            Rich Text
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => addContentBlock("image")}
                          >
                            <ImageIcon className="mr-2 h-4 w-4" />
                            Bild
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => addContentBlock("button")}
                          >
                            <Mouse className="mr-2 h-4 w-4" />
                            Button
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => addContentBlock("list")}
                          >
                            <List className="mr-2 h-4 w-4" />
                            Aufzählung
                          </Button>
                          <Button
                            variant="outline"
                            onClick={() => addContentBlock("form")}
                            className="col-span-2"
                          >
                            <FormInput className="mr-2 h-4 w-4" />
                            Bewerbungsformular
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                {/* Page Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Seiteneinstellungen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="title">Seitentitel</Label>
                      <Input
                        id="title"
                        value={page.title}
                        onChange={(e) => {
                          const newTitle = e.target.value;
                          setPage({
                            ...page,
                            title: newTitle,
                            slug: page.slug || generateSlug(newTitle),
                          });
                        }}
                      />
                    </div>

                    <div>
                      <Label htmlFor="slug">URL Slug</Label>
                      <div className="flex">
                        <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                          /jobs/
                        </span>
                        <Input
                          id="slug"
                          value={page.slug}
                          onChange={(e) =>
                            setPage({
                              ...page,
                              slug: generateSlug(e.target.value),
                            })
                          }
                          className="rounded-l-none"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="status">Status</Label>
                      <Select
                        value={page.status}
                        onValueChange={(value: "draft" | "published") =>
                          setPage({ ...page, status: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="draft">Entwurf</SelectItem>
                          <SelectItem value="published">
                            Veröffentlicht
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>

                {/* Header Settings */}
                <Card>
                  <CardHeader>
                    <CardTitle>Header-Einstellungen</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label htmlFor="header_image">Header-Bild URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="header_image"
                          value={page.header_image || ""}
                          onChange={(e) =>
                            setPage({ ...page, header_image: e.target.value })
                          }
                        />
                        <Button variant="outline">
                          <Upload className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="header_text">Header-Text</Label>
                      <Input
                        id="header_text"
                        value={page.header_text || ""}
                        onChange={(e) =>
                          setPage({ ...page, header_text: e.target.value })
                        }
                      />
                    </div>

                    <div>
                      <Label>Header-Höhe: {page.header_height}px</Label>
                      <Slider
                        value={[page.header_height || 400]}
                        onValueChange={([value]) =>
                          setPage({ ...page, header_height: value })
                        }
                        max={800}
                        min={200}
                        step={50}
                      />
                    </div>

                    <div>
                      <Label htmlFor="overlay_color">Overlay-Farbe</Label>
                      <div className="flex gap-2">
                        <Input
                          id="overlay_color"
                          type="color"
                          value={page.header_overlay_color || "#000000"}
                          onChange={(e) =>
                            setPage({
                              ...page,
                              header_overlay_color: e.target.value,
                            })
                          }
                          className="w-16 h-10"
                        />
                        <Input
                          value={page.header_overlay_color || "#000000"}
                          onChange={(e) =>
                            setPage({
                              ...page,
                              header_overlay_color: e.target.value,
                            })
                          }
                          className="flex-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label>
                        Overlay-Transparenz:{" "}
                        {Math.round((page.header_overlay_opacity || 0.5) * 100)}
                        %
                      </Label>
                      <Slider
                        value={[(page.header_overlay_opacity || 0.5) * 100]}
                        onValueChange={([value]) =>
                          setPage({
                            ...page,
                            header_overlay_opacity: value / 100,
                          })
                        }
                        max={100}
                        min={0}
                        step={5}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Preview Panel */}
          <div className="col-span-4">
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle>Vorschau</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="border rounded-lg p-4 bg-white max-h-96 overflow-y-auto">
                  <div className="scale-50 origin-top-left w-[200%]">
                    {renderPreview()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

const ContentBlockPreview: React.FC<{
  block: ContentBlock;
  mobile?: boolean;
}> = ({ block, mobile }) => {
  switch (block.type) {
    case "header":
      return (
        <h2
          className={`font-bold text-gray-900 mb-4 ${mobile ? "text-xl" : "text-3xl"}`}
        >
          {block.content.text || "Header Text"}
        </h2>
      );

    case "text":
      return (
        <p className="text-gray-700 leading-relaxed">
          {block.content.text || "Text Inhalt"}
        </p>
      );

    case "richtext":
      return (
        <div
          className="prose max-w-none"
          dangerouslySetInnerHTML={{
            __html: block.content.html || "<p>Rich Text Inhalt</p>",
          }}
        />
      );

    case "image":
      return block.content.url ? (
        <img
          src={block.content.url}
          alt={block.content.alt || ""}
          className="w-full h-auto rounded-lg"
        />
      ) : (
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-gray-500">Bild</p>
        </div>
      );

    case "button":
      return (
        <div className="text-center">
          <button className="bg-blue-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors">
            {block.content.text || "Button Text"}
          </button>
        </div>
      );

    case "list":
      return (
        <div className="space-y-3">
          {(block.content.items || []).map((item: any, index: number) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-xl">{item.emoji}</span>
              <span className="text-gray-700 flex-1">{item.text}</span>
            </div>
          ))}
        </div>
      );

    case "form":
      return (
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3
            className={`font-semibold mb-4 ${mobile ? "text-lg" : "text-xl"}`}
          >
            {block.content.title || "Bewerbungsformular"}
          </h3>
          <div className="space-y-4">
            {(block.content.fields || []).map((field: any, index: number) => (
              <div key={index}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label}
                </label>
                {field.type === "textarea" ? (
                  <textarea
                    className="w-full border rounded-md p-2"
                    rows={3}
                    placeholder={field.placeholder}
                  />
                ) : (
                  <input
                    type={field.type}
                    className="w-full border rounded-md p-2"
                    placeholder={field.placeholder}
                  />
                )}
              </div>
            ))}
            <button className="bg-green-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-700 transition-colors">
              Jetzt bewerben
            </button>
          </div>
        </div>
      );

    default:
      return <div>Unbekannter Block-Typ</div>;
  }
};

export default PageBuilder;
