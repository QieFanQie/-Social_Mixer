// ========================================
// Social Mixer - 一起刷
// 混合内容流版本
// ========================================

// DOM 元素
const contentCardsEl = document.getElementById('contentCards');
const contentMetaEl = document.getElementById('contentMeta');
const refreshAllBtn = document.getElementById('refreshAll');
const refreshBiliBtn = document.getElementById('refreshBili');
const refreshTiebaBtn = document.getElementById('refreshTieba');
const refreshLofterBtn = document.getElementById('refreshLofter');
const refreshXiaohongshuBtn = document.getElementById('refreshXiaohongshu');
const toastEl = document.getElementById('toast');
const toastMessageEl = document.getElementById('toastMessage');

// ========================================
// 工具函数
// ========================================

/**
 * 显示提示消息
 */
function showToast(message, duration = 3000) {
    toastMessageEl.textContent = message;
    toastEl.classList.add('show');
    setTimeout(() => {
        toastEl.classList.remove('show');
    }, duration);
}

/**
 * 格式化时间戳
 */
function formatTime(timestamp) {
    if (!timestamp) return '未知';
    
    const now = Date.now() / 1000; // 转换为秒
    const diff = now - timestamp;
    
    if (diff < 60) return '刚刚';
    if (diff < 3600) return Math.floor(diff / 60) + '分钟前';
    if (diff < 86400) return Math.floor(diff / 3600) + '小时前';
    if (diff < 604800) return Math.floor(diff / 86400) + '天前';
    
    const date = new Date(timestamp * 1000);
    return `${date.getMonth() + 1}-${date.getDate()}`;
}

/**
 * 创建卡片（统一函数）
 */
function createCard(item, type) {
    const card = document.createElement('div');
    card.className = `card ${type}`;
    
    if (type === 'bili') {
        // B站卡片 - 有封面
        card.innerHTML = `
            <img class="card-cover" src="${item.cover}" alt="${item.title}" 
                 onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 16 9%22><rect fill=%22%23fb7299%22 width=%2216%22 height=%229%22/><text x=%228%22 y=%226%22 text-anchor=%22middle%22 fill=%22white%22 font-size=%221.5%22>📺</text></svg>'">
            <div class="card-body">
                <div class="card-title">${item.title}</div>
                <div class="card-meta">
                    <span class="card-author">${item.author}</span>
                    <span class="card-time">${formatTime(item.timestamp)}</span>
                </div>
            </div>
            <span class="card-platform bili">📺</span>
        `;
        
        // 点击打开视频
        card.addEventListener('click', () => {
            window.open(`https://www.bilibili.com/video/${item.bvid || item.id}`, '_blank');
        });
    } else if (type === 'lofter') {
        // Lofter卡片 - 有封面
        card.innerHTML = `
            <img class="card-cover" src="${item.cover}" alt="${item.title}" 
                 onerror="this.style.display='none'">
            <div class="card-body">
                <div class="card-title">${item.title}</div>
                <div class="card-meta">
                    <span class="card-author">${item.author}</span>
                    <span class="card-time">${item.pubDate ? item.pubDate.substring(0, 10) : '未知'}</span>
                </div>
            </div>
            <span class="card-platform lofter">🎨</span>
        `;
        
        // 点击打开作品
        card.addEventListener('click', () => {
            if (item.url) {
                window.open(item.url, '_blank');
            }
        });
    } else if (type === 'xiaohongshu') {
        // 小红书卡片 - 有封面
        card.innerHTML = `
            <img class="card-cover" src="${item.cover}" alt="${item.title}" 
                 onerror="this.style.display='none'">
            <div class="card-body">
                <div class="card-title">${item.title}</div>
                <div class="card-meta">
                    <span class="card-author">${item.author}</span>
                    <span class="card-time">${item.pubDate ? item.pubDate.substring(0, 10) : '未知'}</span>
                </div>
            </div>
            <span class="card-platform xiaohongshu">🍠</span>
        `;
        
        // 点击打开笔记
        card.addEventListener('click', () => {
            if (item.url) {
                window.open(item.url, '_blank');
            }
        });
    } else {
        // 贴吧卡片 - 无封面
        card.innerHTML = `
            <div class="card-body">
                <div class="card-title">${item.title}</div>
                <div class="card-meta">
                    <span class="card-author">${item.author || item.forumName || '匿名'}</span>
                    <span class="card-time">${item.replyNum || 0} 回复</span>
                </div>
            </div>
            <span class="card-platform tieba">💬</span>
        `;
        
        // 点击打开帖子
        card.addEventListener('click', () => {
            if (item.id) {
                window.open(`https://tieba.baidu.com/p/${item.id}`, '_blank');
            }
        });
    }
    
    return card;
}

