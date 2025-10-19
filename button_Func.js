// 商品销售系统 JavaScript 功能

// 销售数据存储
let salesData = {};

// 商品配置数据
let productConfig = [];

// 密码验证相关
const CORRECT_PASSWORD = "Vender2025";
let isAuthenticated = false;

// 防抖机制
let isProcessing = false;

// 登录状态缓存相关
const LOGIN_CACHE_KEY = "hw_accounting_login_status";
const LOGIN_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时（毫秒）

// 保存登录状态到缓存
function saveLoginStatus() {
    const loginData = {
        isAuthenticated: true,
        loginTime: Date.now(),
        expiresAt: Date.now() + LOGIN_CACHE_DURATION
    };
    localStorage.setItem(LOGIN_CACHE_KEY, JSON.stringify(loginData));
}

// 从缓存加载登录状态
function loadLoginStatus() {
    try {
        const cachedData = localStorage.getItem(LOGIN_CACHE_KEY);
        if (cachedData) {
            const loginData = JSON.parse(cachedData);
            const now = Date.now();
            
            // 检查是否在有效期内
            if (loginData.expiresAt && now < loginData.expiresAt) {
                isAuthenticated = true;
                return true;
            } else {
                // 过期了，清除缓存
                clearLoginStatus();
                return false;
            }
        }
    } catch (error) {
        console.error('加载登录状态失败:', error);
        clearLoginStatus();
    }
    return false;
}

// 清除登录状态缓存
function clearLoginStatus() {
    localStorage.removeItem(LOGIN_CACHE_KEY);
    isAuthenticated = false;
}

// 获取剩余登录时间（小时）
function getRemainingLoginTime() {
    try {
        const cachedData = localStorage.getItem(LOGIN_CACHE_KEY);
        if (cachedData) {
            const loginData = JSON.parse(cachedData);
            const now = Date.now();
            const remaining = loginData.expiresAt - now;
            return Math.max(0, Math.floor(remaining / (60 * 60 * 1000))); // 转换为小时
        }
    } catch (error) {
        console.error('获取剩余登录时间失败:', error);
    }
    return 0;
}

// 更新登录状态显示
function updateLoginStatusDisplay() {
    const remainingHours = getRemainingLoginTime();
    const loginStatus = document.getElementById('loginStatus');
    const logoutBtn = document.getElementById('logoutBtn');
    
    if (remainingHours > 0) {
        if (loginStatus) {
            if (remainingHours >= 24) {
                const days = Math.floor(remainingHours / 24);
                loginStatus.textContent = `Logged In (${days} days)`;
            } else if (remainingHours >= 1) {
                loginStatus.textContent = `Logged In (${remainingHours} hours)`;
            } else {
                const minutes = Math.floor(remainingHours * 60);
                loginStatus.textContent = `Logged In (${minutes} minutes)`;
            }
        }
        
        if (logoutBtn) {
            logoutBtn.title = `Login status remaining ${remainingHours} hours`;
        }
    } else {
        // 登录状态已过期，自动退出
        if (isAuthenticated) {
            clearLoginStatus();
            showPasswordModal();
            showSuccessMessage('Login status expired, please login again');
        }
    }
}

// 加载商品配置
async function loadProductConfig() {
    try {
        const response = await fetch('merchList.json');
        if (response.ok) {
            const config = await response.json();
            productConfig = config.products;
            console.log('商品配置已加载:', productConfig);
            return true;
        } else {
            throw new Error('无法加载商品配置文件');
        }
    } catch (error) {
        console.error('加载商品配置失败:', error);
        // 使用默认配置作为后备
        productConfig = [
            { name: "Laser Badge", paypalPrice: 6, cashPrice: 5, paymentMethods: ["paypal", "cash"] },
            { name: "fursuit glass", paypalPrice: 17, cashPrice: 15, paymentMethods: ["paypal", "cash"] },
            { name: "badge standard", paypalPrice: 17, cashPrice: 15, paymentMethods: ["paypal", "cash"] },
            { name: "badge Customize", paypalPrice: 17, cashPrice: 15, paymentMethods: ["paypal", "cash"] },
            { name: "collar", paypalPrice: 23, cashPrice: 20, paymentMethods: ["paypal", "cash"] },
            { name: "collar-wide", paypalPrice: 29, cashPrice: 25, paymentMethods: ["paypal", "cash"] },
            { name: "consent Badge", paypalPrice: 6, cashPrice: 5, paymentMethods: ["paypal", "cash"] },
            { name: "keychain", paypalPrice: 6, cashPrice: 5, paymentMethods: ["paypal", "cash"] },
            { name: "fursuit head base", paypalPrice: 100, cashPrice: 80, paymentMethods: ["paypal", "cash"] },
            { name: "fursuit ear", paypalPrice: 35, cashPrice: 30, paymentMethods: ["paypal", "cash"] }
        ];
        return false;
    }
}

