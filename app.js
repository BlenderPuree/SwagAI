// Application Data from JSON
const appData = {
    emptyStateMessages: {
        wardrobe: "Your digital closet awaits! 👗✨\nAdd some clothes to get started and unlock AI-powered outfit magic.",
        outfits: "Upload a few clothing items first, then watch the AI create amazing outfit combinations just for you! 🪄",
        dashboard: "Welcome to your style journey! Ready to build a wardrobe that works perfectly for your lifestyle?"
    },
    permissionMessages: {
        camera: "SwagAI needs camera access to take photos of your clothes. This helps build your digital wardrobe for AI outfit suggestions! 📸",
        files: "We'd like to access your photos so you can upload images of your clothes to build your digital wardrobe! 📁"
    },
    successMessages: {
        photoUploaded: "Perfect! 🎉 Your item has been added to your wardrobe.",
        outfitGenerated: "Wow! Look at these amazing outfit combinations! ✨",
        firstUpload: "Congratulations on your first upload! 🥳 Keep adding items for even better recommendations."
    },
    encouragingTips: [
        "💡 Tip: Upload items from different categories for more outfit variety!",
        "✨ Pro tip: Take photos with good lighting for best AI recognition.",
        "🌟 The more items you add, the more creative your outfit suggestions become!",
        "👔 Try uploading both casual and formal pieces for all-occasion styling."
    ],
    categories: [
        {"id": "tops", "name": "Tops", "icon": "👔", "examples": "Shirts, Blouses, T-shirts"},
        {"id": "bottoms", "name": "Bottoms", "icon": "👖", "examples": "Jeans, Pants, Skirts"},
        {"id": "shoes", "name": "Shoes", "icon": "👟", "examples": "Sneakers, Heels, Boots"},
        {"id": "outerwear", "name": "Outerwear", "icon": "🧥", "examples": "Jackets, Coats, Blazers"},
        {"id": "accessories", "name": "Accessories", "icon": "👜", "examples": "Bags, Jewelry, Scarves"}
    ],
    styleOptions: [
        {"id": "casual", "name": "Casual", "icon": "😎"},
        {"id": "formal", "name": "Formal", "icon": "🎩"},
        {"id": "business", "name": "Business", "icon": "💼"},
        {"id": "party", "name": "Party", "icon": "🎉"},
        {"id": "sporty", "name": "Sporty", "icon": "⚽"},
        {"id": "boho", "name": "Boho", "icon": "🌸"}
    ],
    colorOptions: [
        "Black", "White", "Gray", "Navy", "Brown", "Beige", "Red", "Blue", "Green", "Yellow", "Orange", "Purple", "Pink"
    ]
};

// App State - Start completely empty
let currentScreen = 'landing-screen';
let wardrobeItems = [];
let savedOutfits = [];
let generatedOutfits = [];
let currentStream = null;
let currentTipIndex = 0;
let facingMode = 'environment'; // Start with back camera
let currentPermissionType = null;

// Category icons mapping
const categoryIcons = {
    'tops': 'fas fa-tshirt',
    'bottoms': 'fas fa-vest', 
    'outerwear': 'fas fa-user-tie',
    'shoes': 'fas fa-shoe-prints',
    'accessories': 'fas fa-gem'
};

// Initialize App
document.addEventListener('DOMContentLoaded', function() {
    initializeApp();
    setupEventListeners();
    rotateTips();
});

function initializeApp() {
    // Load data from localStorage if available
    try {
        const savedWardrobe = localStorage.getItem('swagai-wardrobe');
        const savedOutfitsData = localStorage.getItem('swagai-outfits');
        
        if (savedWardrobe) {
            wardrobeItems = JSON.parse(savedWardrobe);
        }
        if (savedOutfitsData) {
            savedOutfits = JSON.parse(savedOutfitsData);
        }
    } catch (error) {
        console.log('No saved data found, starting fresh.');
        wardrobeItems = [];
        savedOutfits = [];
    }
    
    updateDashboardStats();
    updateDashboardUI();
    populateSelectOptions();
    
    // Ensure modal is hidden on startup
    const modal = document.getElementById('permission-modal');
    if (modal) {
        modal.classList.add('hidden');
    }
}

