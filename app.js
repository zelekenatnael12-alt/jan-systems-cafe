// Jan Systems - Core Application Logic

// ── STATE MANAGEMENT ──
const state = {
    currentRole: 'customer',
    menu: [
        { id: 1, name: 'Oat Latte', price: 4.50, category: 'Coffee', icon: '☕', stockItem: 'Oat Milk' },
        { id: 2, name: 'Espresso', price: 3.00, category: 'Coffee', icon: '☕', stockItem: 'Coffee Beans' },
        { id: 3, name: 'Avocado Toast', price: 8.50, category: 'Food', icon: '🥑', stockItem: 'Avocados' },
        { id: 4, name: 'Club Sandwich', price: 9.50, category: 'Food', icon: '🥪', stockItem: 'Bread' },
        { id: 5, name: 'Matcha Latte', price: 5.00, category: 'Tea', icon: '🍵', stockItem: 'Matcha Powder' }
    ],
    inventory: {
        'Oat Milk': { amount: 12, unit: 'L', threshold: 5 },
        'Coffee Beans': { amount: 8, unit: 'kg', threshold: 2 },
        'Avocados': { amount: 15, unit: 'pcs', threshold: 10 },
        'Bread': { amount: 20, unit: 'loaves', threshold: 5 },
        'Matcha Powder': { amount: 1, unit: 'kg', threshold: 0.5 }
    },
    orders: [
        { id: '101', customer: 'Ayşe', items: [{ name: 'Oat Latte', qty: 1 }], status: 'preparing', timestamp: new Date() },
        { id: '102', customer: 'Kerem', items: [{ name: 'Espresso', qty: 1 }], status: 'ready', timestamp: new Date() }
    ],
    cart: []
};

// ── DOM ELEMENTS ──
const appRoot = document.getElementById('app-root');
const roleBtns = document.querySelectorAll('.nav-btn');

// ── ROUTING ──
function setRole(role) {
    state.currentRole = role;
    roleBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.role === role);
    });
    render();
}

roleBtns.forEach(btn => {
    btn.addEventListener('click', () => setRole(btn.dataset.role));
});

// ── ACTIONS ──
function addToCart(itemId) {
    const item = state.menu.find(i => i.id === itemId);
    state.cart.push({ ...item });
    render();
}

function placeOrder() {
    if (state.cart.length === 0) return;
    
    const newOrder = {
        id: Math.floor(Math.random() * 900 + 100).toString(),
        customer: 'Guest User',
        items: [...state.cart],
        status: 'new',
        timestamp: new Date()
    };
    
    state.orders.push(newOrder);
    state.lastOrderId = newOrder.id; // Track for success screen
    
    // Update Inventory
    state.cart.forEach(item => {
        if (state.inventory[item.stockItem]) {
            state.inventory[item.stockItem].amount -= 1;
        }
    });
    
    state.cart = [];
    render();
    notify('Order Placed!', 'Your order is being sent to the kitchen.');
}

function updateOrderStatus(orderId, newStatus) {
    const order = state.orders.find(o => o.id === orderId);
    if (order) {
        order.status = newStatus;
        render();
    }
}

function notify(title, msg) {
    const root = document.getElementById('notification-root');
    const toast = document.createElement('div');
    toast.className = 'card fade-in';
    toast.style = 'position:fixed; bottom:20px; right:20px; z-index:2000; border-left:4px solid var(--amber); min-width:280px;';
    toast.innerHTML = `<strong>${title}</strong><p style="font-size:13px; margin:0">${msg}</p>`;
    root.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
}

// ── RENDERING ──
function render() {
    appRoot.innerHTML = '';
    
    if (state.currentRole === 'customer') renderCustomer();
    else if (state.currentRole === 'kitchen') renderKitchen();
    else if (state.currentRole === 'admin') renderAdmin();
}

function renderCustomer() {
    const container = document.createElement('div');
    container.className = 'container customer-view fade-in';
    
    // Success Screen
    if (state.lastOrderId) {
        container.innerHTML = `
            <div class="order-success fade-in">
                <div class="success-icon">✓</div>
                <h2 style="font-size:32px">Order #${state.lastOrderId}</h2>
                <p style="color:var(--warm-gray); margin-bottom:32px">Your coffee is on the way!</p>
                <button class="btn btn-primary" onclick="state.lastOrderId = null; render()">Back to Menu</button>
            </div>
        `;
        appRoot.appendChild(container);
        return;
    }

    // Header
    container.innerHTML = `
        <header class="menu-header">
            <h1 style="font-size: 42px; margin-bottom: 8px;">Order Now</h1>
            <p style="color: var(--warm-gray)">Quick, fresh, and ready for you.</p>
        </header>
    `;
    
    // Menu
    const categories = [...new Set(state.menu.map(i => i.category))];
    categories.forEach(cat => {
        const catDiv = document.createElement('div');
        catDiv.className = 'menu-category';
        catDiv.innerHTML = `<h3 class="category-title">${cat}</h3>`;
        
        const grid = document.createElement('div');
        grid.className = 'menu-grid';
        
        state.menu.filter(i => i.category === cat).forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'card menu-item';
            itemDiv.innerHTML = `
                <div class="item-img">${item.icon}</div>
                <div class="item-info">
                    <div class="item-name">${item.name}</div>
                    <div class="item-price">₺${item.price.toFixed(2)}</div>
                </div>
                <button class="btn btn-primary" onclick="addToCart(${item.id})">+</button>
            `;
            grid.appendChild(itemDiv);
        });
        catDiv.appendChild(grid);
        container.appendChild(catDiv);
    });
    
    // Floating Cart
    if (state.cart.length > 0) {
        const cartBar = document.createElement('div');
        cartBar.style = 'position:fixed; bottom:0; left:0; right:0; background:var(--espresso); padding:20px; display:flex; justify-content:center; z-index:500;';
        cartBar.innerHTML = `
            <button class="btn btn-primary" style="width:100%; max-width:400px; display:flex; justify-content:space-between;" onclick="placeOrder()">
                <span>Place Order (${state.cart.length})</span>
                <span>₺${state.cart.reduce((acc, curr) => acc + curr.price, 0).toFixed(2)}</span>
            </button>
        `;
        container.appendChild(cartBar);
    }
    
    appRoot.appendChild(container);
}