// 动态生成商品按钮
function generateProductButtons() {
    const productsGrid = document.querySelector('.products-grid');
    if (!productsGrid) {
        console.error('找不到商品网格容器');
        return;
    }
    
    // 清空现有按钮
    productsGrid.innerHTML = '';
    
    // 根据配置生成按钮
    productConfig.forEach(product => {
        const button = document.createElement('button');
        button.className = 'product-btn';
        button.setAttribute('data-product', product.name);
        button.setAttribute('data-paypal-price', product.paypalPrice);
        button.setAttribute('data-cash-price', product.cashPrice);
        
        button.innerHTML = `
            <h3>${product.name}</h3>
            <p>PayPal: $${product.paypalPrice} | Cash: $${product.cashPrice}</p>
        `;
        
        productsGrid.appendChild(button);
    });
    
    console.log('商品按钮已动态生成');
}

// 数据迁移函数 - 将旧格式数据转换为新格式
function migrateDataToNewFormat(data) {
    const migratedData = {};
    
    // 使用动态加载的商品配置
    productConfig.forEach(product => {
        const productName = product.name;
        if (data[productName]) {
            // 如果数据存在，迁移到新格式
            migratedData[productName] = {
                quantity: data[productName].quantity || 0,
                totalSales: data[productName].totalSales || 0,
                paypalQuantity: data[productName].paypalQuantity || 0,
                paypalTotal: data[productName].paypalTotal || 0,
                cashQuantity: data[productName].cashQuantity || 0,
                cashTotal: data[productName].cashTotal || 0
            };
        } else {
            // 如果数据不存在，创建新的空记录
            migratedData[productName] = {
                quantity: 0,
                totalSales: 0,
                paypalQuantity: 0,
                paypalTotal: 0,
                cashQuantity: 0,
                cashTotal: 0
            };
        }
    });
    
    return migratedData;
}

// 初始化销售数据（优先从localStorage加载，然后从JSON文件）
async function initializeSalesData() {
    // 首先尝试从localStorage加载数据
    loadFromLocalStorage();
    
    // 如果localStorage没有数据，则从JSON文件加载
    if (Object.keys(salesData).length === 0) {
        try {
            const response = await fetch('sales_data.json');
            if (response.ok) {
                const rawData = await response.json();
                // 迁移数据到新格式
                salesData = migrateDataToNewFormat(rawData);
                console.log('销售数据已从JSON文件加载并迁移到新格式');
            } else {
                throw new Error('无法加载JSON文件');
            }
        } catch (error) {
            console.error('加载JSON文件失败:', error);
            // 如果加载失败，使用动态商品配置
            productConfig.forEach(product => {
                if (!salesData[product.name]) {
                    salesData[product.name] = {
                        quantity: 0,
                        totalSales: 0,
                        paypalQuantity: 0,
                        paypalTotal: 0,
                        cashQuantity: 0,
                        cashTotal: 0
                    };
                }
            });
        }
    } else {
        // 如果localStorage有数据，也需要迁移到新格式
        salesData = migrateDataToNewFormat(salesData);
        console.log('localStorage数据已迁移到新格式');
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', async function() {
    // 首先检查是否有有效的登录状态缓存
    if (loadLoginStatus()) {
        // 有有效的登录状态，直接进入系统
        hidePasswordModal();
        await initializeSystem();
        showSuccessMessage('Welcome back! Login status restored');
    } else {
        // 没有有效的登录状态，显示密码输入界面
        showPasswordModal();
    }
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
        // 保存登录状态到缓存
        saveLoginStatus();
        hidePasswordModal();
        initializeSystem();
        showSuccessMessage('Login successful! Welcome to the Product Sales System');
    } else {
        errorMessage.textContent = 'Incorrect password, please try again';
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
        // 清除登录状态缓存
        clearLoginStatus();
        showPasswordModal();
        document.getElementById('passwordInput').value = '';
        document.getElementById('errorMessage').style.display = 'none';
        showSuccessMessage('Logged out successfully');
    }
}

