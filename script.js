const rootNode = document.getElementById('root-node');
const svg = document.getElementById('lines-svg');
const container = document.getElementById('mindmap-container');
const zoomWrapper = document.getElementById('zoom-wrapper');
const tooltip = document.getElementById('tooltip');

let tooltipTimeout; 
let terminalNodes = []; 
let terminalLinks = []; 
let openedTerminalsCount = 0; 
let finaleTriggered = false; 

const mapData = {
    text: 'Фронтир',
    info: { "Сутність": "Зона контакту", "Період": "XVI-XVIII ст.", "Регіон": "Україна" },
    children: [
        {
            text: 'Річ Посполита',
            theme: 'polish', 
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
            theme: 'russian', 
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
            theme: 'ottoman', 
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
    if (rootNode.dataset.state === "ready-for-finale") {
        addPulseEffect(rootNode);
        rootNode.classList.remove('golden-ready');
        rootNode.dataset.state = "finished";

        document.body.classList.add('finale-water');
        
        requestAnimationFrame(animateTilt);
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

        const currentTheme = childData.theme || parentTheme;

        childData.localAngle = angle;
        childData.distance = distance;
        childData.currentX = targetX;
        childData.currentY = targetY;

        const childEl = document.createElement('div');
        childEl.className = 'node child';
        if (currentTheme) childEl.classList.add(currentTheme);
        
        childEl.textContent = childData.text;
        childEl.style.left = `${targetX}px`;
        childEl.style.top = `${targetY}px`;
        
        const delay = index * 0.2;
        childEl.style.animationDelay = `${delay}s`;
        childEl.dataset.expanded = "false";
        
        childData.nodeEl = childEl; 
        zoomWrapper.appendChild(childEl);
        
        const mainLine = drawLine(parentX, parentY, targetX, targetY, delay, false);
        if (currentTheme) mainLine.classList.add(currentTheme);
        childData.lineEl = mainLine; 

        setupTooltip(childEl, childData.info);

        if (!childData.children || childData.children.length === 0) {
            openedTerminalsCount++;
            terminalNodes.push(childData);
            
            if (terminalNodes.length > 1) {
                terminalNodes.slice(0, -1).forEach(prevNode => {
                    const gLine = drawLine(prevNode.currentX, prevNode.currentY, targetX, targetY, delay + 0.6, true);
                    gLine.classList.add(currentTheme); 
                    gLine.classList.add('golden');
                    
                    terminalLinks.push({ lineEl: gLine, nodeA: prevNode, nodeB: childData });
                });
            }

            if (openedTerminalsCount === 3) {
                setTimeout(() => {
                    rootNode.classList.add('golden-ready');
                    rootNode.dataset.state = "ready-for-finale";
                }, 2000); 
            }
        }

        childEl.addEventListener('click', () => {
            if (childEl.dataset.expanded === "true") return;
            
            addPulseEffect(childEl);
            childEl.dataset.expanded = "true";
            hideTooltipInstantly();

            if (childData.children && childData.children.length > 0) {
                spawnChildren(childData.children, targetX, targetY, angle, 120, currentTheme);
            }
        });
    });

    setTimeout(autoScaleAndCenter, 300);
}

// ----------------------------------------------------
let startTime = null;
const duration = 2500; 

function animateTilt(timestamp) {
    if (!startTime) startTime = timestamp;
    const elapsed = timestamp - startTime;
    let progress = elapsed / duration;
    if (progress > 1) progress = 1;

    const ease = progress < 0.5 ? 4 * progress * progress * progress : 1 - Math.pow(-2 * progress + 2, 3) / 2;
    const currentOffset = -40 * ease; 

    const centerX = parseFloat(rootNode.style.left);
    const centerY = parseFloat(rootNode.style.top);

    mapData.children.forEach(mainBranch => {
        let offset = 0;
        if (mainBranch.theme === 'russian') {
            offset = currentOffset;
        }
        updateBranchPositions(mainBranch, centerX, centerY, offset);
    });

    terminalLinks.forEach(link => {
        const x1 = link.nodeA.currentX;
        const y1 = link.nodeA.currentY;
        const x2 = link.nodeB.currentX;
        const y2 = link.nodeB.currentY;

        link.lineEl.setAttribute('x1', x1);
        link.lineEl.setAttribute('y1', y1);
        link.lineEl.setAttribute('x2', x2);
        link.lineEl.setAttribute('y2', y2);

        const newLength = Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
        link.lineEl.style.strokeDasharray = newLength;
    });

    if (progress < 1) {
        requestAnimationFrame(animateTilt);
    } else {
        autoScaleAndCenter(); 

        if (!finaleTriggered) {
            finaleTriggered = true;
            setTimeout(() => {
                container.classList.add('fade-out-map');
                
                setTimeout(() => {
                    document.getElementById('rivers-container').classList.add('show-rivers');
                    setTimeout(initTimeline, 1000); 
                }, 1000); 

            }, 5000);
        }
    }
}

function updateBranchPositions(nodeData, parentX, parentY, angleOffset) {
    if (!nodeData.nodeEl) return;

    const newAngle = nodeData.localAngle + angleOffset;
    const angleRad = newAngle * (Math.PI / 180);

    const targetX = parentX + Math.cos(angleRad) * nodeData.distance;
    const targetY = parentY + Math.sin(angleRad) * nodeData.distance;

    nodeData.currentX = targetX;
    nodeData.currentY = targetY;

    nodeData.nodeEl.style.left = `${targetX}px`;
    nodeData.nodeEl.style.top = `${targetY}px`;

    if (nodeData.lineEl) {
        nodeData.lineEl.setAttribute('x1', parentX);
        nodeData.lineEl.setAttribute('y1', parentY);
        nodeData.lineEl.setAttribute('x2', targetX);
        nodeData.lineEl.setAttribute('y2', targetY);
    }

    if (nodeData.children) {
        nodeData.children.forEach(child => {
            updateBranchPositions(child, targetX, targetY, angleOffset);
        });
    }
}
// ----------------------------------------------------

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
    
    return line; 
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

// --- БАЗА ДАНИХ ІСТОРИЧНИХ ДОВІДОК ---
const historyData = [
    {
        id: 'orel',
        title: "Орел (1757)",
        text: "Слобода Орел заснована на лівому березі Південного Бугу. Російська імперія цілеспрямовано будувала тут форпост для захисту від татарських набігів та поступової колонізації степу. Орел став центром сотні Новослобідського козацького полку."
    },
    {
        id: 'holta',
        title: "Голта (1762)",
        text: "Ханська слобода Голта виникла на правому березі Південного Бугу. Османська імперія заклала це поселення для контролю над стратегічно важливою переправою. Територія формально належала Кримському ханству, васалу Османів."
    },
    {
        id: 'bohopil',
        title: "Богопіль (1763)",
        text: "Реагуючи на активність сусідів, Річ Посполита закріплює свою присутність у межиріччі. За наказом графа Станіслава Потоцького тут закладається укріплений маєток Богопіль, який став митним та торговельним центром Брацлавського воєводства."
    }
];

let currentTimelineStep = 0;
let maxUnlockedStep = 0;

// --- ГЕНЕРАТОР ХАТИНОК ---
function generateHouses() {
    scatterHouses('settlement-bohopil', 380, 360, 35, 22);
    scatterHouses('settlement-orel', 580, 320, 45, 50);
    scatterHouses('settlement-holta', 510, 460, 35, 30);
}

function scatterHouses(groupId, cx, cy, radius, count) {
    const group = document.getElementById(groupId);
    if (!group) return;

    for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius; 
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        useEl.setAttribute('href', '#tiny-house');
        useEl.setAttribute('x', x);
        useEl.setAttribute('y', y);
        useEl.setAttribute('class', 'house-icon');

        const rotation = Math.random() * 40 - 20;
        useEl.setAttribute('transform', `rotate(${rotation} ${x} ${y})`);
        group.appendChild(useEl);
    }
}
generateHouses();

