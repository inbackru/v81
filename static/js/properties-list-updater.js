// ✅ PROPERTIES LIST DYNAMIC UPDATER - VERSION 1761859200
console.log('📋 PROPERTIES-LIST-UPDATER.JS LOADED');

// Функция для обновления списка объектов
window.updatePropertiesList = function(properties) {
    console.log('🔄 updatePropertiesList called with', properties.length, 'properties');
    
    const container = document.getElementById('properties-container');
    if (!container) {
        console.error('❌ properties-container not found!');
        return;
    }
    
    // Очищаем контейнер (только для AJAX обновлений)
    console.log('🔄 Clearing container for AJAX update');
    container.innerHTML = '';
    
    // Рендерим каждую карточку
    properties.forEach((property, index) => {
        const card = renderPropertyCard(property, index);
        container.appendChild(card);
    });
    
    if (window.favoritesManager && typeof window.favoritesManager.updateFavoritesUI === 'function') {
        window.favoritesManager.updateFavoritesUI();
        window.favoritesManager.updateComplexFavoritesUI();
    }
    
    if (typeof window.initializeComparisonButtons === 'function') {
        window.initializeComparisonButtons();
    }
    if (window.comparisonManager && typeof window.comparisonManager.updateComparisonUI === 'function') {
        window.comparisonManager.updateComparisonUI();
    }
    
    if (typeof window.initializeImageCarousels === 'function') {
        window.initializeImageCarousels();
    }
    
    initCarouselSwipeHandlers();
    
    // PDF кнопки и Presentation модал работают через onclick атрибуты - не требуют реинициализации
    // Клики на карточки уже добавлены в renderPropertyCard() выше
    
    // ✅ ИСПРАВЛЕНИЕ: Применяем текущий режим отображения (list/grid)
    if (typeof window.currentViewMode !== 'undefined') {
        if (window.currentViewMode === 'list' && typeof window.switchToListView === 'function') {
            console.log('🔄 Applying LIST view after AJAX update');
            window.switchToListView();
        } else if (window.currentViewMode === 'grid' && typeof window.switchToGridView === 'function') {
            console.log('🔄 Applying GRID view after AJAX update');
            window.switchToGridView();
        }
    }
    
    console.log('✅ List updated with', properties.length, 'properties');
};

