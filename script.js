// Categorias disponíveis para cards de tarefas
const CATEGORIES = [
    { id: 'work', name: 'Trabalho', color: 'bg-indigo-100', textColor: 'text-indigo-800' },
    { id: 'personal', name: 'Pessoal', color: 'bg-green-100', textColor: 'text-green-800' },
    { id: 'health', name: 'Saúde', color: 'bg-blue-100', textColor: 'text-blue-800' },
    { id: 'finance', name: 'Finanças', color: 'bg-purple-100', textColor: 'text-purple-800' },
    { id: 'study', name: 'Estudo', color: 'bg-yellow-100', textColor: 'text-yellow-800' },
    { id: 'leisure', name: 'Lazer', color: 'bg-pink-100', textColor: 'text-pink-800' }
];

// Cores disponíveis para os cards de tarefas
const CARD_COLORS = [
    'bg-white', 'bg-red-50', 'bg-blue-50', 'bg-green-50', 
    'bg-yellow-50', 'bg-purple-50', 'bg-pink-50', 'bg-indigo-50'
];

// Variáveis globais
let notes = [];
let cards = []; // Para cards de tarefas
let financeItems = []; // {id, type: 'expense'|'income', title, value}
let totalBalance = 0; // Saldo total das finanças

let currentItemToDelete = null; // Usado para cards de tarefas e itens de finanças

// ========== FUNÇÕES DE INICIALIZAÇÃO ==========
document.addEventListener('DOMContentLoaded', () => {
    setupLogin(); // Configura o formulário de login
    checkAuthentication(); // Verifica se já está autenticado
});

function initializeApp() {
    // Funções que devem ser chamadas após a autenticação e carregamento do DOM
    updateTheme();
    updateClock();
    updateGreeting();
    updateWeatherFallback(); // Usando fallback para o clima por padrão
    setupEventListeners(); // Configura listeners para adicionar cards e D&D
    loadInitialCards(); // Carrega cards de exemplo
    loadNotes(); // Carrega notas salvas
    loadFinanceData(); // Carrega dados de finanças
    
    // Configurar intervalos para atualização contínua
    setInterval(updateClock, 1000);
    setInterval(updateTheme, 60000); // Atualiza o tema a cada minuto
    setInterval(updateGreeting, 60000); // Atualiza a saudação a cada minuto
    // setInterval(updateWeatherUI, 3600000); // Atualiza o clima a cada hora (descomente se usar API real)
}

// ========== SISTEMA DE LOGIN ==========
// Senha fixa para o login
const CORRECT_PASSWORD = 'anaflavia1723'; 

function setupLogin() {
    const loginForm = document.getElementById('login-form');
    const passwordInput = document.getElementById('password');
    const errorMessage = document.getElementById('error-message');
    const loginScreen = document.getElementById('login-screen');
    
    if (loginForm) { // Verifica se o formulário de login existe
        loginForm.addEventListener('submit', (e) => { // Removido 'async' pois não há mais await
            e.preventDefault();
            
            const password = passwordInput.value;
            
            if (password === CORRECT_PASSWORD) { // Comparação direta
                // Login bem-sucedido
                localStorage.setItem('authenticated', 'true');
                loginScreen.classList.add('hidden');
                document.getElementById('app-content').classList.remove('hidden');
                initializeApp(); // Inicia o aplicativo principal
            } else {
                // Login falhou
                passwordInput.value = ''; // Limpa o campo da senha
                loginForm.classList.add('shake'); // Adiciona animação de "shake"
                errorMessage.classList.remove('hidden'); // Mostra mensagem de erro
                
                setTimeout(() => {
                    loginForm.classList.remove('shake');
                }, 500); // Remove a animação após 0.5 segundos
            }
        });
    }
}

function checkAuthentication() {
    if (localStorage.getItem('authenticated') === 'true') {
        document.getElementById('login-screen').classList.add('hidden');
        document.getElementById('app-content').classList.remove('hidden');
        initializeApp(); // Inicia o aplicativo principal
    }
}

// A função sha256 não é mais necessária para o login simples, pode ser removida se não for usada em outro lugar.
// async function sha256(message) {
//     const msgBuffer = new TextEncoder().encode(message);
//     const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
//     const hashArray = Array.from(new Uint8Array(hashBuffer));
//     return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
// }

// ========== TEMA E RELÓGIO ==========
function updateTheme() {
    const now = new Date();
    const hour = now.getHours();
    const body = document.body;
    
    if (hour >= 18 || hour < 6) {
        body.classList.remove('day-theme');
        body.classList.add('night-theme');
        document.documentElement.classList.add('dark');
    } else {
        body.classList.remove('night-theme');
        body.classList.add('day-theme');
        document.documentElement.classList.remove('dark');
    }
}

