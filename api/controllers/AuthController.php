<?php
class AuthController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function login() {
        $data = getRequestData();
        validateRequired($data, ['username', 'password']);
        
        $tenantId = $data['tenant_id'] ?? null;
        $subdomain = $data['subdomain'] ?? null;
        
        // Build user query based on login type
        $userQuery = "
            SELECT u.*, t.name as tenant_name, t.subdomain, t.status as tenant_status, 
                   t.settings as tenant_settings, t.branding as tenant_branding
            FROM users u 
            LEFT JOIN tenants t ON u.tenant_id = t.id 
            WHERE (u.username = ? OR u.email = ?)
        ";
        $userParams = [$data['username'], $data['username']];
        
        // Super admin login (no tenant)
        if ($data['username'] === 'superadmin') {
            $userQuery .= " AND u.role = 'super_admin' AND u.tenant_id IS NULL";
        } 
        // Tenant-specific login
        else {
            if ($tenantId) {
                $userQuery .= " AND u.tenant_id = ?";
                $userParams[] = $tenantId;
            } elseif ($subdomain) {
                $userQuery .= " AND t.subdomain = ?";
                $userParams[] = $subdomain;
            } else {
                // Default to demo tenant for backwards compatibility
                $userQuery .= " AND t.subdomain = 'demo'";
            }
            
            $userQuery .= " AND u.is_active = TRUE AND (t.status = 'active' OR u.role = 'super_admin')";
        }
        