function setupEventListeners() {
    // Modal event listeners
    const modal = document.getElementById('permission-modal');
    const modalOverlay = modal.querySelector('.modal-overlay');
    const modalClose = modal.querySelector('.modal-close');
    const cancelBtn = modal.querySelector('.btn--outline');
    const allowBtn = modal.querySelector('#grant-permission-btn');
    
    // Close modal when clicking overlay
    if (modalOverlay) {
        modalOverlay.addEventListener('click', closePermissionModal);
    }
    
    // Close modal when clicking X button
    if (modalClose) {
        modalClose.addEventListener('click', closePermissionModal);
    }
    
    // Close modal when clicking cancel
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closePermissionModal);
    }
    
    // Handle permission grant
    if (allowBtn) {
        allowBtn.addEventListener('click', handlePermissionGrant);
    }
    
    // Handle escape key
    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closePermissionModal();
        }
    });
    
    // File input change handler
    const fileInput = document.getElementById('file-input');
    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    }
}

// Screen Navigation
function showScreen(screenId) {
    // Hide current screen
    const currentScreenElement = document.querySelector('.screen.active');
    if (currentScreenElement) {
        currentScreenElement.classList.remove('active');
    }
    
    // Show new screen
    const newScreen = document.getElementById(screenId);
    if (newScreen) {
        newScreen.classList.add('active');
        currentScreen = screenId;
        
        // Initialize screen-specific content
        if (screenId === 'wardrobe') {
            loadWardrobe();
        } else if (screenId === 'saved-outfits') {
            loadSavedOutfits();
        } else if (screenId === 'dashboard') {
            updateDashboardStats();
            updateDashboardUI();
        } else if (screenId === 'outfit-generator') {
            loadOutfitGenerator();
        } else if (screenId === 'add-clothes') {
            resetAddClothesScreen();
        }
    }
}

// Dashboard Functions
function updateDashboardStats() {
    document.getElementById('closet-count').textContent = wardrobeItems.length;
    document.getElementById('outfit-count').textContent = savedOutfits.length;
    
    // Update progress
    const progressFill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const itemCount = wardrobeItems.length;
    
    if (itemCount === 0) {
        progressFill.style.width = '0%';
        progressText.textContent = 'Get started by adding your first item!';
    } else if (itemCount < 5) {
        progressFill.style.width = `${(itemCount / 5) * 50}%`;
        progressText.textContent = `${itemCount} items added! Keep going for better recommendations.`;
    } else if (itemCount < 10) {
        progressFill.style.width = `${50 + ((itemCount - 5) / 5) * 30}%`;
        progressText.textContent = `Great progress! ${itemCount} items in your closet.`;
    } else {
        progressFill.style.width = '100%';
        progressText.textContent = `Amazing! You have ${itemCount} items. Perfect for AI magic! ✨`;
    }
}

function updateDashboardUI() {
    const itemCount = wardrobeItems.length;
    const outfitCard = document.getElementById('outfit-generator-card');
    const wardrobeCard = document.getElementById('wardrobe-card');
    const welcomeSection = document.getElementById('welcome-section');
    const dashboardMessage = document.getElementById('dashboard-message');
    
    if (itemCount === 0) {
        // Show encouraging empty state
        dashboardMessage.textContent = appData.emptyStateMessages.dashboard;
        outfitCard.disabled = true;
        outfitCard.style.opacity = '0.6';
        outfitCard.style.cursor = 'not-allowed';
        welcomeSection.style.display = 'block';
        
        // Show disabled overlay
        const disabledOverlay = outfitCard.querySelector('.disabled-overlay');
        if (disabledOverlay) {
            disabledOverlay.style.display = 'flex';
        }
    } else {
        // Show progress celebration
        dashboardMessage.textContent = `You're building an amazing wardrobe! ${itemCount} items and counting! 🎉`;
        outfitCard.disabled = false;
        outfitCard.style.opacity = '1';
        outfitCard.style.cursor = 'pointer';
        
        if (itemCount >= 5) {
            welcomeSection.style.display = 'none';
        }
        
        // Remove disabled overlay
        const disabledOverlay = outfitCard.querySelector('.disabled-overlay');
        if (disabledOverlay) {
            disabledOverlay.style.display = 'none';
        }
    }
}