function updateClock() {
    const now = new Date();
    const options = { 
        timeZone: 'America/Sao_Paulo',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
    };
    
    const dateOptions = {
        timeZone: 'America/Sao_Paulo',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    };
    
    document.getElementById('clock').textContent = now.toLocaleTimeString('pt-BR', options);
    document.getElementById('date').textContent = now.toLocaleDateString('pt-BR', dateOptions);
}

function updateGreeting() {
    const now = new Date();
    const hour = now.getHours();
    let greetingText = '';

    if (hour >= 5 && hour < 12) {
        greetingText = 'bom dia';
    } else if (hour >= 12 && hour < 18) {
        greetingText = 'boa tarde';
    } else {
        greetingText = 'boa noite';
    }

    document.getElementById('greeting').textContent = `${greetingText}, Rodrigo`;
}

// ========== CLIMA (API e Fallback) ==========
// Mapeamento de códigos climáticos para emojis
const WEATHER_ICONS = {
    0: '☀️',  // Céu limpo
    1: '🌤️',  // Principalmente limpo
    2: '⛅',  // Parcialmente nublado
    3: '☁️',  // Nublado
    45: '🌫️', // Nevoeiro
    48: '🌫️', // Nevoeiro com geada
    51: '🌧️', // Chuvisco leve
    53: '🌧️', // Chuvisco moderado
    55: '🌧️', // Chuvisco denso
    56: '🌧️', // Chuvisco congelante leve
    57: '🌧️', // Chuvisco congelante denso
    61: '🌧️', // Chuva leve
    63: '🌧️', // Chuva moderada
    65: '🌧️', // Chuva forte
    66: '🌧️', // Chuva congelante leve
    67: '🌧️', // Chuva congelante forte
    71: '❄️', // Neve leve
    73: '❄️', // Neve moderada
    75: '❄️', // Neve forte
    77: '❄️', // Grãos de neve
    80: '🌦️', // Aguaceiros leves
    81: '🌦️', // Aguaceiros moderados
    82: '🌦️', // Aguaceiros violentos
    85: '❄️', // Neve leve em aguaceiros
    86: '❄️', // Neve forte em aguaceiros
    95: '⛈️',  // Trovoada leve ou moderada
    96: '⛈️',  // Trovoada com granizo leve
    99: '⛈️'   // Trovoada com granizo forte
};

// Função para obter o emoji do clima baseado no código
function getWeatherEmoji(weatherCode) {
    return WEATHER_ICONS[weatherCode] || '🌈';
}

// Função para buscar dados meteorológicos (requer API Key ou CORS configurado)
async function fetchWeatherData() {
    try {
        // Exemplo para São Paulo. Você pode ajustar latitude e longitude.
        const response = await fetch('https://api.open-meteo.com/v1/forecast?latitude=-23.5475&longitude=-46.6361&current=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=America/Sao_Paulo');
        
        if (!response.ok) {
            throw new Error('Erro ao buscar dados meteorológicos');
        }
        
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Erro ao buscar dados meteorológicos:', error);
        return null;
    }
}

// Função para formatar a temperatura com símbolo
function formatTemperature(temp) {
    return `${Math.round(temp)}°C`;
}

// Função para obter a descrição do clima baseada no código
function getWeatherDescription(weatherCode) {
    const descriptions = {
        0: 'Céu limpo', 1: 'Principalmente limpo', 2: 'Parcialmente nublado', 3: 'Nublado',
        45: 'Nevoeiro', 48: 'Nevoeiro com geada', 51: 'Chuvisco leve', 53: 'Chuvisco moderado',
        55: 'Chuvisco denso', 56: 'Chuvisco congelante leve',
        57: 'Chuvisco congelante denso', 61: 'Chuva leve', 63: 'Chuva moderada', 65: 'Chuva forte',
        66: 'Chuvisco congelante leve', 67: 'Chuvisco congelante forte', 71: 'Neve leve', 73: 'Neve moderada', 75: 'Neve forte',
        77: 'Grãos de neve', 80: 'Aguaceiros leves', 81: 'Aguaceiros moderados', 82: 'Aguaceiros violentos',
        85: 'Neve leve em aguaceiros', 86: 'Neve forte em aguaceiros', 95: 'Trovoada leve ou moderada',
        96: 'Trovoada com granizo leve', 99: 'Trovoada com granizo forte'
    };
    return descriptions[weatherCode] || 'Condição desconhecida';
}

