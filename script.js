const rootNode = document.getElementById('root-node');
const svg = document.getElementById('lines-svg');
const container = document.getElementById('mindmap-container');

// 💡 Щоб додати нове відгалудження, просто допиши його в цей масив!
// Кути розрахуються автоматично.
const childrenData = [
    { text: 'Російська імперія' },
    { text: 'Річ Посполита' },
    { text: 'Османська імперія' }
];

let isExpanded = false;
const distance = 300; // Довжина ліній (відстань від центру)

rootNode.addEventListener('click', () => {
    if (isExpanded) return; 
    isExpanded = true;

    // 1. Запускаємо анімацію зменшення
    rootNode.classList.remove('large');
    rootNode.classList.add('shrunk');

    // 2. Чекаємо, поки головний вузол зменшиться (800мс), і малюємо відгалудження
    setTimeout(() => {
        createChildren();
    }, 800);
});

function createChildren() {
    // Координати центру екрана
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;
    
    // Початковий кут (щоб перший елемент був зверху)
    const startAngle = -90; 

    childrenData.forEach((child, index) => {
        // Автоматичний розрахунок кута для рівномірного розподілу
        const angle = startAngle + (360 / childrenData.length) * index;
        const angleRad = angle * (Math.PI / 180);

        // Розрахунок позиції (відносно центру)
        const targetX = centerX + Math.cos(angleRad) * distance;
        const targetY = centerY + Math.sin(angleRad) * distance;

        // Створення прямокутника
        const childEl = document.createElement('div');
        childEl.className = 'node child';
        childEl.textContent = child.text;

        // Позиціонування прямокутника (віднімаємо половину його ширини/висоти для центрування)
        childEl.style.left = `${targetX - 110}px`; // 110 = 220/2 (ширина)
        childEl.style.top = `${targetY - 35}px`;  // 35 = 70/2 (висота)

        // Затримка анімації для ефекту появи "один за одним"
        const delay = index * 0.2;
        childEl.style.animationDelay = `${delay}s`;

        container.appendChild(childEl);

        // Створення лінії
        drawLine(centerX, centerY, targetX, targetY, delay);
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

    svg.appendChild(line);
}
