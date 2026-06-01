const rootNode = document.getElementById('root-node');
const svg = document.getElementById('lines-svg');
const container = document.getElementById('mindmap-container');
const tooltip = document.getElementById('tooltip');

// 💡 ТУТ ТВОЯ БАЗА ДАНИХ
// Тепер це "дерево". Кожен об'єкт може мати свої 'children' (відгалудження).
const mapData = {
    text: 'Фронтир',
    info: { "Сутність": "Зона контакту", "Період": "XVI-XVIII ст." },
    children: [
        {
            text: 'Російська імперія',
            info: { "Вектор": "Південна експансія", "Мета": "Вихід до моря" },
            children: [
                { 
                    text: 'Новоросія', 
                    info: { "Статус": "Колонізація", "Рік": "1764" },
                    children: [] // Можна продовжувати нескінченно!
                }
            ]
        },
        {
            text: 'Річ Посполита',
            info: { "Проблема": "Внутрішня криза", "Вектор": "Збереження кордонів" },
            children: []
        },
        {
            text: 'Османська імперія',
            info: { "Вектор": "Утримання Причорномор'я", "Васали": "Кримське ханство" },
            children: []
        }
    ]
};

const distance = 250; // Відстань між вузлами

// Обробка головного вузла
rootNode.dataset.expanded = "false";

// Навішуємо інформацію для таблиці на головний вузол
setupTooltip(rootNode, mapData.info);

rootNode.addEventListener('click', (e) => {
    if (rootNode.dataset.expanded === "true") return; 
    
    // Ефект пульсації
    addPulseEffect(rootNode);

    rootNode.dataset.expanded = "true";
    rootNode.classList.remove('large');
    rootNode.classList.add('shrunk');

    setTimeout(() => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
        spawnChildren(mapData.children, centerX, centerY, -90, 360);
    }, 800);
});

// Функція створення відгалуджень
function spawnChildren(childrenArray, parentX, parentY, baseAngle, spreadAngle) {
    if (!childrenArray || childrenArray.length === 0) return;

    const angleStep = spreadAngle / childrenArray.length;
    const startAngle = baseAngle - (spreadAngle / 2) + (angleStep / 2);

    childrenArray.forEach((childData, index) => {
        const angle = startAngle + angleStep * index;
        const angleRad = angle * (Math.PI / 180);

        const targetX = parentX + Math.cos(angleRad) * distance;
        const targetY = parentY + Math.sin(angleRad) * distance;

        // Створюємо блок
        const childEl = document.createElement('div');
        childEl.className = 'node child';
        childEl.textContent = childData.text;
        childEl.style.left = `${targetX - 110}px`;
        childEl.style.top = `${targetY - 35}px`;
        
        const delay = index * 0.2;
        childEl.style.animationDelay = `${delay}s`;
        
        childEl.dataset.expanded = "false";
        
        // Налаштовуємо таблицю при наведенні
        setupTooltip(childEl, childData.info);

        container.appendChild(childEl);
        drawLine(parentX, parentY, targetX, targetY, delay);

        // Клік по новому відгалудженню
        childEl.addEventListener('click', () => {
            if (childEl.dataset.expanded === "true") return;
            addPulseEffect(childEl);
            childEl.dataset.expanded = "true";
            
            // Якщо є діти, малюємо їх. Вони розходяться віялом (кут 120 градусів) від поточного напрямку
            if (childData.children) {
                spawnChildren(childData.children, targetX, targetY, angle, 120);
            }
        });
    });
}

function drawLine(x1, y1, x2, y2, delay) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('class', 'line');
    line.style.animationDelay = `${delay}s`;
    svg.insertBefore(line, svg.firstChild);
}

function addPulseEffect(element) {
    element.classList.remove('pulse');
    void element.offsetWidth; // Магія для перезапуску CSS анімації
    element.classList.add('pulse');
}

// Функція для генерації таблиці при наведенні
function setupTooltip(element, infoObj) {
    if (!infoObj) return;

    element.addEventListener('mouseenter', (e) => {
        let tableHTML = '<table>';
        for (const [key, value] of Object.entries(infoObj)) {
            tableHTML += `<tr><th>${key}</th><td>${value}</td></tr>`;
        }
        tableHTML += '</table>';
        
        tooltip.innerHTML = tableHTML;
        tooltip.style.opacity = 1;
    });

    element.addEventListener('mousemove', (e) => {
        // Таблиця рухається за курсором з невеликим відступом
        tooltip.style.left = `${e.pageX + 15}px`;
        tooltip.style.top = `${e.pageY + 15}px`;
    });

    element.addEventListener('mouseleave', () => {
        tooltip.style.opacity = 0;
    });
}
