// 商品销售系统 JavaScript 功能

// 销售数据存储
let salesData = {};

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
                loginStatus.textContent = `已登录 (${days}天)`;
            } else if (remainingHours >= 1) {
                loginStatus.textContent = `已登录 (${remainingHours}小时)`;
            } else {
                const minutes = Math.floor(remainingHours * 60);
                loginStatus.textContent = `已登录 (${minutes}分钟)`;
            }
        }
        
        if (logoutBtn) {
            logoutBtn.title = `登录状态剩余 ${remainingHours} 小时`;
        }
    } else {
        // 登录状态已过期，自动退出
        if (isAuthenticated) {
            clearLoginStatus();
            showPasswordModal();
            showSuccessMessage('登录状态已过期，请重新登录');
        }
    }
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
    // 首先检查是否有有效的登录状态缓存
    if (loadLoginStatus()) {
        // 有有效的登录状态，直接进入系统
        hidePasswordModal();
        await initializeSystem();
        showSuccessMessage('欢迎回来！登录状态已恢复');
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
        // 清除登录状态缓存
        clearLoginStatus();
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

    // 导出CSV按钮、GitHub同步按钮、重置数据按钮和测试按钮 - 使用事件委托
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
        } else if (e.target.id === 'downloadFromGistBtn') {
            e.preventDefault();
            e.stopPropagation();
            downloadFromGist();
        } else if (e.target.id === 'resetBtn') {
            e.preventDefault();
            e.stopPropagation();
            resetSalesData();
        } else if (e.target.id === 'testBtn') {
            e.preventDefault();
            e.stopPropagation();
            addTestData();
        }
    });

    // 同步模态框关闭事件
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
    let hasAnySales = false;
    
    Object.keys(salesData).forEach(product => {
        const data = salesData[product];
        html += `<tr>
            <td>${product}</td>
            <td>${data.quantity}</td>
            <td>$${data.totalSales.toFixed(2)}</td>
        </tr>`;
        totalQuantity += data.quantity;
        totalSales += data.totalSales;
        
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
            <td><strong>$${totalSales.toFixed(2)}</strong></td>
        </tr>
    </tfoot>`;
    
    html += '</table>';
    
    // 如果没有销售记录，显示提示信息
    if (!hasAnySales) {
        html += '<div class="no-sales-message">暂无销售记录</div>';
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
            
            console.log('开始重置销售数据...');
            console.log('重置前的数据:', salesData);
            
            // 重置内存中的数据
            products.forEach(product => {
                salesData[product] = {
                    quantity: 0,
                    totalSales: 0
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
            
            showSuccessMessage('销售数据已重置');
        } catch (error) {
            console.error('重置数据时出错:', error);
            showSuccessMessage('重置数据时出错，请重试');
        } finally {
            // 延迟重置处理状态
            setTimeout(() => {
                isProcessing = false;
            }, 1000);
        }
    }
}

// 添加测试数据
function addTestData() {
    if (!isAuthenticated) {
        showSuccessMessage('请先登录系统');
        return;
    }
    
    // 防抖机制
    if (isProcessing) {
        return;
    }
    
    const testData = [
        { product: "Laser Badge", quantity: 2, totalSales: 12 },
        { product: "fursuit glass", quantity: 1, totalSales: 17 },
        { product: "collar", quantity: 3, totalSales: 69 },
        { product: "keychain", quantity: 5, totalSales: 30 }
    ];
    
    testData.forEach(item => {
        if (!salesData[item.product]) {
            salesData[item.product] = { quantity: 0, totalSales: 0 };
        }
        salesData[item.product].quantity = item.quantity;
        salesData[item.product].totalSales = item.totalSales;
    });
    
    // 保存到localStorage
    localStorage.setItem('salesData', JSON.stringify(salesData));
    
    // 更新显示
    updateSalesDisplay();
    showSuccessMessage('测试数据已添加');
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

// 上传数据到GitHub Gist
async function uploadToGist() {
    const token = document.getElementById('gistToken').value.trim();
    const description = document.getElementById('gistDescription').value.trim() || 'HW Accounting Sales Data';
    
    if (!token) {
        showSuccessMessage('请输入GitHub Personal Access Token');
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
                linkElement.textContent = `Gist ID: ${gistId}`;
                resultDiv.style.display = 'block';
            }
            
            showSuccessMessage(`数据已成功上传到Gist！ID: ${gistId}`);
        } else {
            const error = await response.json();
            throw new Error(error.message || '上传失败');
        }
    } catch (error) {
        console.error('上传到Gist失败:', error);
        showSuccessMessage(`上传失败: ${error.message}`);
    }
}

// 从GitHub Gist下载数据
async function downloadFromGist() {
    const gistInput = document.getElementById('gistIdInput').value.trim();
    
    if (!gistInput) {
        showSuccessMessage('请输入Gist ID或URL');
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
                    
                    showSuccessMessage('数据已成功从Gist下载并加载！');
                } else {
                    throw new Error('Gist中的文件格式不正确');
                }
            } else {
                throw new Error('Gist中未找到sales_data.json文件');
            }
        } else {
            const error = await response.json();
            throw new Error(error.message || '下载失败');
        }
    } catch (error) {
        console.error('从Gist下载失败:', error);
        showSuccessMessage(`下载失败: ${error.message}`);
    }
}
