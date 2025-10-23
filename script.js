document.addEventListener('DOMContentLoaded', () => {

    // --- Referências do DOM ---
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const autocompleteList = document.getElementById('autocomplete-list');
    const resultsContainer = document.getElementById('results');
    const searchContainer = document.getElementById('search-container');
    
    const sidebar = document.getElementById('sidebar');
    const categoryTreeContainer = document.getElementById('category-tree');
    const classTreeContainer = document.getElementById('class-tree');
    const menuToggle = document.getElementById('menu-toggle');
    const overlay = document.getElementById('overlay');

    // --- NOVAS REFERÊNCIAS ---
    const desktopToggle = document.getElementById('desktop-toggle');
    const body = document.body;

    // --- 1. Carregar Dados e Construir a Sidebar ---
    fetch('listagem.json')
        .then(response => response.json())
        .then(data => {
            items = data;
            buildCategoryTree(items); 
            buildClassTree(items);
        })
        .catch(error => {
            console.error('Erro ao carregar o arquivo listagem.json:', error);
            showErrorCard('Erro Grave ao Carregar', 'Não foi possível carregar o arquivo <strong>listagem.json</strong>.');
        });
    
    // --- LÓGICA PARA RECOLHER SEÇÕES ---
    document.querySelectorAll('.section-header').forEach(header => {
        header.addEventListener('click', () => {
            header.parentElement.classList.toggle('open');
        });
    });


    // ... (Funções buildCategoryTree, buildClassTree, displayItemsByLocation, displayItemsByClass - Sem mudanças) ...
    function buildCategoryTree(items) {
        const categories = {};
        items.forEach(item => {
            const { Estante, Local } = item;
            if (!Estante || !Local) return;
            if (!categories[Estante]) {
                categories[Estante] = new Set();
            }
            categories[Estante].add(Local);
        });
        categoryTreeContainer.innerHTML = '';
        const sortedEstantes = Object.keys(categories).sort();
        for (const estante of sortedEstantes) {
            const locations = Array.from(categories[estante]).sort();
            const categoryLi = document.createElement('li');
            categoryLi.className = 'category-list-item';
            categoryLi.innerHTML = `<div class="category-item"><span class="caret">►</span>${estante}</div>`;
            const locationListUl = document.createElement('ul');
            locationListUl.className = 'location-list';
            locations.forEach(local => {
                const locationLi = document.createElement('li');
                locationLi.className = 'location-item';
                locationLi.textContent = local;
                locationLi.addEventListener('click', () => {
                    displayItemsByLocation(estante, local);
                });
                locationListUl.appendChild(locationLi);
            });
            categoryLi.appendChild(locationListUl);
            categoryTreeContainer.appendChild(categoryLi);
            categoryLi.querySelector('.category-item').addEventListener('click', () => {
                categoryLi.classList.toggle('open');
            });
        }
    }
    function buildClassTree(items) {
        const classSet = new Set();
        items.forEach(item => {
            if (item.Classe && item.Classe.trim() !== '') {
                classSet.add(item.Classe);
            }
        });
        const sortedClasses = Array.from(classSet).sort();
        if (sortedClasses.length === 0) {
            document.querySelector('#class-tree').parentElement.style.display = 'none';
            return;
        }
        classTreeContainer.innerHTML = '';
        sortedClasses.forEach(classe => {
            const locationLi = document.createElement('li');
            locationLi.className = 'location-item';
            locationLi.textContent = classe;
            locationLi.style.borderLeft = 'none';
            locationLi.style.marginLeft = '10px';
            locationLi.addEventListener('click', () => {
                displayItemsByClass(classe);
            });
            classTreeContainer.appendChild(locationLi);
        });
    }
    function displayItemsByLocation(estante, local) {
        resultsContainer.innerHTML = '';
        const itemsToShow = items.filter(item =>
            item.Estante === estante && item.Local === local
        );
        if (itemsToShow.length === 0) {
            showErrorCard('Local Vazio', `Nenhum item encontrado em: <strong>${estante} / ${local}</strong>`);
        } else {
            itemsToShow.forEach(item => {
                displaySingleItemCard(item);
            });
        }
        if (window.innerWidth <= 900) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    }
    function displayItemsByClass(classeName) {
        resultsContainer.innerHTML = '';
        const itemsToShow = items.filter(item => item.Classe === classeName);
        if (itemsToShow.length === 0) {
            showErrorCard('Classe Vazia', `Nenhum item encontrado para a classe: <strong>${classeName}</strong>`);
        } else {
            itemsToShow.forEach(item => {
                displaySingleItemCard(item);
            });
        }
        if (window.innerWidth <= 900) {
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }
    }

    // --- 2. Lógica de Busca (Sem mudanças) ---
    // ... (Funções performSearch, listener de input, etc.) ...
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.toLowerCase().trim();
        autocompleteList.innerHTML = '';
        if (query.length === 0) {
            autocompleteList.style.display = 'none';
            return;
        }
        const filteredItems = items.filter(item => {
            const itemCode = String(item.Codigo);
            const itemName = item.Item.toLowerCase();
            return itemName.includes(query) || itemCode.includes(query);
        }).slice(0, 10);
        if (filteredItems.length > 0) {
            filteredItems.forEach(item => {
                const itemElement = document.createElement('div');
                itemElement.className = 'autocomplete-item';
                itemElement.innerHTML = `<h4>${item.Item}</h4><p>Código: ${item.Codigo}</p>`;
                itemElement.addEventListener('click', () => {
                    resultsContainer.innerHTML = '';
                    displaySingleItemCard(item);
                    autocompleteList.style.display = 'none';
                    searchInput.value = item.Item;
                });
                autocompleteList.appendChild(itemElement);
            });
            autocompleteList.style.display = 'block';
        } else {
            autocompleteList.style.display = 'none';
        }
    });
    function performSearch() {
        const query = searchInput.value.toLowerCase().trim();
        autocompleteList.style.display = 'none';
        resultsContainer.innerHTML = '';
        if (query.length === 0) {
            showErrorCard('Busca Vazia', 'Por favor, digite um nome ou código para buscar.');
            return;
        }
        const filteredItems = items.filter(item => {
            const itemCode = String(item.Codigo);
            const itemName = item.Item.toLowerCase();
            return itemName.includes(query) || itemCode.includes(query);
        });
        if (filteredItems.length === 0) {
            showErrorCard('Item Não Encontrado', `Nenhum item corresponde à busca por: <strong>"${query}"</strong>`);
        } else {
            filteredItems.forEach(item => {
                displaySingleItemCard(item);
            });
        }
    }
    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    // --- 3. Lógica do Menu Mobile (Sem mudanças) ---
    menuToggle.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        overlay.classList.toggle('active');
    });

    overlay.addEventListener('click', () => {
        sidebar.classList.remove('open');
        overlay.classList.remove('active');
    });

    // --- 4. LÓGICA DO NOVO TOGGLE DESKTOP ---
    desktopToggle.addEventListener('click', () => {
        // Alterna a classe no body
        body.classList.toggle('sidebar-collapsed');

        // Muda o ícone do botão
        if (body.classList.contains('sidebar-collapsed')) {
            desktopToggle.innerHTML = '►'; // Seta para "Mostrar"
            desktopToggle.setAttribute('aria-label', 'Exibir menu');
        } else {
            desktopToggle.innerHTML = '◄'; // Seta para "Ocultar"
            desktopToggle.setAttribute('aria-label', 'Ocultar menu');
        }
    });

    // Fecha a janelinha de autocompletar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!searchContainer.contains(e.target)) {
            autocompleteList.style.display = 'none';
        }
    });

    // --- 5. Funções Auxiliares (Sem mudanças) ---
    // ... (Funções displaySingleItemCard e showErrorCard) ...
    function displaySingleItemCard(item) {
        const itemElement = document.createElement('div');
        itemElement.className = 'result-item';
        const classeField = (item.Classe && item.Classe.trim() !== '')
            ? `<div class="result-field"><strong>Classe:</strong><span class="data">${item.Classe}</span></div>`
            : '';
        itemElement.innerHTML = `
            <div class="result-title success"><span>✅</span> Medicamento Encontrado</div>
            <div class="result-field"><strong>Nome:</strong><span class="data">${item.Item}</span></div>
            <div class="result-field"><strong>Código:</strong><span class="data">${item.Codigo}</span></div>
            <div class="result-field"><strong>Estante:</strong><span class="data">${item.Estante}</span></div>
            <div class="result-field"><strong>Local:</strong><span class="data">${item.Local}</span></div>
            ${classeField}
        `;
        resultsContainer.appendChild(itemElement);
    }
    function showErrorCard(title, message) {
        resultsContainer.innerHTML = `
            <div class="result-item error-item">
                <div class="result-title error"><span>❌</span> ${title}</div>
                <div class="result-field"><p>${message}</p></div>
            </div>`;
    }

});