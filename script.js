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
    },
    {
        id: 'attack',
        title: "Знищення Богополя (Грудень 1763)",
        text: "Мирне співіснування виявилося міфом. Вже наприкінці 1763 року загони козаків з Орла за наказом російського командування здійснили рейд на щойно закладений Богопіль. Маєток був значно зруйнований і спалений, що яскраво демонструє жорстку конкуренцію на Фронтирі."
    },
    {
        id: 'fort',
        title: "Шанець (Середина 1764)",
        text: "Зліва від слободи Орел споруджується земляне укріплення бастіонного типу у формі шестикутної зірки. Цей шанець мав на меті посилити військову присутність імперії на кордоні та захистити стратегічну переправу через Південний Буг."
    }
];

// ІДЕАЛЬНО ВИВІРЕНІ ТОЧКИ ЗУПИНКИ: 1764.5 для Шанця
const milestones = [1756, 1757, 1762, 1763, 1763.9, 1764.5, 1765];
let currentMilestoneIndex = 0;

// --- ГЕНЕРАТОР ДИНАМІЧНИХ ХАТИНОК ---
function generateHouses() {
    scatterDynamicHouses('settlement-orel', 580, 320, 50, 20, 1757, 5);
    scatterDynamicHouses('settlement-holta', 510, 460, 40, 20, 1762, 5);
    scatterDynamicHouses('settlement-bohopil', 380, 360, 35, 15, 1763, 5);
}

function scatterDynamicHouses(groupId, cx, cy, radius, startCount, startYear, perYearCount) {
    const group = document.getElementById(groupId);
    if (!group) return;

    const maxYear = 1765;
    const totalYears = maxYear - startYear;
    const totalCount = startCount + (totalYears * perYearCount);

    for (let i = 0; i < totalCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const r = Math.sqrt(Math.random()) * radius; 
        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;

        const useEl = document.createElementNS('http://www.w3.org/2000/svg', 'use');
        useEl.setAttribute('href', '#tiny-house');
        useEl.setAttribute('x', x);
        useEl.setAttribute('y', y);
        useEl.setAttribute('class', 'house-icon timeline-house');

        let appearYear = startYear;
        if (i >= startCount) {
            const extraIndex = i - startCount;
            appearYear = startYear + (extraIndex / perYearCount);
        }
        
        let destroyYear = null;
        if (groupId === 'settlement-bohopil' && i < 6) {
            destroyYear = 1763.9;
        }

        useEl.dataset.appearYear = appearYear;
        if (destroyYear) useEl.dataset.destroyYear = destroyYear;

        const rotation = Math.random() * 40 - 20;
        useEl.setAttribute('transform', `rotate(${rotation} ${x} ${y})`);
        group.appendChild(useEl);
    }
}
generateHouses();

// --- ЛОГІКА ПОВЗУНКА ТА КАМЕРИ ---
const slider = document.getElementById('year-slider');
const yearDisplay = document.getElementById('year-display');
const nextBtn = document.getElementById('next-event-btn');

let isAnimating = false; 

function focusCamera(id) {
    const rc = document.getElementById('rivers-container');
    const cameraPositions = {
        'start': { x: '0%', y: '0%', scale: 1 }, 
        'orel': { x: '-8%', y: '5%', scale: 1.3 }, 
        'holta': { x: '-2%', y: '-8%', scale: 1.3 }, 
        'bohopil': { x: '8%', y: '2%', scale: 1.3 }, 
        'attack': { x: '2%', y: '1%', scale: 1.4 }, 
        'fort': { x: '5%', y: '8%', scale: 1.3 }, 
        'end': { x: '0%', y: '0%', scale: 1 } 
    };
    
    const cam = cameraPositions[id] || cameraPositions['start'];
    rc.style.setProperty('--cam-x', cam.x);
    rc.style.setProperty('--cam-y', cam.y);
    rc.style.setProperty('--cam-scale', cam.scale);
}

function openInfoPanel(id) {
    const data = historyData.find(d => d.id === id);
    if (data) {
        document.getElementById('modal-title').textContent = data.title;
        document.getElementById('modal-text').textContent = data.text;
        document.getElementById('info-modal').classList.remove('hidden');
        document.body.classList.add('panel-open');
    }
}

function closeInfoPanel() {
    document.getElementById('info-modal').classList.add('hidden');
    document.body.classList.remove('panel-open');
}

function generateSliderMarkers() {
    const markerContainer = document.getElementById('slider-markers');
    if (!markerContainer) return;
    
    markerContainer.innerHTML = '';
    const minYear = 1756; 
    const maxYear = 1765;
    
    milestones.forEach(year => {
        const percent = ((year - minYear) / (maxYear - minYear)) * 100;
        const marker = document.createElement('div');
        marker.className = 'slider-marker';
        marker.style.left = `calc(${percent}% + ${10 - (percent * 0.2)}px)`;
        markerContainer.appendChild(marker);
    });
}
generateSliderMarkers();

function initTimeline() {
    document.getElementById('bottom-timeline').classList.remove('hidden');
    updateTimelineView(1756); 
}

