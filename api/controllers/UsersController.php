<?php
class UsersController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function index() {
        $users = $this->db->fetchAll("
            SELECT id, username, email, role, created_at, updated_at 
            FROM users 
            ORDER BY created_at DESC
        ");
        
        jsonResponse($users);
    }
    
    public function show($id) {
        $user = $this->db->fetch("
            SELECT id, username, email, role, created_at, updated_at 
            FROM users 
            WHERE id = ?
        ", [$id]);
        
        if (!$user) {
            jsonResponse(['error' => 'User not found'], 404);
        }
        
        jsonResponse($user);
    }
    
    public function create() {
        $data = getRequestData();
        validateRequired($data, ['username', 'email', 'password']);
        
        // Check if user already exists
        $existing = $this->db->fetch(
            "SELECT id FROM users WHERE username = ? OR email = ?",
            [$data['username'], $data['email']]
        );
        
        if ($existing) {
            jsonResponse(['error' => 'User with this username or email already exists'], 409);
        }
        
        // Validate role
        $role = $data['role'] ?? 'user';
        if (!in_array($role, ['admin', 'user'])) {
            jsonResponse(['error' => 'Invalid role'], 400);
        }
        
        // Create user
        $passwordHash = password_hash($data['password'], PASSWORD_DEFAULT);
        
        $this->db->execute(
            "INSERT INTO users (username, email, password_hash, role) VALUES (?, ?, ?, ?)",
            [$data['username'], $data['email'], $passwordHash, $role]
        );
        
        $userId = $this->db->lastInsertId();
        
        // Return created user
        $this->show($userId);
    }
    
    public function update($id) {
        $data = getRequestData();
        
        // Check if user exists
        $user = $this->db->fetch("SELECT id FROM users WHERE id = ?", [$id]);
        
        if (!$user) {
            jsonResponse(['error' => 'User not found'], 404);
        }
        
        // Build update query dynamically
        $updateFields = [];
        $updateValues = [];
        
        if (isset($data['username'])) {
            // Check if username is already taken by another user
            $existing = $this->db->fetch(
                "SELECT id FROM users WHERE username = ? AND id != ?",
                [$data['username'], $id]
            );
            
            if ($existing) {
                jsonResponse(['error' => 'Username already taken'], 409);
            }
            
            $updateFields[] = 'username = ?';
            $updateValues[] = $data['username'];
        }
        
        if (isset($data['email'])) {
            // Check if email is already taken by another user
            $existing = $this->db->fetch(
                "SELECT id FROM users WHERE email = ? AND id != ?",
                [$data['email'], $id]
            );
            
            if ($existing) {
                jsonResponse(['error' => 'Email already taken'], 409);
            }
            
            $updateFields[] = 'email = ?';
            $updateValues[] = $data['email'];
        }
        
        if (isset($data['role'])) {
            if (!in_array($data['role'], ['admin', 'user'])) {
                jsonResponse(['error' => 'Invalid role'], 400);
            }
            
            $updateFields[] = 'role = ?';
            $updateValues[] = $data['role'];
        }
        
        if (isset($data['password'])) {
            $updateFields[] = 'password_hash = ?';
            $updateValues[] = password_hash($data['password'], PASSWORD_DEFAULT);
        }
        
        if (!empty($updateFields)) {
            $updateValues[] = $id;
            
            $this->db->execute(
                "UPDATE users SET " . implode(', ', $updateFields) . " WHERE id = ?",
                $updateValues
            );
        }
        
        // Return updated user
        $this->show($id);
    }
    
    public function delete($id) {
        // Check if user exists
        $user = $this->db->fetch("SELECT id FROM users WHERE id = ?", [$id]);
        
        if (!$user) {
            jsonResponse(['error' => 'User not found'], 404);
        }
        
        // Prevent deleting the last admin
        $adminCount = $this->db->fetch("SELECT COUNT(*) as count FROM users WHERE role = 'admin'")['count'];
        $userRole = $this->db->fetch("SELECT role FROM users WHERE id = ?", [$id])['role'];
        
        if ($userRole === 'admin' && $adminCount <= 1) {
            jsonResponse(['error' => 'Cannot delete the last admin user'], 400);
        }
        
        $this->db->execute("DELETE FROM users WHERE id = ?", [$id]);
        
        jsonResponse(['message' => 'User deleted successfully']);
    }
}
?>
