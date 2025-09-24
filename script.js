class CatholicExplorer {
    constructor() {
        this.baseUrl = 'https://bible-api.com';
        this.currentQuery = '';
        this.isLoading = false;
        this.favorites = JSON.parse(localStorage.getItem('catholicFavorites')) || [];
        this.requestCount = 0;
        this.lastRequestTime = Date.now();
        
    
        this.popularVerses = [
            'john 3:16',
            'psalm 23:1',
            'philippians 4:13',
            'romans 8:28',
            'matthew 28:20',
            '1 corinthians 13:4-7',
            'jeremiah 29:11',
            'isaiah 40:31',
            'psalm 46:10',
            'proverbs 3:5-6',
            'matthew 11:28',
            'joshua 1:9'
        ];
        
        this.initElements();
        this.init();
    }

    initElements() {
        this.searchInputEl = document.getElementById('searchInput');
        this.searchBtnEl = document.getElementById('searchBtn');
        this.randomVerseBtnEl = document.getElementById('randomVerseBtn');
        this.verseOfDayBtnEl = document.getElementById('verseOfDayBtn');
        this.versesGridEl = document.getElementById('versesGrid');
        this.versesLoadingEl = document.getElementById('versesLoading');
        this.loadMoreBtnEl = document.getElementById('loadMoreBtn');
        this.sectionTitleEl = document.getElementById('sectionTitle');
        this.favoritesBtnEl = document.getElementById('favoritesBtn');
        this.favoritesCountEl = document.getElementById('favoritesCount');
        this.modalOverlayEl = document.getElementById('modalOverlay');
        this.closeModalBtnEl = document.getElementById('closeModalBtn');
        this.favoritesGridEl = document.getElementById('favoritesGrid');
        this.emptyFavoritesEl = document.getElementById('emptyFavorites');
    }

    init() {
        this.setupEventListeners();
        this.updateFavoritesCount();
        this.loadPopularVerses();
    }

    setupEventListeners() {
        this.searchBtnEl.addEventListener('click', () => this.handleSearch());
        this.searchInputEl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        this.randomVerseBtnEl.addEventListener('click', () => this.getRandomVerse());
        this.verseOfDayBtnEl.addEventListener('click', () => this.getVerseOfDay());
        this.loadMoreBtnEl.addEventListener('click', () => this.loadMoreVerses());
        
        this.favoritesBtnEl.addEventListener('click', () => this.openFavoritesModal());
        this.closeModalBtnEl.addEventListener('click', () => this.closeFavoritesModal());
        this.modalOverlayEl.addEventListener('click', (e) => {
            if (e.target === this.modalOverlayEl) {
                this.closeFavoritesModal();
            }
        });
    }

    async handleSearch() {
        const query = this.searchInputEl.value.trim();
        if (!query) {
            this.showError('Por favor, digite uma referência bíblica.');
            return;
        }

        this.currentQuery = query;
        this.sectionTitleEl.textContent = `Resultados para "${query}"`;
        this.clearVerses();
        this.showLoading();

        try {
            await this.searchVerse(query);
        } catch (error) {
            this.showError('Erro ao buscar versículo. Verifique a referência e tente novamente.');
            console.error('Search error:', error);
        }
    }

    async searchVerse(query) {
        if (!this.canMakeRequest()) {
            this.showError('Muitas requisições. Aguarde alguns segundos e tente novamente.');
            return;
        }

        const url = `${this.baseUrl}/${encodeURIComponent(query)}?translation=almeida`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Versículo não encontrado');
            }
            
            const data = await response.json();
            this.displaySingleVerse(data);
        } catch (error) {
            throw error;
        } finally {
            this.hideLoading();
        }
    }

    async getRandomVerse() {
        this.sectionTitleEl.textContent = 'Versículo Aleatório';
        this.clearVerses();
        this.showLoading();

        try {
            if (!this.canMakeRequest()) {
                this.showError('Muitas requisições. Aguarde alguns segundos e tente novamente.');
                return;
            }

            const url = `${this.baseUrl}/data/almeida/random`;
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error('Erro ao buscar versículo aleatório');
            }
            
            const data = await response.json();
            this.displaySingleVerse(data);
        } catch (error) {
            this.showError('Erro ao buscar versículo aleatório. Tente novamente.');
            console.error('Random verse error:', error);
        } finally {
            this.hideLoading();
        }
    }

    async getVerseOfDay() {
        // Use a seed based on current date to get consistent "verse of the day"
        const today = new Date();
        const dayOfYear = Math.floor((today - new Date(today.getFullYear(), 0, 0)) / 1000 / 60 / 60 / 24);
        const verseIndex = dayOfYear % this.popularVerses.length;
        const verseOfDay = this.popularVerses[verseIndex];
        
        this.sectionTitleEl.textContent = 'Versículo do Dia';
        this.clearVerses();
        this.showLoading();

        try {
            await this.searchVerse(verseOfDay);
        } catch (error) {
            this.showError('Erro ao buscar versículo do dia. Tente novamente.');
            console.error('Verse of day error:', error);
        }
    }

    async loadPopularVerses() {
        this.sectionTitleEl.textContent = 'Versículos Populares';
        this.clearVerses();
        this.showLoading();

        try {
            // Load first few popular verses
            const versesToLoad = this.popularVerses.slice(0, 6);
            
            for (const verse of versesToLoad) {
                if (!this.canMakeRequest()) {
                    await this.delay(2000); // Wait 2 seconds between requests
                }
                
                try {
                    const url = `${this.baseUrl}/${encodeURIComponent(verse)}?translation=almeida`;
                    const response = await fetch(url);
                    
                    if (response.ok) {
                        const data = await response.json();
                        this.displayVerse(data);
                    }
                } catch (error) {
                    console.error(`Error loading verse ${verse}:`, error);
                }
                
                // Small delay between requests
                await this.delay(500);
            }
        } catch (error) {
            this.showError('Erro ao carregar versículos populares.');
            console.error('Popular verses error:', error);
        } finally {
            this.hideLoading();
        }
    }

    async loadMoreVerses() {
        if (this.currentQuery) {
            // If there's a current search, try to load related verses
            this.showError('Funcionalidade em desenvolvimento.');
        } else {
            // Load more popular verses
            const currentCount = this.versesGridEl.children.length;
            const nextVerses = this.popularVerses.slice(currentCount, currentCount + 3);
            
            if (nextVerses.length === 0) {
                this.loadMoreBtnEl.style.display = 'none';
                return;
            }

            this.showLoading();
            
            for (const verse of nextVerses) {
                if (!this.canMakeRequest()) {
                    await this.delay(2000);
                }
                
                try {
                    const url = `${this.baseUrl}/${encodeURIComponent(verse)}?translation=almeida`;
                    const response = await fetch(url);
                    
                    if (response.ok) {
                        const data = await response.json();
                        this.displayVerse(data);
                    }
                } catch (error) {
                    console.error(`Error loading verse ${verse}:`, error);
                }
                
                await this.delay(500);
            }
            
            this.hideLoading();
            
            if (currentCount + nextVerses.length >= this.popularVerses.length) {
                this.loadMoreBtnEl.style.display = 'none';
            }
        }
    }

    displaySingleVerse(verseData) {
        this.clearVerses();
        this.displayVerse(verseData);
    }

    displayVerse(verseData) {
        const verseCard = this.createVerseCard(verseData);
        this.versesGridEl.appendChild(verseCard);
    }

    createVerseCard(verseData) {
        const card = document.createElement('div');
        card.className = 'verse-card';
        
        const text = verseData.text || verseData.verses?.[0]?.text || 'Texto não disponível';
        const reference = verseData.reference || `${verseData.book_name} ${verseData.chapter}:${verseData.verse}` || 'Referência não disponível';
        const translation = verseData.translation_name || 'João Ferreira de Almeida';
        
        const isFavorite = this.favorites.some(fav => fav.reference === reference);
        
        card.innerHTML = `
            <div class="verse-text">"${text}"</div>
            <div class="verse-reference">${reference}</div>
            <div class="verse-translation">${translation}</div>
            <div class="verse-actions">
                <button class="favorite-btn ${isFavorite ? 'active' : ''}" data-verse='${JSON.stringify({text, reference, translation})}'>
                    <i class="fas fa-heart"></i>
                </button>
                <button class="share-btn" data-verse='${JSON.stringify({text, reference})}'>
                    <i class="fas fa-share"></i>
                    Compartilhar
                </button>
            </div>
        `;

        // Add event listeners
        const favoriteBtn = card.querySelector('.favorite-btn');
        const shareBtn = card.querySelector('.share-btn');
        
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const verseData = JSON.parse(favoriteBtn.dataset.verse);
            this.toggleFavorite(verseData, favoriteBtn);
        });
        
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            const verseData = JSON.parse(shareBtn.dataset.verse);
            this.shareVerse(verseData);
        });

        return card;
    }

    toggleFavorite(verseData, button) {
        const existingIndex = this.favorites.findIndex(fav => fav.reference === verseData.reference);
        
        if (existingIndex > -1) {
            this.favorites.splice(existingIndex, 1);
            button.classList.remove('active');
        } else {
            this.favorites.push({
                text: verseData.text,
                reference: verseData.reference,
                translation: verseData.translation,
                addedAt: new Date().toISOString()
            });
            button.classList.add('active');
        }
        
        localStorage.setItem('catholicFavorites', JSON.stringify(this.favorites));
        this.updateFavoritesCount();
    }

    shareVerse(verseData) {
        const shareText = `"${verseData.text}" - ${verseData.reference}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'Versículo Bíblico',
                text: shareText
            });
        } else {
            // Fallback: copy to clipboard
            navigator.clipboard.writeText(shareText).then(() => {
                // Show temporary feedback
                const originalText = event.target.textContent;
                event.target.textContent = 'Copiado!';
                setTimeout(() => {
                    event.target.textContent = originalText;
                }, 2000);
            });
        }
    }

    openFavoritesModal() {
        this.displayFavorites();
        this.modalOverlayEl.classList.add('active');
    }

    closeFavoritesModal() {
        this.modalOverlayEl.classList.remove('active');
    }

    displayFavorites() {
        this.favoritesGridEl.innerHTML = '';
        
        if (this.favorites.length === 0) {
            this.emptyFavoritesEl.style.display = 'block';
            return;
        }
        
        this.emptyFavoritesEl.style.display = 'none';
        
        this.favorites.forEach(favorite => {
            const card = this.createFavoriteCard(favorite);
            this.favoritesGridEl.appendChild(card);
        });
    }

    createFavoriteCard(favorite) {
        const card = document.createElement('div');
        card.className = 'verse-card';
        
        card.innerHTML = `
            <div class="verse-text">"${favorite.text}"</div>
            <div class="verse-reference">${favorite.reference}</div>
            <div class="verse-translation">${favorite.translation}</div>
            <div class="verse-actions">
                <button class="favorite-btn active" data-reference="${favorite.reference}">
                    <i class="fas fa-heart"></i>
                </button>
                <button class="share-btn" data-verse='${JSON.stringify(favorite)}'>
                    <i class="fas fa-share"></i>
                    Compartilhar
                </button>
            </div>
        `;

        // Add event listeners
        const favoriteBtn = card.querySelector('.favorite-btn');
        const shareBtn = card.querySelector('.share-btn');
        
        favoriteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.removeFavorite(favorite.reference);
            card.remove();
            
            if (this.favorites.length === 0) {
                this.emptyFavoritesEl.style.display = 'block';
            }
        });
        
        shareBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            this.shareVerse(favorite);
        });

        return card;
    }

    removeFavorite(reference) {
        this.favorites = this.favorites.filter(fav => fav.reference !== reference);
        localStorage.setItem('catholicFavorites', JSON.stringify(this.favorites));
        this.updateFavoritesCount();
        
        // Update favorite buttons in main grid
        const favoriteButtons = document.querySelectorAll('.favorite-btn');
        favoriteButtons.forEach(btn => {
            try {
                const verseData = JSON.parse(btn.dataset.verse);
                if (verseData.reference === reference) {
                    btn.classList.remove('active');
                }
            } catch (e) {
                // Handle favorite buttons in favorites modal
                if (btn.dataset.reference === reference) {
                    btn.classList.remove('active');
                }
            }
        });
    }

    updateFavoritesCount() {
        this.favoritesCountEl.textContent = this.favorites.length;
    }

    clearVerses() {
        this.versesGridEl.innerHTML = '';
        this.loadMoreBtnEl.style.display = 'flex';
    }

    showLoading() {
        this.versesLoadingEl.style.display = 'block';
        this.isLoading = true;
    }

    hideLoading() {
        this.versesLoadingEl.style.display = 'none';
        this.isLoading = false;
    }

    showError(message) {
        this.hideLoading();
        
        const errorCard = document.createElement('div');
        errorCard.className = 'verse-card';
        errorCard.style.textAlign = 'center';
        errorCard.style.color = '#ff6b6b';
        
        errorCard.innerHTML = `
            <div style="font-size: 2rem; margin-bottom: 1rem;">
                <i class="fas fa-exclamation-triangle"></i>
            </div>
            <div>${message}</div>
        `;
        
        this.versesGridEl.innerHTML = '';
        this.versesGridEl.appendChild(errorCard);
        this.loadMoreBtnEl.style.display = 'none';
    }

    canMakeRequest() {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        // Reset counter if more than 30 seconds have passed
        if (timeSinceLastRequest > 30000) {
            this.requestCount = 0;
            this.lastRequestTime = now;
        }
        
        // Check if we can make a request (max 15 per 30 seconds)
        if (this.requestCount >= 15) {
            return false;
        }
        
        this.requestCount++;
        return true;
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

// Initialize the Catholic Explorer when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new CatholicExplorer();
});

