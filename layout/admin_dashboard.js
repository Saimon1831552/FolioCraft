// State
let currentTab = 'overview';

document.addEventListener('DOMContentLoaded', async () => {
    checkAdminSession();
    loadStats();
    
    // Default tab
    switchTab('overview');

    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('api.php?action=logout');
        window.location.href = 'index.html';
    });

    // Handle Template Form
    document.getElementById('add-template-form').addEventListener('submit', createTemplate);
    
    // Handle Edit User Form
    document.getElementById('edit-user-form').addEventListener('submit', saveUserEdit);
});

async function checkAdminSession() {
    try {
        const res = await fetch('api.php?action=check_session');
        const data = await res.json();
        
        if (!data.success || data.data.user.role !== 'admin') {
            window.location.href = 'dashboard.html'; // Redirect non-admins
        } else {
            document.getElementById('admin-name').textContent = data.data.user.full_name;
        }
    } catch (e) {
        window.location.href = 'index.html';
    }
}

function switchTab(tabId) {
    document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
    document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('block'));
    
    const target = document.getElementById('tab-' + tabId);
    if(target) {
        target.classList.remove('hidden');
        target.classList.add('block');
    }

    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('bg-brand-600', 'text-white');
        el.classList.add('text-gray-400', 'hover:text-white', 'hover:bg-dark-800');
    });
    
    const activeNav = document.getElementById('nav-' + tabId);
    if(activeNav) {
        activeNav.classList.remove('text-gray-400', 'hover:text-white', 'hover:bg-dark-800');
        activeNav.classList.add('bg-brand-600', 'text-white');
    }

    currentTab = tabId;

    if (tabId === 'users') fetchUsers();
    if (tabId === 'projects') fetchProjects();
    if (tabId === 'templates') fetchTemplates();
}

// --- DATA FETCHERS ---

async function loadStats() {
    try {
        const res = await fetch('api.php?action=admin_stats');
        const json = await res.json();
        if(json.success) {
            document.getElementById('stat-users').textContent = json.data.users_count;
            document.getElementById('stat-projects').textContent = json.data.projects_count;
            document.getElementById('stat-templates').textContent = json.data.templates_count;
        }
    } catch(e) { console.error(e); }
}