// Функция для рендеринга одной карточки объекта - ПОЛНОСТЬЮ ИДЕНТИЧНА templates/properties.html
function renderPropertyCard(property, index) {
    const card = document.createElement('div');
    card.className = 'property-card bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden w-full cursor-pointer';
    
    // Все data-атрибуты ИДЕНТИЧНО оригиналу
    card.setAttribute('data-property-url', `/object/${property.id}`);
    card.setAttribute('data-type', property.type || 'apartment');
    card.setAttribute('data-rooms', property.rooms || 0);
    card.setAttribute('data-price', property.price || 0);
    card.setAttribute('data-district', property.district || '');
    card.setAttribute('data-developer', property.developer || '');
    card.setAttribute('data-complex', property.residential_complex || property.complex_name || 'Не указан');
    card.setAttribute('data-property-type', property.property_type || property.type || 'apartment');
    card.setAttribute('data-completion', property.completion_date || '2024');
    card.setAttribute('data-area', property.area || 0);
    card.setAttribute('data-floor', property.floor || 0);
    card.setAttribute('data-mortgage', property.mortgage_available !== undefined ? property.mortgage_available : 'true');
    card.setAttribute('data-installment', property.installment_available !== undefined ? property.installment_available : 'false');
    card.setAttribute('data-maternal-capital', property.maternal_capital !== undefined ? property.maternal_capital : 'false');
    card.setAttribute('data-trade-in', property.trade_in !== undefined ? property.trade_in : 'false');
    card.setAttribute('data-cashback', property.cashback_available !== undefined ? property.cashback_available : 'true');
    
    // Подготовка данных для галереи (максимум 4 изображения)
    const gallery = property.gallery && property.gallery.length > 0 ? property.gallery.slice(0, 4) : [property.image || 'https://via.placeholder.com/320x280/f3f4f6/9ca3af?text=Фото+недоступно'];
    const hasMultipleImages = gallery.length > 1;
    
    // Формируем описание комнат
    const roomDescription = property.rooms == 0 ? 'Студия' : `${property.rooms}-комн`;
    
    // === Carousel slides - translateX-based sliding ===
    const carouselSlidesHTML = `
        <div class="carousel-track" style="display:flex;width:${gallery.length * 100}%;transform:translateX(0);will-change:transform;" data-index="0" data-count="${gallery.length}">
            ${gallery.map((image, idx) => `
                <div class="carousel-slide" style="width:${100/gallery.length}%;flex-shrink:0;height:100%;" data-slide="${idx}">
                    <img src="${escapeHtml(image)}" 
                         alt="${roomDescription} ${property.area} м² - фото ${idx + 1}" 
                         class="w-full h-full object-cover" 
                         draggable="false"
                         style="user-select:none;-webkit-user-drag:none;-webkit-touch-callout:none;pointer-events:none;"
                         loading="lazy">
                </div>
            `).join('')}
        </div>
    `;
    
    // Dots - always visible on mobile, hover on desktop
    const dotsHTML = hasMultipleImages ? `
        <div class="carousel-dots absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity z-10">
            ${gallery.map((_, idx) => `
                <button onclick="event.stopPropagation(); event.preventDefault(); window.carouselGoTo(this.closest('.carousel-container'), ${idx});" 
                        class="carousel-dot w-2.5 h-2.5 rounded-full ${idx === 0 ? 'bg-white' : 'bg-white/50'} hover:bg-white transition-colors" 
                        data-slide="${idx}"></button>
            `).join('')}
        </div>
    ` : '';
    
    // Navigation arrows (desktop only - hidden on mobile)
    const navigationHTML = hasMultipleImages ? `
        <button onclick="event.stopPropagation(); event.preventDefault(); window.carouselPrev(this.closest('.carousel-container'));" 
                class="hidden sm:flex absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
        </button>
        <button onclick="event.stopPropagation(); event.preventDefault(); window.carouselNext(this.closest('.carousel-container'));" 
                class="hidden sm:flex absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-black/50 hover:bg-black/70 text-white rounded-full items-center justify-center transition-all opacity-0 group-hover:opacity-100 z-10">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
        </button>
    ` : '';
    
    // Определяем, является ли пользователь менеджером
    const isManager = Boolean(window.manager_authenticated);
    
    // Формируем цену и ипотеку
    const priceHTML = property.price && property.price > 0 ? `
        <div class="text-2xl font-bold text-gray-900">
            ${formatNumber(property.price)} ₽
        </div>
        <div class="flex items-center gap-2 flex-wrap">
            <div class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">
                от ${formatNumber(Math.floor((property.price * 0.05) / 12))} ₽/мес ипотека
            </div>
            ${property.cashback && property.cashback > 0 ? `
            <div class="bg-blue-100 text-blue-700 text-xs px-2 py-1 rounded font-medium">
                Кэшбек до ${formatNumber(property.cashback)} ₽
            </div>
            ` : ''}
        </div>
    ` : `
        <div class="text-2xl font-bold text-gray-900">
            Цена по запросу
        </div>
    `;
    
    // Кнопка презентации (только для менеджеров)
    const presentationButtonHTML = isManager ? `
        <button class="presentation-btn w-10 h-10 bg-white border border-purple-300 rounded flex items-center justify-center text-purple-600 hover:bg-purple-50 hover:border-purple-400 hover:text-purple-700 hover:scale-105 transition-all duration-200" 
                data-property-id="${property.id}" 
                title="Добавить в презентацию" 
                onclick="window.openPresentationModal('${property.id}'); event.stopPropagation();">
            <i class="fas fa-plus"></i>
        </button>
    ` : '';
    
    // Dynamic phone for mobile action bar
    const phoneNumber = property.manager_phone || property.phone || '+78622666216';
    
    // Формируем HTML карточки - mobile-responsive version
    card.innerHTML = `
        <!-- Image Section -->
        <div class="relative w-full sm:w-80 h-[200px] sm:h-60 flex-shrink-0 group">
            <!-- Unified carousel for mobile + desktop -->
            <div class="carousel-container w-full h-full relative overflow-hidden bg-gray-100 sm:rounded-lg" 
                 data-property-id="${property.id}"
                 style="touch-action:pan-y;cursor:grab;user-select:none;">
                ${carouselSlidesHTML}
                ${navigationHTML}
                ${dotsHTML}
            </div>
            
            <!-- Blue Cashback Badge (hidden on mobile) -->
            <div class="hidden sm:block absolute top-3 left-3 bg-blue-600 text-white text-xs font-medium px-2 py-1 rounded z-20">
                Кэшбек до ${formatNumber(property.cashback || 0)} ₽
            </div>
            
            <!-- Favorite Icons Container -->
            <div class="absolute top-3 right-3 flex gap-2 z-20">
                <div class="w-8 h-8 bg-white/90 hover:bg-white rounded-full flex items-center justify-center shadow cursor-pointer favorite-heart z-20" 
                     data-property-id="${property.id}" 
                     title="Добавить в избранное" 
                     onclick="if(window.favoritesManager) { window.favoritesManager.toggleFavorite('${property.id}', this); event.stopPropagation(); }">
                    <i class="fas fa-heart text-gray-400 hover:text-red-500 text-sm transition-colors"></i>
                </div>
            </div>
        </div>
        
        <!-- Content Section -->
        <div class="flex-1 p-4 sm:p-6 flex flex-col">
            <!-- Title -->
            <h2 class="text-lg sm:text-xl font-semibold text-gray-900 mb-2 sm:mb-3">
                ${roomDescription}, ${property.area} м², ${property.floor}/${property.total_floors} эт.
            </h2>
            
            <!-- Complex and Location -->
            <div class="mb-1 sm:mb-2">
                ${property.residential_complex || property.complex_name ? `
                    <a href="/residential-complex/${escapeHtml(property.residential_complex || property.complex_name)}" 
                       class="text-blue-600 hover:text-blue-700 hover:underline text-sm font-medium" 
                       onclick="event.stopPropagation();">
                        ${escapeHtml(property.residential_complex || property.complex_name)}
                    </a>
                ` : `
                    <span class="text-gray-700 text-sm font-medium">
                        ЖК не указан
                    </span>
                `}
                <span class="text-blue-600 text-sm"> • Краснодарский край</span>
            </div>
            
            <!-- Address (hidden on mobile) -->
            <div class="hidden sm:block text-gray-500 text-sm mb-2">
                ${escapeHtml(property.address || '')}
            </div>
            
            <!-- Developer (hidden on mobile) -->
            <div class="hidden sm:block text-gray-700 text-sm mb-4">
                <span class="font-medium">Застройщик:</span> ${escapeHtml(property.developer || property.developer_name || '')}
            </div>
            
            <!-- Tags (hidden on mobile) -->
            <div class="hidden sm:flex gap-2 mb-4">
                <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">${property.floor}-й этаж</span>
                <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">${escapeHtml(property.renovation_display_name || 'Без отделки')}</span>
                <span class="bg-gray-100 text-gray-700 px-2 py-1 rounded text-xs">${escapeHtml(property.complex_object_class_display_name || 'Комфорт')}</span>
            </div>
            
            <div class="flex-1"></div>
            
            <!-- Price + Desktop Action Buttons -->
            <div class="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 sm:gap-4">
                <div class="flex flex-col gap-1 sm:gap-2">
                    ${priceHTML}
                </div>
                <div class="hidden sm:flex items-center gap-2 flex-shrink-0">
                <button class="map-btn w-10 h-10 bg-[#0088CC]/10 hover:bg-[#0088CC] rounded-full flex items-center justify-center text-[#0088CC] hover:text-white hover:scale-105 transition-all duration-200 shadow-sm" 
                        data-property-id="${property.id}" 
                        data-lat="${property.latitude || 45.0355}" 
                        data-lon="${property.longitude || 38.9753}" 
                        data-name="${escapeHtml(property.complex_name || property.residential_complex || '')}" 
                        title="Показать на карте">
                    <i class="fas fa-map-marker-alt"></i>
                </button>
                <a href="/object/${property.id}/pdf" target="_blank" 
                   class="w-10 h-10 bg-[#0088CC]/10 hover:bg-[#0088CC] rounded-full flex items-center justify-center text-[#0088CC] hover:text-white hover:scale-105 transition-all duration-200 shadow-sm" 
                   title="Скачать PDF" 
                   onclick="event.stopPropagation();">
                    <i class="fas fa-file-pdf"></i>
                </a>
                <button class="compare-btn w-10 h-10 bg-[#0088CC]/10 hover:bg-[#0088CC] rounded-full flex items-center justify-center text-[#0088CC] hover:text-white hover:scale-105 transition-all duration-200 shadow-sm" 
                        data-property-id="${property.id}" 
                        title="Добавить к сравнению">
                    <i class="fas fa-balance-scale"></i>
                </button>
                ${presentationButtonHTML}
                </div>
            </div>
            
            <!-- Mobile Action Bar -->
            <div class="mobile-action-bar flex sm:hidden items-center justify-between mt-2 pt-2 border-t border-gray-100 relative z-20" style="pointer-events:auto;">
                <button class="mobile-call-btn flex items-center gap-1.5 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium shadow-sm"
                   style="touch-action:manipulation;pointer-events:auto;"
                   data-phone="${escapeHtml(phoneNumber)}"
                   data-property-id="${property.id}"
                   data-complex-name="${escapeHtml(property.complex_name || property.residential_complex || '')}"
                   onclick="event.stopPropagation();event.stopImmediatePropagation();openPhoneModal(this.dataset.propertyId, this.dataset.complexName);">
                    <i class="fas fa-phone text-xs"></i> Позвонить
                </button>
                <div class="flex gap-2" style="pointer-events:auto;">
                    <button class="map-btn w-9 h-9 bg-[#0088CC]/10 rounded-full flex items-center justify-center text-[#0088CC] text-sm"
                            data-property-id="${property.id}" 
                            data-lat="${property.latitude || 45.0355}" 
                            data-lon="${property.longitude || 38.9753}"
                            data-name="${escapeHtml(property.complex_name || property.residential_complex || '')}"
                            title="Карта" style="touch-action:manipulation;" 
                            onclick="event.stopPropagation();event.stopImmediatePropagation();openMapModal(parseFloat(this.dataset.lat), parseFloat(this.dataset.lon), this.dataset.name || 'Расположение');">
                        <i class="fas fa-map-marker-alt"></i>
                    </button>
                    <a href="/object/${property.id}/pdf" target="_blank" 
                       class="w-9 h-9 bg-[#0088CC]/10 rounded-full flex items-center justify-center text-[#0088CC] text-sm"
                       title="PDF" style="touch-action:manipulation;" onclick="event.stopPropagation();event.stopImmediatePropagation();">
                        <i class="fas fa-file-pdf"></i>
                    </a>
                    <button class="compare-btn w-9 h-9 bg-[#0088CC]/10 rounded-full flex items-center justify-center text-[#0088CC] text-sm"
                            data-property-id="${property.id}"
                            title="Сравнить" style="touch-action:manipulation;" onclick="event.stopPropagation();event.stopImmediatePropagation();">
                        <i class="fas fa-balance-scale"></i>
                    </button>
                </div>
            </div>
        </div>
    `;
    
    card.addEventListener('click', function(e) {
        if (e.target.closest('.mobile-action-bar') || e.target.closest('button') || e.target.closest('a') || e.target.closest('.carousel-container')) return;
        if (e.defaultPrevented) return;
        window.location.href = `/object/${property.id}`;
    });
    
    return card;
}

