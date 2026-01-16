// templates.js - Loads templates from API and handles selection

document.addEventListener('DOMContentLoaded', async () => {
    // 1. Initialize Lucide icons
    lucide.createIcons();

    // 2. Fetch templates from API
    const templateContainer = document.querySelector('.grid');
    if (!templateContainer) return;

    // Keep the "Blank Canvas" option (assuming it's the first child)
    // We will append DB templates after it.
    
    try {
        const response = await fetch('api.php?action=get_templates');
        const data = await response.json();

        if (data.success && data.data.templates.length > 0) {
            
            data.data.templates.forEach(template => {
                const templateCard = document.createElement('div');
                templateCard.className = "group bg-dark-800 rounded-xl border border-dark-700 overflow-hidden hover:shadow-2xl hover:shadow-brand-500/20 transition-all";
                
                // Color variation based on category for visual distinction
                let bgGradient = 'bg-gradient-to-br from-gray-800 to-black';
                if (template.category === 'Photography') bgGradient = 'bg-gradient-to-br from-gray-900 to-gray-800';
                if (template.category === 'Business') bgGradient = 'bg-white text-black';
                
                // A simple visual representation (mockup)
                const visual = `
                    <div class="h-48 relative overflow-hidden bg-gray-700">
                        <div class="w-full h-full ${bgGradient} p-4 flex flex-col justify-center items-center">
                            <span class="text-xs font-bold opacity-50 uppercase tracking-widest">${template.category}</span>
                            <div class="font-bold text-lg mt-2">${template.name}</div>
                        </div>
                        <div class="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <span class="bg-brand-600 text-white px-4 py-2 rounded-full font-medium">Use Template</span>
                        </div>
                    </div>
                `;

                templateCard.innerHTML = `
                    ${visual}
                    <div class="p-6">
                        <h3 class="text-lg font-semibold text-white">${template.name}</h3>
                        <p class="text-gray-400 text-sm mt-1">Category: ${template.category}</p>
                        <a href="builder.html?template=${template.slug}" class="mt-4 block w-full text-center bg-dark-700 hover:bg-brand-600 text-white py-2 rounded-lg transition-colors">Select</a>
                    </div>
                `;

                templateContainer.appendChild(templateCard);
            });
        }
    } catch (error) {
        console.error("Failed to load templates", error);
    }
});