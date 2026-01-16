// CONFIG & TEMPLATES
// (Note: In a full production app, these templates might also be fetched from the DB)
const templates = {
    'text': {
        html: `<div class="p-4"><h2 class="text-3xl font-bold mb-3 text-slate-900" contenteditable="true">Edit Heading</h2><p class="text-slate-600 leading-relaxed" contenteditable="true">Click here to edit this paragraph.</p></div>`,
        label: 'Text Block'
    },
    'button': {
        html: `<div class="p-4 text-center"><button class="px-8 py-3 bg-brand-600 text-white rounded-lg font-medium hover:opacity-90 transition-opacity shadow-md" contenteditable="true">Call to Action</button></div>`,
        label: 'Button'
    },
    'image': {
        html: `<div class="p-4"><img src="https://images.unsplash.com/photo-1497215728101-856f4ea42174?w=800&q=80" class="w-full h-64 object-cover rounded-xl shadow-md" alt="Placeholder"></div>`,
        label: 'Image'
    },
    'spacer': {
        html: `<div class="h-16 w-full"></div>`,
        label: 'Spacer'
    },
    'hero': {
        html: `<div class="py-24 px-8 bg-slate-50 text-center"><span class="text-brand-600 font-bold tracking-wide text-sm uppercase mb-2 block" contenteditable="true">Welcome</span><h1 class="text-5xl md:text-6xl font-extrabold text-slate-900 mb-6 tracking-tight" contenteditable="true">Showcase Your Work</h1><p class="text-xl text-slate-600 max-w-2xl mx-auto mb-10" contenteditable="true">A professional portfolio builder.</p><div class="flex justify-center gap-4"><button class="bg-blue-600 text-white px-8 py-4 rounded-full font-semibold hover:bg-blue-700 transition shadow-lg shadow-blue-500/20" contenteditable="true">Get Started</button><button class="bg-white text-slate-900 border border-slate-200 px-8 py-4 rounded-full font-semibold hover:bg-slate-50 transition" contenteditable="true">Learn More</button></div></div>`,
        label: 'Hero Section'
    },
    'features': {
        html: `<div class="py-16 px-8 bg-white"><div class="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-6xl mx-auto"><div class="text-center p-6 bg-slate-50 rounded-2xl"><div class="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4"><i data-lucide="zap" class="w-6 h-6"></i></div><h3 class="text-xl font-bold mb-2 text-slate-900" contenteditable="true">Fast</h3><p class="text-slate-500" contenteditable="true">Optimized for speed.</p></div><div class="text-center p-6 bg-slate-50 rounded-2xl"><div class="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4"><i data-lucide="shield" class="w-6 h-6"></i></div><h3 class="text-xl font-bold mb-2 text-slate-900" contenteditable="true">Secure</h3><p class="text-slate-500" contenteditable="true">Enterprise grade security.</p></div><div class="text-center p-6 bg-slate-50 rounded-2xl"><div class="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mx-auto mb-4"><i data-lucide="smile" class="w-6 h-6"></i></div><h3 class="text-xl font-bold mb-2 text-slate-900" contenteditable="true">Easy</h3><p class="text-slate-500" contenteditable="true">Built for humans.</p></div></div></div>`,
        label: 'Feature Grid'
    },
    'gallery': {
        html: `<div class="p-8 bg-white"><div class="grid grid-cols-2 md:grid-cols-3 gap-4"><div class="aspect-square bg-slate-100 rounded-lg overflow-hidden group"><img src="https://images.unsplash.com/photo-1542831371-29b0f74f9713?w=500" class="w-full h-full object-cover group-hover:scale-110 transition duration-500"></div><div class="aspect-square bg-slate-100 rounded-lg overflow-hidden group"><img src="https://images.unsplash.com/photo-1498050108023-c5249f4df085?w=500" class="w-full h-full object-cover group-hover:scale-110 transition duration-500"></div><div class="aspect-square bg-slate-100 rounded-lg overflow-hidden group"><img src="https://images.unsplash.com/photo-1499951360447-b19be8fe80f5?w=500" class="w-full h-full object-cover group-hover:scale-110 transition duration-500"></div></div></div>`,
        label: 'Gallery'
    },
    'contact': {
        html: `<div class="py-16 px-8 max-w-2xl mx-auto"><div class="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg"><h2 class="text-2xl font-bold mb-6 text-center text-slate-900" contenteditable="true">Get in Touch</h2><div class="space-y-4"><input type="text" placeholder="Your Name" class="w-full p-3 rounded-lg border border-slate-300 bg-slate-50"><input type="email" placeholder="Your Email" class="w-full p-3 rounded-lg border border-slate-300 bg-slate-50"><textarea rows="4" placeholder="Message" class="w-full p-3 rounded-lg border border-slate-300 bg-slate-50"></textarea><button class="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition">Send Message</button></div></div></div>`,
        label: 'Contact Form'
    }
};

