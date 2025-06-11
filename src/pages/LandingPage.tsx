import React, { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { api, LandingPage as LandingPageType, ContentBlock } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle } from "lucide-react";

const LandingPage = () => {
  const { slug } = useParams();
  const [page, setPage] = useState<LandingPageType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showCookieBanner, setShowCookieBanner] = useState(true);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showImprintModal, setShowImprintModal] = useState(false);
  const [formSubmissions, setFormSubmissions] = useState<{
    [key: string]: any;
  }>({});
  const [submitSuccess, setSubmitSuccess] = useState<{
    [key: string]: boolean;
  }>({});

  useEffect(() => {
    if (slug) {
      loadPage(slug);
    }

    // Check if user has already accepted cookies
    const cookiesAccepted = localStorage.getItem("cookies_accepted");
    if (cookiesAccepted) {
      setShowCookieBanner(false);
    }
  }, [slug]);

  const loadPage = async (pageSlug: string) => {
    try {
      const pageData = await api.getPageBySlug(pageSlug);
      setPage(pageData);
    } catch (err) {
      console.log(
        "API call failed, providing demo content for slug:",
        pageSlug,
      );

      // Provide demo content as fallback
      const demoPage: LandingPageType = {
        id: 1,
        title:
          pageSlug === "museumsmitarbeiter"
            ? "Museumsmitarbeiter gesucht"
            : `Demo Landing Page: ${pageSlug}`,
        slug: pageSlug,
        header_image: "",
        header_text:
          pageSlug === "museumsmitarbeiter"
            ? "Werden Sie Teil unseres Teams im Museum"
            : "Willkommen bei unserer Demo Landing Page",
        header_overlay_color: "#000000",
        header_overlay_opacity: 0.5,
        header_height: 400,
        content_blocks:
          pageSlug === "museumsmitarbeiter"
            ? [
                {
                  id: "1",
                  type: "header",
                  content: { text: "Ihre Aufgaben als Museumsmitarbeiter" },
                  order: 1,
                },
                {
                  id: "2",
                  type: "list",
                  content: {
                    items: [
                      {
                        emoji: "🎨",
                        text: "Betreuung von Ausstellungen und Besuchern",
                      },
                      {
                        emoji: "📚",
                        text: "Pflege und Verwaltung von Sammlungen",
                      },
                      { emoji: "👥", text: "Durchführung von Führungen" },
                      { emoji: "💼", text: "Administrative Tätigkeiten" },
                    ],
                  },
                  order: 2,
                },
                {
                  id: "3",
                  type: "text",
                  content: {
                    text: "Wir bieten Ihnen eine abwechslungsreiche Tätigkeit in einem kulturell wertvollen Umfeld mit flexiblen Arbeitszeiten und einem freundlichen Team.",
                  },
                  order: 3,
                },
                {
                  id: "4",
                  type: "form",
                  content: {
                    title: "Jetzt bewerben",
                    fields: [
                      {
                        name: "name",
                        label: "Vollständiger Name",
                        type: "text",
                        required: true,
                      },
                      {
                        name: "email",
                        label: "E-Mail-Adresse",
                        type: "email",
                        required: true,
                      },
                      {
                        name: "phone",
                        label: "Telefonnummer",
                        type: "tel",
                        required: false,
                      },
                      {
                        name: "experience",
                        label: "Berufserfahrung",
                        type: "textarea",
                        required: false,
                      },
                      {
                        name: "motivation",
                        label: "Warum möchten Sie bei uns arbeiten?",
                        type: "textarea",
                        required: false,
                      },
                    ],
                  },
                  order: 4,
                },
              ]
            : [
                {
                  id: "1",
                  type: "header",
                  content: { text: "Demo Landing Page" },
                  order: 1,
                },
                {
                  id: "2",
                  type: "text",
                  content: {
                    text: "Dies ist eine Demo Landing Page. In der echten Anwendung würden hier die tatsächlichen Inhalte angezeigt.",
                  },
                  order: 2,
                },
                {
                  id: "3",
                  type: "form",
                  content: {
                    title: "Jetzt bewerben",
                    fields: [
                      {
                        name: "name",
                        label: "Name",
                        type: "text",
                        required: true,
                      },
                      {
                        name: "email",
                        label: "E-Mail",
                        type: "email",
                        required: true,
                      },
                      {
                        name: "phone",
                        label: "Telefon",
                        type: "tel",
                        required: false,
                      },
                      {
                        name: "message",
                        label: "Nachricht",
                        type: "textarea",
                        required: false,
                      },
                    ],
                  },
                  order: 3,
                },
              ],
        status: "published",
        user_id: 1,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setPage(demoPage);
    } finally {
      setLoading(false);
    }
  };

  const handleCookieAccept = () => {
    localStorage.setItem("cookies_accepted", "true");
    setShowCookieBanner(false);
  };

  const handleFormSubmit = async (blockId: string, formData: FormData) => {
    try {
      const data: { [key: string]: any } = {};
      formData.forEach((value, key) => {
        data[key] = value;
      });

      if (page) {
        await api.submitForm(page.id, { block_id: blockId, ...data });
        setSubmitSuccess({ ...submitSuccess, [blockId]: true });
        setTimeout(() => {
          setSubmitSuccess({ ...submitSuccess, [blockId]: false });
        }, 5000);
      }
    } catch (err) {
      console.error("Error submitting form:", err);
    }
  };

  const renderContentBlock = (block: ContentBlock) => {
    switch (block.type) {
      case "header":
        return (
          <div className="text-center mb-8 lg:mb-12">
            <h2 className="text-2xl lg:text-4xl font-bold text-gray-900 mb-4">
              {block.content.text}
            </h2>
          </div>
        );

      case "text":
        return (
          <div className="prose prose-lg max-w-none mb-6 lg:mb-8">
            <p className="text-gray-700 leading-relaxed text-base lg:text-lg">
              {block.content.text}
            </p>
          </div>
        );

      case "richtext":
        return (
          <div
            className="prose prose-lg max-w-none mb-6 lg:mb-8"
            dangerouslySetInnerHTML={{ __html: block.content.html }}
          />
        );

      case "image":
        return block.content.url ? (
          <div className="mb-6 lg:mb-8">
            <img
              src={block.content.url}
              alt={block.content.alt || ""}
              className="w-full h-auto rounded-lg shadow-lg"
            />
          </div>
        ) : null;

      case "button":
        return (
          <div className="text-center mb-6 lg:mb-8">
            <Button
              size="lg"
              className="px-8 py-4 text-lg font-semibold"
              onClick={() => {
                if (block.content.url) {
                  window.open(block.content.url, "_blank");
                }
              }}
            >
              {block.content.text}
            </Button>
          </div>
        );

      case "list":
        return (
          <div className="mb-6 lg:mb-8">
            <div className="space-y-4">
              {(block.content.items || []).map((item: any, index: number) => (
                <div key={index} className="flex items-start gap-4">
                  <span className="text-2xl lg:text-3xl flex-shrink-0">
                    {item.emoji}
                  </span>
                  <span className="text-gray-700 text-base lg:text-lg leading-relaxed flex-1">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        );

      case "form":
        return (
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 lg:p-8 rounded-xl shadow-lg mb-6 lg:mb-8">
            <h3 className="text-xl lg:text-2xl font-bold text-gray-900 mb-6 text-center">
              {block.content.title}
            </h3>

            {submitSuccess[block.id] ? (
              <div className="text-center py-8">
                <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <h4 className="text-xl font-semibold text-green-800 mb-2">
                  Vielen Dank für Ihre Bewerbung!
                </h4>
                <p className="text-green-700">
                  Wir haben Ihre Bewerbung erhalten und werden uns bald bei
                  Ihnen melden.
                </p>
              </div>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleFormSubmit(block.id, formData);
                }}
                className="space-y-6"
              >
                {(block.content.fields || []).map(
                  (field: any, index: number) => (
                    <div key={index}>
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        {field.label}
                      </label>
                      {field.type === "textarea" ? (
                        <Textarea
                          name={field.label.toLowerCase().replace(/\s+/g, "_")}
                          placeholder={field.placeholder}
                          required
                          rows={4}
                          className="w-full"
                        />
                      ) : (
                        <Input
                          type={field.type}
                          name={field.label.toLowerCase().replace(/\s+/g, "_")}
                          placeholder={field.placeholder}
                          required
                          className="w-full"
                        />
                      )}
                    </div>
                  ),
                )}

                <div className="text-center pt-4">
                  <Button
                    type="submit"
                    size="lg"
                    className="px-8 py-4 text-lg font-semibold bg-green-600 hover:bg-green-700"
                  >
                    Jetzt bewerben
                  </Button>
                </div>
              </form>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Lade Seite...</p>
        </div>
      </div>
    );
  }

  if (error || !page) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">404</h1>
          <p className="text-gray-600">Seite nicht gefunden</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header
        className="relative bg-cover bg-center text-white"
        style={{
          backgroundImage: page.header_image
            ? `url(${page.header_image})`
            : undefined,
          height: `${page.header_height}px`,
          backgroundColor: !page.header_image ? "#1f2937" : undefined,
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
        <div className="relative z-10 flex items-center justify-center h-full px-4 lg:px-8">
          <div className="text-center max-w-4xl">
            <h1 className="text-3xl lg:text-5xl xl:text-6xl font-bold mb-6 leading-tight">
              {page.title}
            </h1>
            {page.header_text && (
              <p className="text-lg lg:text-xl xl:text-2xl opacity-90 leading-relaxed">
                {page.header_text}
              </p>
            )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="px-4 lg:px-8 py-8 lg:py-16">
        <div className="max-w-6xl mx-auto">
          <div className="lg:grid lg:grid-cols-2 lg:gap-12 space-y-8 lg:space-y-0">
            {page.content_blocks.map((block, index) => (
              <div
                key={block.id}
                className={
                  block.type === "header" || block.type === "form"
                    ? "lg:col-span-2"
                    : ""
                }
              >
                {renderContentBlock(block)}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white">
        <div className="max-w-6xl mx-auto px-4 lg:px-8 py-8 lg:py-12">
          <div className="text-center space-y-6">
            <div className="flex flex-col sm:flex-row justify-center items-center space-y-4 sm:space-y-0 sm:space-x-8">
              <button
                onClick={() => setShowImprintModal(true)}
                className="text-gray-300 hover:text-white transition-colors underline"
              >
                Impressum
              </button>
              <button
                onClick={() => setShowPrivacyModal(true)}
                className="text-gray-300 hover:text-white transition-colors underline"
              >
                Datenschutzerklärung
              </button>
            </div>
            <div className="border-t border-gray-700 pt-6">
              <p className="text-gray-400 text-sm">
                © 2024 WWS-Strube. Alle Rechte vorbehalten.
              </p>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 text-white p-4 lg:p-6 z-50">
          <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center justify-between space-y-4 lg:space-y-0">
            <div className="text-sm lg:text-base">
              <p>
                Diese Website verwendet Cookies, um Ihnen die bestmögliche
                Nutzererfahrung zu bieten. Durch die weitere Nutzung der Website
                stimmen Sie der Verwendung von Cookies zu.
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowPrivacyModal(true)}
                className="text-white border-white hover:bg-white hover:text-gray-900"
              >
                Mehr erfahren
              </Button>
              <Button
                size="sm"
                onClick={handleCookieAccept}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Akzeptieren
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Privacy Modal */}
      <Dialog open={showPrivacyModal} onOpenChange={setShowPrivacyModal}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Datenschutzerklärung</DialogTitle>
          </DialogHeader>
          <div className="prose max-w-none">
            <h3>1. Datenschutz auf einen Blick</h3>
            <p>
              Die folgenden Hinweise geben einen einfachen Überblick darüber,
              was mit Ihren personenbezogenen Daten passiert, wenn Sie diese
              Website besuchen. Personenbezogene Daten sind alle Daten, mit
              denen Sie persönlich identifiziert werden können.
            </p>

            <h3>2. Datenerfassung auf dieser Website</h3>
            <p>
              Die Datenverarbeitung auf dieser Website erfolgt durch den
              Websitebetreiber. Dessen Kontaktdaten können Sie dem Impressum
              dieser Website entnehmen.
            </p>

            <h3>3. Cookies</h3>
            <p>
              Diese Website verwendet Cookies. Das sind kleine Textdateien, die
              Ihr Webbrowser auf Ihrem Endgerät speichert. Cookies helfen uns
              dabei, unser Angebot nutzerfreundlicher, effektiver und sicherer
              zu machen.
            </p>

            <h3>4. Kontaktformular</h3>
            <p>
              Wenn Sie uns per Kontaktformular Anfragen zukommen lassen, werden
              Ihre Angaben aus dem Anfrageformular inklusive der von Ihnen dort
              angegebenen Kontaktdaten zwecks Bearbeitung der Anfrage und für
              den Fall von Anschlussfragen bei uns gespeichert.
            </p>
          </div>
        </DialogContent>
      </Dialog>

      {/* Imprint Modal */}
      <Dialog open={showImprintModal} onOpenChange={setShowImprintModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Impressum</DialogTitle>
          </DialogHeader>
          <div className="prose max-w-none">
            <h3>Angaben gemäß § 5 TMG</h3>
            <p>
              WWS-Strube
              <br />
              Musterstraße 123
              <br />
              12345 Musterstadt
            </p>

            <h3>Kontakt</h3>
            <p>
              Telefon: +49 (0) 123 456789
              <br />
              E-Mail: info@wws-strube.de
            </p>

            <h3>Verantwortlich für den Inhalt nach § 55 Abs. 2 RStV</h3>
            <p>
              Max Mustermann
              <br />
              Musterstraße 123
              <br />
              12345 Musterstadt
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LandingPage;