// 初始化系统（登录成功后调用）
async function initializeSystem() {
    // 先加载商品配置
    await loadProductConfig();
    
    // 生成商品按钮
    generateProductButtons();
    
    // 然后初始化销售数据
    await initializeSalesData();
    setupEventListeners();
    updateSalesDisplay();
    updateLoginStatusDisplay();
    
    // 每分钟更新一次登录状态显示
    setInterval(updateLoginStatusDisplay, 60000);
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

    // Export CSV, GitHub Sync, and Reset Data buttons - using event delegation
    document.addEventListener('click', function(e) {
        if (e.target.id === 'exportBtn') {
            e.preventDefault();
            e.stopPropagation();
            exportToCSV();
        } else if (e.target.id === 'syncBtn') {
            e.preventDefault();
            e.stopPropagation();
            showSyncModal();
        } else if (e.target.id === 'uploadToGistBtn') {
            e.preventDefault();
            e.stopPropagation();
            uploadToGist();
        } else if (e.target.id === 'updateExistingGistBtn') {
            e.preventDefault();
            e.stopPropagation();
            updateExistingGist();
        } else if (e.target.id === 'downloadFromGistBtn') {
            e.preventDefault();
            e.stopPropagation();
            downloadFromGist();
        } else if (e.target.id === 'resetBtn') {
            e.preventDefault();
            e.stopPropagation();
            resetSalesData();
        }
    });

    // Sync modal close events
    const syncModal = document.getElementById('syncModal');
    const syncCloseBtn = document.querySelector('.sync-close');
    
    if (syncCloseBtn) {
        syncCloseBtn.addEventListener('click', hideSyncModal);
    }
    
    if (syncModal) {
        window.addEventListener('click', function(e) {
            if (e.target === syncModal) {
                hideSyncModal();
            }
        });
    }
}

