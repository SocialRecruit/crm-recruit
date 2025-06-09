import React, { useState } from "react";
import { ContentBlock } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Badge } from "@/components/ui/badge";
import {
  Type,
  FileText,
  Image as ImageIcon,
  Mouse,
  List,
  FormInput,
  Trash2,
  Edit,
  GripVertical,
  Plus,
} from "lucide-react";

interface ContentBlockEditorProps {
  block: ContentBlock;
  onUpdate: (block: ContentBlock) => void;
  onDelete: (blockId: string) => void;
}

interface EmojiListItem {
  emoji: string;
  text: string;
}

const EMOJIS = [
  "✅",
  "🎯",
  "💼",
  "🚀",
  "⭐",
  "📈",
  "💡",
  "🔥",
  "✨",
  "🎉",
  "👥",
  "📊",
  "🌟",
  "💪",
  "🎖️",
];

const EmojiPicker: React.FC<{ onSelect: (emoji: string) => void }> = ({
  onSelect,
}) => (
  <div className="grid grid-cols-5 gap-2 p-2">
    {EMOJIS.map((emoji) => (
      <Button
        key={emoji}
        variant="ghost"
        className="text-2xl h-12 w-12"
        onClick={() => onSelect(emoji)}
      >
        {emoji}
      </Button>
    ))}
  </div>
);

