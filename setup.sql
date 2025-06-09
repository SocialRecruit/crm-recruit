-- Social Recruiting CRM Database Setup
-- Run this script in your MySQL database

CREATE DATABASE IF NOT EXISTS social_recruiting_crm;
USE social_recruiting_crm;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role ENUM('admin', 'user') DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_username (username),
    INDEX idx_email (email),
    INDEX idx_role (role)
);

-- Landing pages table
CREATE TABLE IF NOT EXISTS landing_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    header_image VARCHAR(500),
    header_text TEXT,
    header_overlay_color VARCHAR(7) DEFAULT '#000000',
    header_overlay_opacity DECIMAL(3,2) DEFAULT 0.50,
    header_height INT DEFAULT 400,
    content_blocks JSON,
    status ENUM('draft', 'published') DEFAULT 'draft',
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_slug (slug),
    INDEX idx_status (status),
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at)
);

-- Form submissions table
CREATE TABLE IF NOT EXISTS form_submissions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    page_id INT NOT NULL,
    data JSON NOT NULL,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
    INDEX idx_page_id (page_id),
    INDEX idx_created_at (created_at),
    INDEX idx_ip_address (ip_address)
);

-- Uploads table
CREATE TABLE IF NOT EXISTS uploads (
    id INT AUTO_INCREMENT PRIMARY KEY,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INT NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    url VARCHAR(500) NOT NULL,
    user_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_user_id (user_id),
    INDEX idx_created_at (created_at),
    INDEX idx_filename (filename)
);

-- Auth tokens table (for JWT token tracking)
CREATE TABLE IF NOT EXISTS auth_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token_hash VARCHAR(255) NOT NULL,
    user_id INT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at),
    INDEX idx_user_id (user_id)
);

-- Insert default admin user
-- Password: admin123 (change this in production!)
INSERT INTO users (username, email, password_hash, role) VALUES 
('admin', 'admin@wws-strube.de', '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
ON DUPLICATE KEY UPDATE id=id;

-- Insert sample landing page
INSERT INTO landing_pages (title, slug, header_text, content_blocks, status, user_id) VALUES 
('Museumsmitarbeiter', 'museumsmitarbeiter', 'Werden Sie Teil unseres Teams im Museum', 
'[
    {
        "id": "1",
        "type": "header",
        "content": {"text": "Ihre Aufgaben"},
        "order": 1
    },
    {
        "id": "2",
        "type": "list",
        "content": {
            "items": [
                {"emoji": "🎨", "text": "Betreuung von Ausstellungen und Besuchern"},
                {"emoji": "📚", "text": "Pflege und Verwaltung von Sammlungen"},
                {"emoji": "👥", "text": "Durchführung von Führungen"},
                {"emoji": "💼", "text": "Administrative Tätigkeiten"}
            ]
        },
        "order": 2
    },
    {
        "id": "3",
        "type": "header",
        "content": {"text": "Was wir bieten"},
        "order": 3
    },
    {
        "id": "4",
        "type": "list",
        "content": {
            "items": [
                {"emoji": "💰", "text": "Attraktive Vergütung"},
                {"emoji": "⏰", "text": "Flexible Arbeitszeiten"},
                {"emoji": "🎓", "text": "Weiterbildungsmöglichkeiten"},
                {"emoji": "🌟", "text": "Arbeiten in einem kulturellen Umfeld"}
            ]
        },
        "order": 4
    },
    {
        "id": "5",
        "type": "form",
        "content": {
            "title": "Bewerbung als Museumsmitarbeiter",
            "fields": [
                {"label": "Vollständiger Name", "type": "text", "placeholder": "Ihr vollständiger Name"},
                {"label": "E-Mail-Adresse", "type": "email", "placeholder": "ihre@email.de"},
                {"label": "Telefonnummer", "type": "tel", "placeholder": "+49 123 456789"},
                {"label": "Motivationsschreiben", "type": "textarea", "placeholder": "Warum möchten Sie bei uns arbeiten?"}
            ]
        },
        "order": 5
    }
]', 
'published', 1)
ON DUPLICATE KEY UPDATE id=id;

-- Create uploads directory structure (note: this needs to be done manually on the server)
-- mkdir -p uploads
-- chmod 755 uploads

-- Clean up expired tokens (can be run as a cron job)
-- DELETE FROM auth_tokens WHERE expires_at < NOW();

-- Optimize tables
OPTIMIZE TABLE users, landing_pages, form_submissions, uploads, auth_tokens;

-- Display setup completion message
SELECT 'Database setup completed successfully!' as Status;
SELECT 'Default admin credentials:' as Info, 'Username: admin' as Username, 'Password: admin123' as Password;
SELECT 'Please change the default password after first login!' as Important;