// 显示支付方式选择模态框
function showPaymentModal(product, paypalPrice, cashPrice) {
    const modal = document.getElementById('paymentModal');
    const productTitle = document.getElementById('selectedProduct');
    const paypalPriceElement = document.getElementById('paypalPrice');
    const cashPriceElement = document.getElementById('cashPrice');
    
    productTitle.textContent = `${product}`;
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
        showSuccessMessage('Please login to the system first');
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
                totalSales: 0,
                paypalQuantity: 0,
                paypalTotal: 0,
                cashQuantity: 0,
                cashTotal: 0
            };
        }
        
        salesData[product].quantity += 1;
        salesData[product].totalSales += price;
        
        // Track payment method separately
        if (paymentMethod === 'paypal') {
            salesData[product].paypalQuantity += 1;
            salesData[product].paypalTotal += price;
        } else if (paymentMethod === 'cash') {
            salesData[product].cashQuantity += 1;
            salesData[product].cashTotal += price;
        }
        
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
    let html = '<table class="sales-table"><thead><tr><th>merch name</th><th>total sold</th><th>PayPal sold</th><th>Cash sold</th><th>total income</th><th>PayPal income</th><th>Cash income</th></tr></thead><tbody>';
    
    let totalQuantity = 0;
    let totalSales = 0;
    let totalPaypalQuantity = 0;
    let totalPaypalSales = 0;
    let totalCashQuantity = 0;
    let totalCashSales = 0;
    let hasAnySales = false;
    
    Object.keys(salesData).forEach(product => {
        const data = salesData[product];
        // Ensure all properties exist for backward compatibility
        const paypalQty = data.paypalQuantity || 0;
        const paypalTotal = data.paypalTotal || 0;
        const cashQty = data.cashQuantity || 0;
        const cashTotal = data.cashTotal || 0;
        
        html += `<tr>
            <td>${product}</td>
            <td>${data.quantity}</td>
            <td>${paypalQty}</td>
            <td>${cashQty}</td>
            <td>$${data.totalSales.toFixed(2)}</td>
            <td>$${paypalTotal.toFixed(2)}</td>
            <td>$${cashTotal.toFixed(2)}</td>
        </tr>`;
        
        totalQuantity += data.quantity;
        totalSales += data.totalSales;
        totalPaypalQuantity += paypalQty;
        totalPaypalSales += paypalTotal;
        totalCashQuantity += cashQty;
        totalCashSales += cashTotal;
        
        if (data.quantity > 0) {
            hasAnySales = true;
        }
    });
    
    html += '</tbody>';
    
    // 总是显示总计行，即使所有数据都是0
    html += `<tfoot>
        <tr class="total-row">
            <td><strong>总计</strong></td>
            <td><strong>${totalQuantity}</strong></td>
            <td><strong>${totalPaypalQuantity}</strong></td>
            <td><strong>${totalCashQuantity}</strong></td>
            <td><strong>$${totalSales.toFixed(2)}</strong></td>
            <td><strong>$${totalPaypalSales.toFixed(2)}</strong></td>
            <td><strong>$${totalCashSales.toFixed(2)}</strong></td>
        </tr>
    </tfoot>`;
    
    html += '</table>';
    
    // 如果没有销售记录，显示提示信息
    if (!hasAnySales) {
        html += '<div class="no-sales-message">No sales records yet</div>';
    }
    
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
        showSuccessMessage('Please login to the system first');
        return;
    }
    
    let csvContent = "Product Type,Total Quantity,PayPal Quantity,Cash Quantity,Total Sales,PayPal Sales,Cash Sales\n";
    
    Object.keys(salesData).forEach(product => {
        const data = salesData[product];
        const paypalQty = data.paypalQuantity || 0;
        const paypalTotal = data.paypalTotal || 0;
        const cashQty = data.cashQuantity || 0;
        const cashTotal = data.cashTotal || 0;
        
        csvContent += `${product},${data.quantity},${paypalQty},${cashQty},${data.totalSales.toFixed(2)},${paypalTotal.toFixed(2)},${cashTotal.toFixed(2)}\n`;
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
        showSuccessMessage('Please login to the system first');
        return;
    }
    
    // 防抖机制
    if (isProcessing) {
        return;
    }
    
    if (confirm('确定要重置所有销售数据吗？此操作不可撤销。')) {
        isProcessing = true;
        
        try {
            console.log('开始重置销售数据...');
            console.log('重置前的数据:', salesData);
            
            // 重置内存中的数据 - 使用动态商品配置
            productConfig.forEach(product => {
                salesData[product.name] = {
                    quantity: 0,
                    totalSales: 0,
                    paypalQuantity: 0,
                    paypalTotal: 0,
                    cashQuantity: 0,
                    cashTotal: 0
                };
            });
            
            console.log('重置后的数据:', salesData);
            
            // 清除localStorage中的数据
            localStorage.removeItem('salesData');
            console.log('已清除localStorage中的数据');
            
            // 重新保存空数据到localStorage
            localStorage.setItem('salesData', JSON.stringify(salesData));
            console.log('已保存空数据到localStorage');
            
            // 更新显示
            updateSalesDisplay();
            console.log('已更新显示');
            
            showSuccessMessage('Sales data has been reset');
        } catch (error) {
            console.error('重置数据时出错:', error);
            showSuccessMessage('Error resetting data, please try again');
        } finally {
            // 延迟重置处理状态
            setTimeout(() => {
                isProcessing = false;
            }, 1000);
        }
    }
}

// 显示同步模态框
function showSyncModal() {
    const modal = document.getElementById('syncModal');
    if (modal) {
        modal.style.display = 'block';
    }
}

// 隐藏同步模态框
function hideSyncModal() {
    const modal = document.getElementById('syncModal');
    if (modal) {
        modal.style.display = 'none';
    }
}