// --- ЛОГІКА ТАЙМЛАЙНУ ---
function initTimeline() {
    document.getElementById('bottom-timeline').classList.remove('hidden');
    updateTimelineView();
}

function updateTimelineView() {
    // 1. Оновлюємо стан поселень на мапі
    historyData.forEach((data, index) => {
        const settlement = document.getElementById(`settlement-${data.id}`);
        const scrollBtn = settlement.querySelector('.scroll-btn');
        
        // Перевіряємо, чи було поселення прихованим ДО цього моменту
        const wasHidden = settlement.classList.contains('timeline-hidden');

        if (index <= currentTimelineStep) {
            // Якщо воно було приховане і саме зараз з'являється — робимо спалах!
            if (wasHidden) {
                settlement.classList.remove('flash-reveal');
                void settlement.offsetWidth; // Магія перезапуску анімації
                settlement.classList.add('flash-reveal');
            }
            settlement.classList.remove('timeline-hidden'); 
        } else {
            // Ховаємо ті, час яких ще не настав
            settlement.classList.add('timeline-hidden'); 
        }

        // Логіка сувою: показуємо іконку ТІЛЬКИ в той рік, про який іде мова
        if (index === currentTimelineStep) {
            scrollBtn.classList.remove('hidden');
        } else {
            scrollBtn.classList.add('hidden');
        }
    });

    // 2. Оновлюємо вузли на нижній шкалі
    const nodes = document.querySelectorAll('.timeline-node');
    nodes.forEach((node, index) => {
        node.classList.remove('active');
        if (index === currentTimelineStep) node.classList.add('active');
        
        if (index <= maxUnlockedStep) {
            node.classList.remove('locked');
        }
    });

    // 3. Заповнюємо смугу прогресу
    const progress = document.getElementById('timeline-progress');
    progress.style.width = `${(currentTimelineStep / (historyData.length - 1)) * 100}%`;

    // 4. Оновлюємо кнопку "Наступна подія"
    const nextBtn = document.getElementById('next-event-btn');
    if (currentTimelineStep === historyData.length - 1) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
        if (currentTimelineStep < maxUnlockedStep) {
            nextBtn.textContent = "Вперед ➔";
        } else {
            nextBtn.textContent = "Наступна подія ➔";
        }
    }
}

        // Логіка сувою: показуємо іконку ТІЛЬКИ в той рік, про який іде мова
        if (index === currentTimelineStep) {
            scrollBtn.classList.remove('hidden');
        } else {
            scrollBtn.classList.add('hidden');
        }
    });

    window.lastStep = currentTimelineStep;

    // 2. Оновлюємо вузли на нижній шкалі
    const nodes = document.querySelectorAll('.timeline-node');
    nodes.forEach((node, index) => {
        node.classList.remove('active');
        if (index === currentTimelineStep) node.classList.add('active');
        
        if (index <= maxUnlockedStep) {
            node.classList.remove('locked');
        }
    });

    // 3. Заповнюємо смугу прогресу
    const progress = document.getElementById('timeline-progress');
    progress.style.width = `${(currentTimelineStep / (historyData.length - 1)) * 100}%`;

    // 4. Оновлюємо кнопку "Наступна подія"
    const nextBtn = document.getElementById('next-event-btn');
    if (currentTimelineStep === historyData.length - 1) {
        nextBtn.disabled = true;
    } else {
        nextBtn.disabled = false;
        // Якщо користувач відмотав час назад
        if (currentTimelineStep < maxUnlockedStep) {
            nextBtn.textContent = "Вперед ➔";
        } else {
            nextBtn.textContent = "Наступна подія ➔";
        }
    }
}

