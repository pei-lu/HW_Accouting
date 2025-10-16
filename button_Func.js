// 商品销售系统 JavaScript 功能

// 销售数据存储
let salesData = {};

// 密码验证相关
const CORRECT_PASSWORD = "Vender2025";
let isAuthenticated = false;

// 防抖机制
let isProcessing = false;

// 初始化销售数据（优先从localStorage加载，然后从JSON文件）
async function initializeSalesData() {
    // 首先尝试从localStorage加载数据
    loadFromLocalStorage();
    
    // 如果localStorage没有数据，则从JSON文件加载
    if (Object.keys(salesData).length === 0) {
        try {
            const response = await fetch('sales_data.json');
            if (response.ok) {
                salesData = await response.json();
                console.log('销售数据已从JSON文件加载');
            } else {
                throw new Error('无法加载JSON文件');
            }
        } catch (error) {
            console.error('加载JSON文件失败:', error);
            // 如果加载失败，使用默认数据
            const products = [
                "Laser Badge", "fursuit glass", "badge standard", "badge Customize",
                "collar", "collar-wide", "consent Badge", "keychain"
            ];
            
            products.forEach(product => {
                if (!salesData[product]) {
                    salesData[product] = {
                        quantity: 0,
                        totalSales: 0
                    };
                }
            });
        }
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    showPasswordModal();
    setupPasswordEventListeners();
});

// 显示密码模态框
function showPasswordModal() {
    const modal = document.getElementById('passwordModal');
    const mainContainer = document.getElementById('mainContainer');
    
    modal.style.display = 'flex';
    mainContainer.style.display = 'none';
    
    // 聚焦到密码输入框
    setTimeout(() => {
        document.getElementById('passwordInput').focus();
    }, 100);
}

// 隐藏密码模态框并显示主界面
function hidePasswordModal() {
    const modal = document.getElementById('passwordModal');
    const mainContainer = document.getElementById('mainContainer');
    
    modal.style.display = 'none';
    mainContainer.style.display = 'block';
}

// 设置密码相关事件监听器
function setupPasswordEventListeners() {
    const passwordInput = document.getElementById('passwordInput');
    const loginBtn = document.getElementById('loginBtn');
    const logoutBtn = document.getElementById('logoutBtn');
    
    // 登录按钮点击事件
    loginBtn.addEventListener('click', handleLogin);
    
    // 密码输入框回车事件
    passwordInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleLogin();
        }
    });
    
    // 退出登录按钮
    logoutBtn.addEventListener('click', handleLogout);
}

// 处理登录
function handleLogin() {
    const passwordInput = document.getElementById('passwordInput');
    const errorMessage = document.getElementById('errorMessage');
    const enteredPassword = passwordInput.value.trim();
    
    if (enteredPassword === CORRECT_PASSWORD) {
        isAuthenticated = true;
        hidePasswordModal();
        initializeSystem();
        showSuccessMessage('登录成功！欢迎使用商品销售系统');
    } else {
        errorMessage.textContent = '密码错误，请重新输入';
        errorMessage.style.display = 'block';
        passwordInput.value = '';
        passwordInput.focus();
        
        // 3秒后隐藏错误消息
        setTimeout(() => {
            errorMessage.style.display = 'none';
        }, 3000);
    }
}

// 处理退出登录
function handleLogout() {
    if (confirm('确定要退出登录吗？')) {
        isAuthenticated = false;
        showPasswordModal();
        document.getElementById('passwordInput').value = '';
        document.getElementById('errorMessage').style.display = 'none';
        showSuccessMessage('已退出登录');
    }
}

// 初始化系统（登录成功后调用）
async function initializeSystem() {
    await initializeSalesData();
    setupEventListeners();
    updateSalesDisplay();
}