// Função para atualizar a previsão do tempo na UI
async function updateWeatherUI() {
    const weatherData = await fetchWeatherData();
    
    if (!weatherData) {
        updateWeatherFallback(); // Usa dados de fallback se a API falhar
        return;
    }
    
    // Atualizar dados atuais
    const current = weatherData.current;
    document.getElementById('temperature').textContent = formatTemperature(current.temperature_2m);
    document.getElementById('weather-desc').textContent = getWeatherDescription(current.weather_code);
    document.getElementById('weather-icon').textContent = getWeatherEmoji(current.weather_code);
    
    // Atualizar previsão diária
    const dailyContainer = document.getElementById('weekly-weather');
    dailyContainer.innerHTML = '';
    
    for (let i = 0; i < Math.min(5, weatherData.daily.time.length); i++) {
        const dayElement = document.createElement('div');
        dayElement.className = 'flex justify-between items-center';
        
        const date = new Date(weatherData.daily.time[i]);
        const dayName = i === 0 ? 'Hoje' : date.toLocaleDateString('pt-BR', { weekday: 'short' });
        const maxTemp = weatherData.daily.temperature_2m_max[i];
        const weatherCode = weatherData.daily.weather_code[i];
        
        dayElement.innerHTML = `
            <span class="text-sm font-medium">${dayName}</span>
            <div class="flex items-center gap-2">
                <span class="font-medium">${formatTemperature(maxTemp)}</span>
                <span class="weather-icon-small">${getWeatherEmoji(weatherCode)}</span>
            </div>
        `;
        dailyContainer.appendChild(dayElement);
    }
}

// Fallback caso a API não responda
function updateWeatherFallback() {
    console.log('Usando dados meteorológicos simulados');
    document.getElementById('temperature').textContent = '25°C';
    document.getElementById('weather-desc').textContent = 'Parcialmente nublado';
    document.getElementById('weather-icon').textContent = '⛅';
    
    const forecastData = [
        { day: 'Hoje', temp: 25, icon: '⛅' },
        { day: 'Amanhã', temp: 24, icon: '🌧️' },
        { day: 'Terça', temp: 26, icon: '⛅' },
        { day: 'Quarta', temp: 28, icon: '☀️' },
        { day: 'Quinta', temp: 23, icon: '🌧️' }
    ];
    
    const dailyContainer = document.getElementById('weekly-weather');
    dailyContainer.innerHTML = '';
    
    forecastData.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'flex justify-between items-center';
        dayElement.innerHTML = `
            <span class="text-sm font-medium">${day.day}</span>
            <div class="flex items-center gap-2">
                <span class="font-medium">${day.temp}°C</span>
                <span class="weather-icon-small">${day.icon}</span>
            </div>
        `;
        dailyContainer.appendChild(dayElement);
    });
}

// ========== DRAG AND DROP (para cards de tarefas) ==========
function initializeDragAndDrop() {
    const taskLists = document.querySelectorAll('.task-list');

    taskLists.forEach(list => {
        // Remove listeners antigos para evitar duplicação
        list.removeEventListener('dragstart', handleDragStart);
        list.removeEventListener('dragend', handleDragEnd);
        list.removeEventListener('dragover', handleDragOver);
        list.removeEventListener('drop', handleDrop);

        // Adiciona novos listeners
        list.addEventListener('dragstart', handleDragStart);
        list.addEventListener('dragend', handleDragEnd);
        list.addEventListener('dragover', handleDragOver);
        list.addEventListener('drop', handleDrop);
    });
}

function handleDragStart(e) {
    if (e.target.classList.contains('task-card')) {
        draggedItem = e.target;
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', draggedItem.dataset.id); // Passa o ID do card
        setTimeout(() => {
            e.target.classList.add('dragging');
        }, 0);
    }
}

function handleDragEnd(e) {
    if (e.target.classList.contains('task-card')) {
        e.target.classList.remove('dragging');
        draggedItem = null;
        // Após o drag, re-renderiza para garantir que o estado visual e interno estejam sincronizados
        renderAllCards(); 
    }
}

function handleDragOver(e) {
    e.preventDefault(); // Permite o drop
    const list = e.currentTarget;
    const afterElement = getDragAfterElement(list, e.clientY);
    const draggable = document.querySelector('.dragging');

    if (draggable && list.contains(draggable)) { // Se o item arrastado já está na lista atual
        if (afterElement == null) {
            list.appendChild(draggable);
        } else {
            list.insertBefore(draggable, afterElement);
        }
    } else if (draggable) { // Se o item arrastado vem de outra lista
        if (afterElement == null) {
            list.appendChild(draggable);
        } else {
            list.insertBefore(draggable, afterElement);
        }
    }
}