async function fetchUsers() {
    const tbody = document.getElementById('users-table-body');
    tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center">Loading...</td></tr>';
    
    try {
        const res = await fetch('api.php?action=admin_get_users');
        const json = await res.json();
        
        if(json.success) {
            tbody.innerHTML = '';
            json.data.users.forEach(user => {
                const tr = document.createElement('tr');
                const isSuspended = user.is_suspended == 1;
                
                // Construct Status Badge
                const statusBadge = isSuspended 
                    ? `<span class="px-2 py-1 rounded text-xs bg-red-500/20 text-red-400">Suspended</span>`
                    : `<span class="px-2 py-1 rounded text-xs bg-green-500/20 text-green-400">Active</span>`;

                // Construct Suspend Button Text
                const suspendBtnText = isSuspended ? 'Activate' : 'Suspend';
                const suspendBtnColor = isSuspended ? 'text-green-400 hover:text-green-300' : 'text-orange-400 hover:text-orange-300';

                // Safely encode user object for edit button
                const userString = JSON.stringify(user).replace(/"/g, '&quot;');

                tr.innerHTML = `
                    <td class="px-6 py-4">#${user.id}</td>
                    <td class="px-6 py-4 font-bold text-white">${user.full_name}</td>
                    <td class="px-6 py-4">${user.email}</td>
                    <td class="px-6 py-4"><span class="px-2 py-1 rounded text-xs ${user.role === 'admin' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}">${user.role.toUpperCase()}</span></td>
                    <td class="px-6 py-4">${statusBadge}</td>
                    <td class="px-6 py-4 text-right space-x-2">
                        <button onclick="openEditModal(${userString})" class="text-blue-400 hover:text-blue-300 text-xs font-medium">Edit</button>
                        <button onclick="toggleSuspend(${user.id}, ${isSuspended ? 1 : 0})" class="${suspendBtnColor} text-xs font-medium">${suspendBtnText}</button>
                        <button onclick="deleteUser(${user.id})" class="text-red-400 hover:text-red-300 text-xs font-medium">Delete</button>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch(e) { tbody.innerHTML = '<tr><td colspan="6" class="px-6 py-4 text-center text-red-400">Error loading users</td></tr>'; }
}

// --- USER ACTIONS ---

async function deleteUser(id) {
    if (!confirm("Are you sure you want to delete this user? This will also delete all their projects.")) return;
    
    try {
        const res = await fetch('api.php?action=admin_delete_user', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: id })
        });
        const json = await res.json();
        if(json.success) {
            fetchUsers(); // Refresh list
        } else {
            alert(json.error);
        }
    } catch(e) { console.error(e); }
}

async function toggleSuspend(id, currentStatus) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    const action = newStatus === 1 ? "Suspend" : "Activate";
    if (!confirm(`Are you sure you want to ${action} this user?`)) return;

    try {
        const res = await fetch('api.php?action=admin_toggle_suspend', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: id, is_suspended: newStatus })
        });
        const json = await res.json();
        if(json.success) {
            fetchUsers();
        } else {
            alert(json.error);
        }
    } catch(e) { console.error(e); }
}

function openEditModal(user) {
    document.getElementById('edit-user-id').value = user.id;
    document.getElementById('edit-user-name').value = user.full_name;
    document.getElementById('edit-user-email').value = user.email;
    document.getElementById('edit-user-role').value = user.role;
    document.getElementById('edit-user-modal').classList.remove('hidden');
}

async function saveUserEdit(e) {
    e.preventDefault();
    const data = {
        id: document.getElementById('edit-user-id').value,
        full_name: document.getElementById('edit-user-name').value,
        email: document.getElementById('edit-user-email').value,
        role: document.getElementById('edit-user-role').value
    };

    try {
        const res = await fetch('api.php?action=admin_update_user', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const json = await res.json();
        
        if(json.success) {
            document.getElementById('edit-user-modal').classList.add('hidden');
            fetchUsers();
        } else {
            alert('Error: ' + json.error);
        }
    } catch(err) {
        alert('Server Error');
    }
}

// --- PROJECT ACTIONS ---

async function fetchProjects() {
    const tbody = document.getElementById('projects-table-body');
    tbody.innerHTML = '<tr><td colspan="5" class="px-6 py-4 text-center">Loading...</td></tr>';
    
    try {
        const res = await fetch('api.php?action=admin_get_projects');
        const json = await res.json();
        
        if(json.success) {
            tbody.innerHTML = '';
            json.data.projects.forEach(p => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td class="px-6 py-4 font-bold text-white">${p.title}</td>
                    <td class="px-6 py-4">${p.owner_name}</td>
                    <td class="px-6 py-4 text-xs font-mono">${p.subdomain}</td>
                    <td class="px-6 py-4"><span class="text-green-400">Active</span></td>
                    <td class="px-6 py-4 text-right">
                        <a href="builder.html?project_id=${p.id}" class="text-brand-400 hover:text-brand-300 mr-2">View</a>
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch(e) { console.error(e); }
}

async function fetchTemplates() {
    const grid = document.getElementById('templates-grid');
    grid.innerHTML = '<div class="text-gray-500">Loading templates...</div>';
    
    try {
        const res = await fetch('api.php?action=get_templates');
        const json = await res.json();
        
        if(json.success) {
            grid.innerHTML = '';
            json.data.templates.forEach(t => {
                const card = document.createElement('div');
                card.className = 'bg-dark-900 border border-white/10 p-6 rounded-xl';
                card.innerHTML = `
                    <div class="flex justify-between items-start mb-4">
                        <div class="p-2 bg-dark-800 rounded-lg"><i data-lucide="layout" class="text-brand-500"></i></div>
                        <span class="text-xs bg-dark-800 px-2 py-1 rounded text-gray-400">${t.category}</span>
                    </div>
                    <h3 class="font-bold text-white text-lg">${t.name}</h3>
                    <p class="text-xs text-gray-500 font-mono mt-1">Slug: ${t.slug}</p>
                `;
                grid.appendChild(card);
            });
            lucide.createIcons();
        }
    } catch(e) { console.error(e); }
}

async function createTemplate(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const originalText = btn.textContent;
    btn.textContent = 'Creating...';
    
    const data = {
        name: document.getElementById('tpl-name').value,
        slug: document.getElementById('tpl-slug').value,
        category: document.getElementById('tpl-category').value,
        structure_json: document.getElementById('tpl-json').value
    };

    try {
        const res = await fetch('api.php?action=admin_create_template', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const json = await res.json();
        
        if(json.success) {
            alert('Template Created!');
            document.getElementById('add-template-modal').classList.add('hidden');
            fetchTemplates();
            e.target.reset();
        } else {
            alert('Error: ' + json.error);
        }
    } catch(err) {
        alert('Server Error');
    } finally {
        btn.textContent = originalText;
    }
}