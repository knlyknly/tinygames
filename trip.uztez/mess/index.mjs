import { Tripez } from '../assets/core/tripez-io.mjs';

// DOM元素
const tripsManagerBtn = document.getElementById('trips-manager-btn');
const tripsManager = document.getElementById('trips-manager');
const tripsList = document.getElementById('trips-list');
const addTripBtn = document.getElementById('add-trip-btn');
const currentTripName = document.getElementById('current-trip-name');
const tripEditor = document.getElementById('trip-editor');
const formatBtn = document.getElementById('format-btn');
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modal-title');
const modalInput = document.getElementById('modal-input');
const modalCancel = document.getElementById('modal-cancel');
const modalConfirm = document.getElementById('modal-confirm');

// 状态变量
let trips = [];
let currentTripIndex = -1;
let modalMode = 'add'; // 'add', 'rename'
let modalTripIndex = -1;

// 初始化
function init() {
    loadTrips();
    setupEventListeners();
    
    // 如果有行程，默认选择第一个
    if (trips.length > 0) {
        selectTrip(0);
    }
}

// 从localStorage加载trips数据
function loadTrips() {
    const storedTrips = localStorage.getItem('trips');
    if (storedTrips) {
        trips = JSON.parse(storedTrips);
    } else {
        // 如果没有存储的trips，创建一个示例
        const exampleTrip = {
            name: '示例行程',
            content: 'd1 w4-0724 247km\n===================\n14:00 成都市↑500(43km-1h)\n15:00 崇州市&望蜀里&川藏线起点\n      拍摄视频\n    ↓ (104km-1h)\n18:00 雅安市(100km-2h)\n20:00 泸定县↑1321&泸定桥(60km-1h)\n21:00 康定市↑2560(34km-1h)\n22:00 折多山↑4298(36km-1h)\n23:00 新都桥↑3000'
        };
        trips = [exampleTrip];
        saveTrips();
    }
    renderTripsList();
}

// 保存trips到localStorage
function saveTrips() {
    localStorage.setItem('trips', JSON.stringify(trips));
}

// 渲染trips列表
function renderTripsList() {
    tripsList.innerHTML = '';
    trips.forEach((trip, index) => {
        const li = document.createElement('li');
        li.className = `trip-item ${index === currentTripIndex ? 'active' : ''}`;
        
        li.innerHTML = `
            <span class="trip-name">${trip.name}</span>
            <div class="trip-actions">
                <button class="rename-btn" title="重命名">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                        <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                    </svg>
                </button>
                <button class="delete-btn" title="删除">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                        <polyline points="3 6 5 6 21 6"></polyline>
                        <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                    </svg>
                </button>
            </div>
        `;
        
        // 点击行程名称选择该行程
        const tripName = li.querySelector('.trip-name');
        tripName.addEventListener('click', () => selectTrip(index));
        
        // 重命名按钮
        const renameBtn = li.querySelector('.rename-btn');
        renameBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            showRenameModal(index);
        });
        
        // 删除按钮
        const deleteBtn = li.querySelector('.delete-btn');
        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            deleteTrip(index);
        });
        
        tripsList.appendChild(li);
    });
}

// 选择行程
function selectTrip(index) {
    // 保存当前行程内容（如果有）
    if (currentTripIndex !== -1) {
        trips[currentTripIndex].content = tripEditor.value;
        saveTrips();
    }
    
    currentTripIndex = index;
    const trip = trips[index];
    currentTripName.textContent = trip.name;
    tripEditor.value = trip.content;
    
    // 更新列表中的活动状态
    renderTripsList();
    
    // 关闭行程管理器
    tripsManager.classList.add('hidden');
}

// 添加新行程
function addTrip(name) {
    const newTrip = {
        name: name,
        content: ''
    };
    trips.push(newTrip);
    saveTrips();
    renderTripsList();
    selectTrip(trips.length - 1);
}

// 重命名行程
function renameTrip(index, newName) {
    trips[index].name = newName;
    saveTrips();
    renderTripsList();
    
    if (index === currentTripIndex) {
        currentTripName.textContent = newName;
    }
}

// 删除行程
function deleteTrip(index) {
    if (confirm(`确定要删除行程 "${trips[index].name}" 吗？`)) {
        trips.splice(index, 1);
        saveTrips();
        
        // 如果删除的是当前选中的行程
        if (index === currentTripIndex) {
            if (trips.length > 0) {
                // 选择同一位置的行程，或者最后一个
                const newIndex = Math.min(index, trips.length - 1);
                selectTrip(newIndex);
            } else {
                // 没有行程了
                currentTripIndex = -1;
                currentTripName.textContent = '未选择行程';
                tripEditor.value = '';
            }
        } else if (index < currentTripIndex) {
            // 如果删除的行程在当前行程之前，需要调整当前索引
            currentTripIndex--;
        }
        
        renderTripsList();
    }
}

// 格式化当前行程文本
function formatTripText() {
    if (currentTripIndex === -1) return;
    
    try {
        const text = tripEditor.value;
        const model = Tripez.fromText(text);
        const formattedText = Tripez.toText(model, {
            forceDaysContinuous: true
        });
        
        tripEditor.value = formattedText;
        
        // 保存格式化后的内容
        trips[currentTripIndex].content = formattedText;
        saveTrips();
    } catch (error) {
        alert('格式化失败：' + error.message);
        console.error('格式化错误:', error);
    }
}

// 显示添加行程的模态框
function showAddModal() {
    modalMode = 'add';
    modalTitle.textContent = '新增行程';
    modalInput.value = '';
    modal.classList.remove('hidden');
    modalInput.focus();
}

// 显示重命名行程的模态框
function showRenameModal(index) {
    modalMode = 'rename';
    modalTripIndex = index;
    modalTitle.textContent = '重命名行程';
    modalInput.value = trips[index].name;
    modal.classList.remove('hidden');
    modalInput.focus();
}

// 关闭模态框
function closeModal() {
    modal.classList.add('hidden');
}

// 确认模态框操作
function confirmModal() {
    const name = modalInput.value.trim();
    if (!name) {
        alert('请输入行程名称');
        return;
    }
    
    if (modalMode === 'add') {
        addTrip(name);
    } else if (modalMode === 'rename') {
        renameTrip(modalTripIndex, name);
    }
    
    closeModal();
}

// 设置事件监听器
function setupEventListeners() {
    // 行程管理按钮
    tripsManagerBtn.addEventListener('click', (e) => {
        tripsManager.classList.toggle('hidden');
        e.stopPropagation();
    });
    
    // 点击页面其他地方关闭下拉菜单
    document.addEventListener('click', (e) => {
        if (!tripsManager.contains(e.target) && e.target !== tripsManagerBtn) {
            tripsManager.classList.add('hidden');
        }
    });
    
    // 添加行程按钮
    addTripBtn.addEventListener('click', showAddModal);
    
    // 格式化按钮
    formatBtn.addEventListener('click', formatTripText);
    
    // 编辑器内容变化时保存
    tripEditor.addEventListener('input', () => {
        if (currentTripIndex !== -1) {
            trips[currentTripIndex].content = tripEditor.value;
            saveTrips();
        }
    });
    
    // 模态框按钮
    modalCancel.addEventListener('click', closeModal);
    modalConfirm.addEventListener('click', confirmModal);
    
    // 模态框回车键确认
    modalInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
            confirmModal();
        }
    });
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !modal.classList.contains('hidden')) {
            closeModal();
        }
    });
}

// 初始化应用
init();