// STATE MANAGEMENT
const AppState = {
    projectId: null,
    selectedEl: null,
    history: [],
    historyIndex: -1,
    maxHistory: 20,
    hasUnsavedChanges: false,
    
    init() {
        const urlParams = new URLSearchParams(window.location.search);
        this.projectId = urlParams.get('project_id');
        const templateSlug = urlParams.get('template');

        if (this.projectId) {
            this.loadFromAPI(this.projectId);
        } else if (templateSlug) {
            // New project from template - Fetch template structure from API
            this.loadTemplateFromAPI(templateSlug);
            this.hasUnsavedChanges = true;
            this.updateSaveStatus();
        } else {
            document.getElementById('empty-state').style.display = 'flex';
        }
    },

    pushHistory(actionDescription) {
        if (this.historyIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.historyIndex + 1);
        }

        const state = this.serializeCanvas();
        this.history.push(state);
        
        if (this.history.length > this.maxHistory) this.history.shift();
        else this.historyIndex++;

        this.updateUndoRedoUI();
        this.hasUnsavedChanges = true;
        this.updateSaveStatus();
    },

    undo() {
        if (this.historyIndex > 0) {
            this.historyIndex--;
            this.restoreCanvas(this.history[this.historyIndex]);
            this.updateUndoRedoUI();
        }
    },

    redo() {
        if (this.historyIndex < this.history.length - 1) {
            this.historyIndex++;
            this.restoreCanvas(this.history[this.historyIndex]);
            this.updateUndoRedoUI();
        }
    },

    serializeCanvas() {
        const elements = [];
        document.querySelectorAll('.canvas-element').forEach(el => {
            elements.push({
                type: el.dataset.type,
                html: el.querySelector('.element-content').innerHTML
            });
        });
        return JSON.stringify(elements);
    },

    restoreCanvas(jsonString) {
        const contentArea = document.getElementById('canvas-content');
        contentArea.innerHTML = ''; // Clear
        
        try {
            const elements = JSON.parse(jsonString);
            if (elements && elements.length > 0) {
                document.getElementById('empty-state').style.display = 'none';
                elements.forEach(item => {
                    createElement(item.type, item.html);
                });
            } else {
                document.getElementById('empty-state').style.display = 'flex';
            }
            lucide.createIcons();
        } catch(e) { console.error("Restore failed", e); }
    },

    updateUndoRedoUI() {
        document.getElementById('undo-btn').disabled = this.historyIndex <= 0;
        document.getElementById('redo-btn').disabled = this.historyIndex >= this.history.length - 1;
    },

    updateSaveStatus() {
        const el = document.getElementById('save-status');
        if (this.hasUnsavedChanges) {
            el.textContent = 'Unsaved changes';
            el.classList.remove('text-green-500');
            el.classList.add('text-slate-500');
        } else {
            el.textContent = 'All changes saved';
            el.classList.add('text-green-500');
            el.classList.remove('text-slate-500');
        }
    },

    async loadFromAPI(id) {
        try {
            const res = await fetch(`api.php?action=get_project&id=${id}`);
            const data = await res.json();
            if(data.success) {
                document.getElementById('project-title').value = data.data.project.title;
                if (data.data.project.content_state) {
                    const json = JSON.stringify(data.data.project.content_state);
                    this.restoreCanvas(json);
                    this.history = [json];
                    this.historyIndex = 0;
                }
            } else {
                showToast(data.error || 'Failed to load', 'error');
            }
        } catch(e) {
            console.error("API Load Error", e);
            showToast("Failed to load project", "error");
        }
    },

    async loadTemplateFromAPI(slug) {
        if (slug === 'blank') return; // Blank canvas
        
        try {
            const res = await fetch(`api.php?action=get_template_by_slug&slug=${slug}`);
            const data = await res.json();
            if(data.success && data.data.template.structure_json) {
                const json = JSON.stringify(data.data.template.structure_json);
                this.restoreCanvas(json);
                this.history = [json];
                this.historyIndex = 0;
            }
        } catch(e) {
            console.error("Template Load Error", e);
        }
    }
};

