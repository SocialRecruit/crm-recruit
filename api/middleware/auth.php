<?php
require_once 'config/database.php';

class JWTHelper {
    private static $secret = 'your-secret-key-change-this-in-production';
    
    public static function encode($payload, $expiry = 86400) {
        $header = json_encode(['typ' => 'JWT', 'alg' => 'HS256']);
        $payload['exp'] = time() + $expiry;
        $payload = json_encode($payload);
        
        $headerEncoded = self::base64UrlEncode($header);
        $payloadEncoded = self::base64UrlEncode($payload);
        
        $signature = hash_hmac('sha256', $headerEncoded . "." . $payloadEncoded, self::$secret, true);
        $signatureEncoded = self::base64UrlEncode($signature);
        
        return $headerEncoded . "." . $payloadEncoded . "." . $signatureEncoded;
    }
    
    public static function decode($jwt) {
        $parts = explode('.', $jwt);
        if (count($parts) !== 3) {
            return false;
        }
        
        $header = json_decode(self::base64UrlDecode($parts[0]), true);
        $payload = json_decode(self::base64UrlDecode($parts[1]), true);
        $signature = self::base64UrlDecode($parts[2]);
        
        $expectedSignature = hash_hmac('sha256', $parts[0] . "." . $parts[1], self::$secret, true);
        
        if (!hash_equals($signature, $expectedSignature)) {
            return false;
        }
        
        if (isset($payload['exp']) && $payload['exp'] < time()) {
            return false;
        }
        
        return $payload;
    }
    
    private static function base64UrlEncode($data) {
        return rtrim(strtr(base64_encode($data), '+/', '-_'), '=');
    }
    
    private static function base64UrlDecode($data) {
        return base64_decode(str_pad(strtr($data, '-_', '+/'), strlen($data) % 4, '=', STR_PAD_RIGHT));
    }
}

