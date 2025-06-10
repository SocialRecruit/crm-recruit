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
    
    // Create tenants table
    $db->execute("
        CREATE TABLE IF NOT EXISTS tenants (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(255) NOT NULL,
            subdomain VARCHAR(100) UNIQUE NOT NULL,
            domain VARCHAR(255),
            status ENUM('active', 'inactive', 'suspended') DEFAULT 'active',
            settings JSON,
            branding JSON,
            plan ENUM('free', 'basic', 'pro', 'enterprise') DEFAULT 'free',
            max_users INT DEFAULT 5,
            max_pages INT DEFAULT 10,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            INDEX idx_subdomain (subdomain),
            INDEX idx_status (status),
            INDEX idx_plan (plan)
        )
    ");
    
    // Create users table with tenant support
    $db->execute("
        CREATE TABLE IF NOT EXISTS users (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT,
            username VARCHAR(50) NOT NULL,
            email VARCHAR(100) NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            role ENUM('super_admin', 'tenant_admin', 'admin', 'user') DEFAULT 'user',
            is_active BOOLEAN DEFAULT TRUE,
            last_login TIMESTAMP NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            UNIQUE KEY unique_user_per_tenant (tenant_id, username),
            UNIQUE KEY unique_email_per_tenant (tenant_id, email),
            INDEX idx_tenant_id (tenant_id),
            INDEX idx_username (username),
            INDEX idx_email (email),
            INDEX idx_role (role)
        )
    ");
    
    // Create landing_pages table with tenant support
    $db->execute("
        CREATE TABLE IF NOT EXISTS landing_pages (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT NOT NULL,
            title VARCHAR(255) NOT NULL,
            slug VARCHAR(255) NOT NULL,
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
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            UNIQUE KEY unique_slug_per_tenant (tenant_id, slug),
            INDEX idx_tenant_id (tenant_id),
            INDEX idx_slug (slug),
            INDEX idx_status (status),
            INDEX idx_user_id (user_id)
        )
    ");
    
    // Create form_submissions table with tenant support
    $db->execute("
        CREATE TABLE IF NOT EXISTS form_submissions (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT NOT NULL,
            page_id INT NOT NULL,
            data JSON NOT NULL,
            ip_address VARCHAR(45),
            user_agent TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            FOREIGN KEY (page_id) REFERENCES landing_pages(id) ON DELETE CASCADE,
            INDEX idx_tenant_id (tenant_id),
            INDEX idx_page_id (page_id),
            INDEX idx_created_at (created_at)
        )
    ");
    
    // Create uploads table with tenant support
    $db->execute("
        CREATE TABLE IF NOT EXISTS uploads (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT NOT NULL,
            filename VARCHAR(255) NOT NULL,
            original_name VARCHAR(255) NOT NULL,
            file_size INT NOT NULL,
            mime_type VARCHAR(100) NOT NULL,
            url VARCHAR(500) NOT NULL,
            user_id INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_tenant_id (tenant_id),
            INDEX idx_user_id (user_id),
            INDEX idx_created_at (created_at)
        )
    ");
    
    // Create auth_tokens table with tenant support
    $db->execute("
        CREATE TABLE IF NOT EXISTS auth_tokens (
            id INT AUTO_INCREMENT PRIMARY KEY,
            token_hash VARCHAR(255) NOT NULL,
            user_id INT NOT NULL,
            tenant_id INT,
            expires_at TIMESTAMP NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            INDEX idx_token_hash (token_hash),
            INDEX idx_expires_at (expires_at),
            INDEX idx_user_id (user_id),
            INDEX idx_tenant_id (tenant_id)
        )
    ");
    
    // Create tenant_invitations table
    $db->execute("
        CREATE TABLE IF NOT EXISTS tenant_invitations (
            id INT AUTO_INCREMENT PRIMARY KEY,
            tenant_id INT NOT NULL,
            email VARCHAR(100) NOT NULL,
            role ENUM('tenant_admin', 'admin', 'user') DEFAULT 'user',
            token VARCHAR(255) NOT NULL,
            expires_at TIMESTAMP NOT NULL,
            used_at TIMESTAMP NULL,
            created_by INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (tenant_id) REFERENCES tenants(id) ON DELETE CASCADE,
            FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE,
            INDEX idx_token (token),
            INDEX idx_expires_at (expires_at),
            INDEX idx_tenant_id (tenant_id)
        )
    ");
    
    // Create default tenants and super admin
    $tenantCount = $db->fetch("SELECT COUNT(*) as count FROM tenants")['count'];
    if ($tenantCount == 0) {
        // Create default tenant
        $db->execute("
            INSERT INTO tenants (name, subdomain, status, settings, branding, plan, max_users, max_pages) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ", [
            'WWS-Strube Demo',
            'demo',
            'active',
            json_encode(['timezone' => 'Europe/Berlin', 'language' => 'de']),
            json_encode(['primary_color' => '#3b82f6', 'logo_url' => '', 'company_name' => 'WWS-Strube']),
            'pro',
            50,
            100
        ]);
        
        $defaultTenantId = $db->lastInsertId();
        
        // Create super admin (no tenant)
        $superAdminPassword = password_hash('superadmin123', PASSWORD_DEFAULT);
        $db->execute("
            INSERT INTO users (tenant_id, username, email, password_hash, role) 
            VALUES (NULL, 'superadmin', 'superadmin@system.local', ?, 'super_admin')
        ", [$superAdminPassword]);
        
        // Create default tenant admin
        $defaultPassword = password_hash('admin123', PASSWORD_DEFAULT);
        $db->execute("
            INSERT INTO users (tenant_id, username, email, password_hash, role) 
            VALUES (?, 'admin', 'admin@wws-strube.de', ?, 'tenant_admin')
        ", [$defaultTenantId, $defaultPassword]);
    }
}

// Auto-setup database on first run
setupDatabase();
?>