function handleDrop(e) {
    e.preventDefault();
    const droppedCardId = e.dataTransfer.getData('text/plain');
    const droppedCardElement = document.querySelector(`[data-id="${droppedCardId}"]`);
    const targetList = e.currentTarget;

    if (droppedCardElement && targetList) {
        const oldColumnId = droppedCardElement.parentNode.id;
        const newColumnId = targetList.id;

        // Atualiza o array 'cards'
        const cardIndex = cards.findIndex(c => c.id == droppedCardId);
        if (cardIndex > -1) {
            cards[cardIndex].columnId = newColumnId;
        }
        
        // A re-renderização em dragEnd já cuida da atualização visual e da ordem
        // Mas se precisar de uma atualização imediata aqui, pode chamar renderAllCards()
        // renderAllCards(); 
    }
}


function getDragAfterElement(container, y) {
    const draggableElements = [...container.querySelectorAll('.task-card:not(.dragging)')];
    
    return draggableElements.reduce((closest, child) => {
        const box = child.getBoundingClientRect();
        const offset = y - box.top - box.height / 2;
        
        if (offset < 0 && offset > closest.offset) {
            return { offset: offset, element: child };
        } else {
            return closest;
        }
    }, { offset: Number.NEGATIVE_INFINITY }).element;
}

// ========== GERENCIAMENTO DE CARDS DE TAREFAS ==========
function setupEventListeners() {
    // Adicionar um novo card de tarefa
    document.querySelectorAll('[onclick^="addNewCard"]').forEach(btn => {
        const columnId = btn.getAttribute('onclick').split("'")[1];
        // Remove o listener para evitar duplicação
        btn.onclick = null; 
        btn.addEventListener('click', () => addNewCard(columnId));
    });

    // Adicionar um novo item de finanças
    document.querySelectorAll('[onclick^="addFinanceItem"]').forEach(btn => {
        const type = btn.getAttribute('onclick').split("'")[1];
        // Remove o listener para evitar duplicação
        btn.onclick = null;
        btn.addEventListener('click', () => addFinanceItem(type));
    });

    // Listener para edição do saldo total
    const totalBalanceElement = document.getElementById('total-balance');
    if (totalBalanceElement) {
        totalBalanceElement.addEventListener('blur', handleTotalBalanceEdit);
        totalBalanceElement.addEventListener('keydown', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault(); // Evita quebra de linha
                totalBalanceElement.blur(); // Tira o foco para salvar
            }
        });
    }
}

function loadInitialCards() {
    // Exemplo de cards iniciais
    cards = [
        {
            id: 1,
            columnId: 'in-progress-task-list',
            title: 'Completar projeto X',
            description: 'Finalizar todas as tarefas do projeto até sexta-feira',
            category: CATEGORIES[0],
            color: CARD_COLORS[0],
            date: new Date().toLocaleDateString('pt-BR')
        },
        {
            id: 2,
            columnId: 'upcoming-task-list',
            title: 'Aniversário da esposa',
            description: 'Preparar surpresa e jantar especial',
            category: CATEGORIES[5],
            color: CARD_COLORS[6],
            date: '10/11/2023'
        },
        {
            id: 3,
            columnId: 'recurrent-task-list',
            title: 'Pagar contas do mês',
            description: 'Água, luz, internet e aluguel',
            category: CATEGORIES[3],
            color: CARD_COLORS[1],
            date: '05/11/2023'
        }
    ];
    renderAllCards();
}

function addNewCard(columnId) {
    const newCard = {
        id: Date.now(), // ID único
        columnId: columnId,
        title: 'Nova Tarefa',
        description: 'Descrição da tarefa',
        category: CATEGORIES[0], // Categoria padrão
        color: CARD_COLORS[0], // Cor padrão
        date: new Date().toLocaleDateString('pt-BR')
    };
    
    cards.push(newCard);
    renderAllCards(); // Re-renderiza todos os cards para incluir o novo
}

function renderAllCards() {
    // Limpa todas as colunas antes de renderizar
    document.querySelectorAll('.task-list').forEach(list => {
        list.innerHTML = '';
    });
    
    // Renderiza cada card na sua respectiva coluna
    cards.forEach(card => {
        renderCard(card);
    });
    initializeEditableElements(); // Re-inicializa os elementos editáveis após a re-renderização
    initializeDragAndDrop(); // Re-inicializa o D&D para todos os cards
}

