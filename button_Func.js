// 商品销售系统 JavaScript 功能

// 销售数据存储
let salesData = {};

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
    await initializeSalesData();
    setupEventListeners();
    updateSalesDisplay();
});

// 设置事件监听器
function setupEventListeners() {
    // 商品按钮点击事件
    const productButtons = document.querySelectorAll('.product-btn');
    productButtons.forEach(button => {
        button.addEventListener('click', function() {
            const product = this.dataset.product;
            const paypalPrice = parseFloat(this.dataset.paypalPrice);
            const cashPrice = parseFloat(this.dataset.cashPrice);
            
            showPaymentModal(product, paypalPrice, cashPrice);
        });
    });

    // 支付方式按钮点击事件
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('payment-btn')) {
            const method = e.target.dataset.method;
            const product = document.getElementById('selectedProduct').textContent;
            const price = parseFloat(e.target.querySelector('.payment-price').textContent.replace('$', ''));
            
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

    // 导出CSV按钮
    document.getElementById('exportBtn').addEventListener('click', exportToCSV);
    
    // 重置数据按钮
    document.getElementById('resetBtn').addEventListener('click', resetSalesData);
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
    if (confirm('确定要重置所有销售数据吗？此操作不可撤销。')) {
        const products = [
            "Laser Badge", "fursuit glass", "badge standard", "badge Customize",
            "collar", "collar-wide", "consent Badge", "keychain"
        ];
        
        products.forEach(product => {
            salesData[product] = {
                quantity: 0,
                totalSales: 0
            };
        });
        
        saveToJSON();
        updateSalesDisplay();
        showSuccessMessage('销售数据已重置');
    }
}
