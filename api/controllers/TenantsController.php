<?php
class TenantsController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function index() {
        requireSuperAdmin();
        
        $tenants = $this->db->fetchAll("
            SELECT t.*, 
                   COUNT(DISTINCT u.id) as user_count,
                   COUNT(DISTINCT p.id) as page_count,
                   COUNT(DISTINCT s.id) as submission_count
            FROM tenants t
            LEFT JOIN users u ON t.id = u.tenant_id
            LEFT JOIN landing_pages p ON t.id = p.tenant_id
            LEFT JOIN form_submissions s ON t.id = s.tenant_id
            GROUP BY t.id
            ORDER BY t.created_at DESC
        ");
        
        // Parse JSON fields
        foreach ($tenants as &$tenant) {
            $tenant['settings'] = json_decode($tenant['settings'] ?: '{}', true);
            $tenant['branding'] = json_decode($tenant['branding'] ?: '{}', true);
        }
        
        jsonResponse($tenants);
    }
    
    public function show($id) {
        requireSuperAdmin();
        
        $tenant = $this->db->fetch("
            SELECT t.*,
                   COUNT(DISTINCT u.id) as user_count,
                   COUNT(DISTINCT p.id) as page_count,
                   COUNT(DISTINCT s.id) as submission_count
            FROM tenants t
            LEFT JOIN users u ON t.id = u.tenant_id
            LEFT JOIN landing_pages p ON t.id = p.tenant_id
            LEFT JOIN form_submissions s ON t.id = s.tenant_id
            WHERE t.id = ?
            GROUP BY t.id
        ", [$id]);
        
        if (!$tenant) {
            jsonResponse(['error' => 'Tenant not found'], 404);
        }
        
        $tenant['settings'] = json_decode($tenant['settings'] ?: '{}', true);
        $tenant['branding'] = json_decode($tenant['branding'] ?: '{}', true);
        
        // Get recent activity
        $tenant['recent_users'] = $this->db->fetchAll("
            SELECT username, email, role, created_at, last_login
            FROM users 
            WHERE tenant_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5
        ", [$id]);
        
        $tenant['recent_pages'] = $this->db->fetchAll("
            SELECT title, slug, status, created_at
            FROM landing_pages 
            WHERE tenant_id = ? 
            ORDER BY created_at DESC 
            LIMIT 5
        ", [$id]);
        
        jsonResponse($tenant);
    }
    
    public function create() {
        requireSuperAdmin();
        $data = getRequestData();
        
        validateRequired($data, ['name', 'subdomain']);
        
        // Validate subdomain format
        if (!preg_match('/^[a-z0-9-]+$/', $data['subdomain'])) {
            jsonResponse(['error' => 'Invalid subdomain format. Only lowercase letters, numbers, and hyphens allowed.'], 400);
        }
        
        // Check if subdomain is already taken
        $existing = $this->db->fetch("SELECT id FROM tenants WHERE subdomain = ?", [$data['subdomain']]);
        if ($existing) {
            jsonResponse(['error' => 'Subdomain already exists'], 409);
        }
        
        // Set default values
        $settings = $data['settings'] ?? [
            'timezone' => 'Europe/Berlin',
            'language' => 'de',
            'email_notifications' => true
        ];
        
        $branding = $data['branding'] ?? [
            'primary_color' => '#3b82f6',
            'logo_url' => '',
            'company_name' => $data['name']
        ];
        
        $plan = $data['plan'] ?? 'free';
        $maxUsers = $this->getPlanLimits($plan)['users'];
        $maxPages = $this->getPlanLimits($plan)['pages'];
        
        // Create tenant
        $this->db->execute("
            INSERT INTO tenants (name, subdomain, domain, status, settings, branding, plan, max_users, max_pages) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        ", [
            $data['name'],
            $data['subdomain'],
            $data['domain'] ?? null,
            $data['status'] ?? 'active',
            json_encode($settings),
            json_encode($branding),
            $plan,
            $maxUsers,
            $maxPages
        ]);
        
        $tenantId = $this->db->lastInsertId();
        
        // Create default tenant admin if provided
        if (isset($data['admin_email']) && isset($data['admin_password'])) {
            $adminPassword = password_hash($data['admin_password'], PASSWORD_DEFAULT);
            $adminUsername = $data['admin_username'] ?? 'admin';
            
            $this->db->execute("
                INSERT INTO users (tenant_id, username, email, password_hash, role) 
                VALUES (?, ?, ?, ?, 'tenant_admin')
            ", [$tenantId, $adminUsername, $data['admin_email'], $adminPassword]);
        }
        
        // Return created tenant
        $this->show($tenantId);
    }
    
    public function update($id) {
        requireSuperAdmin();
        $data = getRequestData();
        
        $tenant = $this->db->fetch("SELECT id FROM tenants WHERE id = ?", [$id]);
        if (!$tenant) {
            jsonResponse(['error' => 'Tenant not found'], 404);
        }
        
        // Build update query
        $updateFields = [];
        $updateValues = [];
        
        $allowedFields = ['name', 'subdomain', 'domain', 'status', 'plan', 'max_users', 'max_pages'];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                if ($field === 'subdomain') {
                    // Validate subdomain format
                    if (!preg_match('/^[a-z0-9-]+$/', $data[$field])) {
                        jsonResponse(['error' => 'Invalid subdomain format'], 400);
                    }
                    
                    // Check if subdomain is already taken by another tenant
                    $existing = $this->db->fetch(
                        "SELECT id FROM tenants WHERE subdomain = ? AND id != ?", 
                        [$data[$field], $id]
                    );
                    if ($existing) {
                        jsonResponse(['error' => 'Subdomain already exists'], 409);
                    }
                }
                
                $updateFields[] = $field . ' = ?';
                $updateValues[] = $data[$field];
            }
        }
        
        if (isset($data['settings'])) {
            $updateFields[] = 'settings = ?';
            $updateValues[] = json_encode($data['settings']);
        }
        
        if (isset($data['branding'])) {
            $updateFields[] = 'branding = ?';
            $updateValues[] = json_encode($data['branding']);
        }
        
        if (!empty($updateFields)) {
            $updateValues[] = $id;
            
            $this->db->execute(
                "UPDATE tenants SET " . implode(', ', $updateFields) . " WHERE id = ?",
                $updateValues
            );
        }
        
        $this->show($id);
    }
    
    public function delete($id) {
        requireSuperAdmin();
        
        $tenant = $this->db->fetch("SELECT name FROM tenants WHERE id = ?", [$id]);
        if (!$tenant) {
            jsonResponse(['error' => 'Tenant not found'], 404);
        }
        
        // Check if tenant has any data
        $userCount = $this->db->fetch("SELECT COUNT(*) as count FROM users WHERE tenant_id = ?", [$id])['count'];
        $pageCount = $this->db->fetch("SELECT COUNT(*) as count FROM landing_pages WHERE tenant_id = ?", [$id])['count'];
        
        if ($userCount > 0 || $pageCount > 0) {
            jsonResponse(['error' => 'Cannot delete tenant with existing users or pages. Please migrate or delete data first.'], 400);
        }
        
        $this->db->execute("DELETE FROM tenants WHERE id = ?", [$id]);
        
        jsonResponse(['message' => 'Tenant deleted successfully']);
    }
    
    public function impersonate($id) {
        $user = requireSuperAdmin();
        
        $tenant = $this->db->fetch("SELECT * FROM tenants WHERE id = ? AND status = 'active'", [$id]);
        if (!$tenant) {
            jsonResponse(['error' => 'Tenant not found or inactive'], 404);
        }
        
        // Create impersonation token
        $token = JWTHelper::encode([
            'user_id' => $user['id'],
            'impersonating_tenant' => $id,
            'original_role' => $user['role'],
            'impersonation' => true
        ]);
        
        jsonResponse([
            'token' => $token,
            'tenant' => [
                'id' => $tenant['id'],
                'name' => $tenant['name'],
                'subdomain' => $tenant['subdomain'],
                'settings' => json_decode($tenant['settings'] ?: '{}', true),
                'branding' => json_decode($tenant['branding'] ?: '{}', true)
            ],
            'message' => 'Impersonation token created'
        ]);
    }
    
    public function stopImpersonation() {
        $user = getCurrentUser();
        
        if (!isset($user['impersonation']) || !$user['impersonation']) {
            jsonResponse(['error' => 'Not currently impersonating'], 400);
        }
        
        // Create regular super admin token
        $token = JWTHelper::encode([
            'user_id' => $user['id'],
            'role' => $user['original_role']
        ]);
        
        jsonResponse([
            'token' => $token,
            'message' => 'Impersonation stopped'
        ]);
    }
    
    public function getStats() {
        requireSuperAdmin();
        
        $stats = [
            'total_tenants' => $this->db->fetch("SELECT COUNT(*) as count FROM tenants")['count'],
            'active_tenants' => $this->db->fetch("SELECT COUNT(*) as count FROM tenants WHERE status = 'active'")['count'],
            'total_users' => $this->db->fetch("SELECT COUNT(*) as count FROM users WHERE role != 'super_admin'")['count'],
            'total_pages' => $this->db->fetch("SELECT COUNT(*) as count FROM landing_pages")['count'],
            'total_submissions' => $this->db->fetch("SELECT COUNT(*) as count FROM form_submissions")['count']
        ];
        
        $planStats = $this->db->fetchAll("
            SELECT plan, COUNT(*) as count 
            FROM tenants 
            GROUP BY plan
        ");
        
        $stats['plans'] = [];
        foreach ($planStats as $planStat) {
            $stats['plans'][$planStat['plan']] = $planStat['count'];
        }
        
        $recentTenants = $this->db->fetchAll("
            SELECT id, name, subdomain, status, created_at
            FROM tenants 
            ORDER BY created_at DESC 
            LIMIT 5
        ");
        
        $stats['recent_tenants'] = $recentTenants;
        
        jsonResponse($stats);
    }
    
    private function getPlanLimits($plan) {
        $limits = [
            'free' => ['users' => 5, 'pages' => 10],
            'basic' => ['users' => 25, 'pages' => 50],
            'pro' => ['users' => 100, 'pages' => 200],
            'enterprise' => ['users' => 999, 'pages' => 999]
        ];
        
        return $limits[$plan] ?? $limits['free'];
    }
}
?>