function renderCard(card) {
    const column = document.getElementById(card.columnId);
    if (!column) return; // Garante que a coluna existe

    const cardElement = document.createElement('div');
    // Adiciona a classe da coluna para a borda lateral
    let columnBorderClass = '';
    if (card.columnId === 'in-progress-task-list') {
        columnBorderClass = 'column-in-progress';
    } else if (card.columnId === 'upcoming-task-list') {
        columnBorderClass = 'column-upcoming';
    } else if (card.columnId === 'recurrent-task-list') {
        columnBorderClass = 'column-recurrent';
    }

    cardElement.className = `task-card p-4 mb-3 rounded-lg shadow-sm relative ${card.color} ${columnBorderClass}`;
    cardElement.setAttribute('data-id', card.id);
    cardElement.setAttribute('draggable', 'true'); // Habilita o drag

    cardElement.innerHTML = `
        <div class="flex justify-between items-start">
            <div class="flex-1">
                <h3 class="font-medium mb-1" contenteditable="true" data-card-id="${card.id}" data-field="title">${card.title}</h3>
                <p class="text-sm text-gray-600 mb-2" contenteditable="true" data-card-id="${card.id}" data-field="description">${card.description}</p>
                <div class="flex items-center justify-between">
                    <span class="text-xs px-2 py-1 rounded ${card.category.color} ${card.category.textColor}" 
                          onclick="showCategoryMenu(event, '${card.id}')"
                          style="cursor:pointer;">
                        ${card.category.name}
                    </span>
                    <span class="text-xs text-gray-500">${card.date}</span>
                </div>
            </div>
            
            <div class="task-actions">
                <div class="relative">
                    <button class="p-1 text-gray-500 hover:text-gray-700" onclick="showCardActionsMenu(event, '${card.id}')">
                        <i class="fas fa-ellipsis-v"></i>
                    </button>
                    
                    <div class="status-menu hidden" id="card-actions-menu-${card.id}">
                        <div class="status-menu-item" onclick="showCategoryMenu(event, '${card.id}')">
                            <i class="fas fa-tag mr-2"></i> Mudar Categoria
                        </div>
                        <div class="status-menu-item" onclick="showColorMenu(event, '${card.id}')">
                            <i class="fas fa-palette mr-2"></i> Mudar Cor
                        </div>
                        <hr class="my-1">
                        <div class="status-menu-item text-red-500" onclick="showDeleteConfirmation('${card.id}', 'card')">
                            <i class="fas fa-trash mr-2"></i> Excluir
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
    
    column.appendChild(cardElement);
}

// Mostra menu de ações do card (substitui showStatusMenu)
function showCardActionsMenu(event, cardId) {
    event.stopPropagation();
    // Fecha outros menus abertos
    document.querySelectorAll('.status-menu').forEach(menu => menu.classList.add('hidden'));
    // Abre o menu do card clicado
    const menu = document.getElementById(`card-actions-menu-${cardId}`);
    if (menu) {
        menu.classList.remove('hidden');
        // Fecha ao clicar fora
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && e.target !== event.target) {
                    menu.classList.add('hidden');
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
    }
}

// Mostra menu de categorias
function showCategoryMenu(event, cardId) {
    event.stopPropagation();
    
    // Esconde outros menus
    document.querySelectorAll('.status-menu').forEach(menu => {
        menu.classList.add('hidden');
    });

    const parentElement = event.target.closest('.relative');
    const menu = document.createElement('div');
    menu.className = 'status-menu';
    menu.style.position = 'absolute';
    menu.style.right = '0';
    menu.style.top = '100%';
    menu.style.zIndex = '100';
    menu.style.display = 'block'; // Garante que o menu seja exibido

    CATEGORIES.forEach(category => {
        const item = document.createElement('div');
        item.className = 'status-menu-item';
        item.innerHTML = `
            <span class="w-3 h-3 rounded-full ${category.color} mr-2"></span>
            ${category.name}
        `;
        item.onclick = (e) => { // Adiciona e.stopPropagation() aqui
            e.stopPropagation();
            changeCardCategory(cardId, category.id);
            menu.remove();
        };
        menu.appendChild(item);
    });
    
    parentElement.appendChild(menu);
    
    // Esconde o menu ao clicar em qualquer lugar fora dele
    const hideMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== event.target) {
            menu.remove();
            document.removeEventListener('click', hideMenu);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', hideMenu);
    }, 10);
}

// Altera categoria do card
function changeCardCategory(cardId, categoryId) {
    const card = cards.find(c => c.id == cardId);
    const category = CATEGORIES.find(c => c.id === categoryId);
    
    if (card && category) {
        card.category = category;
        renderAllCards(); // Re-renderiza para atualizar a categoria visualmente
    }
}

// Mostra menu de cores
function showColorMenu(event, cardId) {
    event.stopPropagation();

    // Esconde outros menus
    document.querySelectorAll('.status-menu').forEach(menu => {
        menu.classList.add('hidden');
    });
    
    const parentElement = event.target.closest('.relative');
    const menu = document.createElement('div');
    menu.className = 'status-menu p-2 grid grid-cols-4 gap-2';
    menu.style.position = 'absolute';
    menu.style.right = '0';
    menu.style.top = '100%';
    menu.style.zIndex = '100';
    menu.style.width = '160px';
    menu.style.display = 'grid'; // Garante que o menu seja exibido como grid
    
    CARD_COLORS.forEach(color => {
        const item = document.createElement('div');
        item.className = `w-6 h-6 rounded-full ${color} cursor-pointer`;
        item.onclick = (e) => { // Adiciona e.stopPropagation() aqui
            e.stopPropagation();
            changeCardColor(cardId, color);
            menu.remove();
        };
        menu.appendChild(item);
    });
    
    parentElement.appendChild(menu);
    
    // Esconde o menu ao clicar em qualquer lugar fora dele
    const hideMenu = (e) => {
        if (!menu.contains(e.target) && e.target !== event.target) {
            menu.remove();
            document.removeEventListener('click', hideMenu);
        }
    };
    setTimeout(() => {
        document.addEventListener('click', hideMenu);
    }, 10);
}

// Altera cor do card
function changeCardColor(cardId, color) {
    const card = cards.find(c => c.id == cardId);
    if (card) {
        card.color = color;
        renderAllCards(); // Re-renderiza para atualizar a cor visualmente
    }
}

// ========== GERENCIAMENTO DE FINANÇAS ==========
let incomes = [];
let expenses = [];
let balance = 0;

// Renderiza listas e saldo
function renderFinance() {
  const expensesList = document.getElementById('expenses-list');
  const incomeList = document.getElementById('income-list');
  expensesList.innerHTML = '';
  incomeList.innerHTML = '';
  let total = totalBalance;

  financeItems.forEach(item => {
    const card = document.createElement('div');
    card.className = `finance-card p-3 rounded-lg shadow-sm flex justify-between items-center ${item.type === 'expense' ? 'bg-red-50' : 'bg-green-50'}`;
    card.innerHTML = `
      <div>
        <h3 class="font-medium">${item.title}</h3>
        <span class="text-sm ${item.type === 'expense' ? 'text-red-600' : 'text-green-600'}">R$ ${item.value.toFixed(2)}</span>
      </div>
      <button onclick="removeFinanceCard(${item.id})" class="text-red-500 hover:text-red-700 ml-2">
        <i class="fas fa-trash"></i>
      </button>
    `;
    if (item.type === 'expense') {
      expensesList.appendChild(card);
      total -= item.value;
    } else {
      incomeList.appendChild(card);
      total += item.value;
    }
  });

  document.getElementById('total-balance').textContent = `R$ ${total.toFixed(2)}`;
  renderFinanceChart(); // <-- Adicione aqui
}

function addFinanceCard(listId) {
    const type = listId === 'expenses-list' ? 'expense' : 'income';
    const title = prompt(type === 'expense' ? 'Descrição do gasto:' : 'Descrição do ganho:');
    if (!title) return;
    const valueStr = prompt('Valor (ex: 100.50):');
    const value = parseFloat(valueStr.replace(',', '.'));
    if (isNaN(value) || value <= 0) return alert('Valor inválido!');
    financeItems.push({
        id: Date.now(),
        type,
        title,
        value
    });
    renderFinance();
}

function removeFinanceCard(id) {
    financeItems = financeItems.filter(item => item.id !== id);
    renderFinance();
}

function editBalance() {
    const valueStr = prompt('Novo saldo total:', totalBalance.toFixed(2));
    const value = parseFloat(valueStr.replace(',', '.'));
    if (!isNaN(value)) {
        totalBalance = value;
        renderFinance();
    }
}

// Inicializa a renderização das finanças ao carregar a página
document.addEventListener('DOMContentLoaded', () => {
    renderFinance();
});

// ========== MODAL DE CONFIRMAÇÃO (Unificado) ==========
function showDeleteConfirmation(itemId, type) {
    currentItemToDelete = { id: itemId, type: type };
    document.getElementById('confirmation-modal').classList.remove('hidden');
    // Atualiza a mensagem do modal se necessário
    const modalMessage = document.querySelector('#confirmation-modal p');
    if (type === 'card') {
        modalMessage.textContent = 'Tem certeza que deseja excluir esta tarefa?';
    } else if (type === 'finance') {
        modalMessage.textContent = 'Tem certeza que deseja excluir este item financeiro?';
    }
}

function closeConfirmationModal() {
    document.getElementById('confirmation-modal').classList.add('hidden');
    currentItemToDelete = null;
}

function confirmDeleteCard() { // Renomeado para ser mais genérico, mas o nome da função no HTML ainda é 'confirmDeleteCard'
    if (currentItemToDelete) {
        if (currentItemToDelete.type === 'card') {
            cards = cards.filter(card => card.id != currentItemToDelete.id);
            renderAllCards();
        } else if (currentItemToDelete.type === 'finance') {
            deleteFinanceItem(currentItemToDelete.id); // Chama a função específica de finanças
        }
        closeConfirmationModal();
    }
}

// ========== EDIÇÃO DE TÍTULO/DESCRIÇÃO DOS CARDS DE TAREFAS ==========
function initializeEditableElements() {
    document.querySelectorAll('.task-card h3[contenteditable="true"], .task-card p[contenteditable="true"]').forEach(element => {
        element.removeEventListener('blur', handleCardTextBlur); // Remove para evitar duplicidade
        element.addEventListener('blur', handleCardTextBlur);
    });
}

function handleCardTextBlur(e) {
    const cardId = parseInt(e.target.dataset.cardId);
    const field = e.target.dataset.field; // 'title' or 'description'
    const newValue = e.target.textContent.trim();

    const card = cards.find(c => c.id === cardId);
    if (card) {
        card[field] = newValue;
        // Não precisa renderizar tudo de novo, pois a edição é in-place
        // Mas se quiser persistir, adicione aqui uma função saveCards()
    }
}

// ========== ANOTAÇÕES RÁPIDAS ==========
function addNote() {
    const titleInput = document.getElementById('new-note-title-input');
    const descriptionInput = document.getElementById('new-note-description-input');
    const noteTitle = titleInput.value.trim();
    const noteDescription = descriptionInput.value.trim();

    if (noteTitle || noteDescription) { // Permite adicionar nota com apenas título ou apenas descrição
        const newNote = {
            id: Date.now(), // ID único para a nota
            title: noteTitle,
            description: noteDescription,
            date: new Date().toLocaleDateString('pt-BR'),
            completed: false // Campo para status de conclusão
        };
        notes.unshift(newNote); // Adiciona no início para as mais recentes aparecerem primeiro
        titleInput.value = ''; // Limpa o campo do título
        descriptionInput.value = ''; // Limpa o campo da descrição
        saveNotes();
        renderNotes();
    }
}

function saveNotes() {
    localStorage.setItem('quick-notes', JSON.stringify(notes));
    showNotification('Anotações salvas!');
}

function loadNotes() {
    const savedNotes = localStorage.getItem('quick-notes');
    if (savedNotes) {
        notes = JSON.parse(savedNotes);
        renderNotes();
    }
}

function renderNotes() {
    const notesList = document.getElementById('notes-list');
    notesList.innerHTML = ''; // Limpa a lista antes de renderizar

    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.className = `bg-gray-100 dark:bg-gray-700 p-3 rounded-lg flex justify-between items-start ${note.completed ? 'opacity-60 line-through' : ''}`;
        noteElement.innerHTML = `
            <div class="flex-1">
                <h4 class="font-medium ${note.completed ? 'text-gray-500' : ''}" contenteditable="true" data-note-id="${note.id}" data-field="title">${note.title || 'Sem Título'}</h4>
                <p class="text-sm ${note.completed ? 'text-gray-500' : ''}" contenteditable="true" data-note-id="${note.id}" data-field="description">${note.description || 'Sem Descrição'}</p>
                <span class="text-xs text-gray-500 dark:text-gray-400">${note.date}</span>
            </div>
            <div class="flex items-center gap-2 ml-2">
                <input type="checkbox" ${note.completed ? 'checked' : ''} onchange="toggleNoteCompleted(${note.id})" class="form-checkbox h-5 w-5 text-indigo-600 rounded">
                <button onclick="deleteNote(${note.id})" class="text-red-500 hover:text-red-700">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        notesList.appendChild(noteElement);
    });

    // Adiciona listeners para edição de notas
    notesList.querySelectorAll('[contenteditable="true"]').forEach(element => {
        element.removeEventListener('blur', handleNoteTextBlur); // Remove para evitar duplicidade
        element.addEventListener('blur', handleNoteTextBlur);
    });
}

