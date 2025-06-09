<?php
class UploadController {
    private $db;
    private $uploadDir;
    private $allowedTypes;
    private $maxFileSize;
    
    public function __construct() {
        $this->db = Database::getInstance();
        $this->uploadDir = realpath(dirname(__FILE__) . '/../../uploads') . '/';
        $this->allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        $this->maxFileSize = 5 * 1024 * 1024; // 5MB
        
        // Create upload directory if it doesn't exist
        if (!is_dir($this->uploadDir)) {
            mkdir($this->uploadDir, 0755, true);
        }
    }
    
    public function upload() {
        $user = getCurrentUser();
        
        if (!isset($_FILES['file'])) {
            jsonResponse(['error' => 'No file uploaded'], 400);
        }
        
        $file = $_FILES['file'];
        
        // Check for upload errors
        if ($file['error'] !== UPLOAD_ERR_OK) {
            jsonResponse(['error' => 'File upload error'], 400);
        }
        
        // Check file size
        if ($file['size'] > $this->maxFileSize) {
            jsonResponse(['error' => 'File too large. Maximum size is 5MB'], 400);
        }
        
        // Check file type
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeType = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!in_array($mimeType, $this->allowedTypes)) {
            jsonResponse(['error' => 'Invalid file type. Only images are allowed'], 400);
        }
        
        // Generate unique filename
        $extension = pathinfo($file['name'], PATHINFO_EXTENSION);
        $filename = uniqid() . '_' . time() . '.' . $extension;
        $filepath = $this->uploadDir . $filename;
        
        // Move uploaded file
        if (!move_uploaded_file($file['tmp_name'], $filepath)) {
            jsonResponse(['error' => 'Failed to save file'], 500);
        }
        
        // Save file info to database
        $url = '/uploads/' . $filename;
        
        $this->db->execute(
            "INSERT INTO uploads (filename, original_name, file_size, mime_type, url, user_id) VALUES (?, ?, ?, ?, ?, ?)",
            [$filename, $file['name'], $file['size'], $mimeType, $url, $user['id']]
        );
        
        jsonResponse([
            'url' => $url,
            'filename' => $filename,
            'original_name' => $file['name'],
            'size' => $file['size'],
            'type' => $mimeType
        ]);
    }
    
    public function gallery() {
        $user = getCurrentUser();
        
        // Get all uploaded files
        $files = $this->db->fetchAll("
            SELECT filename, original_name, file_size, mime_type, url, created_at 
            FROM uploads 
            ORDER BY created_at DESC
        ");
        
        // Add file exists check and remove non-existent files
        $validFiles = [];
        foreach ($files as $file) {
            $filepath = $this->uploadDir . $file['filename'];
            if (file_exists($filepath)) {
                $validFiles[] = [
                    'name' => $file['filename'],
                    'original_name' => $file['original_name'],
                    'url' => $file['url'],
                    'size' => $file['file_size'],
                    'type' => $file['mime_type'],
                    'created_at' => $file['created_at']
                ];
            } else {
                // Remove from database if file doesn't exist
                $this->db->execute("DELETE FROM uploads WHERE filename = ?", [$file['filename']]);
            }
        }
        
        jsonResponse(['files' => $validFiles]);
    }
    
    public function delete() {
        $user = getCurrentUser();
        $data = getRequestData();
        
        if (!isset($data['filename'])) {
            jsonResponse(['error' => 'Filename required'], 400);
        }
        
        $filename = $data['filename'];
        
        // Check if file exists in database
        $file = $this->db->fetch(
            "SELECT id, user_id FROM uploads WHERE filename = ?",
            [$filename]
        );
        
        if (!$file) {
            jsonResponse(['error' => 'File not found'], 404);
        }
        
        // Check permissions (admin can delete any file, users only their own)
        if ($user['role'] !== 'admin' && $file['user_id'] != $user['id']) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }
        
        // Delete physical file
        $filepath = $this->uploadDir . $filename;
        if (file_exists($filepath)) {
            unlink($filepath);
        }
        
        // Delete from database
        $this->db->execute("DELETE FROM uploads WHERE filename = ?", [$filename]);
        
        jsonResponse(['message' => 'File deleted successfully']);
    }
}
?>
