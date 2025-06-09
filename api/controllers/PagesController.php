<?php
class PagesController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function index() {
        $user = getCurrentUser();
        
        // Admin can see all pages, users only see their own
        if ($user['role'] === 'admin') {
            $pages = $this->db->fetchAll("
                SELECT p.*, u.username as author 
                FROM landing_pages p 
                LEFT JOIN users u ON p.user_id = u.id 
                ORDER BY p.updated_at DESC
            ");
        } else {
            $pages = $this->db->fetchAll("
                SELECT p.*, u.username as author 
                FROM landing_pages p 
                LEFT JOIN users u ON p.user_id = u.id 
                WHERE p.user_id = ? 
                ORDER BY p.updated_at DESC
            ", [$user['id']]);
        }
        
        // Decode JSON content_blocks
        foreach ($pages as &$page) {
            $page['content_blocks'] = json_decode($page['content_blocks'] ?: '[]', true);
        }
        
        jsonResponse($pages);
    }
    
    public function show($id) {
        $user = getCurrentUser();
        
        $page = $this->db->fetch("
            SELECT p.*, u.username as author 
            FROM landing_pages p 
            LEFT JOIN users u ON p.user_id = u.id 
            WHERE p.id = ?
        ", [$id]);
        
        if (!$page) {
            jsonResponse(['error' => 'Page not found'], 404);
        }
        
        // Check permissions
        if ($user['role'] !== 'admin' && $page['user_id'] != $user['id']) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }
        
        $page['content_blocks'] = json_decode($page['content_blocks'] ?: '[]', true);
        
        jsonResponse($page);
    }
    
    public function showBySlug($slug) {
        $page = $this->db->fetch("
            SELECT p.*, u.username as author 
            FROM landing_pages p 
            LEFT JOIN users u ON p.user_id = u.id 
            WHERE p.slug = ? AND p.status = 'published'
        ", [$slug]);
        
        if (!$page) {
            jsonResponse(['error' => 'Page not found'], 404);
        }
        
        $page['content_blocks'] = json_decode($page['content_blocks'] ?: '[]', true);
        
        jsonResponse($page);
    }
    
    public function create() {
        $user = getCurrentUser();
        $data = getRequestData();
        
        validateRequired($data, ['title']);
        
        // Generate slug if not provided
        if (!isset($data['slug']) || empty($data['slug'])) {
            $data['slug'] = generateSlug($data['title']);
        } else {
            $data['slug'] = generateSlug($data['slug']);
        }
        
        // Ensure unique slug
        $data['slug'] = ensureUniqueSlug($data['slug'], 'landing_pages');
        
        // Prepare content blocks
        $contentBlocks = json_encode($data['content_blocks'] ?? []);
        
        // Insert page
        $this->db->execute("
            INSERT INTO landing_pages (
                title, slug, header_image, header_text, header_overlay_color, 
                header_overlay_opacity, header_height, content_blocks, status, user_id
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ", [
            $data['title'],
            $data['slug'],
            $data['header_image'] ?? null,
            $data['header_text'] ?? null,
            $data['header_overlay_color'] ?? '#000000',
            $data['header_overlay_opacity'] ?? 0.5,
            $data['header_height'] ?? 400,
            $contentBlocks,
            $data['status'] ?? 'draft',
            $user['id']
        ]);
        
        $pageId = $this->db->lastInsertId();
        
        // Return created page
        $this->show($pageId);
    }
    
    public function update($id) {
        $user = getCurrentUser();
        $data = getRequestData();
        
        // Check if page exists and user has permission
        $page = $this->db->fetch("SELECT user_id FROM landing_pages WHERE id = ?", [$id]);
        
        if (!$page) {
            jsonResponse(['error' => 'Page not found'], 404);
        }
        
        if ($user['role'] !== 'admin' && $page['user_id'] != $user['id']) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }
        
        // Handle slug update
        if (isset($data['slug'])) {
            $data['slug'] = generateSlug($data['slug']);
            $data['slug'] = ensureUniqueSlug($data['slug'], 'landing_pages', $id);
        }
        
        // Build update query dynamically
        $updateFields = [];
        $updateValues = [];
        
        $allowedFields = [
            'title', 'slug', 'header_image', 'header_text', 'header_overlay_color',
            'header_overlay_opacity', 'header_height', 'status'
        ];
        
        foreach ($allowedFields as $field) {
            if (isset($data[$field])) {
                $updateFields[] = $field . ' = ?';
                $updateValues[] = $data[$field];
            }
        }
        
        if (isset($data['content_blocks'])) {
            $updateFields[] = 'content_blocks = ?';
            $updateValues[] = json_encode($data['content_blocks']);
        }
        
        if (!empty($updateFields)) {
            $updateValues[] = $id;
            
            $this->db->execute(
                "UPDATE landing_pages SET " . implode(', ', $updateFields) . " WHERE id = ?",
                $updateValues
            );
        }
        
        // Return updated page
        $this->show($id);
    }
    
    public function delete($id) {
        $user = getCurrentUser();
        
        // Check if page exists and user has permission
        $page = $this->db->fetch("SELECT user_id FROM landing_pages WHERE id = ?", [$id]);
        
        if (!$page) {
            jsonResponse(['error' => 'Page not found'], 404);
        }
        
        if ($user['role'] !== 'admin' && $page['user_id'] != $user['id']) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }
        
        $this->db->execute("DELETE FROM landing_pages WHERE id = ?", [$id]);
        
        jsonResponse(['message' => 'Page deleted successfully']);
    }
}
?>
