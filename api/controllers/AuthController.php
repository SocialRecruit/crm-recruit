<?php
class AuthController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function login() {
        $data = getRequestData();
        validateRequired($data, ['username', 'password']);
        
        $user = $this->db->fetch(
            "SELECT id, username, email, password_hash, role FROM users WHERE username = ? OR email = ?",
            [$data['username'], $data['username']]
        );
        
        if (!$user || !password_verify($data['password'], $user['password_hash'])) {
            jsonResponse(['error' => 'Invalid credentials'], 401);
        }
        
        // Generate JWT token
        $token = JWTHelper::encode([
            'user_id' => $user['id'],
            'username' => $user['username'],
            'role' => $user['role']
        ]);
        
        // Store token in database for tracking
        $this->db->execute(
            "INSERT INTO auth_tokens (token_hash, user_id, expires_at) VALUES (?, ?, ?)",
            [hash('sha256', $token), $user['id'], date('Y-m-d H:i:s', time() + 86400)]
        );
        
        unset($user['password_hash']);
        $user['created_at'] = date('Y-m-d H:i:s');
        
        jsonResponse([
            'token' => $token,
            'user' => $user
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
        jsonResponse($user);
    }
    
    public function register() {
        $data = getRequestData();
        validateRequired($data, ['username', 'email', 'password']);
        
        // Check if user already exists
        $existing = $this->db->fetch(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [$data['username'], $data['email']]
        );
        
        if ($existing) {
            jsonResponse(['error' => 'User already exists'], 409);
        }
        
        // Create new user
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        $role = $data['role'] ?? 'user';
        
        $this->db->execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [$data['username'], $data['email'], $passwordHash, $role]
        );
        
        $userId = $this->db->lastInsertId();
        
        $user = $this->db->fetch(
            "SELECT id, username, email, role, created_at FROM users WHERE id = ?",
            [$userId]
        );
        
        jsonResponse($user, 201);
    }
}
?>
