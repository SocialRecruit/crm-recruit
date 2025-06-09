<?php
class Database {
    private static $instance = null;
    private $connection;
    
    // Database configuration
    private $host = 'localhost';
    private $username = 'root';
    private $password = '';
    private $database = 'social_recruiting_crm';
    
    private function __construct() {
        try {
            $this->connection = new PDO(
                "mysql:host={$this->host};dbname={$this->database};charset=utf8mb4",
                $this->username,
                $this->password,
                [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES => false,
                ]
            );
        } catch (PDOException $e) {
            die('Database connection failed: ' . $e->getMessage());
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function getConnection() {
        return $this->connection;
    }
    
    public function query($sql, $params = []) {
        $stmt = $this->connection->prepare($sql);
        $stmt->execute($params);
        return $stmt;
    }
    
    public function fetchAll($sql, $params = []) {
        return $this->query($sql, $params)->fetchAll();
    }
    
    public function fetch($sql, $params = []) {
        return $this->query($sql, $params)->fetch();
    }
    
    public function execute($sql, $params = []) {
        return $this->query($sql, $params);
    }
    
    public function lastInsertId() {
        return $this->connection->lastInsertId();
    }
}

// Database setup function
function setupDatabase() {
    $db = Database::getInstance();
    
    // Create users table
    $db->execute("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(50) UNIQUE NOT NULL,
            email VARCHAR(100) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('admin', 'user') DEFAULT 'user',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
    ");
    
    // Create landing_pages table
    $db->execute("
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
            INDEX idx_user_id (user_id)
        )
    ");
    
    // Create form_submissions table
    $db->execute("
        CREATE TABLE IF NOT EXISTS form_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            page_id INT NOT NULL,
            data JSON NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
            INDEX idx_page_id (page_id),
            INDEX idx_created_at (created_at)
        )
    ");
    
    // Create uploads table
    $db->execute("
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
            INDEX idx_created_at (created_at)
        )
    ");
    
    // Create auth_tokens table for JWT blacklisting
    $db->execute("
        CREATE TABLE IF NOT EXISTS auth_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            token_hash VARCHAR(255) NOT NULL,
            user_id INT NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_token_hash (token_hash),
            INDEX idx_expires_at (expires_at)
        )
    ");
    
    // Create default admin user if no users exist
    $userCount = $db->fetch("SELECT COUNT(*) as count FROM users")['count'];
    if ($userCount == 0) {
        $defaultPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $db->execute("
            INSERT INTO users (username, email, password_hash, role) 
            VALUES ('admin', 'admin@wws-strube.de', ?, 'admin')
        ", [$defaultPassword]);
    }
}

// Auto-setup database on first run
setupDatabase();
?>