function handleNoteTextBlur(e) {
    const noteId = parseInt(e.target.dataset.noteId);
    const field = e.target.dataset.field; // 'title' or 'description'
    const newValue = e.target.textContent.trim();
    editNote(noteId, field, newValue);
}

function editNote(id, field, newValue) {
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex > -1) {
        notes[noteIndex][field] = newValue; // Atualiza o campo específico (title ou description)
        saveNotes();
    }
}

function deleteNote(id) {
    notes = notes.filter(note => note.id !== id);
    saveNotes();
    renderNotes();
}

function toggleNoteCompleted(id) {
    const noteIndex = notes.findIndex(note => note.id === id);
    if (noteIndex > -1) {
        notes[noteIndex].completed = !notes[noteIndex].completed;
        saveNotes();
        renderNotes(); // Re-renderiza para aplicar os estilos de concluído
    }
}

// ========== UTILITÁRIOS ==========
function showNotification(message) {
    const notification = document.createElement('div');
    notification.className = 'fixed bottom-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('opacity-0', 'translate-y-2', 'transition-all', 'duration-300');
        setTimeout(() => {
            notification.remove(); // Usa .remove() para remover o elemento
        }, 300);
    }, 2000);
}

// Gráfico de Finanças
let financeChart = null;

function renderFinanceChart() {
    const ctx = document.getElementById('financeChart');
    if (!ctx) return;

    // Agrupa por tipo
    const totalGanhos = financeItems.filter(i => i.type === 'income').reduce((acc, i) => acc + i.value, 0);
    const totalGastos = financeItems.filter(i => i.type === 'expense').reduce((acc, i) => acc + i.value, 0);

    // Se já existe um gráfico, destrua antes de criar outro
    if (financeChart) {
        financeChart.destroy();
    }

    financeChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Ganhos', 'Gastos'],
            datasets: [{
                data: [totalGanhos, totalGastos],
                backgroundColor: ['#22c55e', '#ef4444'],
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: true, position: 'bottom', labels: { font: { size: 16 } } }
            },
            cutout: '70%' // Deixa o gráfico mais "donut"
        }
    });
}

