<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Include required files
require_once 'config/database.php';
require_once 'middleware/auth.php';
require_once 'controllers/AuthController.php';
require_once 'controllers/PagesController.php';
require_once 'controllers/UsersController.php';
require_once 'controllers/UploadController.php';
require_once 'controllers/SubmissionController.php';

// Get the request URI and method
$request_uri = $_SERVER['REQUEST_URI'];
$request_method = $_SERVER['REQUEST_METHOD'];

// Remove the base path and query string
$path = parse_url($request_uri, PHP_URL_PATH);
$path = str_replace('/api', '', $path);

// Route the request
try {
    switch (true) {
        // Authentication routes
        case $path === '/auth/login' && $request_method === 'POST':
            $controller = new AuthController();
            $controller->login();
            break;
            
        case $path === '/auth/logout' && $request_method === 'POST':
            $controller = new AuthController();
            $controller->logout();
            break;
            
        case $path === '/auth/me' && $request_method === 'GET':
            requireAuth();
            $controller = new AuthController();
            $controller->me();
            break;

        // Pages routes
        case $path === '/pages' && $request_method === 'GET':
            requireAuth();
            $controller = new PagesController();
            $controller->index();
            break;
            
        case preg_match('/^\/pages\/(\d+)$/', $path, $matches) && $request_method === 'GET':
            requireAuth();
            $controller = new PagesController();
            $controller->show($matches[1]);
            break;
            
        case preg_match('/^\/pages\/slug\/(.+)$/', $path, $matches) && $request_method === 'GET':
            $controller = new PagesController();
            $controller->showBySlug($matches[1]);
            break;
            
        case $path === '/pages' && $request_method === 'POST':
            requireAuth();
            $controller = new PagesController();
            $controller->create();
            break;
            
        case preg_match('/^\/pages\/(\d+)$/', $path, $matches) && $request_method === 'PUT':
            requireAuth();
            $controller = new PagesController();
            $controller->update($matches[1]);
            break;
            
        case preg_match('/^\/pages\/(\d+)$/', $path, $matches) && $request_method === 'DELETE':
            requireAuth();
            $controller = new PagesController();
            $controller->delete($matches[1]);
            break;

        // Users routes
        case $path === '/users' && $request_method === 'GET':
            requireAuth('admin');
            $controller = new UsersController();
            $controller->index();
            break;
            
        case $path === '/users' && $request_method === 'POST':
            requireAuth('admin');
            $controller = new UsersController();
            $controller->create();
            break;
            
        case preg_match('/^\/users\/(\d+)$/', $path, $matches) && $request_method === 'PUT':
            requireAuth('admin');
            $controller = new UsersController();
            $controller->update($matches[1]);
            break;
            
        case preg_match('/^\/users\/(\d+)$/', $path, $matches) && $request_method === 'DELETE':
            requireAuth('admin');
            $controller = new UsersController();
            $controller->delete($matches[1]);
            break;

        // Upload routes
        case $path === '/upload' && $request_method === 'POST':
            requireAuth();
            $controller = new UploadController();
            $controller->upload();
            break;
            
        case $path === '/gallery' && $request_method === 'GET':
            requireAuth();
            $controller = new UploadController();
            $controller->gallery();
            break;

        // Form submission routes
        case $path === '/submit' && $request_method === 'POST':
            $controller = new SubmissionController();
            $controller->submit();
            break;
            
        case $path === '/submissions' && $request_method === 'GET':
            requireAuth();
            $controller = new SubmissionController();
            $controller->index();
            break;

        default:
            http_response_code(404);
            echo json_encode(['error' => 'Endpoint not found']);
            break;
    }
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(['error' => $e->getMessage()]);
}
?>
