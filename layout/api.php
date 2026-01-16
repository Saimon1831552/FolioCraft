<?php
require_once 'config.php';
session_start();

header('Content-Type: application/json');

function sendResponse($success, $data = [], $error = null) {
    echo json_encode(['success' => $success, 'data' => $data, 'error' => $error]);
    exit();
}

$input = json_decode(file_get_contents('php://input'), true);
$action = $_GET['action'] ?? '';

// --- AUTHENTICATION ---

if ($action === 'register') {
    $fullName = trim($input['full_name'] ?? '');
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    if (!$fullName || !$email || !$password) sendResponse(false, [], "All fields required.");
    
    $stmt = $pdo->prepare("SELECT id FROM users WHERE email = ?");
    $stmt->execute([$email]);
    if ($stmt->fetch()) sendResponse(false, [], "Email already registered.");

    $hash = password_hash($password, PASSWORD_BCRYPT);
    $initial = strtoupper(substr($fullName, 0, 1));

    try {
        $stmt = $pdo->prepare("INSERT INTO users (full_name, email, password_hash, role, avatar_initial) VALUES (?, ?, ?, 'user', ?)");
        $stmt->execute([$fullName, $email, $hash, $initial]);
        sendResponse(true, ['message' => 'Registration successful']);
    } catch (Exception $e) {
        sendResponse(false, [], "Database error.");
    }
}

if ($action === 'login') {
    $email = trim($input['email'] ?? '');
    $password = $input['password'] ?? '';

    $stmt = $pdo->prepare("SELECT * FROM users WHERE email = ?");
    $stmt->execute([$email]);
    $user = $stmt->fetch();

    if ($user && password_verify($password, $user['password_hash'])) {
        // CHECK SUSPENSION
        if (isset($user['is_suspended']) && $user['is_suspended'] == 1) {
            sendResponse(false, [], "Your account has been suspended. Contact admin.");
        }

        $_SESSION['user_id'] = $user['id'];
        $_SESSION['role'] = $user['role'];
        $_SESSION['full_name'] = $user['full_name'];
        $_SESSION['avatar_initial'] = $user['avatar_initial'];

        sendResponse(true, [
            'user' => [
                'id' => $user['id'],
                'full_name' => $user['full_name'],
                'email' => $user['email'],
                'role' => $user['role'],
                'avatar_initial' => $user['avatar_initial']
            ]
        ]);
    } else {
        sendResponse(false, [], "Invalid email or password.");
    }
}

if ($action === 'logout') {
    session_destroy();
    sendResponse(true, ['message' => 'Logged out']);
}

if ($action === 'check_session') {
    if (isset($_SESSION['user_id'])) {
        sendResponse(true, [
            'user' => [
                'id' => $_SESSION['user_id'],
                'full_name' => $_SESSION['full_name'],
                'role' => $_SESSION['role'],
                'avatar_initial' => $_SESSION['avatar_initial']
            ]
        ]);
    } else {
        sendResponse(false, [], 'Not logged in');
    }
}

// --- PROJECT MANAGEMENT ---

function requireAuth() {
    if (!isset($_SESSION['user_id'])) sendResponse(false, [], "Unauthorized");
}

if ($action === 'get_my_projects') {
    requireAuth();
    $stmt = $pdo->prepare("SELECT * FROM projects WHERE user_id = ? ORDER BY updated_at DESC");
    $stmt->execute([$_SESSION['user_id']]);
    $projects = $stmt->fetchAll();
    sendResponse(true, ['projects' => $projects]);
}

if ($action === 'get_project') {
    if (isset($_GET['id'])) {
        requireAuth();
        $stmt = $pdo->prepare("SELECT * FROM projects WHERE id = ? AND user_id = ?");
        $stmt->execute([$_GET['id'], $_SESSION['user_id']]);
        $project = $stmt->fetch();
        
        if ($project) {
            $project['content_state'] = json_decode($project['content_state']);
            sendResponse(true, ['project' => $project]);
        } else {
            sendResponse(false, [], "Project not found");
        }
    } else {
        sendResponse(false, [], "ID required");
    }
}

if ($action === 'save_project') {
    requireAuth();
    $userId = $_SESSION['user_id'];
    $projectId = $input['project_id'] ?? null;
    $title = $input['title'] ?? 'Untitled Template';
    $contentState = json_encode($input['content_state'] ?? []);
    
    $subdomain = strtolower(preg_replace('/[^a-zA-Z0-9]/', '', $title)) . '-' . rand(1000, 9999);

    if ($projectId) {
        $stmt = $pdo->prepare("UPDATE projects SET title = ?, content_state = ?, updated_at = NOW() WHERE id = ? AND user_id = ?");
        $stmt->execute([$title, $contentState, $projectId, $userId]);
        $newId = $projectId;
    } else {
        $stmt = $pdo->prepare("INSERT INTO projects (user_id, title, subdomain, content_state) VALUES (?, ?, ?, ?)");
        $stmt->execute([$userId, $title, $subdomain, $contentState]);
        $newId = $pdo->lastInsertId();
    }
    
    sendResponse(true, ['project_id' => $newId, 'message' => 'Template saved successfully']);
}