// Кнопка "Наступна подія"
document.getElementById('next-event-btn').addEventListener('click', () => {
    if (currentTimelineStep < historyData.length - 1) {
        currentTimelineStep++;
        if (currentTimelineStep > maxUnlockedStep) {
            maxUnlockedStep = currentTimelineStep;
        }
        updateTimelineView();
    }
});

// Кліки по самих роках на таймлайні (навігація)
document.querySelectorAll('.timeline-node').forEach(node => {
    node.addEventListener('click', function() {
        const index = parseInt(this.getAttribute('data-index'));
        if (index <= maxUnlockedStep) {
            currentTimelineStep = index;
            updateTimelineView();
        }
    });
});

// --- ЛОГІКА СУВОЇВ ТА ДОВІДКИ ---
document.querySelectorAll('.scroll-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation(); // Щоб клік не йшов далі
        const parentId = this.parentElement.getAttribute('data-id');
        const data = historyData.find(d => d.id === parentId);
        
        if (data) {
            document.getElementById('modal-title').textContent = data.title;
            document.getElementById('modal-text').textContent = data.text;
            document.getElementById('info-modal').classList.remove('hidden');
        }
    });
});

document.getElementById('close-modal').addEventListener('click', () => {
    document.getElementById('info-modal').classList.add('hidden');
});