const ContentBlockEditor: React.FC<ContentBlockEditorProps> = ({
  block,
  onUpdate,
  onDelete,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [tempContent, setTempContent] = useState(block.content);

  const handleSave = () => {
    onUpdate({ ...block, content: tempContent });
    setIsEditing(false);
  };

  const renderPreview = () => {
    switch (block.type) {
      case "header":
        return (
          <div className="text-center">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              {block.content.text || "Header Text"}
            </h2>
          </div>
        );

      case "text":
        return (
          <div className="prose max-w-none">
            <p className="text-gray-700 leading-relaxed">
              {block.content.text || "Text Inhalt"}
            </p>
          </div>
        );

      case "richtext":
        return (
          <div className="prose max-w-none">
            <div
              dangerouslySetInnerHTML={{
                __html: block.content.html || "<p>Rich Text Inhalt</p>",
              }}
            />
          </div>
        );

      case "image":
        return (
          <div className="text-center">
            {block.content.url ? (
              <img
                src={block.content.url}
                alt={block.content.alt || ""}
                className="max-w-full h-auto rounded-lg"
              />
            ) : (
              <div className="border-2 border-dashed border-gray-300 rounded-lg p-8">
                <ImageIcon className="mx-auto h-12 w-12 text-gray-400" />
                <p className="mt-2 text-gray-500">Bild hinzufügen</p>
              </div>
            )}
          </div>
        );

      case "button":
        return (
          <div className="text-center">
            <Button
              size="lg"
              variant={block.content.variant || "default"}
              className="px-8 py-3"
            >
              {block.content.text || "Button Text"}
            </Button>
          </div>
        );

      case "list":
        return (
          <div className="space-y-3">
            {((block.content.items as EmojiListItem[]) || []).map(
              (item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <span className="text-xl">{item.emoji}</span>
                  <span className="text-gray-700 flex-1">{item.text}</span>
                </div>
              ),
            )}
          </div>
        );

      case "form":
        return (
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-4">
              {block.content.title || "Bewerbungsformular"}
            </h3>
            <div className="space-y-4">
              {(block.content.fields || []).map((field: any, index: number) => (
                <div key={index}>
                  <Label>{field.label}</Label>
                  {field.type === "textarea" ? (
                    <Textarea placeholder={field.placeholder} />
                  ) : (
                    <Input type={field.type} placeholder={field.placeholder} />
                  )}
                </div>
              ))}
              <Button>Jetzt bewerben</Button>
            </div>
          </div>
        );

      default:
        return <div>Unbekannter Block-Typ</div>;
    }
  };

  const renderEditor = () => {
    switch (block.type) {
      case "header":
      case "text":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Text</Label>
              <Textarea
                id="text"
                value={tempContent.text || ""}
                onChange={(e) =>
                  setTempContent({ ...tempContent, text: e.target.value })
                }
                rows={block.type === "header" ? 2 : 4}
              />
            </div>
          </div>
        );

      case "richtext":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="html">HTML Inhalt</Label>
              <Textarea
                id="html"
                value={tempContent.html || ""}
                onChange={(e) =>
                  setTempContent({ ...tempContent, html: e.target.value })
                }
                rows={8}
              />
            </div>
          </div>
        );

      case "image":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="url">Bild URL</Label>
              <Input
                id="url"
                value={tempContent.url || ""}
                onChange={(e) =>
                  setTempContent({ ...tempContent, url: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="alt">Alt Text</Label>
              <Input
                id="alt"
                value={tempContent.alt || ""}
                onChange={(e) =>
                  setTempContent({ ...tempContent, alt: e.target.value })
                }
              />
            </div>
          </div>
        );

      case "button":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="text">Button Text</Label>
              <Input
                id="text"
                value={tempContent.text || ""}
                onChange={(e) =>
                  setTempContent({ ...tempContent, text: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="url">Link URL</Label>
              <Input
                id="url"
                value={tempContent.url || ""}
                onChange={(e) =>
                  setTempContent({ ...tempContent, url: e.target.value })
                }
              />
            </div>
            <div>
              <Label htmlFor="variant">Button Stil</Label>
              <Select
                value={tempContent.variant || "default"}
                onValueChange={(value) =>
                  setTempContent({ ...tempContent, variant: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="default">Standard</SelectItem>
                  <SelectItem value="secondary">Sekundär</SelectItem>
                  <SelectItem value="outline">Umriss</SelectItem>
                  <SelectItem value="destructive">Destruktiv</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        );

      case "list":
        return (
          <div className="space-y-4">
            <Label>Aufzählungspunkte</Label>
            {((tempContent.items as EmojiListItem[]) || []).map(
              (item, index) => (
                <div key={index} className="flex gap-2 items-center">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-xl p-2 h-10 w-10"
                      >
                        {item.emoji}
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Emoji auswählen</DialogTitle>
                      </DialogHeader>
                      <EmojiPicker
                        onSelect={(emoji) => {
                          const newItems = [...(tempContent.items || [])];
                          newItems[index] = { ...item, emoji };
                          setTempContent({ ...tempContent, items: newItems });
                        }}
                      />
                    </DialogContent>
                  </Dialog>
                  <Input
                    value={item.text}
                    onChange={(e) => {
                      const newItems = [...(tempContent.items || [])];
                      newItems[index] = { ...item, text: e.target.value };
                      setTempContent({ ...tempContent, items: newItems });
                    }}
                    placeholder="Text eingeben..."
                    className="flex-1"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newItems = (tempContent.items || []).filter(
                        (_, i) => i !== index,
                      );
                      setTempContent({ ...tempContent, items: newItems });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ),
            )}
            <Button
              variant="outline"
              onClick={() => {
                const newItems = [
                  ...(tempContent.items || []),
                  { emoji: "✅", text: "" },
                ];
                setTempContent({ ...tempContent, items: newItems });
              }}
            >
              <Plus className="mr-2 h-4 w-4" />
              Punkt hinzufügen
            </Button>
          </div>
        );

      case "form":
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Formular Titel</Label>
              <Input
                id="title"
                value={tempContent.title || ""}
                onChange={(e) =>
                  setTempContent({ ...tempContent, title: e.target.value })
                }
              />
            </div>
            <div>
              <Label>Formular Felder</Label>
              {(tempContent.fields || []).map((field: any, index: number) => (
                <div key={index} className="flex gap-2 mt-2">
                  <Input
                    placeholder="Feld Name"
                    value={field.label || ""}
                    onChange={(e) => {
                      const newFields = [...(tempContent.fields || [])];
                      newFields[index] = { ...field, label: e.target.value };
                      setTempContent({ ...tempContent, fields: newFields });
                    }}
                  />
                  <Select
                    value={field.type || "text"}
                    onValueChange={(value) => {
                      const newFields = [...(tempContent.fields || [])];
                      newFields[index] = { ...field, type: value };
                      setTempContent({ ...tempContent, fields: newFields });
                    }}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="email">E-Mail</SelectItem>
                      <SelectItem value="tel">Telefon</SelectItem>
                      <SelectItem value="textarea">Textarea</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      const newFields = (tempContent.fields || []).filter(
                        (_, i) => i !== index,
                      );
                      setTempContent({ ...tempContent, fields: newFields });
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                onClick={() => {
                  const newFields = [
                    ...(tempContent.fields || []),
                    { label: "", type: "text", placeholder: "" },
                  ];
                  setTempContent({ ...tempContent, fields: newFields });
                }}
              >
                <Plus className="mr-2 h-4 w-4" />
                Feld hinzufügen
              </Button>
            </div>
          </div>
        );

      default:
        return <div>Editor für diesen Block-Typ nicht verfügbar</div>;
    }
  };

  const getBlockIcon = () => {
    switch (block.type) {
      case "header":
        return <Type className="h-4 w-4" />;
      case "text":
        return <FileText className="h-4 w-4" />;
      case "richtext":
        return <FileText className="h-4 w-4" />;
      case "image":
        return <ImageIcon className="h-4 w-4" />;
      case "button":
        return <Mouse className="h-4 w-4" />;
      case "list":
        return <List className="h-4 w-4" />;
      case "form":
        return <FormInput className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getBlockTypeName = () => {
    switch (block.type) {
      case "header":
        return "Überschrift";
      case "text":
        return "Text";
      case "richtext":
        return "Rich Text";
      case "image":
        return "Bild";
      case "button":
        return "Button";
      case "list":
        return "Aufzählung";
      case "form":
        return "Formular";
      default:
        return "Unbekannt";
    }
  };

  return (
    <Card className="mb-4">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
          {getBlockIcon()}
          <CardTitle className="text-sm font-medium">
            {getBlockTypeName()}
          </CardTitle>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="text-xs">
            {block.order}
          </Badge>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditing(!isEditing)}
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => onDelete(block.id)}>
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {isEditing ? (
          <div className="space-y-4">
            {renderEditor()}
            <div className="flex gap-2">
              <Button onClick={handleSave}>Speichern</Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                Abbrechen
              </Button>
            </div>
          </div>
        ) : (
          <div className="cursor-pointer" onClick={() => setIsEditing(true)}>
            {renderPreview()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ContentBlockEditor;