function rotateTips() {
    const tipElement = document.getElementById('current-tip');
    if (tipElement && appData.encouragingTips.length > 0) {
        tipElement.textContent = appData.encouragingTips[currentTipIndex];
        currentTipIndex = (currentTipIndex + 1) % appData.encouragingTips.length;
        
        setTimeout(rotateTips, 5000); // Change tip every 5 seconds
    }
}

// Populate select options
function populateSelectOptions() {
    const categorySelect = document.getElementById('item-category');
    const colorSelect = document.getElementById('item-color');
    const styleSelect = document.getElementById('item-style');
    const filterSelect = document.querySelector('.filter-select');
    
    if (categorySelect) {
        categorySelect.innerHTML = '<option value="">Select a category...</option>';
        appData.categories.forEach(cat => {
            categorySelect.innerHTML += `<option value="${cat.id}">${cat.icon} ${cat.name}</option>`;
        });
    }
    
    if (colorSelect) {
        colorSelect.innerHTML = '<option value="">Select color...</option>';
        appData.colorOptions.forEach(color => {
            colorSelect.innerHTML += `<option value="${color}">${color}</option>`;
        });
    }
    
    if (styleSelect) {
        styleSelect.innerHTML = '<option value="">Select style...</option>';
        appData.styleOptions.forEach(style => {
            styleSelect.innerHTML += `<option value="${style.id}">${style.icon} ${style.name}</option>`;
        });
    }
    
    if (filterSelect) {
        filterSelect.innerHTML = '<option value="">All Categories</option>';
        appData.categories.forEach(cat => {
            filterSelect.innerHTML += `<option value="${cat.id}">${cat.name}</option>`;
        });
    }
}

// Camera Functions
function startCamera() {
    currentPermissionType = 'camera';
    showPermissionModal('camera', appData.permissionMessages.camera);
}

async function requestCameraPermission() {
    try {
        const constraints = {
            video: {
                facingMode: facingMode,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };
        
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        currentStream = stream;
        
        const video = document.getElementById('camera-video');
        video.srcObject = stream;
        
        const uploadOptions = document.getElementById('upload-options');
        const cameraSection = document.getElementById('camera-section');
        
        uploadOptions.classList.add('hidden');
        cameraSection.classList.remove('hidden');
        
        return true;
    } catch (error) {
        console.error('Camera permission denied:', error);
        alert('Camera access is required to take photos. Please allow camera access or try uploading photos instead.');
        return false;
    }
}

function switchCamera() {
    if (!currentStream) return;
    
    facingMode = facingMode === 'environment' ? 'user' : 'environment';
    stopCamera();
    requestCameraPermission();
}

function stopCamera() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
        currentStream = null;
    }
    
    const uploadOptions = document.getElementById('upload-options');
    const cameraSection = document.getElementById('camera-section');
    
    uploadOptions.classList.remove('hidden');
    cameraSection.classList.add('hidden');
}

function capturePhoto() {
    const video = document.getElementById('camera-video');
    const canvas = document.getElementById('camera-canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob(blob => {
        const reader = new FileReader();
        reader.onload = function(e) {
            showPhotoPreview(e.target.result);
            stopCamera();
        };
        reader.readAsDataURL(blob);
    }, 'image/jpeg', 0.8);
}

// File Upload Functions
function selectFiles() {
    currentPermissionType = 'files';
    showPermissionModal('files', appData.permissionMessages.files);
}

function handlePermissionGrant() {
    if (currentPermissionType === 'camera') {
        closePermissionModal();
        requestCameraPermission();
    } else if (currentPermissionType === 'files') {
        closePermissionModal();
        document.getElementById('file-input').click();
    }
}

function handleFileSelect(event) {
    const files = event.target.files;
    if (files && files.length > 0) {
        const file = files[0];
        
        if (file.type.startsWith('image/')) {
            const reader = new FileReader();
            reader.onload = function(e) {
                showPhotoPreview(e.target.result);
            };
            reader.readAsDataURL(file);
        } else {
            alert('Please select an image file.');
        }
    }
    
    // Reset file input
    event.target.value = '';
}