// 上传数据到GitHub Gist（创建新Gist）
async function uploadToGist() {
    const token = document.getElementById('gistToken').value.trim();
    const description = document.getElementById('gistDescription').value.trim() || 'HW Accounting Sales Data';
    
    if (!token) {
            showSuccessMessage('Please enter GitHub Personal Access Token');
        return;
    }
    
    try {
        const gistData = {
            description: description,
            public: false,
            files: {
                'sales_data.json': {
                    content: JSON.stringify(salesData, null, 2)
                }
            }
        };
        
        const response = await fetch('https://api.github.com/gists', {
            method: 'POST',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(gistData)
        });
        
        if (response.ok) {
            const result = await response.json();
            const gistId = result.id;
            const gistUrl = result.html_url;
            
            // 显示结果
            const resultDiv = document.getElementById('gistResult');
            const linkElement = document.getElementById('gistLink');
            
            if (resultDiv && linkElement) {
                linkElement.href = gistUrl;
                linkElement.textContent = `新Gist ID: ${gistId}`;
                resultDiv.style.display = 'block';
            }
            
            // 自动填充现有Gist ID输入框，方便下次更新
            document.getElementById('existingGistId').value = gistId;
            
            showSuccessMessage(`Data successfully uploaded to new Gist! ID: ${gistId}`);
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Upload failed');
        }
    } catch (error) {
        console.error('上传到Gist失败:', error);
        showSuccessMessage(`Upload failed: ${error.message}`);
    }
}

// 更新现有GitHub Gist
async function updateExistingGist() {
    const token = document.getElementById('gistToken').value.trim();
    const existingGistId = document.getElementById('existingGistId').value.trim();
    const description = document.getElementById('gistDescription').value.trim() || 'HW Accounting Sales Data';
    
    if (!token) {
            showSuccessMessage('Please enter GitHub Personal Access Token');
        return;
    }
    
    if (!existingGistId) {
            showSuccessMessage('Please enter existing Gist ID');
        return;
    }
    
    try {
        const gistData = {
            description: description,
            files: {
                'sales_data.json': {
                    content: JSON.stringify(salesData, null, 2)
                }
            }
        };
        
        const response = await fetch(`https://api.github.com/gists/${existingGistId}`, {
            method: 'PATCH',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json',
                'Accept': 'application/vnd.github.v3+json'
            },
            body: JSON.stringify(gistData)
        });
        
        if (response.ok) {
            const result = await response.json();
            const gistId = result.id;
            const gistUrl = result.html_url;
            
            // 显示结果
            const resultDiv = document.getElementById('gistResult');
            const linkElement = document.getElementById('gistLink');
            
            if (resultDiv && linkElement) {
                linkElement.href = gistUrl;
                linkElement.textContent = `Updated Gist ID: ${gistId}`;
                resultDiv.style.display = 'block';
            }
            
            showSuccessMessage(`Data successfully updated to Gist! ID: ${gistId}`);
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Update failed');
        }
    } catch (error) {
        console.error('更新Gist失败:', error);
        showSuccessMessage(`Update failed: ${error.message}`);
    }
}

// 从GitHub Gist下载数据
async function downloadFromGist() {
    const gistInput = document.getElementById('gistIdInput').value.trim();
    
    if (!gistInput) {
            showSuccessMessage('Please enter Gist ID or URL');
        return;
    }
    
    try {
        // 提取Gist ID
        let gistId = gistInput;
        if (gistInput.includes('gist.github.com')) {
            const match = gistInput.match(/gist\.github\.com\/[^\/]+\/([a-f0-9]+)/);
            if (match) {
                gistId = match[1];
            }
        }
        
        const response = await fetch(`https://api.github.com/gists/${gistId}`);
        
        if (response.ok) {
            const gist = await response.json();
            
            // 查找sales_data.json文件
            const salesDataFile = gist.files['sales_data.json'];
            if (salesDataFile) {
                const newSalesData = JSON.parse(salesDataFile.content);
                
                // 验证数据格式
                if (typeof newSalesData === 'object' && newSalesData !== null) {
                    salesData = newSalesData;
                    saveToJSON();
                    updateSalesDisplay();
                    
                    // 显示结果
                    const resultDiv = document.getElementById('downloadResult');
                    if (resultDiv) {
                        resultDiv.style.display = 'block';
                    }
                    
                            showSuccessMessage('Data successfully downloaded and loaded from Gist!');
                } else {
                    throw new Error('Incorrect file format in Gist');
                }
            } else {
                throw new Error('sales_data.json file not found in Gist');
            }
        } else {
            const error = await response.json();
            throw new Error(error.message || 'Download failed');
        }
    } catch (error) {
        console.error('从Gist下载失败:', error);
        showSuccessMessage(`Download failed: ${error.message}`);
    }
}