if ($action === 'toggle_publish') {
    requireAuth();
    $projectId = $input['id'] ?? null;
    $newStatus = $input['status'] ?? 0;

    $stmt = $pdo->prepare("UPDATE projects SET is_published = ? WHERE id = ? AND user_id = ?");
    $result = $stmt->execute([$newStatus, $projectId, $_SESSION['user_id']]);

    if ($result) sendResponse(true, ['message' => 'Status updated']);
    else sendResponse(false, [], "Failed to update status");
}

if ($action === 'delete_project') {
    requireAuth();
    $projectId = $input['id'] ?? null;
    $stmt = $pdo->prepare("DELETE FROM projects WHERE id = ? AND user_id = ?");
    $stmt->execute([$projectId, $_SESSION['user_id']]);
    sendResponse(true, ['message' => 'Template deleted']);
}

// --- PUBLIC TEMPLATES ---
if ($action === 'get_templates') {
    $stmt = $pdo->query("SELECT * FROM templates ORDER BY name ASC");
    $templates = $stmt->fetchAll();
    foreach ($templates as &$t) {
        $t['structure_json'] = json_decode($t['structure_json']);
    }
    sendResponse(true, ['templates' => $templates]);
}

if ($action === 'get_template_by_slug') {
    $slug = $_GET['slug'] ?? '';
    $stmt = $pdo->prepare("SELECT * FROM templates WHERE slug = ?");
    $stmt->execute([$slug]);
    $template = $stmt->fetch();
    if ($template) {
        $template['structure_json'] = json_decode($template['structure_json']);
        sendResponse(true, ['template' => $template]);
    } else {
        sendResponse(false, [], "Template not found");
    }
}

// --- ADMIN FUNCTIONS ---
function requireAdmin() {
    requireAuth();
    if ($_SESSION['role'] !== 'admin') sendResponse(false, [], "Access Denied.");
}

if ($action === 'admin_stats') {
    requireAdmin();
    $users = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
    $projects = $pdo->query("SELECT COUNT(*) FROM projects")->fetchColumn();
    $templates = $pdo->query("SELECT COUNT(*) FROM templates")->fetchColumn();
    sendResponse(true, ['users_count' => $users, 'projects_count' => $projects, 'templates_count' => $templates]);
}

if ($action === 'admin_get_users') {
    requireAdmin();
    // Fetch is_suspended as well
    $stmt = $pdo->query("SELECT id, full_name, email, role, is_suspended, created_at FROM users ORDER BY created_at DESC");
    sendResponse(true, ['users' => $stmt->fetchAll()]);
}

//  Delete User
if ($action === 'admin_delete_user') {
    requireAdmin();
    $id = $input['id'] ?? null;
    if ($id == $_SESSION['user_id']) sendResponse(false, [], "Cannot delete yourself.");
    
    $stmt = $pdo->prepare("DELETE FROM users WHERE id = ?");
    $stmt->execute([$id]);
    sendResponse(true, ['message' => 'User deleted']);
}

//  Update User Info
if ($action === 'admin_update_user') {
    requireAdmin();
    $id = $input['id'] ?? null;
    $name = $input['full_name'] ?? '';
    $email = $input['email'] ?? '';
    $role = $input['role'] ?? 'user';

    $stmt = $pdo->prepare("UPDATE users SET full_name = ?, email = ?, role = ? WHERE id = ?");
    $stmt->execute([$name, $email, $role, $id]);
    sendResponse(true, ['message' => 'User updated']);
}

//  Toggle Suspend User
if ($action === 'admin_toggle_suspend') {
    requireAdmin();
    $id = $input['id'] ?? null;
    $status = $input['is_suspended'] ?? 0;
    
    if ($id == $_SESSION['user_id']) sendResponse(false, [], "Cannot suspend yourself.");

    $stmt = $pdo->prepare("UPDATE users SET is_suspended = ? WHERE id = ?");
    $stmt->execute([$status, $id]);
    sendResponse(true, ['message' => 'User status updated']);
}

if ($action === 'admin_create_template') {
    requireAdmin();
    $name = $input['name']; $slug = $input['slug']; $category = $input['category']; $json = $input['structure_json']; 
    try {
        $stmt = $pdo->prepare("INSERT INTO templates (name, slug, category, structure_json) VALUES (?, ?, ?, ?)");
        $stmt->execute([$name, $slug, $category, $json]);
        sendResponse(true, ['message' => 'Template created']);
    } catch (Exception $e) {
        sendResponse(false, [], $e->getMessage());
    }
}

sendResponse(false, [], "Invalid action specified.");
?>