// Photo Preview Functions
function showPhotoPreview(imageDataUrl) {
    const uploadOptions = document.getElementById('upload-options');
    const preview = document.getElementById('photo-preview');
    const previewImage = document.getElementById('preview-image');
    
    uploadOptions.classList.add('hidden');
    preview.classList.remove('hidden');
    previewImage.src = imageDataUrl;
    
    // Store the image data for saving
    preview.dataset.imageData = imageDataUrl;
}

function retakePhoto() {
    const uploadOptions = document.getElementById('upload-options');
    const preview = document.getElementById('photo-preview');
    
    uploadOptions.classList.remove('hidden');
    preview.classList.add('hidden');
    
    // Clear form
    resetPhotoForm();
}

function resetPhotoForm() {
    document.getElementById('item-name').value = '';
    document.getElementById('item-category').value = '';
    document.getElementById('item-color').value = '';
    document.getElementById('item-style').value = '';
}

function resetAddClothesScreen() {
    const uploadOptions = document.getElementById('upload-options');
    const cameraSection = document.getElementById('camera-section');
    const preview = document.getElementById('photo-preview');
    const successAnimation = document.getElementById('success-animation');
    
    uploadOptions.classList.remove('hidden');
    cameraSection.classList.add('hidden');
    preview.classList.add('hidden');
    successAnimation.classList.add('hidden');
    
    resetPhotoForm();
    stopCamera();
}

// Save to Wardrobe
function saveToWardrobe() {
    const preview = document.getElementById('photo-preview');
    const imageData = preview.dataset.imageData;
    const category = document.getElementById('item-category').value;
    const itemName = document.getElementById('item-name').value;
    const color = document.getElementById('item-color').value;
    const style = document.getElementById('item-style').value;
    
    if (!category) {
        alert('Please select a category for your item.');
        return;
    }
    
    const categoryData = appData.categories.find(c => c.id === category);
    const newItem = {
        id: Date.now(),
        name: itemName || `${categoryData.name} Item`,
        category: category,
        categoryName: categoryData.name,
        color: color || 'Mixed',
        style: style || 'casual',
        image: imageData,
        dateAdded: new Date().toISOString(),
        tags: [categoryData.name, color, style].filter(Boolean)
    };
    
    wardrobeItems.push(newItem);
    saveToStorage();
    
    // Show success animation
    showSuccessAnimation(wardrobeItems.length === 1);
    
    // Return to dashboard after animation
    setTimeout(() => {
        showScreen('dashboard');
    }, 3000);
}

function saveToStorage() {
    try {
        localStorage.setItem('swagai-wardrobe', JSON.stringify(wardrobeItems));
        localStorage.setItem('swagai-outfits', JSON.stringify(savedOutfits));
    } catch (error) {
        console.log('Could not save to localStorage:', error);
    }
}

function showSuccessAnimation(isFirstUpload) {
    const successAnimation = document.getElementById('success-animation');
    const successMessage = document.getElementById('success-message');
    
    if (isFirstUpload) {
        successMessage.textContent = appData.successMessages.firstUpload;
    } else {
        successMessage.textContent = appData.successMessages.photoUploaded;
    }
    
    successAnimation.classList.remove('hidden');
    
    // Hide after 3 seconds
    setTimeout(() => {
        successAnimation.classList.add('hidden');
    }, 3000);
}