function getCurrentUser() {
    $authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    
    if (!preg_match('/Bearer\s+(.*)$/i', $authHeader, $matches)) {
        return null;
    }
    
    $token = $matches[1];
    $payload = JWTHelper::decode($token);
    
    if (!$payload) {
        return null;
    }
    
    $db = Database::getInstance();
    $user = $db->fetch("
        SELECT u.*, t.name as tenant_name, t.subdomain, t.status as tenant_status, t.settings as tenant_settings, t.branding as tenant_branding
        FROM users u 
        LEFT JOIN tenants t ON u.tenant_id = t.id 
        WHERE u.id = ?
    ", [$payload['user_id']]);
    
    if (!$user) {
        return null;
    }
    
    // Parse JSON fields
    if ($user['tenant_settings']) {
        $user['tenant_settings'] = json_decode($user['tenant_settings'], true);
    }
    if ($user['tenant_branding']) {
        $user['tenant_branding'] = json_decode($user['tenant_branding'], true);
    }
    
    return $user;
}

function getCurrentTenant() {
    $user = getCurrentUser();
    if (!$user || !$user['tenant_id']) {
        return null;
    }
    
    return [
        'id' => $user['tenant_id'],
        'name' => $user['tenant_name'],
        'subdomain' => $user['subdomain'],
        'status' => $user['tenant_status'],
        'settings' => $user['tenant_settings'],
        'branding' => $user['tenant_branding']
    ];
}

function requireAuth($requiredRole = null, $allowSuperAdmin = true) {
    $user = getCurrentUser();
    
    if (!$user) {
        http_response_code(401);
        echo json_encode(['error' => 'Unauthorized']);
        exit();
    }
    
    // Super admins can access everything if allowed
    if ($allowSuperAdmin && $user['role'] === 'super_admin') {
        return $user;
    }
    
    // Check if user's tenant is active (except for super admins)
    if ($user['role'] !== 'super_admin' && $user['tenant_status'] !== 'active') {
        http_response_code(403);
        echo json_encode(['error' => 'Tenant is not active']);
        exit();
    }
    
    if ($requiredRole) {
        $roleHierarchy = [
            'user' => 1,
            'admin' => 2,
            'tenant_admin' => 3,
            'super_admin' => 4
        ];
        
        $userLevel = $roleHierarchy[$user['role']] ?? 0;
        $requiredLevel = $roleHierarchy[$requiredRole] ?? 0;
        
        if ($userLevel < $requiredLevel) {
            http_response_code(403);
            echo json_encode(['error' => 'Insufficient permissions']);
            exit();
        }
    }
    
    return $user;
}

function requireSuperAdmin() {
    $user = getCurrentUser();
    
    if (!$user || $user['role'] !== 'super_admin') {
        http_response_code(403);
        echo json_encode(['error' => 'Super admin access required']);
        exit();
    }
    
    return $user;
}

function scopeToTenant($query, $params = [], $tenantIdField = 'tenant_id') {
    $user = getCurrentUser();
    
    // Super admins can access all data
    if ($user && $user['role'] === 'super_admin') {
        return [$query, $params];
    }
    
    // Regular users are scoped to their tenant
    if ($user && $user['tenant_id']) {
        if (stripos($query, 'WHERE') !== false) {
            $query .= " AND {$tenantIdField} = ?";
        } else {
            $query .= " WHERE {$tenantIdField} = ?";
        }
        $params[] = $user['tenant_id'];
    }
    
    return [$query, $params];
}

function impersonateTenant($tenantId) {
    $user = requireSuperAdmin();
    
    $db = Database::getInstance();
    $tenant = $db->fetch("SELECT * FROM tenants WHERE id = ?", [$tenantId]);
    
    if (!$tenant) {
        jsonResponse(['error' => 'Tenant not found'], 404);
    }
    
    // Create impersonation token
    $token = JWTHelper::encode([
        'user_id' => $user['id'],
        'impersonating_tenant' => $tenantId,
        'original_role' => $user['role'],
        'impersonation' => true
    ]);
    
    return $token;
}

function getRequestData() {
    $input = file_get_contents('php://input');
    return json_decode($input, true) ?: [];
}

function jsonResponse($data, $status = 200) {
    http_response_code($status);
    echo json_encode($data);
    exit();
}

function validateRequired($data, $fields) {
    $missing = [];
    foreach ($fields as $field) {
        if (!isset($data[$field]) || empty($data[$field])) {
            $missing[] = $field;
        }
    }
    
    if (!empty($missing)) {
        jsonResponse(['error' => 'Missing required fields: ' . implode(', ', $missing)], 400);
    }
}

function generateSlug($text) {
    // Convert to lowercase
    $slug = strtolower($text);
    
    // Handle German characters
    $slug = str_replace(['ä', 'ö', 'ü', 'ß'], ['ae', 'oe', 'ue', 'ss'], $slug);
    
    // Remove special characters
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    
    // Replace spaces and multiple hyphens with single hyphen
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    
    // Trim hyphens from start and end
    return trim($slug, '-');
}

function ensureUniqueSlug($slug, $table, $excludeId = null, $tenantId = null) {
    $db = Database::getInstance();
    $originalSlug = $slug;
    $counter = 1;
    
    while (true) {
        $query = "SELECT id FROM {$table} WHERE slug = ?";
        $params = [$slug];
        
        if ($tenantId) {
            $query .= " AND tenant_id = ?";
            $params[] = $tenantId;
        }
        
        if ($excludeId) {
            $query .= " AND id != ?";
            $params[] = $excludeId;
        }
        
        $existing = $db->fetch($query, $params);
        
        if (!$existing) {
            return $slug;
        }
        
        $slug = $originalSlug . '-' . $counter;
        $counter++;
    }
}

function getTenantFromRequest() {
    // Try to get tenant from subdomain
    $host = $_SERVER['HTTP_HOST'] ?? '';
    $parts = explode('.', $host);
    
    if (count($parts) > 2) {
        $subdomain = $parts[0];
        $db = Database::getInstance();
        $tenant = $db->fetch("SELECT * FROM tenants WHERE subdomain = ? AND status = 'active'", [$subdomain]);
        if ($tenant) {
            return $tenant;
        }
    }
    
    // Try to get tenant from URL parameter
    $tenantParam = $_GET['tenant'] ?? null;
    if ($tenantParam) {
        $db = Database::getInstance();
        $tenant = $db->fetch("SELECT * FROM tenants WHERE subdomain = ? AND status = 'active'", [$tenantParam]);
        if ($tenant) {
            return $tenant;
        }
    }
    
    return null;
}
?>
