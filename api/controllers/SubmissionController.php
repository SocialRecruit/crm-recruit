<?php
class SubmissionController {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    public function submit() {
        $data = getRequestData();
        validateRequired($data, ['page_id', 'data']);
        
        // Verify that the page exists and is published
        $page = $this->db->fetch(
            "SELECT id, title FROM landing_pages WHERE id = ? AND status = 'published'",
            [$data['page_id']]
        );
        
        if (!$page) {
            jsonResponse(['error' => 'Page not found or not published'], 404);
        }
        
        // Get client information
        $ipAddress = $_SERVER['HTTP_X_FORWARDED_FOR'] ?? $_SERVER['REMOTE_ADDR'] ?? 'unknown';
        $userAgent = $_SERVER['HTTP_USER_AGENT'] ?? 'unknown';
        
        // Sanitize and validate form data
        $formData = $this->sanitizeFormData($data['data']);
        
        // Save form submission
        $this->db->execute(
            "INSERT INTO form_submissions (page_id, data, ip_address, user_agent) VALUES (?, ?, ?, ?)",
            [$data['page_id'], json_encode($formData), $ipAddress, $userAgent]
        );
        
        $submissionId = $this->db->lastInsertId();
        
        // Optional: Send notification email (implement as needed)
        $this->sendNotificationEmail($page, $formData, $submissionId);
        
        jsonResponse([
            'message' => 'Form submitted successfully',
            'submission_id' => $submissionId
        ], 201);
    }
    
    public function index() {
        $user = getCurrentUser();
        $pageId = $_GET['page_id'] ?? null;
        
        $query = "
            SELECT s.*, p.title as page_title, p.slug as page_slug 
            FROM form_submissions s 
            JOIN landing_pages p ON s.page_id = p.id
        ";
        $params = [];
        
        // Filter by page if specified
        if ($pageId) {
            $query .= " WHERE s.page_id = ?";
            $params[] = $pageId;
        }
        
        // Non-admin users can only see submissions for their own pages
        if ($user['role'] !== 'admin') {
            $query .= ($pageId ? " AND" : " WHERE") . " p.user_id = ?";
            $params[] = $user['id'];
        }
        
        $query .= " ORDER BY s.created_at DESC";
        
        $submissions = $this->db->fetchAll($query, $params);
        
        // Decode JSON data
        foreach ($submissions as &$submission) {
            $submission['data'] = json_decode($submission['data'], true);
        }
        
        jsonResponse($submissions);
    }
    
    public function show($id) {
        $user = getCurrentUser();
        
        $submission = $this->db->fetch("
            SELECT s.*, p.title as page_title, p.slug as page_slug, p.user_id as page_owner_id
            FROM form_submissions s 
            JOIN landing_pages p ON s.page_id = p.id 
            WHERE s.id = ?
        ", [$id]);
        
        if (!$submission) {
            jsonResponse(['error' => 'Submission not found'], 404);
        }
        
        // Check permissions
        if ($user['role'] !== 'admin' && $submission['page_owner_id'] != $user['id']) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }
        
        $submission['data'] = json_decode($submission['data'], true);
        
        jsonResponse($submission);
    }
    
    public function delete($id) {
        $user = getCurrentUser();
        
        $submission = $this->db->fetch("
            SELECT s.id, p.user_id as page_owner_id 
            FROM form_submissions s 
            JOIN landing_pages p ON s.page_id = p.id 
            WHERE s.id = ?
        ", [$id]);
        
        if (!$submission) {
            jsonResponse(['error' => 'Submission not found'], 404);
        }
        
        // Check permissions
        if ($user['role'] !== 'admin' && $submission['page_owner_id'] != $user['id']) {
            jsonResponse(['error' => 'Forbidden'], 403);
        }
        
        $this->db->execute("DELETE FROM form_submissions WHERE id = ?", [$id]);
        
        jsonResponse(['message' => 'Submission deleted successfully']);
    }
    
    private function sanitizeFormData($data) {
        $sanitized = [];
        
        foreach ($data as $key => $value) {
            // Remove any non-printable characters and limit length
            if (is_string($value)) {
                $value = preg_replace('/[\x00-\x1F\x7F]/', '', $value);
                $value = substr($value, 0, 1000); // Limit to 1000 characters
            }
            
            $sanitized[htmlspecialchars($key)] = htmlspecialchars($value);
        }
        
        return $sanitized;
    }
    
    private function sendNotificationEmail($page, $formData, $submissionId) {
        // This is a placeholder for email notification functionality
        // You can implement this using PHPMailer or similar library
        
        $subject = "Neue Bewerbung für: " . $page['title'];
        $message = "Eine neue Bewerbung wurde eingereicht.\n\n";
        $message .= "Seite: " . $page['title'] . "\n";
        $message .= "Submission ID: " . $submissionId . "\n\n";
        $message .= "Daten:\n";
        
        foreach ($formData as $key => $value) {
            $message .= ucfirst($key) . ": " . $value . "\n";
        }
        
        // Uncomment and configure to send actual emails
        // mail('admin@wws-strube.de', $subject, $message);
        
        // Log for debugging (remove in production)
        error_log("Form submission: " . json_encode([
            'page' => $page['title'],
            'submission_id' => $submissionId,
            'data' => $formData
        ]));
    }
}
?>