// DRAG AND DROP & ELEMENT CREATION (Simplified for brevity, ensuring core logic)
function setupDragAndDrop() {
    const draggables = document.querySelectorAll('.draggable-item');
    const canvas = document.getElementById('canvas');
    const contentArea = document.getElementById('canvas-content');
    const indicator = document.getElementById('drop-indicator');

    draggables.forEach(item => {
        item.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('type', item.dataset.type);
            e.dataTransfer.setData('source', 'sidebar');
            item.style.opacity = '0.5';
        });
        item.addEventListener('dragend', () => item.style.opacity = '1');
    });

    canvas.addEventListener('dragover', (e) => {
        e.preventDefault();
        const afterElement = getDragAfterElement(contentArea, e.clientY);
        indicator.style.display = 'block';
        if (afterElement) {
            contentArea.insertBefore(indicator, afterElement);
        } else {
            contentArea.appendChild(indicator);
        }
    });

    canvas.addEventListener('dragleave', (e) => {
        if (!canvas.contains(e.relatedTarget)) indicator.style.display = 'none';
    });

    canvas.addEventListener('drop', (e) => {
        e.preventDefault();
        indicator.style.display = 'none';
        
        const type = e.dataTransfer.getData('type');
        const source = e.dataTransfer.getData('source');
        const afterElement = getDragAfterElement(contentArea, e.clientY);

        if (source === 'sidebar' && templates[type]) {
            const newEl = createElement(type, templates[type].html, afterElement);
            AppState.pushHistory('Added ' + type);
            selectElement(newEl);
        } else if (source === 'canvas') {
            const draggedId = e.dataTransfer.getData('elementId');
            const draggedEl = document.getElementById(draggedId);
            if (draggedEl) {
                if (afterElement) contentArea.insertBefore(draggedEl, afterElement);
                else contentArea.appendChild(draggedEl);
                AppState.pushHistory('Reordered element');
                selectElement(draggedEl);
            }
        }
        document.getElementById('empty-state').style.display = 'none';
    });
}

function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.canvas-element:not(.dragging)')];
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        if (offset < 0 && offset > closest.offset) return { offset: offset, element: child };
        else return closest;
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

function createElement(type, html, afterElement) {
    const contentArea = document.getElementById('canvas-content');
    const wrapper = document.createElement('div');
    const id = 'el-' + Date.now() + Math.floor(Math.random() * 1000);
    
    wrapper.id = id;
    wrapper.className = 'canvas-element group animate-fade-in';
    wrapper.dataset.type = type;
    wrapper.dataset.label = templates[type]?.label || 'Element';
    wrapper.draggable = true;
    
    wrapper.innerHTML = `
        <div class="element-content">${html}</div>
        <div class="element-actions">
            <div class="action-btn" onclick="moveElement(this, 'up')" title="Move Up"><i data-lucide="arrow-up" class="w-4 h-4"></i></div>
            <div class="action-btn" onclick="moveElement(this, 'down')" title="Move Down"><i data-lucide="arrow-down" class="w-4 h-4"></i></div>
            <div class="action-btn drag-handle cursor-move" title="Drag to reorder"><i data-lucide="move" class="w-4 h-4"></i></div>
            <div class="action-btn delete" title="Delete"><i data-lucide="trash-2" class="w-4 h-4"></i></div>
        </div>
    `;

    if (afterElement && afterElement.id !== 'drop-indicator') {
        contentArea.insertBefore(wrapper, afterElement);
    } else {
        contentArea.appendChild(wrapper);
    }

    attachElementEvents(wrapper);
    lucide.createIcons();
    return wrapper;
}

function attachElementEvents(wrapper) {
    wrapper.addEventListener('click', (e) => { e.stopPropagation(); selectElement(wrapper); });
    wrapper.querySelector('.delete').addEventListener('click', (e) => {
        e.stopPropagation();
        wrapper.remove();
        AppState.selectedEl = null;
        renderProperties(null);
        AppState.pushHistory('Deleted element');
        if (document.getElementById('canvas-content').children.length === 0) {
            document.getElementById('empty-state').style.display = 'flex';
        }
    });
    wrapper.addEventListener('dragstart', (e) => {
        if (document.activeElement.isContentEditable) { e.preventDefault(); return; }
        e.dataTransfer.setData('source', 'canvas');
        e.dataTransfer.setData('elementId', wrapper.id);
        wrapper.classList.add('dragging');
        e.stopPropagation();
    });
    wrapper.addEventListener('dragend', () => wrapper.classList.remove('dragging'));
}