// Wardrobe Functions
function loadWardrobe() {
    const emptyState = document.getElementById('wardrobe-empty-state');
    const content = document.getElementById('wardrobe-content');
    const wardrobeGrid = document.getElementById('wardrobe-grid');
    
    if (wardrobeItems.length === 0) {
        emptyState.classList.remove('hidden');
        content.classList.add('hidden');
        return;
    }
    
    emptyState.classList.add('hidden');
    content.classList.remove('hidden');
    
    wardrobeGrid.innerHTML = wardrobeItems.map(item => {
        const categoryData = appData.categories.find(c => c.id === item.category);
        return `
            <div class="wardrobe-item" data-category="${item.category}" data-name="${item.name.toLowerCase()}">
                <div class="item-image">
                    ${item.image ? `<img src="${item.image}" alt="${item.name}">` : `<i class="${categoryIcons[item.category]}"></i>`}
                </div>
                <div class="item-details">
                    <div class="item-name">${item.name}</div>
                    <div class="item-category">${categoryData ? categoryData.name : item.categoryName}</div>
                    <div class="item-tags">
                        ${item.tags.map(tag => `<span class="item-tag">${tag}</span>`).join('')}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

function filterWardrobe() {
    const searchInput = document.querySelector('.search-input');
    const categoryFilter = document.querySelector('.filter-select');
    const items = document.querySelectorAll('.wardrobe-item');
    
    const searchTerm = searchInput.value.toLowerCase();
    const selectedCategory = categoryFilter.value;
    
    items.forEach(item => {
        const itemName = item.dataset.name;
        const itemCategory = item.dataset.category;
        
        const matchesSearch = itemName.includes(searchTerm);
        const matchesCategory = !selectedCategory || itemCategory === selectedCategory;
        
        if (matchesSearch && matchesCategory) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

// Outfit Generator Functions
function loadOutfitGenerator() {
    const emptyState = document.getElementById('outfit-empty-state');
    const generatorForm = document.getElementById('generator-form');
    
    if (wardrobeItems.length < 3) {
        emptyState.classList.remove('hidden');
        generatorForm.classList.add('hidden');
    } else {
        emptyState.classList.add('hidden');
        generatorForm.classList.remove('hidden');
        
        // Reset form
        document.getElementById('day-plans').value = '';
        document.getElementById('ai-loading').classList.add('hidden');
        document.getElementById('outfit-results').classList.add('hidden');
    }
}

function generateOutfits() {
    const dayPlans = document.getElementById('day-plans').value;
    const weather = document.getElementById('weather-select').value;
    
    if (!dayPlans.trim()) {
        alert('Please tell us about your plans for the day!');
        return;
    }
    
    // Show loading
    document.getElementById('generator-form').classList.add('hidden');
    document.getElementById('ai-loading').classList.remove('hidden');
    
    // Simulate AI processing
    setTimeout(() => {
        document.getElementById('ai-loading').classList.add('hidden');
        showGeneratedOutfits(dayPlans, weather);
    }, 2500);
}

function showGeneratedOutfits(dayPlans, weather) {
    const outfitResults = document.getElementById('outfit-results');
    const outfitGrid = document.getElementById('outfit-grid');
    
    // Generate context-aware outfits
    const contextOutfits = generateContextualOutfits(dayPlans, weather);
    
    outfitGrid.innerHTML = contextOutfits.map(outfit => `
        <div class="outfit-card">
            <div class="outfit-header">
                <h4 class="outfit-name">${outfit.name}</h4>
                <div class="outfit-rating">
                    ${Array.from({length: outfit.rating}, () => '<i class="fas fa-star star"></i>').join('')}
                </div>
            </div>
            <div class="outfit-items">
                ${outfit.items.map(item => `
                    <div class="outfit-item" title="${item.name}">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-base);">` : `<i class="${categoryIcons[item.category]}"></i>`}
                    </div>
                `).join('')}
            </div>
            <p class="outfit-description">${outfit.description}</p>
            <div class="outfit-actions">
                <button class="like-btn" onclick="toggleLike(${outfit.id}, this)">
                    <i class="fas fa-thumbs-up"></i>
                </button>
                <button class="dislike-btn" onclick="toggleDislike(${outfit.id}, this)">
                    <i class="fas fa-thumbs-down"></i>
                </button>
                <button class="btn btn--primary btn--sm save-outfit-btn" onclick="saveOutfit(${outfit.id})">
                    <i class="fas fa-bookmark"></i>
                    Save Outfit
                </button>
            </div>
        </div>
    `).join('');
    
    outfitResults.classList.remove('hidden');
    generatedOutfits = contextOutfits;
}

function generateContextualOutfits(dayPlans, weather) {
    const plans = dayPlans.toLowerCase();
    const contextOutfits = [];
    
    // Group items by category
    const itemsByCategory = {};
    wardrobeItems.forEach(item => {
        if (!itemsByCategory[item.category]) {
            itemsByCategory[item.category] = [];
        }
        itemsByCategory[item.category].push(item);
    });
    
    // Generate 3-4 different outfit combinations
    for (let i = 0; i < Math.min(4, Math.max(2, Math.floor(wardrobeItems.length / 3))); i++) {
        const outfit = {
            id: Date.now() + i,
            name: generateOutfitName(plans, i),
            items: [],
            occasion: getOccasionFromPlans(plans),
            description: generateOutfitDescription(plans, weather, i),
            rating: Math.floor(Math.random() * 2) + 4, // 4 or 5 stars
            liked: false,
            saved: false
        };
        
        // Try to include items from different categories
        const usedItems = new Set();
        const categories = Object.keys(itemsByCategory);
        
        // Prioritize tops and bottoms
        if (itemsByCategory.tops && itemsByCategory.tops.length > 0) {
            const top = itemsByCategory.tops[i % itemsByCategory.tops.length];
            if (!usedItems.has(top.id)) {
                outfit.items.push(top);
                usedItems.add(top.id);
            }
        }
        
        if (itemsByCategory.bottoms && itemsByCategory.bottoms.length > 0) {
            const bottom = itemsByCategory.bottoms[i % itemsByCategory.bottoms.length];
            if (!usedItems.has(bottom.id)) {
                outfit.items.push(bottom);
                usedItems.add(bottom.id);
            }
        }
        
        // Add shoes if available
        if (itemsByCategory.shoes && itemsByCategory.shoes.length > 0) {
            const shoe = itemsByCategory.shoes[i % itemsByCategory.shoes.length];
            if (!usedItems.has(shoe.id)) {
                outfit.items.push(shoe);
                usedItems.add(shoe.id);
            }
        }
        
        // Add accessories or outerwear
        ['outerwear', 'accessories'].forEach(cat => {
            if (itemsByCategory[cat] && itemsByCategory[cat].length > 0 && outfit.items.length < 4) {
                const item = itemsByCategory[cat][i % itemsByCategory[cat].length];
                if (!usedItems.has(item.id)) {
                    outfit.items.push(item);
                    usedItems.add(item.id);
                }
            }
        });
        
        // Ensure at least 2 items
        if (outfit.items.length >= 2) {
            contextOutfits.push(outfit);
        }
    }
    
    return contextOutfits;
}

function generateOutfitName(plans, index) {
    const names = [
        "Perfect Day Look",
        "Effortless Style",
        "Confidence Boost",
        "Statement Maker",
        "Comfort Chic",
        "Modern Classic"
    ];
    
    if (plans.includes('meeting') || plans.includes('work')) {
        return ["Professional Power", "Executive Excellence", "Business Boss"][index % 3];
    }
    if (plans.includes('date') || plans.includes('dinner')) {
        return ["Evening Elegance", "Date Night Magic", "Dinner Delight"][index % 3];
    }
    if (plans.includes('casual') || plans.includes('friend')) {
        return ["Casual Cool", "Weekend Vibes", "Effortless Chic"][index % 3];
    }
    
    return names[index % names.length];
}

function getOccasionFromPlans(plans) {
    if (plans.includes('meeting') || plans.includes('work')) return "Professional";
    if (plans.includes('date') || plans.includes('dinner')) return "Evening Out";
    if (plans.includes('casual') || plans.includes('friend')) return "Casual";
    return "Everyday";
}

function generateOutfitDescription(plans, weather, index) {
    const descriptions = [
        "A perfect combination that works beautifully for your day!",
        "Stylish and comfortable - you'll look amazing!",
        "This outfit captures your unique style perfectly!",
        "Effortlessly chic and totally you!"
    ];
    
    return descriptions[index % descriptions.length];
}

// Outfit Interaction Functions
function toggleLike(outfitId, button) {
    const outfit = generatedOutfits.find(o => o.id === outfitId);
    if (outfit) {
        outfit.liked = !outfit.liked;
        button.classList.toggle('active');
        
        // Remove dislike if like is active
        if (outfit.liked) {
            const dislikeBtn = button.nextElementSibling;
            dislikeBtn.classList.remove('active');
        }
    }
}

function toggleDislike(outfitId, button) {
    const outfit = generatedOutfits.find(o => o.id === outfitId);
    if (outfit) {
        const isDisliked = button.classList.contains('active');
        button.classList.toggle('active');
        
        // Remove like if dislike is active
        if (!isDisliked) {
            const likeBtn = button.previousElementSibling;
            likeBtn.classList.remove('active');
        }
    }
}

function saveOutfit(outfitId) {
    const outfit = generatedOutfits.find(o => o.id === outfitId);
    if (outfit && !outfit.saved) {
        outfit.saved = true;
        outfit.createdAt = new Date().toISOString().split('T')[0];
        savedOutfits.push(outfit);
        saveToStorage();
        
        // Update button
        const saveBtn = event.target.closest('button');
        saveBtn.innerHTML = '<i class="fas fa-check"></i> Saved!';
        saveBtn.disabled = true;
        saveBtn.style.opacity = '0.7';
        
        updateDashboardStats();
    }
}

// Saved Outfits Functions
function loadSavedOutfits() {
    const savedOutfitsGrid = document.getElementById('saved-outfits-grid');
    
    if (savedOutfits.length === 0) {
        savedOutfitsGrid.innerHTML = `
            <div class="empty-state">
                <div class="empty-icon">
                    <i class="fas fa-bookmark"></i>
                </div>
                <h3>No saved outfits yet! 📌</h3>
                <p>Generate some outfits and save your favorites!</p>
                <button class="btn btn--primary" onclick="showScreen('outfit-generator')">
                    <i class="fas fa-magic"></i>
                    Generate Outfits
                </button>
            </div>
        `;
        return;
    }
    
    savedOutfitsGrid.innerHTML = savedOutfits.map(outfit => `
        <div class="saved-outfit-card">
            <div class="saved-outfit-header">
                <h4 class="outfit-name">${outfit.name}</h4>
                <span class="saved-outfit-date">${formatDate(outfit.createdAt)}</span>
            </div>
            <div class="outfit-items">
                ${outfit.items.map(item => `
                    <div class="outfit-item" title="${item.name}">
                        ${item.image ? `<img src="${item.image}" alt="${item.name}" style="width:100%;height:100%;object-fit:cover;border-radius:var(--radius-base);">` : `<i class="${categoryIcons[item.category]}"></i>`}
                    </div>
                `).join('')}
            </div>
            <p class="outfit-description">${outfit.description}</p>
            <div class="outfit-actions">
                <div class="outfit-rating">
                    ${Array.from({length: outfit.rating}, () => '<i class="fas fa-star star"></i>').join('')}
                </div>
                <button class="btn btn--outline btn--sm" onclick="removeFromSaved(${outfit.id})">
                    <i class="fas fa-trash"></i>
                    Remove
                </button>
            </div>
        </div>
    `).join('');
}

function removeFromSaved(outfitId) {
    if (confirm('Remove this outfit from your saved collection?')) {
        savedOutfits = savedOutfits.filter(outfit => outfit.id !== outfitId);
        saveToStorage();
        loadSavedOutfits();
        updateDashboardStats();
    }
}

// Permission Modal Functions
function showPermissionModal(type, message) {
    const modal = document.getElementById('permission-modal');
    const title = document.getElementById('permission-title');
    const icon = document.getElementById('permission-icon');
    const messageEl = document.getElementById('permission-message');
    
    if (type === 'camera') {
        title.textContent = 'Camera Access';
        icon.className = 'fas fa-camera';
    } else {
        title.textContent = 'Photo Access';
        icon.className = 'fas fa-upload';
    }
    
    messageEl.textContent = message;
    modal.classList.remove('hidden');
}

function closePermissionModal() {
    const modal = document.getElementById('permission-modal');
    modal.classList.add('hidden');
    currentPermissionType = null;
}

// Utility Functions
function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = Math.abs(today - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    
    return date.toLocaleDateString();
}

// Clean up camera on page unload
window.addEventListener('beforeunload', function() {
    if (currentStream) {
        currentStream.getTracks().forEach(track => track.stop());
    }
});

// Handle orientation change for mobile
window.addEventListener('orientationchange', function() {
    setTimeout(() => {
        if (currentStream) {
            // Refresh camera stream on orientation change
            const video = document.getElementById('camera-video');
            if (video.srcObject) {
                video.play();
            }
        }
    }, 500);
});