// ========== CALENDÁRIO ==========
document.addEventListener('DOMContentLoaded', function() {
  const calendarEl = document.getElementById('calendar');
  if (calendarEl) {
    const calendar = new FullCalendar.Calendar(calendarEl, {
      initialView: 'dayGridMonth',
      height: 600,
      locale: 'pt-br',
      headerToolbar: {
        left: 'prev,next today',
        center: 'title',
        right: 'dayGridMonth,timeGridWeek,timeGridDay'
      },
      events: [], // Aqui você pode carregar eventos locais ou do Google
    });
    calendar.render();
    window.myCalendar = calendar; // Para acessar depois se quiser
  }
});

// Exemplo usando fetch para iCal público (precisa de conversão para eventos JS)
fetch('https://calendar.google.com/calendar/ical/SEU_ID_PUBLICO/basic.ics')
  .then(res => res.text())
  .then(icsData => {
    // Use uma lib como ical.js para converter para eventos JS
    // https://github.com/mozilla-comm/ical.js/
    // Ou use um serviço de terceiros para converter
  });

// ========== GOOGLE CALENDAR ==========
function authenticateGoogleCalendar() {
  gapi.load('client:auth2', () => {
    gapi.client.init({
      apiKey: 'SUA_API_KEY',
      clientId: 'SEU_CLIENT_ID.apps.googleusercontent.com',
      discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
      scope: "https://www.googleapis.com/auth/calendar.events.readonly"
    }).then(() => {
      return gapi.auth2.getAuthInstance().signIn();
    }).then(() => {
      listGoogleCalendarEvents();
    });
  });
}

function listGoogleCalendarEvents() {
  gapi.client.calendar.events.list({
    'calendarId': 'primary',
    'timeMin': (new Date()).toISOString(),
    'showDeleted': false,
    'singleEvents': true,
    'maxResults': 10,
    'orderBy': 'startTime'
  }).then(response => {
    const events = response.result.items;
    // Adapte para adicionar ao FullCalendar
    if (window.myCalendar) {
      window.myCalendar.removeAllEvents();
      events.forEach(ev => {
        window.myCalendar.addEvent({
          title: ev.summary,
          start: ev.start.dateTime || ev.start.date,
          end: ev.end.dateTime || ev.end.date
        });
      });
    }
  });
}