/**
 * 混合排序（交错显示）
 */
function mergeAndShuffle(biliData, tiebaData, lofterData, xiaohongshuData) {
    const merged = [];
    
    // 添加B站数据
    biliData.forEach(item => {
        merged.push({ ...item, type: 'bili' });
    });
    
    // 添加贴吧数据
    tiebaData.forEach(item => {
        merged.push({ ...item, type: 'tieba' });
    });
    
    // 添加Lofter数据
    lofterData.forEach(item => {
        merged.push({ ...item, type: 'lofter' });
    });
    
    // 添加小红书数据
    xiaohongshuData.forEach(item => {
        merged.push({ ...item, type: 'xiaohongshu' });
    });
    
    // 简单的随机排序
    return merged.sort(() => Math.random() - 0.5);
}

/**
 * 渲染混合内容流
 */
function renderContent(biliFeed, tiebaFeed, lofterFeed, xiaohongshuFeed) {
    const biliData = biliFeed || [];
    const tiebaData = tiebaFeed || [];
    const lofterData = lofterFeed || [];
    const xiaohongshuData = xiaohongshuFeed || [];
    
    if (biliData.length === 0 && tiebaData.length === 0 && lofterData.length === 0 && xiaohongshuData.length === 0) {
        contentCardsEl.innerHTML = '<div class="empty"><div class="empty-icon">📭</div>暂无内容<br>点击上方按钮刷新数据</div>';
        contentMetaEl.textContent = '暂无数据';
        return;
    }
    
    // 混合数据
    const mergedData = mergeAndShuffle(biliData, tiebaData, lofterData, xiaohongshuData);
    
    // 渲染卡片
    contentCardsEl.innerHTML = '';
    mergedData.forEach(item => {
        contentCardsEl.appendChild(createCard(item, item.type));
    });
    
    // 更新元信息
    contentMetaEl.textContent = `共 ${mergedData.length} 条 · ${biliData.length} 视频 · ${tiebaData.length} 帖子 · ${lofterData.length} 作品 · ${xiaohongshuData.length} 笔记`;
}

// ========================================
// 事件处理
// ========================================

/**
 * 刷新B站数据
 */
refreshBiliBtn.addEventListener('click', async () => {
    showToast('正在刷新B站数据...');
    
    try {
        const data = await new Promise((resolve) => {
            chrome.storage.local.get(['biliFeed', 'tiebaFeed', 'lofterFeed'], resolve);
        });
        
        renderContent(data.biliFeed, data.tiebaFeed, data.lofterFeed);
        showToast(`B站数据已刷新，共 ${data.biliFeed?.length || 0} 条视频`);
    } catch (error) {
        console.error('获取B站数据失败:', error);
        showToast('获取B站数据失败');
    }
});

// 全局变量：保存贴吧页面的引用
let tiebaWindow = null;

// 全局变量：保存Lofter页面的引用
let lofterWindow = null;

// 全局变量：保存小红书页面的引用
let xiaohongshuWindow = null;

/**
 * 刷新贴吧数据
 */
refreshTiebaBtn.addEventListener('click', async () => {
    showToast('正在跳转贴吧主页...');
    
    try {
        // 如果之前打开过贴吧页面，先关闭它
        if (tiebaWindow && !tiebaWindow.closed) {
            tiebaWindow.close();
        }
        
        // 打开贴吧主页并保存引用
        const tiebaUrl = 'https://tieba.baidu.com/';
        tiebaWindow = window.open(tiebaUrl, '_blank');
        
        // 设置一个定时器，5秒后自动刷新页面并关闭贴吧页面
        setTimeout(() => {
            init();
            
            // 关闭贴吧页面（如果还存在）
            if (tiebaWindow && !tiebaWindow.closed) {
                tiebaWindow.close();
                tiebaWindow = null;
            }
            
            showToast('已获取贴吧热门帖子');
        }, 5000);
        
        showToast('已在后台打开贴吧主页，5秒后自动关闭');
    } catch (error) {
        console.error('跳转贴吧失败:', error);
        showToast('跳转贴吧失败');
    }
});