        $user = $this->db->fetch($userQuery, $userParams);
        
        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            jsonResponse(['error' => 'Invalid credentials'], 401);
        }
        
        // Update last login
        $this->db->execute(
            "UPDATE users SET last_login = NOW() WHERE id = ?",
            [$user['id']]
        );
        
        // Generate JWT token
        $tokenPayload = [
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'tenant_id' => $user['tenant_id']
        ];
        
        $token = JWTHelper::encode($tokenPayload);
        
        // Store token in database for tracking
        $this->db->execute(
            "INSERT INTO auth_tokens (token_hash, user_id, tenant_id, expires_at) VALUES (?, ?, ?, ?)",
            [hash('sha256', $token), $user['id'], $user['tenant_id'], date('Y-m-d H:i:s', time() + 86400)]
        );
        
        // Prepare user response
        $userResponse = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'tenant_id' => $user['tenant_id'],
            'created_at' => $user['created_at']
        ];
        
        $response = [
            'token' => $token,
            'user' => $userResponse
        ];
        
        // Add tenant info for non-super-admins
        if ($user['tenant_id']) {
            $response['tenant'] = [
                'id' => $user['tenant_id'],
                'name' => $user['tenant_name'],
                'subdomain' => $user['subdomain'],
                'settings' => json_decode($user['tenant_settings'] ?: '{}', true),
                'branding' => json_decode($user['tenant_branding'] ?: '{}', true)
            ];
        }
        
        jsonResponse($response);
    }
    
    public function getTenants() {
        // Public endpoint to get available tenants for login
        $tenants = $this->db->fetchAll("
            SELECT id, name, subdomain, branding 
            FROM tenants 
            WHERE status = 'active' 
            ORDER BY name
        ");
        
        foreach ($tenants as &$tenant) {
            $tenant['branding'] = json_decode($tenant['branding'] ?: '{}', true);
        }
        
        jsonResponse($tenants);
    }
    
    public function switchTenant() {
        $user = requireAuth();
        $data = getRequestData();
        validateRequired($data, ['tenant_id']);
        
        // Only super admins can switch tenants
        if ($user['role'] !== 'super_admin') {
            jsonResponse(['error' => 'Only super admins can switch tenants'], 403);
        }
        
        $tenant = $this->db->fetch(
            "SELECT * FROM tenants WHERE id = ? AND status = 'active'",
            [$data['tenant_id']]
        );
        
        if (!$tenant) {
            jsonResponse(['error' => 'Tenant not found or inactive'], 404);
        }
        
        // Create new token for the selected tenant
        $token = JWTHelper::encode([
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role'],
            'tenant_id' => $tenant['id'],
            'impersonating_tenant' => $tenant['id']
        ]);
        
        jsonResponse([
            'token' => $token,
            'tenant' => [
                'id' => $tenant['id'],
                'name' => $tenant['name'],
                'subdomain' => $tenant['subdomain'],
                'settings' => json_decode($tenant['settings'] ?: '{}', true),
                'branding' => json_decode($tenant['branding'] ?: '{}', true)
            ]
        ]);
    }
    
    public function logout() {
        $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
        
        if (preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
            $token = $matches[1];
            $tokenHash = hash('sha256', $token);
            
            // Remove token from database
            $this->db->execute(
                "DELETE FROM auth_tokens WHERE token_hash = ?",
                [$tokenHash]
            );
        }
        
        jsonResponse(['message' => 'Logged out successfully']);
    }
    
    public function me() {
        $user = getCurrentUser();
        
        $response = [
            'id' => $user['id'],
            'username' => $user['username'],
            'email' => $user['email'],
            'role' => $user['role'],
            'tenant_id' => $user['tenant_id'],
            'created_at' => $user['created_at'],
            'last_login' => $user['last_login']
        ];
        
        if ($user['tenant_id']) {
            $response['tenant'] = [
                'id' => $user['tenant_id'],
                'name' => $user['tenant_name'],
                'subdomain' => $user['subdomain'],
                'settings' => $user['tenant_settings'],
                'branding' => $user['tenant_branding']
            ];
        }
        
        jsonResponse($response);
    }
    
    public function register() {
        $data = getRequestData();
        validateRequired($data, ['username', 'email', 'password', 'tenant_id']);
        
        // Check if registration is allowed for this tenant
        $tenant = $this->db->fetch(
            "SELECT * FROM tenants WHERE id = ? AND status = 'active'",
            [$data['tenant_id']]
        );
        
        if (!$tenant) {
            jsonResponse(['error' => 'Tenant not found or inactive'], 404);
        }
        
        // Check user limits
        $userCount = $this->db->fetch(
            "SELECT COUNT(*) as count FROM users WHERE tenant_id = ?",
            [$data['tenant_id']]
        )['count'];
        
        if ($userCount >= $tenant['max_users']) {
            jsonResponse(['error' => 'User limit reached for this tenant'], 400);
        }
        
        // Check if user already exists in this tenant
        $existing = $this->db->fetch(
            "SELECT id FROM users WHERE (username = ? OR email = ?) AND tenant_id = ?",
            [$data['username'], $data['email'], $data['tenant_id']]
        );
        
        if ($existing) {
            jsonResponse(['error' => 'User already exists in this tenant'], 409);
        }
        
        // Create new user
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        $role = $data['role'] ?? 'user';
        
        // Validate role
        if (!in_array($role, ['user', 'admin'])) {
            $role = 'user';
        }
        
        $this->db->execute(
            "INSERT INTO users (tenant_id, username, email, password_hash, role) VALUES (?, ?, ?, ?, ?)",
            [$data['tenant_id'], $data['username'], $data['email'], $passwordHash, $role]
        );
        
        $userId = $this->db->lastInsertId();
        
        $user = $this->db->fetch(
            "SELECT u.*, t.name as tenant_name, t.subdomain 
             FROM users u 
             JOIN tenants t ON u.tenant_id = t.id 
             WHERE u.id = ?",
            [$userId]
        );
        
        unset($user['password_hash']);
        jsonResponse($user, 201);
    }
    
    public function inviteUser() {
        $user = requireAuth('tenant_admin');
        $data = getRequestData();
        validateRequired($data, ['email', 'role']);
        
        $tenantId = $data['tenant_id'] ?? $user['tenant_id'];
        
        // Only tenant admins can invite to their own tenant, super admins can invite to any
        if ($user['role'] !== 'super_admin' && $tenantId !== $user['tenant_id']) {
            jsonResponse(['error' => 'Can only invite users to your own tenant'], 403);
        }
        
        // Check if user already exists
        $existing = $this->db->fetch(
            "SELECT id FROM users WHERE email = ? AND tenant_id = ?",
            [$data['email'], $tenantId]
        );
        
        if ($existing) {
            jsonResponse(['error' => 'User already exists in this tenant'], 409);
        }
        
        // Create invitation
        $token = bin2hex(random_bytes(32));
        $expiresAt = date('Y-m-d H:i:s', time() + (7 * 24 * 60 * 60)); // 7 days
        
        $this->db->execute(
            "INSERT INTO tenant_invitations (tenant_id, email, role, token, expires_at, created_by) VALUES (?, ?, ?, ?, ?, ?)",
            [$tenantId, $data['email'], $data['role'], $token, $expiresAt, $user['id']]
        );
        
        // TODO: Send invitation email
        
        jsonResponse(['message' => 'Invitation sent', 'token' => $token]);
    }
}
?>