// Вспомогательная функция для экранирования HTML
function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Функция для обновления пагинации
window.updatePagination = function(pagination) {
    console.log('📄 updatePagination called:', pagination);
    
    // Обновляем счетчик "Найдено X объектов"
    const resultsCount = document.getElementById('results-count');
    if (resultsCount) {
        resultsCount.textContent = pagination.total;
        console.log('✅ Updated results-count to', pagination.total);
    }
    
    // Обновляем счетчик resultsCounter (статичный счётчик в filter chips)
    const resultsCounter = document.getElementById('resultsCounter');
    if (resultsCounter) {
        // Функция склонения слова "объект"
        const getObjectWord = (count) => {
            if (count % 100 >= 11 && count % 100 <= 14) return "объектов";
            switch (count % 10) {
                case 1: return "объект";
                case 2: case 3: case 4: return "объекта";
                default: return "объектов";
            }
        };
        resultsCounter.textContent = `${pagination.total} ${getObjectWord(pagination.total)}`;
        console.log('✅ Updated resultsCounter to', pagination.total);
    }
    
    // Обновляем счетчик на кнопке "Показать на карте" (если есть)
    const counters = document.querySelectorAll('.properties-count');
    counters.forEach(counter => {
        counter.textContent = pagination.total;
    });
    
    // Обновляем пагинацию
    const paginationContainer = document.querySelector('.pagination');
    if (!paginationContainer) {
        console.warn('⚠️ Pagination container not found');
        return;
    }
    
    if (pagination.total_pages <= 1) {
        paginationContainer.innerHTML = '';
        return;
    }
    
    let html = '<div class="flex justify-center items-center gap-2 mt-8">';
    
    // Previous button
    if (pagination.has_prev) {
        html += `<a href="?page=${pagination.page - 1}" class="pagination-link px-4 py-2 rounded bg-white border border-gray-300 hover:bg-gray-50" data-page="${pagination.page - 1}">Назад</a>`;
    }
    
    // Page numbers
    const maxPages = 7;
    let startPage = Math.max(1, pagination.page - Math.floor(maxPages / 2));
    let endPage = Math.min(pagination.total_pages, startPage + maxPages - 1);
    
    if (endPage - startPage < maxPages - 1) {
        startPage = Math.max(1, endPage - maxPages + 1);
    }
    
    for (let i = startPage; i <= endPage; i++) {
        if (i === pagination.page) {
            html += `<span class="px-4 py-2 rounded bg-blue-600 text-white font-semibold">${i}</span>`;
        } else {
            html += `<a href="?page=${i}" class="pagination-link px-4 py-2 rounded bg-white border border-gray-300 hover:bg-gray-50" data-page="${i}">${i}</a>`;
        }
    }
    
    // Next button
    if (pagination.has_next) {
        html += `<a href="?page=${pagination.page + 1}" class="pagination-link px-4 py-2 rounded bg-white border border-gray-300 hover:bg-gray-50" data-page="${pagination.page + 1}">Вперёд</a>`;
    }
    
    html += '</div>';
    paginationContainer.innerHTML = html;
    
    // Добавляем обработчики клика на ссылки пагинации
    attachPaginationHandlers();
    
    console.log('✅ Pagination updated');
};

