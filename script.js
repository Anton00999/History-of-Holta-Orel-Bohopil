const rootNode = document.getElementById('root-node');
const svg = document.getElementById('lines-svg');
const container = document.getElementById('mindmap-container');
const tooltip = document.getElementById('tooltip');

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

const distance = 250; 

rootNode.dataset.expanded = "false";
setupTooltip(rootNode, mapData.info);

rootNode.addEventListener('click', (e) => {
    if (rootNode.dataset.expanded === "true") return; 
    
    addPulseEffect(rootNode);

    rootNode.dataset.expanded = "true";
    rootNode.classList.remove('large');
    rootNode.classList.add('shrunk');

    // Ховаємо підказку при кліку, щоб не заважала
    tooltip.style.opacity = '0';
    setTimeout(() => { tooltip.style.display = 'none'; }, 300);

    setTimeout(() => {
        const centerX = window.innerWidth / 2;
        const centerY = window.innerHeight / 2;
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
        childEl.style.left = `${targetX - 110}px`;
        childEl.style.top = `${targetY - 35}px`;
        
        const delay = index * 0.2;
        childEl.style.animationDelay = `${delay}s`;
        childEl.dataset.expanded = "false";
        
        container.appendChild(childEl);
        drawLine(parentX, parentY, targetX, targetY, delay);

        setupTooltip(childEl, childData.info);

        childEl.addEventListener('click', () => {
            if (childEl.dataset.expanded === "true") return;
            
            addPulseEffect(childEl);
            childEl.dataset.expanded = "true";
            
            // Ховаємо підказку при кліку
            tooltip.style.opacity = '0';
            setTimeout(() => { tooltip.style.display = 'none'; }, 300);

            if (childData.children && childData.children.length > 0) {
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
    void element.offsetWidth; 
    element.classList.add('pulse');
}

function setupTooltip(element, infoObj) {
    if (!infoObj || Object.keys(infoObj).length === 0) return;

    element.addEventListener('mouseenter', (e) => {
        let tableHTML = '<table>';
        for (const [key, value] of Object.entries(infoObj)) {
            tableHTML += `<tr><th>${key}</th><td>${value}</td></tr>`;
        }
        tableHTML += '</table>';
        
        tooltip.innerHTML = tableHTML;
        tooltip.style.display = 'block';
        
        setTimeout(() => {
            tooltip.style.opacity = '1';
        }, 10);
    });

    element.addEventListener('mousemove', (e) => {
        tooltip.style.left = `${e.pageX + 20}px`;
        tooltip.style.top = `${e.pageY + 20}px`;
    });

    element.addEventListener('mouseleave', () => {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 300);
    });
}
