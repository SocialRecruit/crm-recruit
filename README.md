# Social Recruiting CRM - Landing Page Builder

Ein modernes CRM-System für Social Recruiting mit einem integrierten Landing Page Builder. Entwickelt mit React (Frontend) und PHP (Backend) für XAMPP und allinkl.com Webspace.

## 🚀 Features

- **Landing Page Builder**: Drag & Drop Editor für Social Recruiting Pages
- **Content-Blöcke**: Header, Text, Rich Text, Bilder, Buttons, Aufzählungen, Formulare
- **Responsive Design**: Optimiert für Desktop und Mobile
- **Benutzer-Verwaltung**: Admin und Standard-Benutzer Rollen
- **Formular-Management**: Bewerbungen sammeln und verwalten
- **Bildergalerie**: Upload und Verwaltung von Medien
- **SEO-Optimiert**: Clean URLs mit .htaccess
- **DSGVO-konform**: Cookie-Banner und Datenschutz

## 📋 Systemanforderungen

- **Webserver**: Apache mit mod_rewrite
- **PHP**: Version 7.4 oder höher
- **MySQL**: Version 5.7 oder höher
- **Node.js**: Version 16 oder höher (für Entwicklung)

## 🛠️ Installation

### 1. Repository klonen

```bash
git clone <repository-url>
cd social-recruiting-crm
```

### 2. Frontend Dependencies installieren

```bash
npm install
```

### 3. Frontend builden

```bash
npm run build
```

### 4. Dateien auf Server hochladen

- Lade alle Dateien auf deinen Webserver hoch
- Stelle sicher, dass der `uploads/` Ordner existiert und beschreibbar ist:

```bash
mkdir uploads
chmod 755 uploads
```

### 5. Datenbank einrichten

1. Erstelle eine MySQL-Datenbank namens `social_recruiting_crm`
2. Importiere die `setup.sql` Datei:

```sql
mysql -u username -p social_recruiting_crm < setup.sql
```

### 6. Datenbankverbindung konfigurieren

Bearbeite `api/config/database.php` und passe die Datenbankverbindung an:

```php
private $host = 'localhost';
private $username = 'dein_username';
private $password = 'dein_password';
private $database = 'social_recruiting_crm';
```

### 7. Sicherheit konfigurieren

1. Ändere den JWT Secret in `api/middleware/auth.php`:

```php
private static $secret = 'dein-geheimer-schluessel-hier';
```

2. Setze sichere Dateirechte:

```bash
chmod 644 .htaccess
chmod -R 644 api/
chmod 755 api/
```

## 🔑 Standard-Anmeldedaten

Nach der Installation kannst du dich mit folgenden Daten anmelden:

- **Benutzername**: admin
- **E-Mail**: admin@wws-strube.de
- **Passwort**: admin123

**⚠️ WICHTIG**: Ändere das Passwort sofort nach der ersten Anmeldung!

## 📁 Projektstruktur

```
social-recruiting-crm/
├── src/                          # React Frontend
│   ├── components/              # UI Komponenten
│   ├── pages/                   # Seiten-Komponenten
│   ├── contexts/               # React Contexts
│   └── lib/                    # Utilities und API
├── api/                         # PHP Backend
│   ├── config/                 # Datenbank-Konfiguration
│   ├── controllers/            # API Controller
│   ├── middleware/             # Authentifizierung
│   └── index.php              # API Router
├── uploads/                     # Upload-Verzeichnis
├── .htaccess                   # URL Rewriting
└── setup.sql                  # Datenbank Setup
```

## 🎯 Verwendung

### Landing Pages erstellen

1. Melde dich im Dashboard an
2. Klicke auf "Neue Landing Page"
3. Füge Header-Informationen hinzu
4. Erstelle Content-Blöcke:
   - **Header**: Überschriften
   - **Text**: Einfacher Text
   - **Rich Text**: HTML-formatierter Text
   - **Bild**: Bilder hochladen
   - **Button**: Call-to-Action Buttons
   - **Aufzählung**: Listen mit Emojis
   - **Formular**: Bewerbungsformulare

### URL-Struktur

Landing Pages sind unter folgenden URLs erreichbar:

- `/jobs/{slug}` - Öffentliche Landing Page
- `/dashboard` - CRM Dashboard
- `/page-builder/{id}` - Landing Page Editor

### Bewerbungen verwalten

1. Gehe zum Dashboard
2. Klicke auf "Bewerbungen"
3. Verwalte eingegangene Formulardaten

## 🔧 Entwicklung

### Frontend entwickeln

```bash
npm run dev
```

### Backend testen

Der PHP-Backend läuft direkt auf dem Webserver. Für lokale Entwicklung:

```bash
# XAMPP starten
# Oder einen lokalen PHP Server
php -S localhost:8000
```

### Build für Produktion

```bash
npm run build
```

## 📝 API Dokumentation

### Authentifizierung

```
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

### Landing Pages

```
GET    /api/pages
POST   /api/pages
GET    /api/pages/{id}
PUT    /api/pages/{id}
DELETE /api/pages/{id}
GET    /api/pages/slug/{slug}
```

### Benutzer (Admin only)

```
GET    /api/users
POST   /api/users
PUT    /api/users/{id}
DELETE /api/users/{id}
```

### Uploads

```
POST /api/upload
GET  /api/gallery
```

### Formular-Einreichungen

```
POST /api/submit
GET  /api/submissions
```

## 🛡️ Sicherheit

- JWT-basierte Authentifizierung
- Passwort-Hashing mit bcrypt
- SQL-Injection Schutz durch Prepared Statements
- CSRF-Schutz für Formulare
- Input-Validierung und Sanitization
- Datei-Upload Beschränkungen

## 🌐 Browser-Unterstützung

- Chrome (aktuell)
- Firefox (aktuell)
- Safari (aktuell)
- Edge (aktuell)

## 📞 Support

Bei Fragen oder Problemen:

1. Überprüfe die Logs in `/var/log/apache2/` oder `/logs/`
2. Stelle sicher, dass mod_rewrite aktiviert ist
3. Überprüfe die Dateirechte
4. Kontaktiere den Support

## 🔄 Updates

Um das System zu aktualisieren:

1. Sichere deine Datenbank
2. Lade neue Dateien hoch
3. Führe eventuelle Datenbank-Migrationen aus
4. Leere den Browser-Cache

---

**© 2024 WWS-Strube. Alle Rechte vorbehalten.**
