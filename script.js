const rootNode = document.getElementById('root-node');
const svg = document.getElementById('lines-svg');
const container = document.getElementById('mindmap-container');
const zoomWrapper = document.getElementById('zoom-wrapper');
const tooltip = document.getElementById('tooltip');

let tooltipTimeout; 
let terminalNodes = []; // Масив для кінцевих точок
let openedTerminalsCount = 0; // Лічильник відкритих кінцевих точок

// 💡 Зверни увагу: я змінив порядок на Річ Посполита -> Росія -> Османи
// Це потрібно, щоб після повороту на -40 градусів вони лягли точно за географією Первомайська!
const mapData = {
    text: 'Фронтир',
    info: { "Сутність": "Зона контакту", "Період": "XVI-XVIII ст.", "Регіон": "Україна" },
    children: [
        {
            text: 'Річ Посполита',
            theme: 'polish', // Альтернативний золотий
            info: { "Проблема": "Внутрішня криза", "Вектор": "Збереження кордонів", "Вплив": "Полонізація" },
            children: [
                { 
                    text: 'Брацлавське воєводство', 
                    info: { "Статус": "Адмін. одиниця" },
                    children: [
                        { text: 'Богопіль', info: { "Маєток": "Закладений 1763-го року" }, children: [] }
                    ]
                }
            ]
        },
        {
            text: 'Російська імперія',
            theme: 'russian', // Малиновий
            info: { "Вектор": "Південна експансія", "Мета": "Вихід до моря", "Дії": "Колонізація" },
            children: [
                { 
                    text: 'Новослобідський полк', 
                    info: { "Статус": "Адмін. одиниця" },
                    children: [
                        { text: 'Орел', info: { "Слобода": "Заснований 1757-го року" }, children: [] }
                    ]
                }
            ]
        },
        {
            text: 'Османська імперія',
            theme: 'ottoman', // Синій
            info: { "Вектор": "Утримання Причорномор'я", "Васали": "Кримське ханство", "Мета": "Безпека кордонів" },
            children: [
                { 
                    text: 'Ханська Україна', 
                    info: { "Статус": "Адмін. одиниця" },
                    children: [
                        { text: 'Голта', info: { "Ханська слобода": "Заснована 1762-го року" }, children: [] }
                    ]
                }
            ]
        }
    ]
};

const distance = 300; 

rootNode.style.left = `${window.innerWidth / 2}px`;
rootNode.style.top = `${window.innerHeight / 2}px`;
rootNode.dataset.expanded = "false";
setupTooltip(rootNode, mapData.info);

rootNode.addEventListener('click', (e) => {
    // ЛОГІКА ДРУГОГО КЛІКУ (ФІНАЛ)
    if (rootNode.dataset.state === "ready-for-finale") {
        addPulseEffect(rootNode);
        rootNode.classList.remove('golden-ready');
        rootNode.dataset.state = "finished";

        // Запускаємо перетворення карти (поворот + вода + кольори)
        document.body.classList.add('finale-water');
        container.classList.add('finale-rotate');
        return;
    }

    if (rootNode.dataset.expanded === "true") return; 
    
    addPulseEffect(rootNode);
    rootNode.dataset.expanded = "true";
    rootNode.classList.remove('large');
    rootNode.classList.add('shrunk');
    hideTooltipInstantly();

    setTimeout(() => {
        const centerX = parseFloat(rootNode.style.left);
        const centerY = parseFloat(rootNode.style.top);
        // Передаємо null як стартову тему
        spawnChildren(mapData.children, centerX, centerY, -90, 360, null);
    }, 800);
});

function spawnChildren(childrenArray, parentX, parentY, baseAngle, spreadAngle, parentTheme) {
    if (!childrenArray || childrenArray.length === 0) return;

    const angleStep = spreadAngle / childrenArray.length;
    const startAngle = baseAngle - (spreadAngle / 2) + (angleStep / 2);

    childrenArray.forEach((childData, index) => {
        const angle = startAngle + angleStep * index;
        const angleRad = angle * (Math.PI / 180);

        const targetX = parentX + Math.cos(angleRad) * distance;
        const targetY = parentY + Math.sin(angleRad) * distance;

        // Визначаємо тему для цієї гілки (малинова, синя або золота)
        const currentTheme = childData.theme || parentTheme;

        const childEl = document.createElement('div');
        childEl.className = 'node child';
        if (currentTheme) childEl.classList.add(currentTheme); // Додаємо клас кольору
        
        childEl.textContent = childData.text;
        childEl.style.left = `${targetX}px`;
        childEl.style.top = `${targetY}px`;
        
        const delay = index * 0.2;
        childEl.style.animationDelay = `${delay}s`;
        childEl.dataset.expanded = "false";
        
        zoomWrapper.appendChild(childEl);
        
        // Малюємо лінію і передаємо їй кольорову тему
        const mainLine = drawLine(parentX, parentY, targetX, targetY, delay, false);
        if (currentTheme) mainLine.classList.add(currentTheme);

        setupTooltip(childEl, childData.info);

        // Якщо це кінцевий вузол (Голта, Орел, Богопіль)
        if (!childData.children || childData.children.length === 0) {
            openedTerminalsCount++;
            terminalNodes.push({ x: targetX, y: targetY });
            
            if (terminalNodes.length > 1) {
                // Малюємо трикутник
                terminalNodes.slice(0, -1).forEach(prevNode => {
                    const gLine = drawLine(prevNode.x, prevNode.y, targetX, targetY, delay + 0.6, true);
                    gLine.classList.add(currentTheme); // Лінія перейме колір вузла
                    gLine.classList.add('golden');
                });
            }

            // Якщо відкрито всі 3 міста — готуємо фінал
            if (openedTerminalsCount === 3) {
                setTimeout(() => {
                    rootNode.classList.add('golden-ready');
                    rootNode.dataset.state = "ready-for-finale";
                }, 2000); // Чекаємо, поки домалюються золоті лінії
            }
        }

        childEl.addEventListener('click', () => {
            if (childEl.dataset.expanded === "true") return;
            
            addPulseEffect(childEl);
            childEl.dataset.expanded = "true";
            hideTooltipInstantly();

            if (childData.children && childData.children.length > 0) {
                // Передаємо тему дітям
                spawnChildren(childData.children, targetX, targetY, angle, 120, currentTheme);
            }
        });
    });

    setTimeout(autoScaleAndCenter, 300);
}