window.moveElement = function(btn, dir) {
    const el = btn.closest('.canvas-element');
    if (dir === 'up' && el.previousElementSibling) {
        el.parentNode.insertBefore(el, el.previousElementSibling);
        AppState.pushHistory('Moved element up');
    } else if (dir === 'down' && el.nextElementSibling) {
        el.parentNode.insertBefore(el.nextElementSibling, el);
        AppState.pushHistory('Moved element down');
    }
}

function selectElement(el) {
    if (AppState.selectedEl) AppState.selectedEl.classList.remove('selected');
    AppState.selectedEl = el;
    AppState.selectedEl.classList.add('selected');
    renderProperties(el);
}

function renderProperties(el) {
    const panel = document.getElementById('properties-panel');
    if (!el) {
        panel.innerHTML = `<div class="text-center py-20 opacity-40"><i data-lucide="mouse-pointer-2" class="w-10 h-10 mx-auto mb-3 text-slate-600"></i><p class="text-xs text-slate-400">Select an element</p></div>`;
        lucide.createIcons();
        return;
    }

    const type = el.dataset.type;
    const target = el.querySelector('.element-content > div');
    const computedStyle = window.getComputedStyle(target);

    let html = `<div class="space-y-6 animate-fade-in">`;
    
    html += `
        <div class="flex items-center justify-between pb-4 border-b border-white/5">
            <span class="text-sm font-semibold text-white">${templates[type]?.label || 'Element'}</span>
            <span class="text-[10px] text-slate-500 font-mono bg-dark-950 px-2 py-0.5 rounded">#${el.id.substr(-6)}</span>
        </div>`;

    html += createRangeControl('Padding', 'padding', parseInt(computedStyle.padding) || 0, 0, 100, 'px');
    
    html += `
        <div>
            <label class="text-xs font-semibold text-slate-400 uppercase mb-3 block">Background</label>
            <div class="grid grid-cols-6 gap-2">
                <button onclick="updateStyle('backgroundColor', 'transparent')" class="w-8 h-8 rounded border border-white/10 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI4IiBoZWlnaHQ9IjgiPjxyZWN0IHdpZHRoPSI4IiBoZWlnaHQ9IjgiIGZpbGw9IiMzMzMiLz48cmVjdCB3aWR0aD0iNCIgaGVpZ2h0PSI0IiBmaWxsPSIjNDQ0Ii8+PHJlY3QgeD0iNCIgeT0iNCIgd2lkdGg9IjQiIGhlaWdodD0iNCIgZmlsbD0iIzQ0NCIvPjwvc3ZnPg==')] hover:scale-110 transition"></button>
                <button onclick="updateStyle('backgroundColor', '#ffffff')" class="w-8 h-8 rounded border border-white/10 bg-white hover:scale-110 transition"></button>
                <button onclick="updateStyle('backgroundColor', '#f8fafc')" class="w-8 h-8 rounded border border-white/10 bg-slate-50 hover:scale-110 transition"></button>
                <button onclick="updateStyle('backgroundColor', '#1e293b')" class="w-8 h-8 rounded border border-white/10 bg-slate-800 hover:scale-110 transition"></button>
                <button onclick="updateStyle('backgroundColor', '#0f172a')" class="w-8 h-8 rounded border border-white/10 bg-slate-900 hover:scale-110 transition"></button>
                <button onclick="updateStyle('backgroundColor', '#000000')" class="w-8 h-8 rounded border border-white/10 bg-black hover:scale-110 transition"></button>
            </div>
        </div>`;

    if (['text', 'hero', 'button', 'features'].includes(type)) {
        html += `
        <div>
            <label class="text-xs font-semibold text-slate-400 uppercase mb-3 block">Alignment</label>
            <div class="flex bg-dark-950 rounded-lg p-1 border border-white/5">
                <button class="flex-1 py-1.5 hover:bg-dark-800 rounded text-slate-400 hover:text-white transition" onclick="updateStyle('textAlign', 'left')"><i data-lucide="align-left" class="w-4 h-4 mx-auto"></i></button>
                <button class="flex-1 py-1.5 hover:bg-dark-800 rounded text-slate-400 hover:text-white transition" onclick="updateStyle('textAlign', 'center')"><i data-lucide="align-center" class="w-4 h-4 mx-auto"></i></button>
                <button class="flex-1 py-1.5 hover:bg-dark-800 rounded text-slate-400 hover:text-white transition" onclick="updateStyle('textAlign', 'right')"><i data-lucide="align-right" class="w-4 h-4 mx-auto"></i></button>
            </div>
        </div>`;
    }

    if (type === 'image') {
        html += createRangeControl('Rounded Corners', 'borderRadius', 0, 0, 32, 'px', 'updateImageStyle');
    }

    html += `</div>`;
    panel.innerHTML = html;
    lucide.createIcons();
}

