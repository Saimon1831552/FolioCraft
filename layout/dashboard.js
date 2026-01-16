document.addEventListener('DOMContentLoaded', async () => {
    
    // 1. Check Session
    try {
        const sessionRes = await fetch('api.php?action=check_session');
        const sessionData = await sessionRes.json();

        if (!sessionData.success) {
            window.location.href = 'index.html'; 
            return;
        }

        const user = sessionData.data.user;
        document.getElementById('user-name-display').textContent = user.full_name;
        document.getElementById('user-avatar').textContent = user.avatar_initial;
        
        if (user.role === 'admin') {
            document.getElementById('user-plan-display').textContent = 'Administrator';
        }

    } catch (error) {
        console.error("Session check failed", error);
        window.location.href = 'index.html';
    }

    // 2. Fetch User Projects (Templates)
    const grid = document.getElementById('projects-grid');
    const emptyTemplate = document.getElementById('empty-state-template');

    try {
        const projRes = await fetch('api.php?action=get_my_projects');
        const projData = await projRes.json();

        grid.innerHTML = ''; // Clear loading state

        if (projData.success && projData.data.projects.length > 0) {
            
            projData.data.projects.forEach(project => {
                const card = document.createElement('div');
                card.className = "bg-dark-900 border border-white/10 rounded-xl overflow-hidden hover:border-brand-500/50 transition-all group flex flex-col";
                
                // Format date
                const date = new Date(project.updated_at).toLocaleDateString();
                
                // Determine toggle state
                const isPub = parseInt(project.is_published) === 1;
                const toggleColor = isPub ? 'bg-green-500' : 'bg-gray-600';
                const togglePos = isPub ? 'translate-x-6' : 'translate-x-1';
                const statusText = isPub ? 'Published' : 'Draft';
                const statusTextColor = isPub ? 'text-green-400' : 'text-gray-400';

                // REDESIGNED CARD: Buttons are now in the body, no hover needed
                card.innerHTML = `
                    <div class="h-32 bg-dark-800 flex items-center justify-center border-b border-white/5 relative overflow-hidden">
                        <!-- Decorative Background Pattern -->
                        <div class="absolute inset-0 opacity-10 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-brand-500 via-dark-900 to-dark-950"></div>
                        <i data-lucide="layout" class="w-10 h-10 text-dark-600 relative z-10"></i>
                    </div>
                    
                    <div class="p-5 flex flex-col flex-grow">
                        <div class="mb-4">
                            <h3 class="font-bold text-lg text-white truncate" title="${project.title}">${project.title}</h3>
                            <div class="text-xs text-brand-500 font-mono mt-1 truncate">/${project.subdomain}</div>
                        </div>

                        <!-- Action Buttons (Always Visible) -->
                        <div class="flex gap-2 mb-5">
                            <a href="builder.html?project_id=${project.id}" class="flex-1 bg-brand-600 text-white text-center py-2 rounded-lg text-sm font-semibold hover:bg-brand-500 transition-colors flex items-center justify-center gap-2">
                                <i data-lucide="edit-2" class="w-3.5 h-3.5"></i> Edit
                            </a>
                            <a href="view.php?site=${project.subdomain}" target="_blank" class="flex-1 bg-dark-800 border border-white/10 text-white text-center py-2 rounded-lg text-sm font-semibold hover:bg-dark-700 transition-colors flex items-center justify-center gap-2">
                                <i data-lucide="external-link" class="w-3.5 h-3.5"></i> View
                            </a>
                        </div>
                        
                        <div class="mt-auto flex items-center justify-between border-t border-white/5 pt-4">
                            <div class="flex items-center gap-3">
                                <!-- Publish Toggle -->
                                <div class="flex items-center gap-2 cursor-pointer select-none" onclick="togglePublish(${project.id}, ${isPub ? 1 : 0}, this)">
                                    <div class="w-9 h-5 ${toggleColor} rounded-full relative transition-colors toggle-bg">
                                        <div class="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-md transform ${togglePos} transition-transform toggle-dot"></div>
                                    </div>
                                    <span class="text-[10px] font-medium ${statusTextColor} status-label uppercase tracking-wider">${statusText}</span>
                                </div>
                            </div>

                            <button onclick="deleteProject(${project.id})" class="text-gray-500 hover:text-red-400 p-2 hover:bg-red-400/10 rounded-md transition-colors" title="Delete Template">
                                <i data-lucide="trash-2" class="w-4 h-4"></i>
                            </button>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
            lucide.createIcons();

        } else {
            // Show empty state
            const emptyClone = emptyTemplate.content.cloneNode(true);
            grid.appendChild(emptyClone);
            lucide.createIcons();
        }

    } catch (error) {
        console.error("Failed to load projects", error);
        grid.innerHTML = '<div class="col-span-full text-red-400 text-center">Failed to load templates.</div>';
    }

    // 3. Logout Logic
    document.getElementById('logout-btn').addEventListener('click', async () => {
        await fetch('api.php?action=logout');
        window.location.href = 'index.html';
    });
});

async function togglePublish(id, currentStatus, element) {
    const newStatus = currentStatus === 1 ? 0 : 1;
    
    // UI Elements
    const bg = element.querySelector('.toggle-bg');
    const dot = element.querySelector('.toggle-dot');
    const label = element.querySelector('.status-label');

    // Optimistic UI Update
    if (newStatus === 1) {
        bg.classList.remove('bg-gray-600');
        bg.classList.add('bg-green-500');
        dot.classList.remove('translate-x-1');
        dot.classList.add('translate-x-6'); // Adjusted for smaller toggle size
        label.textContent = 'Published';
        label.classList.remove('text-gray-400');
        label.classList.add('text-green-400');
    } else {
        bg.classList.remove('bg-green-500');
        bg.classList.add('bg-gray-600');
        dot.classList.remove('translate-x-6');
        dot.classList.add('translate-x-1');
        label.textContent = 'Draft';
        label.classList.remove('text-green-400');
        label.classList.add('text-gray-400');
    }

    // Update the onclick handler
    element.setAttribute('onclick', `togglePublish(${id}, ${newStatus}, this)`);

    try {
        const res = await fetch('api.php?action=toggle_publish', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: id, status: newStatus })
        });
        const data = await res.json();
        
        if (!data.success) {
            alert('Failed to update status');
            window.location.reload();
        }
    } catch (e) {
        console.error(e);
        alert('Connection error');
    }
}

async function deleteProject(id) {
    if (!confirm("Are you sure you want to delete this template? This cannot be undone.")) return;

    try {
        const res = await fetch('api.php?action=delete_project', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({ id: id })
        });
        const data = await res.json();
        if (data.success) {
            window.location.reload();
        } else {
            alert("Error: " + data.error);
        }
    } catch (e) {
        console.error(e);
    }
}