/**
 * 刷新Lofter数据
 */
refreshLofterBtn.addEventListener('click', async () => {
    showToast('正在跳转Lofter发现页...');
    
    try {
        // 如果之前打开过Lofter页面，先关闭它
        if (lofterWindow && !lofterWindow.closed) {
            lofterWindow.close();
        }
        
        // 打开Lofter发现页并保存引用
        const lofterUrl = 'https://www.lofter.com/trend';
        lofterWindow = window.open(lofterUrl, '_blank');
        
        // 设置一个定时器，5秒后自动刷新页面并关闭Lofter页面
        setTimeout(() => {
            init();
            
            // 关闭Lofter页面（如果还存在）
            if (lofterWindow && !lofterWindow.closed) {
                lofterWindow.close();
                lofterWindow = null;
            }
            
            showToast('已获取Lofter发现页帖子');
        }, 5000);
        
        showToast('已在后台打开Lofter发现页，5秒后自动关闭');
    } catch (error) {
        console.error('跳转Lofter失败:', error);
        showToast('跳转Lofter失败');
    }
});

/**
 * 刷新小红书数据
 */
refreshXiaohongshuBtn.addEventListener('click', async () => {
    showToast('正在跳转小红书发现页...');
    
    try {
        // 如果之前打开过小红书页面，先关闭它
        if (xiaohongshuWindow && !xiaohongshuWindow.closed) {
            xiaohongshuWindow.close();
        }
        
        // 打开小红书发现页并保存引用（使用移动端页面，结构更简单）
        const xiaohongshuUrl = 'https://m.xiaohongshu.com/explore';
        xiaohongshuWindow = window.open(xiaohongshuUrl, '_blank');
        
        // 设置一个定时器，5秒后自动刷新页面并关闭小红书页面
        setTimeout(() => {
            // 先检查是否有数据
            chrome.storage.local.get(['xiaohongshuFeed'], (data) => {
                const count = data.xiaohongshuFeed?.length || 0;
                if (count === 0) {
                    showToast('小红书数据获取失败，请手动打开小红书页面后重试');
                } else {
                    showToast(`已获取 ${count} 条小红书笔记`);
                }
            });
            
            init();
            
            // 关闭小红书页面（如果还存在）
            if (xiaohongshuWindow && !xiaohongshuWindow.closed) {
                xiaohongshuWindow.close();
                xiaohongshuWindow = null;
            }
        }, 5000);
        
        showToast('已在后台打开小红书发现页，5秒后自动关闭');
    } catch (error) {
        console.error('跳转小红书失败:', error);
        showToast('跳转小红书失败');
    }
});

/**
 * 刷新全部数据（B站 + 贴吧 + Lofter + 小红书）
 */
refreshAllBtn.addEventListener('click', async () => {
    showToast('正在刷新全部平台...');
    
    // 同时打开贴吧、Lofter和小红书页面
    try {
        // 打开贴吧
        if (tiebaWindow && !tiebaWindow.closed) {
            tiebaWindow.close();
        }
        tiebaWindow = window.open('https://tieba.baidu.com/', '_blank');
        
        // 打开Lofter发现页
        if (lofterWindow && !lofterWindow.closed) {
            lofterWindow.close();
        }
        lofterWindow = window.open('https://www.lofter.com/trend', '_blank');
        
        // 打开小红书发现页
        if (xiaohongshuWindow && !xiaohongshuWindow.closed) {
            xiaohongshuWindow.close();
        }
        xiaohongshuWindow = window.open('https://m.xiaohongshu.com/explore', '_blank');
        
        // 贴吧5秒后关闭
        setTimeout(() => {
            if (tiebaWindow && !tiebaWindow.closed) {
                tiebaWindow.close();
                tiebaWindow = null;
            }
        }, 5000);
        
        // Lofter 5秒后关闭
        setTimeout(() => {
            if (lofterWindow && !lofterWindow.closed) {
                lofterWindow.close();
                lofterWindow = null;
            }
        }, 5000);
        
        // 小红书5秒后关闭并刷新显示
        setTimeout(() => {
            if (xiaohongshuWindow && !xiaohongshuWindow.closed) {
                xiaohongshuWindow.close();
                xiaohongshuWindow = null;
            }
            init();
            showToast('已获取全部平台数据');
        }, 5000);
        
        showToast('已在后台打开贴吧、Lofter和小红书，5秒后自动关闭');
    } catch (error) {
        console.error('刷新全部失败:', error);
        showToast('刷新全部失败');
    }
});

