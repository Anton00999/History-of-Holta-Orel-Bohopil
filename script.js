const rootNode = document.getElementById('root-node');
const svg = document.getElementById('lines-svg');
const container = document.getElementById('mindmap-container');
const zoomWrapper = document.getElementById('zoom-wrapper');
const tooltip = document.getElementById('tooltip');

let tooltipTimeout; // Глобальна змінна для контролю таймера підказки

const mapData = {
    text: 'Фронтир',
    info: { "Сутність": "Зона контакту", "Період": "XVI-XVIII ст.", "Регіон": "Україна" },
    children: [
        {
            text: 'Російська імперія',
            info: { "Вектор": "Південна експансія", "Мета": "Вихід до моря", "Дії": "Колонізація" },
            children: [
                { 
                    text: 'Новоросія', 
                    info: { "Статус": "Адмін. одиниця", "Рік": "1764", "Суть": "Поділ козацьких земель" },
                    children: []
                }
            ]
        },
        {
            text: 'Річ Посполита',
            info: { "Проблема": "Внутрішня криза", "Вектор": "Збереження кордонів", "Вплив": "Полонізація" },
            children: []
        },
        {
            text: 'Османська імперія',
            info: { "Вектор": "Утримання Причорномор'я", "Васали": "Кримське ханство", "Мета": "Безпека кордонів" },
            children: []
        }
    ]
};

const distance = 300; 

// Ініціалізація головного вузла (жорстке центрування координатами)
rootNode.style.left = `${window.innerWidth / 2}px`;
rootNode.style.top = `${window.innerHeight / 2}px`;
rootNode.dataset.expanded = "false";
setupTooltip(rootNode, mapData.info);

rootNode.addEventListener('click', (e) => {
    if (rootNode.dataset.expanded === "true") return; 
    
    addPulseEffect(rootNode);
    rootNode.dataset.expanded = "true";
    rootNode.classList.remove('large');
    rootNode.classList.add('shrunk');

    hideTooltipInstantly();

    setTimeout(() => {
        const centerX = parseFloat(rootNode.style.left);
        const centerY = parseFloat(rootNode.style.top);
        spawnChildren(mapData.children, centerX, centerY, -90, 360);
    }, 800);
});

function spawnChildren(childrenArray, parentX, parentY, baseAngle, spreadAngle) {
    if (!childrenArray || childrenArray.length === 0) return;

    const angleStep = spreadAngle / childrenArray.length;
    const startAngle = baseAngle - (spreadAngle / 2) + (angleStep / 2);

    childrenArray.forEach((childData, index) => {
        const angle = startAngle + angleStep * index;
        const angleRad = angle * (Math.PI / 180);

        const targetX = parentX + Math.cos(angleRad) * distance;
        const targetY = parentY + Math.sin(angleRad) * distance;

        const childEl = document.createElement('div');
        childEl.className = 'node child';
        childEl.textContent = childData.text;
        
        // Позиціонуємо центр елемента
        childEl.style.left = `${targetX}px`;
        childEl.style.top = `${targetY}px`;
        
        const delay = index * 0.2;
        childEl.style.animationDelay = `${delay}s`;
        childEl.dataset.expanded = "false";
        
        zoomWrapper.appendChild(childEl);
        drawLine(parentX, parentY, targetX, targetY, delay);

        setupTooltip(childEl, childData.info);

        childEl.addEventListener('click', () => {
            if (childEl.dataset.expanded === "true") return;
            
            addPulseEffect(childEl);
            childEl.dataset.expanded = "true";
            hideTooltipInstantly();

            if (childData.children && childData.children.length > 0) {
                spawnChildren(childData.children, targetX, targetY, angle, 120);
            }
        });
    });

    // Після того, як вузли додано, викликаємо функцію автомасштабування
    setTimeout(autoScaleAndCenter, 300);
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
    void element.offsetWidth; 
    element.classList.add('pulse');
}

// Функція для приховування підказки під час кліку
function hideTooltipInstantly() {
    clearTimeout(tooltipTimeout);
    tooltip.style.opacity = '0';
    tooltip.style.display = 'none';
}

function setupTooltip(element, infoObj) {
    if (!infoObj || Object.keys(infoObj).length === 0) return;

    element.addEventListener('mouseenter', (e) => {
        clearTimeout(tooltipTimeout); // Скасовуємо старе зникнення, якщо швидко перевели мишу
        
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

        // "Розумне" позиціонування: завжди всередину екрана
        if (e.clientX <= cx) {
            left = e.clientX + offset; // Курсор зліва -> показуємо справа
        } else {
            left = e.clientX - tooltip.offsetWidth - offset; // Курсор справа -> показуємо зліва
        }

        if (e.clientY <= cy) {
            top = e.clientY + offset; // Курсор зверху -> показуємо знизу
        } else {
            top = e.clientY - tooltip.offsetHeight - offset; // Курсор знизу -> показуємо зверху
        }

        tooltip.style.left = `${left}px`;
        tooltip.style.top = `${top}px`;
    });

    element.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        tooltipTimeout = setTimeout(() => {
            tooltip.style.display = 'none';
        }, 200); // Зникнення стало швидшим (200мс)
    });
}

// 📸 МАТЕМАТИКА КАМЕРИ: Автоматичне масштабування та центрування
function autoScaleAndCenter() {
    const nodes = document.querySelectorAll('.node');
    let minX = Infinity, maxX = -Infinity;
    let minY = Infinity, maxY = -Infinity;

    // Знаходимо крайні точки всього дерева
    nodes.forEach(node => {
        const left = parseFloat(node.style.left);
        const top = parseFloat(node.style.top);
        
        const halfW = 110; // Половина ширини звичайного блоку
        const halfH = 40;  // Половина висоти звичайного блоку

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

    // Відступи по краях екрана (щоб мапа не прилипала до рамки)
    const padding = 150; 
    const scaleX = (viewportWidth - padding) / bboxWidth;
    const scaleY = (viewportHeight - padding) / bboxHeight;
    
    // Масштабуємо, але не збільшуємо більше ніж на оригінальний розмір (scale: 1)
    let scale = Math.min(scaleX, scaleY, 1); 
    if (!isFinite(scale) || scale <= 0) scale = 1;

    // Розраховуємо, на скільки треба змістити полотно, щоб центр мапи опинився в центрі екрана
    const translateX = (viewportWidth / 2) - (bboxCenterX * scale);
    const translateY = (viewportHeight / 2) - (bboxCenterY * scale);

    // Плавно переміщуємо камеру
    zoomWrapper.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
}

// Додатково центруємо при зміні розміру вікна браузера
window.addEventListener('resize', () => {
    if (rootNode.dataset.expanded === "true") {
        autoScaleAndCenter();
    }
});