// 设置事件监听器
function setupEventListeners() {
    // 商品按钮点击事件 - 使用事件委托避免重复绑定
    document.addEventListener('click', function(e) {
        if (e.target.closest('.product-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.closest('.product-btn');
            const product = button.dataset.product;
            const paypalPrice = parseFloat(button.dataset.paypalPrice);
            const cashPrice = parseFloat(button.dataset.cashPrice);
            
            showPaymentModal(product, paypalPrice, cashPrice);
        }
    });

    // 支付方式按钮点击事件
    document.addEventListener('click', function(e) {
        if (e.target.closest('.payment-btn')) {
            e.preventDefault();
            e.stopPropagation();
            
            const button = e.target.closest('.payment-btn');
            const method = button.dataset.method;
            const product = document.getElementById('selectedProduct').textContent;
            const price = parseFloat(button.querySelector('.payment-price').textContent.replace('$', ''));
            
            recordSale(product, method, price);
            closePaymentModal();
        }
    });

    // 模态框关闭事件
    const modal = document.getElementById('paymentModal');
    const closeBtn = document.querySelector('.close');
    
    closeBtn.addEventListener('click', closePaymentModal);
    window.addEventListener('click', function(e) {
        if (e.target === modal) {
            closePaymentModal();
        }
    });

    // 导出CSV按钮和重置数据按钮 - 使用事件委托
    document.addEventListener('click', function(e) {
        if (e.target.id === 'exportBtn') {
            e.preventDefault();
            e.stopPropagation();
            exportToCSV();
        } else if (e.target.id === 'resetBtn') {
            e.preventDefault();
            e.stopPropagation();
            resetSalesData();
        }
    });
}

// 显示支付方式选择模态框
function showPaymentModal(product, paypalPrice, cashPrice) {
    const modal = document.getElementById('paymentModal');
    const productTitle = document.getElementById('selectedProduct');
    const paypalPriceElement = document.getElementById('paypalPrice');
    const cashPriceElement = document.getElementById('cashPrice');
    
    productTitle.textContent = `选择支付方式 - ${product}`;
    paypalPriceElement.textContent = `$${paypalPrice}`;
    cashPriceElement.textContent = `$${cashPrice}`;
    
    // 存储当前选择的商品信息
    modal.dataset.currentProduct = product;
    modal.dataset.paypalPrice = paypalPrice;
    modal.dataset.cashPrice = cashPrice;
    
    modal.style.display = 'block';
}

// 关闭支付方式选择模态框
function closePaymentModal() {
    const modal = document.getElementById('paymentModal');
    modal.style.display = 'none';
}

// 记录销售
function recordSale(product, paymentMethod, price) {
    if (!isAuthenticated) {
        showSuccessMessage('请先登录系统');
        return;
    }
    
    // 防抖机制
    if (isProcessing) {
        return;
    }
    isProcessing = true;
    
    try {
        if (!salesData[product]) {
            salesData[product] = {
                quantity: 0,
                totalSales: 0
            };
        }
        
        salesData[product].quantity += 1;
        salesData[product].totalSales += price;
        
        updateSalesDisplay();
        saveToJSON();
        
        // 显示成功消息
        showSuccessMessage(`${product} 销售记录已添加 (${paymentMethod}: $${price})`);
    } finally {
        // 延迟重置处理状态，防止快速重复点击
        setTimeout(() => {
            isProcessing = false;
        }, 500);
    }
}

// 更新销售记录显示
function updateSalesDisplay() {
    const salesDisplay = document.getElementById('salesDisplay');
    let html = '<table class="sales-table"><thead><tr><th>商品名称</th><th>销售数量</th><th>销售额</th></tr></thead><tbody>';
    
    let totalQuantity = 0;
    let totalSales = 0;
    
    Object.keys(salesData).forEach(product => {
        const data = salesData[product];
        if (data.quantity > 0) {
            html += `<tr>
                <td>${product}</td>
                <td>${data.quantity}</td>
                <td>$${data.totalSales.toFixed(2)}</td>
            </tr>`;
            totalQuantity += data.quantity;
            totalSales += data.totalSales;
        }
    });
    
    html += '</tbody>';
    
    if (totalQuantity > 0) {
        html += `<tfoot>
            <tr class="total-row">
                <td><strong>总计</strong></td>
                <td><strong>${totalQuantity}</strong></td>
                <td><strong>$${totalSales.toFixed(2)}</strong></td>
            </tr>
        </tfoot>`;
    }
    
    html += '</table>';
    salesDisplay.innerHTML = html;
}

// 保存到JSON文件
function saveToJSON() {
    // 由于浏览器安全限制，无法直接写入本地文件
    // 这里将数据保存到localStorage作为临时存储
    localStorage.setItem('salesData', JSON.stringify(salesData));
    console.log('销售数据已保存到localStorage');
}

// 从localStorage加载数据
function loadFromLocalStorage() {
    const savedData = localStorage.getItem('salesData');
    if (savedData) {
        try {
            salesData = JSON.parse(savedData);
            console.log('销售数据已从localStorage加载');
        } catch (error) {
            console.error('解析localStorage数据失败:', error);
        }
    }
}

// 导出CSV文件（从JSON数据导出）
function exportToCSV() {
    if (!isAuthenticated) {
        showSuccessMessage('请先登录系统');
        return;
    }
    
    let csvContent = "商品种类,销售数量,销售额\n";
    
    Object.keys(salesData).forEach(product => {
        const data = salesData[product];
        csvContent += `${product},${data.quantity},${data.totalSales.toFixed(2)}\n`;
    });
    
    // 创建CSV文件并下载
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'sales_record.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showSuccessMessage('CSV文件已从JSON数据导出');
}

// 显示成功消息
function showSuccessMessage(message) {
    // 创建临时消息元素
    const messageDiv = document.createElement('div');
    messageDiv.className = 'success-message';
    messageDiv.textContent = message;
    
    // 添加到页面
    document.body.appendChild(messageDiv);
    
    // 3秒后移除
    setTimeout(() => {
        document.body.removeChild(messageDiv);
    }, 3000);
}

// 重置销售数据（清空所有记录）
function resetSalesData() {
    if (!isAuthenticated) {
        showSuccessMessage('请先登录系统');
        return;
    }
    
    // 防抖机制
    if (isProcessing) {
        return;
    }
    
    if (confirm('确定要重置所有销售数据吗？此操作不可撤销。')) {
        isProcessing = true;
        
        try {
            const products = [
                "Laser Badge", "fursuit glass", "badge standard", "badge Customize",
                "collar", "collar-wide", "consent Badge", "keychain"
            ];
            
            // 重置内存中的数据
            products.forEach(product => {
                salesData[product] = {
                    quantity: 0,
                    totalSales: 0
                };
            });
            
            // 清除localStorage中的数据
            localStorage.removeItem('salesData');
            
            // 重新保存空数据
            saveToJSON();
            updateSalesDisplay();
            showSuccessMessage('销售数据已重置');
        } finally {
            // 延迟重置处理状态
            setTimeout(() => {
                isProcessing = false;
            }, 1000);
        }
    }
}