slider.addEventListener('input', (e) => {
    let selectedYear = parseFloat(e.target.value);
    const maxAllowedYear = milestones[currentMilestoneIndex];

    if (selectedYear > maxAllowedYear) {
        selectedYear = maxAllowedYear;
        slider.value = maxAllowedYear;
    }
    updateTimelineView(selectedYear);
    
    closeInfoPanel();
    focusCamera('start'); 
});

function animateSlider(startVal, endVal, duration) {
    isAnimating = true;
    slider.disabled = true; 
    nextBtn.disabled = true;

    const startTime = performance.now();

    function step(currentTime) {
        let progress = (currentTime - startTime) / duration;
        if (progress > 1) progress = 1;

        const easeProgress = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        const currentVal = startVal + (endVal - startVal) * easeProgress;
        
        slider.value = currentVal;
        updateTimelineView(currentVal);
        
        if (progress < 1) {
            requestAnimationFrame(step); 
        } else {
            slider.disabled = false;
            isAnimating = false;
            if (currentMilestoneIndex < milestones.length - 1) {
                nextBtn.disabled = false;
            }
        }
    }
    requestAnimationFrame(step); 
}

nextBtn.addEventListener('click', () => {
    if (currentMilestoneIndex < milestones.length - 1 && !isAnimating) {
        const startYear = parseFloat(slider.value);
        currentMilestoneIndex++;
        const targetYear = milestones[currentMilestoneIndex];
        
        animateSlider(startYear, targetYear, 1500); 

        let idToOpen = null;
        if (targetYear === 1757) idToOpen = 'orel';
        else if (targetYear === 1762) idToOpen = 'holta';
        else if (targetYear === 1763) idToOpen = 'bohopil';
        else if (targetYear === 1763.9) idToOpen = 'attack';
        else if (targetYear === 1764.5) idToOpen = 'fort'; // ТОЧНО 1764.5
        
        if (idToOpen) {
            openInfoPanel(idToOpen);
            focusCamera(idToOpen);
        } else {
            focusCamera('end'); 
        }
    }
});

    // ТУТ ЗАДАНІ ПРАВИЛЬНІ ДІАПАЗОНИ СУВОЇВ ДЛЯ КОЖНОЇ ПОДІЇ
    processSettlement('orel', 1757, 1762, currentYear);
    processSettlement('holta', 1762, 1763, currentYear);
    processSettlement('bohopil', 1763, 1763.9, currentYear);
    processSettlement('fort', 1764.5, 1766, currentYear); // Від 1764.5 до кінця
    
    processAttackEvent('attack', 1763.9, 1764.5, currentYear); // Від атаки рівно до форту
    
    if (currentYear < 1757) {
        nextBtn.textContent = "Почати ➔";
    } else {
        nextBtn.textContent = "Наступна подія ➔";
    }
}

function processSettlement(id, startYear, endYear, currentYear) {
    const group = document.getElementById(`settlement-${id}`);
    if (!group) return;
    
    const scrollBtn = group.querySelector('.scroll-btn');

    if (currentYear >= startYear) {
        const wasHidden = group.classList.contains('timeline-hidden');
        if (wasHidden) {
            group.classList.remove('timeline-hidden');
            group.classList.remove('flash-reveal');
            void group.offsetWidth; 
            group.classList.add('flash-reveal');
        }

        if (!group.cachedHouses) {
            group.cachedHouses = group.querySelectorAll('.timeline-house');
        }

        group.cachedHouses.forEach(house => {
            const appearYear = parseFloat(house.dataset.appearYear);
            const destroyYear = house.dataset.destroyYear ? parseFloat(house.dataset.destroyYear) : Infinity;
            
            const shouldShow = (currentYear >= appearYear) && (currentYear < destroyYear);
            
            if (house.classList.contains('visible') !== shouldShow) {
                house.classList.toggle('visible', shouldShow);
            }
        });

        if (currentYear >= startYear && currentYear < endYear) {
            scrollBtn.classList.remove('hidden');
        } else {
            scrollBtn.classList.add('hidden');
        }

    } else {
        group.classList.add('timeline-hidden');
        group.classList.remove('flash-reveal');
        scrollBtn.classList.add('hidden');
        
        if (!group.cachedHouses) {
            group.cachedHouses = group.querySelectorAll('.timeline-house');
        }
        group.cachedHouses.forEach(house => house.classList.remove('visible'));
    }
}

function processAttackEvent(id, startYear, endYear, currentYear) {
    const attackGroup = document.getElementById(`event-${id}`);
    if (!attackGroup) return; 
    
    const scrollBtn = attackGroup.querySelector('.scroll-btn');

    if (currentYear >= startYear && currentYear < endYear) {
        attackGroup.classList.remove('timeline-hidden');
        scrollBtn.classList.remove('hidden');
    } else {
        attackGroup.classList.add('timeline-hidden');
        scrollBtn.classList.add('hidden');
    }
}

// --- ЛОГІКА СУВОЇВ ТА ДОВІДКИ ---
document.querySelectorAll('.scroll-btn').forEach(btn => {
    btn.addEventListener('click', function(e) {
        e.stopPropagation(); 
        const parentId = this.parentElement.getAttribute('data-id');
        openInfoPanel(parentId);
        focusCamera(parentId); 
    });
});

document.getElementById('close-modal').addEventListener('click', () => {
    closeInfoPanel();
    focusCamera('start'); 
});