function drawLine(x1, y1, x2, y2, delay, isThick = false) {
    const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    line.setAttribute('x1', x1);
    line.setAttribute('y1', y1);
    line.setAttribute('x2', x2);
    line.setAttribute('y2', y2);
    line.setAttribute('class', 'line');
    
    const length = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    line.style.strokeDasharray = length;
    line.style.strokeDashoffset = length;

    if (isThick) {
        line.style.strokeWidth = '5px';
        line.style.stroke = '#f9a826'; 
        line.style.filter = 'drop-shadow(0 0 10px rgba(249, 168, 38, 0.7))';
    }

    line.style.animationDelay = `${delay}s`;
    svg.insertBefore(line, svg.firstChild);
    
    return line; // Повертаємо лінію, щоб навісити кольорові класи
}

function addPulseEffect(element) {
    element.classList.remove('pulse');
    void element.offsetWidth; 
    element.classList.add('pulse');
}

function hideTooltipInstantly() {
    clearTimeout(tooltipTimeout);
    tooltip.style.opacity = '0';
    tooltip.style.display = 'none';
}

function setupTooltip(element, infoObj) {
    if (!infoObj || Object.keys(infoObj).length === 0) return;

    element.addEventListener('mouseenter', (e) => {
        clearTimeout(tooltipTimeout); 
        
        let tableHTML = '<table>';
        for (const [key, value] of Object.entries(infoObj)) {
            tableHTML += `<tr><th>${key}</th><td>${value}</td></tr>`;
        }
        tableHTML += '</table>';
        
        tooltip.innerHTML = tableHTML;
        tooltip.style.display = 'block';
        
        setTimeout(() => { tooltip.style.opacity = '1'; }, 10);
    });

    element.addEventListener('mousemove', (e) => {
        const cx = window.innerWidth / 2;
        const cy = window.innerHeight / 2;
        const offset = 20;
        
        let left, top;

        if (e.clientX <= cx) { left = e.clientX + offset; } 
        else { left = e.clientX - tooltip.offsetWidth - offset; }

        if (e.clientY <= cy) { top = e.clientY + offset; } 
        else { top = e.clientY - tooltip.offsetHeight - offset; }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    });

    element.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        tooltipTimeout = setTimeout(() => { tooltip.style.display = 'none'; }, 200); 
    });
}

function autoScaleAndCenter() {
    const nodes = document.querySelectorAll('.node');
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    nodes.forEach(node => {
        const left = parseFloat(node.style.left);
        const top = parseFloat(node.style.top);
        const halfW = 110; 
        const halfH = 40;  

        if (left - halfW < minX) minX = left - halfW;
        if (left + halfW > maxX) maxX = left + halfW;
        if (top - halfH < minY) minY = top - halfH;
        if (top + halfH > maxY) maxY = top + halfH;
    });

    const bboxWidth = maxX - minX;
    const bboxHeight = maxY - minY;
    const bboxCenterX = minX + bboxWidth / 2;
    const bboxCenterY = minY + bboxHeight / 2;

    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    const padding = 150; 
    const scaleX = (viewportWidth - padding) / bboxWidth;
    const scaleY = (viewportHeight - padding) / bboxHeight;
    
    let scale = Math.min(scaleX, scaleY, 1); 
    if (!isFinite(scale) || scale <= 0) scale = 1;

    const translateX = (viewportWidth / 2) - (bboxCenterX * scale);
    const translateY = (viewportHeight / 2) - (bboxCenterY * scale);

    zoomWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

window.addEventListener('resize', () => {
    if (rootNode.dataset.expanded === "true") {
        autoScaleAndCenter();
    }
});