// Функция для прикрепления обработчиков к ссылкам пагинации
function attachPaginationHandlers() {
    const links = document.querySelectorAll('.pagination-link');
    links.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            const page = this.getAttribute('data-page');
            loadPage(page);
        });
    });
}

// Функция для загрузки конкретной страницы
function loadPage(page) {
    console.log('📄 Loading page:', page);
    
    showLoadingIndicator();
    
    const currentUrl = new URLSearchParams(window.location.search);
    currentUrl.set('page', page);
    if (window.currentCityId && !currentUrl.has('city_id')) {
        currentUrl.set('city_id', window.currentCityId);
    }
    
    const apiUrl = '/api/properties/list?' + currentUrl.toString();
    
    fetch(apiUrl)
        .then(response => response.json())
        .then(data => {
            if (data.success && data.properties) {
                updatePropertiesList(data.properties);
                updatePagination(data.pagination);
                
                const newUrl = window.location.pathname + '?' + currentUrl.toString();
                window.history.pushState({}, '', newUrl);
                
                scrollToPropertiesList();
            }
            hideLoadingIndicator();
        })
        .catch(error => {
            console.error('❌ Error loading page:', error);
            hideLoadingIndicator();
        });
}

// Вспомогательная функция для форматирования чисел
function formatNumber(num) {
    if (!num) return '0';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

// Вспомогательные функции для индикатора загрузки и скролла
// (определены в properties-sorting.js, но добавляем проверку на существование)
function showLoadingIndicator() {
    if (typeof window.showLoadingIndicator === 'undefined') {
        const container = document.getElementById('properties-container');
        if (container) {
            container.style.opacity = '0.5';
            container.style.pointerEvents = 'none';
        }
    }
}

function hideLoadingIndicator() {
    if (typeof window.hideLoadingIndicator === 'undefined') {
        const container = document.getElementById('properties-container');
        if (container) {
            container.style.opacity = '1';
            container.style.pointerEvents = 'auto';
        }
    }
}

function scrollToPropertiesList() {
    const container = document.getElementById('properties-container');
    if (container) {
        const offset = 100;
        const top = container.getBoundingClientRect().top + window.pageYOffset - offset;
        window.scrollTo({ top: top, behavior: 'smooth' });
    }
}

// Функция для переинициализации функционала карточек без изменения DOM
function reinitializeCardFeatures() {
    console.log('🔄 Reinitializing card features without DOM changes');
    
    if (window.favoritesManager && typeof window.favoritesManager.updateFavoritesUI === 'function') {
        window.favoritesManager.updateFavoritesUI();
        window.favoritesManager.updateComplexFavoritesUI();
    }
    
    if (typeof window.initializeComparisonButtons === 'function') {
        console.log('🔄 Reinitializing comparison buttons...');
        window.initializeComparisonButtons();
    }
    
    // Инициализация image carousel для SSR карточек
    if (typeof window.initializeImageCarousels === 'function') {
        console.log('🔄 Initializing image carousels for SSR cards...');
        window.initializeImageCarousels();
    }
    
    console.log('✅ Card features reinitialized');
}


// === Transform-based carousel: smooth sliding that follows finger ===

function carouselUpdateDots(container, index) {
    var dots = container.querySelectorAll('.carousel-dot');
    dots.forEach(function(dot, i) {
        if (i === index) { dot.classList.remove('bg-white/50'); dot.classList.add('bg-white'); }
        else { dot.classList.remove('bg-white'); dot.classList.add('bg-white/50'); }
    });
}

function carouselGoTo(container, index) {
    var track = container.querySelector('.carousel-track');
    if (!track) return;
    var count = parseInt(track.dataset.count) || 1;
    if (index < 0) index = 0;
    if (index >= count) index = count - 1;
    track.dataset.index = index;
    track.style.transition = 'transform 0.3s ease';
    track.style.transform = 'translateX(-' + (index * (100 / count)) + '%)';
    carouselUpdateDots(container, index);
}
window.carouselGoTo = carouselGoTo;

window.carouselNext = function(container) {
    var track = container.querySelector('.carousel-track');
    if (!track) return;
    var idx = parseInt(track.dataset.index) || 0;
    var count = parseInt(track.dataset.count) || 1;
    carouselGoTo(container, (idx + 1) % count);
};

window.carouselPrev = function(container) {
    var track = container.querySelector('.carousel-track');
    if (!track) return;
    var idx = parseInt(track.dataset.index) || 0;
    var count = parseInt(track.dataset.count) || 1;
    carouselGoTo(container, (idx - 1 + count) % count);
};

function initCarouselSwipeHandlers() {
    var containers = document.querySelectorAll('.carousel-container');
    containers.forEach(function(container) {
        if (container._swipeReady) return;
        container._swipeReady = true;
        var track = container.querySelector('.carousel-track');
        if (!track) return;
        
        var startX = 0, startY = 0, currentDelta = 0, isSwiping = false, isDragging = false;
        var count = parseInt(track.dataset.count) || 1;
        var slideWidthPercent = 100 / count;

        container.addEventListener('touchstart', function(e) {
            track.style.transition = 'none';
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            currentDelta = 0;
            isSwiping = false;
            isDragging = false;
        }, {passive: true});
        
        container.addEventListener('touchmove', function(e) {
            var dx = e.touches[0].clientX - startX;
            var dy = e.touches[0].clientY - startY;
            if (!isDragging && Math.abs(dy) > Math.abs(dx) && Math.abs(dy) > 10) {
                return;
            }
            if (Math.abs(dx) > 8) {
                isDragging = true;
                isSwiping = true;
                e.preventDefault();
            }
            if (isDragging) {
                currentDelta = dx;
                var idx = parseInt(track.dataset.index) || 0;
                var baseOffset = -(idx * slideWidthPercent);
                var dragPercent = (dx / container.offsetWidth) * slideWidthPercent;
                track.style.transform = 'translateX(' + (baseOffset + dragPercent) + '%)';
            }
        }, {passive: false});
        
        container.addEventListener('touchend', function(e) {
            if (!isDragging) return;
            var idx = parseInt(track.dataset.index) || 0;
            var threshold = container.offsetWidth * 0.2;
            if (currentDelta < -threshold && idx < count - 1) {
                carouselGoTo(container, idx + 1);
            } else if (currentDelta > threshold && idx > 0) {
                carouselGoTo(container, idx - 1);
            } else {
                carouselGoTo(container, idx);
            }
        }, {passive: true});
        
        container.addEventListener('touchcancel', function() {
            var idx = parseInt(track.dataset.index) || 0;
            carouselGoTo(container, idx);
        }, {passive: true});

        var mouseDown = false, mouseStartX = 0;
        container.addEventListener('mousedown', function(e) {
            e.preventDefault();
            mouseDown = true;
            isSwiping = false;
            mouseStartX = e.clientX;
            currentDelta = 0;
            track.style.transition = 'none';
            container.style.cursor = 'grabbing';
        });
        container.addEventListener('mousemove', function(e) {
            if (!mouseDown) return;
            var dx = e.clientX - mouseStartX;
            currentDelta = dx;
            if (Math.abs(dx) > 8) isSwiping = true;
            if (isSwiping) {
                var idx = parseInt(track.dataset.index) || 0;
                var baseOffset = -(idx * slideWidthPercent);
                var dragPercent = (dx / container.offsetWidth) * slideWidthPercent;
                track.style.transform = 'translateX(' + (baseOffset + dragPercent) + '%)';
            }
        });
        container.addEventListener('mouseup', function(e) {
            if (!mouseDown) return;
            mouseDown = false;
            container.style.cursor = '';
            if (!isSwiping) return;
            var idx = parseInt(track.dataset.index) || 0;
            var threshold = container.offsetWidth * 0.2;
            if (currentDelta < -threshold && idx < count - 1) {
                carouselGoTo(container, idx + 1);
            } else if (currentDelta > threshold && idx > 0) {
                carouselGoTo(container, idx - 1);
            } else {
                carouselGoTo(container, idx);
            }
        });
        container.addEventListener('mouseleave', function() {
            if (mouseDown) {
                mouseDown = false;
                container.style.cursor = '';
                var idx = parseInt(track.dataset.index) || 0;
                carouselGoTo(container, idx);
            }
        });
        
        container.addEventListener('click', function(e) {
            if (isSwiping) {
                e.preventDefault();
                e.stopPropagation();
                setTimeout(function() { isSwiping = false; }, 100);
            }
        }, true);
    });
    console.log('📱 Carousel swipe handlers initialized for', containers.length, 'containers');
}
window.initCarouselSwipeHandlers = initCarouselSwipeHandlers;

// Export renderPropertyCard for use in infinite-scroll.js
window.renderPropertyCard = renderPropertyCard;

console.log('✅ properties-list-updater.js loaded');