// ========================================
// 初始化
// ========================================

/**
 * 初始化页面
 */
async function init() {
    try {
        // 从存储加载数据
        const data = await new Promise((resolve) => {
            chrome.storage.local.get(['biliFeed', 'tiebaFeed', 'lofterFeed', 'xiaohongshuFeed'], resolve);
        });
        
        renderContent(data.biliFeed, data.tiebaFeed, data.lofterFeed, data.xiaohongshuFeed);
        console.log('Social Mixer 已初始化', data);
        
        // 自动刷新所有平台（仅首次执行）
        autoRefreshAll();
        
        showToast('正在刷新数据...');
    } catch (error) {
        console.error('初始化失败:', error);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);

// 防止重复自动刷新的标记
let autoRefreshDone = false;

/**
 * 自动刷新所有平台（仅首次执行）
 */
function autoRefreshAll() {
    if (autoRefreshDone) return;
    autoRefreshDone = true;
    
    // 自动刷新B站数据（后台静默更新）
    chrome.runtime.sendMessage({ type: 'refresh_bilibili' }, (response) => {
        if (response && response.success) {
            // B站数据已更新，刷新显示
            setTimeout(() => {
                chrome.storage.local.get(['biliFeed'], (newData) => {
                    if (newData.biliFeed && newData.biliFeed.length > 0) {
                        chrome.storage.local.get(['biliFeed', 'tiebaFeed', 'lofterFeed', 'xiaohongshuFeed'], (allData) => {
                            renderContent(allData.biliFeed, allData.tiebaFeed, allData.lofterFeed, allData.xiaohongshuFeed);
                        });
                    }
                });
            }, 2000);
        }
    });
    
    // 自动打开贴吧页面（后台提取数据）
    setTimeout(() => {
        // 打开贴吧
        if (tiebaWindow && !tiebaWindow.closed) {
            tiebaWindow.close();
        }
        tiebaWindow = window.open('https://tieba.baidu.com/', '_blank');
        
        // 5秒后关闭贴吧页面
        setTimeout(() => {
            if (tiebaWindow && !tiebaWindow.closed) {
                tiebaWindow.close();
                tiebaWindow = null;
            }
        }, 5000);
    }, 1000);
    
    // 自动打开Lofter发现页（后台提取数据）
    setTimeout(() => {
        // 打开Lofter
        if (lofterWindow && !lofterWindow.closed) {
            lofterWindow.close();
        }
        lofterWindow = window.open('https://www.lofter.com/trend', '_blank');
        
        // 5秒后关闭Lofter页面
        setTimeout(() => {
            if (lofterWindow && !lofterWindow.closed) {
                lofterWindow.close();
                lofterWindow = null;
            }
        }, 5000);
    }, 2000);
    
    // 自动打开小红书发现页（后台提取数据）
    setTimeout(() => {
        // 打开小红书
        if (xiaohongshuWindow && !xiaohongshuWindow.closed) {
            xiaohongshuWindow.close();
        }
        xiaohongshuWindow = window.open('https://m.xiaohongshu.com/explore', '_blank');
        
        // 5秒后关闭小红书页面并刷新显示
        setTimeout(() => {
            if (xiaohongshuWindow && !xiaohongshuWindow.closed) {
                xiaohongshuWindow.close();
                xiaohongshuWindow = null;
            }
            // 刷新显示
            chrome.storage.local.get(['biliFeed', 'tiebaFeed', 'lofterFeed', 'xiaohongshuFeed'], (allData) => {
                renderContent(allData.biliFeed, allData.tiebaFeed, allData.lofterFeed, allData.xiaohongshuFeed);
            });
            showToast('已获取全部平台数据');
        }, 5000);
    }, 3000);
}

// 监听来自 background script 的消息
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'data_updated') {
        init();
        showToast('数据已更新');
    }
});