function renderKitchen() {
    const container = document.createElement('div');
    container.className = 'container fade-in';
    container.innerHTML = `<h2 style="margin-bottom:24px">Live Orders</h2>`;
    
    const board = document.createElement('div');
    board.className = 'kitchen-view';
    
    const columns = [
        { id: 'new', label: 'Incoming', btnLabel: 'Prepare', next: 'preparing' },
        { id: 'preparing', label: 'Making', btnLabel: 'Ready', next: 'ready' },
        { id: 'ready', label: 'Ready for Pickup', btnLabel: 'Complete', next: 'done' }
    ];
    
    columns.forEach(col => {
        const colDiv = document.createElement('div');
        colDiv.className = 'order-col';
        
        const filtered = state.orders.filter(o => o.status === col.id);
        colDiv.innerHTML = `
            <div class="col-header">
                <span>${col.label}</span>
                <span>${filtered.length}</span>
            </div>
        `;
        
        filtered.forEach(order => {
            const orderCard = document.createElement('div');
            orderCard.className = 'order-card fade-in';
            orderCard.innerHTML = `
                <div class="order-header">
                    <span class="order-id">#${order.id}</span>
                    <span style="font-size:12px; color:var(--warm-gray)">${order.customer}</span>
                </div>
                <div style="margin-bottom:12px">
                    ${order.items.map(i => `<div style="font-size:14px"><strong>${i.qty || 1}x</strong> ${i.name}</div>`).join('')}
                </div>
                <button class="btn btn-outline" style="width:100%; padding:8px" onclick="updateOrderStatus('${order.id}', '${col.next}')">
                    ${col.btnLabel}
                </button>
            `;
            colDiv.appendChild(orderCard);
        });
        
        board.appendChild(colDiv);
    });
    
    container.appendChild(board);
    appRoot.appendChild(container);
}

function renderAdmin() {
    const container = document.createElement('div');
    container.className = 'container admin-view fade-in';
    
    // Inventory Section
    const invSection = document.createElement('div');
    invSection.innerHTML = `
        <h2 style="margin-bottom:24px">Inventory Status</h2>
        <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr)); gap:16px">
            ${Object.entries(state.inventory).map(([name, data]) => `
                <div class="card" style="border-top: 4px solid ${data.amount <= data.threshold ? 'red' : 'var(--sage)'}">
                    <div style="font-size:12px; color:var(--warm-gray)">${name}</div>
                    <div style="font-size:24px; font-weight:700">${data.amount}${data.unit}</div>
                    ${data.amount <= data.threshold ? '<span style="color:red; font-size:11px; font-weight:700">LOW STOCK</span>' : ''}
                </div>
            `).join('')}
        </div>
    `;
    
    // Staff Sidebar
    const staffSection = document.createElement('div');
    staffSection.innerHTML = `
        <h2 style="margin-bottom:24px">Staff on Duty</h2>
        <div class="card" style="display:flex; flex-direction:column; gap:12px">
            <div style="display:flex; align-items:center; gap:12px">
                <div style="width:32px; height:32px; border-radius:50%; background:var(--amber); display:flex; align-items:center; justify-content:center; font-weight:700">Z</div>
                <div>Zeynep (Barista)</div>
            </div>
            <div style="display:flex; align-items:center; gap:12px">
                <div style="width:32px; height:32px; border-radius:50%; background:var(--sage); display:flex; align-items:center; justify-content:center; font-weight:700; color:#fff">M</div>
                <div>Murat (Manager)</div>
            </div>
            <hr style="opacity:0.1">
            <button class="btn btn-outline" style="width:100%">Manage Schedule</button>
        </div>
    `;
    
    container.appendChild(invSection);
    container.appendChild(staffSection);
    appRoot.appendChild(container);
}

// Initial render
setTimeout(render, 1000); // Simulate "waking up"
window.addToCart = addToCart;
window.placeOrder = placeOrder;
window.updateOrderStatus = updateOrderStatus;