function createRangeControl(label, prop, val, min, max, unit, funcName = 'updateStyle') {
    return `
        <div>
            <div class="flex justify-between mb-2">
                <label class="text-xs font-semibold text-slate-400 uppercase">${label}</label>
                <span class="text-xs text-slate-500 font-mono" id="val-${prop}">${val}${unit}</span>
            </div>
            <input type="range" min="${min}" max="${max}" value="${val}" 
                oninput="${funcName}('${prop}', this.value + '${unit}'); document.getElementById('val-${prop}').innerText = this.value + '${unit}'"
            >
        </div>`;
}

window.updateStyle = function(prop, value) {
    if (AppState.selectedEl) {
        const target = AppState.selectedEl.querySelector('.element-content > div');
        if (target) {
            target.style[prop] = value;
            AppState.hasUnsavedChanges = true;
            AppState.updateSaveStatus();
        }
    }
}

window.updateImageStyle = function(prop, value) {
    if (AppState.selectedEl) {
        const img = AppState.selectedEl.querySelector('img');
        if (img) {
            img.style[prop] = value;
            AppState.hasUnsavedChanges = true;
            AppState.updateSaveStatus();
        }
    }
}

// MAIN EVENTS
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    setupDragAndDrop();
    AppState.init();

    document.getElementById('undo-btn').addEventListener('click', () => AppState.undo());
    document.getElementById('redo-btn').addEventListener('click', () => AppState.redo());

    document.querySelectorAll('.viewport-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            document.querySelectorAll('.viewport-btn').forEach(b => {
                b.classList.remove('bg-dark-800', 'text-brand-400', 'active', 'shadow-sm');
            });
            btn.classList.add('bg-dark-800', 'text-brand-400', 'active', 'shadow-sm');
            document.getElementById('canvas').style.width = btn.dataset.width;
        });
    });

    document.getElementById('save-btn').addEventListener('click', async () => {
        const btn = document.getElementById('save-btn');
        const originalContent = btn.innerHTML;
        btn.innerHTML = `<span class="animate-spin mr-2">⟳</span> Saving...`;
        
        const contentState = [];
        document.querySelectorAll('.canvas-element').forEach(el => {
            contentState.push({
                type: el.dataset.type,
                html: el.querySelector('.element-content').innerHTML
            });
        });

        const projectData = {
            title: document.getElementById('project-title').value,
            content_state: contentState,
            project_id: AppState.projectId
        };

        try {
            const res = await fetch('api.php?action=save_project', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(projectData)
            });
            const data = await res.json();
            
            if (data.success) {
                showToast("Project saved successfully");
                AppState.hasUnsavedChanges = false;
                AppState.updateSaveStatus();
                // Update URL if new project created
                if (!AppState.projectId && data.data.project_id) {
                    AppState.projectId = data.data.project_id;
                    const newUrl = new URL(window.location);
                    newUrl.searchParams.set('project_id', data.data.project_id);
                    newUrl.searchParams.delete('template');
                    window.history.pushState({}, '', newUrl);
                }
            } else {
                throw new Error(data.error);
            }
        } catch (e) {
            console.error(e);
            showToast("Error saving project: " + e.message, "error");
        } finally {
            btn.innerHTML = originalContent;
        }
    });

    document.getElementById('canvas-area').addEventListener('focusout', (e) => {
        if (e.target.isContentEditable) AppState.pushHistory('Text edit');
    });

    document.getElementById('canvas-area').addEventListener('click', (e) => {
        if (e.target.id === 'canvas-area' && AppState.selectedEl) {
            AppState.selectedEl.classList.remove('selected');
            AppState.selectedEl = null;
            renderProperties(null);
        }
    });
});

function showToast(msg, type = 'success') {
    const toast = document.getElementById('toast');
    const icon = document.getElementById('toast-icon');
    const msgEl = document.getElementById('toast-message');
    msgEl.textContent = msg;
    if (type === 'error') {
        icon.setAttribute('class', 'text-red-500 w-4 h-4');
        toast.classList.add('border-red-500/30');
    } else {
        icon.setAttribute('class', 'text-green-500 w-4 h-4');
        toast.classList.remove('border-red-500/30');
    }
    toast.classList.remove('translate-y-20', 'opacity-0');
    setTimeout(() => toast.classList.add('translate-y-20', 'opacity-0'), 3000);
}