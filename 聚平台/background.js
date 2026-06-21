async function getBilibiliCookies() {
  const cookies = await chrome.cookies.getAll({
    domain: 'bilibili.com'
  });
  
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

// ============ 百度贴吧功能 ============

// 获取百度贴吧的 cookies（主要是 BDUSS）
async function getTiebaCookies() {
  const cookies = await chrome.cookies.getAll({
    domain: 'baidu.com'
  });
  
  return cookies.map(cookie => `${cookie.name}=${cookie.value}`).join('; ');
}

// 获取 BDUSS cookie（单独获取，用于请求头）
async function getBDUSS() {
  const cookie = await chrome.cookies.get({
    url: 'https://tieba.baidu.com/',
    name: 'BDUSS'
  });
  
  return cookie ? cookie.value : '';
}

// 获取 TBS（用于防 CSRF 攻击的令牌）
async function getTBS(bduss) {
  try {
    const response = await fetch('https://tieba.baidu.com/dc/common/tbs', {
      headers: {
        'Cookie': `BDUSS=${bduss}`,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    });
    
    const data = await response.json();
    return data.tbs;
  } catch (error) {
    console.error('获取 TBS 失败:', error);
    return null;
  }
}

// 生成贴吧 API 签名（将参数按字典序排序后 MD5 加密）
async function generateSign(params) {
  const signKey = 'tiebaclient!!!';
  
  // 将参数按键名排序并拼接
  const sortedKeys = Object.keys(params).sort();
  let signStr = '';
  
  for (const key of sortedKeys) {
    signStr += key + '=' + params[key];
  }
  
  signStr += signKey;
  
  // 使用 SubtleCrypto 进行 MD5 加密
  const encoder = new TextEncoder();
  const data = encoder.encode(signStr);
  const hashBuffer = await crypto.subtle.digest('MD5', data).catch(() => null);
  
  if (!hashBuffer) {
    // 如果 SubtleCrypto 不支持 MD5，使用同步方法
    return btoa(signStr).substring(0, 32).toUpperCase();
  }
  
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

// MD5 同步实现（用于 Service Worker）
function md5(str) {
  function md5cycle(x, k) {
    let a = x[0], b = x[1], c = x[2], d = x[3];
    a = ff(a, b, c, d, k[0], 7, -680876936);
    d = ff(d, a, b, c, k[1], 12, -389564586);
    c = ff(c, d, a, b, k[2], 17, 606105819);
    b = ff(b, c, d, a, k[3], 22, -1044525330);
    a = ff(a, b, c, d, k[4], 7, -176418897);
    d = ff(d, a, b, c, k[5], 12, 1200080426);
    c = ff(c, d, a, b, k[6], 17, -1473231341);
    b = ff(b, c, d, a, k[7], 22, -45705983);
    a = ff(a, b, c, d, k[8], 7, 1770035416);
    d = ff(d, a, b, c, k[9], 12, -1958414417);
    c = ff(c, d, a, b, k[10], 17, -42063);
    b = ff(b, c, d, a, k[11], 22, -1990404162);
    a = ff(a, b, c, d, k[12], 7, 1804603682);
    d = ff(d, a, b, c, k[13], 12, -40341101);
    c = ff(c, d, a, b, k[14], 17, -1502002290);
    b = ff(b, c, d, a, k[15], 22, 1236535329);
    a = gg(a, b, c, d, k[1], 5, -165796510);
    d = gg(d, a, b, c, k[6], 9, -1069501632);
    c = gg(c, d, a, b, k[11], 14, 643717713);
    b = gg(b, c, d, a, k[0], 20, -373897302);
    a = gg(a, b, c, d, k[5], 5, -701558691);
    d = gg(d, a, b, c, k[10], 9, 38016083);
    c = gg(c, d, a, b, k[15], 14, -660478335);
    b = gg(b, c, d, a, k[4], 20, -405537848);
    a = gg(a, b, c, d, k[9], 5, 568446438);
    d = gg(d, a, b, c, k[14], 9, -1019803690);
    c = gg(c, d, a, b, k[3], 14, -187363961);
    b = gg(b, c, d, a, k[8], 20, 1163531501);
    a = gg(a, b, c, d, k[13], 5, -1444681467);
    d = gg(d, a, b, c, k[2], 9, -51403784);
    c = gg(c, d, a, b, k[7], 14, 1735328473);
    b = gg(b, c, d, a, k[12], 20, -1926607734);
    a = hh(a, b, c, d, k[5], 4, -378558);
    d = hh(d, a, b, c, k[8], 11, -2022574463);
    c = hh(c, d, a, b, k[11], 16, 1839030562);
    b = hh(b, c, d, a, k[14], 23, -35309556);
    a = hh(a, b, c, d, k[1], 4, -1530992060);
    d = hh(d, a, b, c, k[4], 11, 1272893353);
    c = hh(c, d, a, b, k[7], 16, -155497632);
    b = hh(b, c, d, a, k[10], 23, -1094730640);
    a = hh(a, b, c, d, k[13], 4, 681279174);
    d = hh(d, a, b, c, k[0], 11, -358537222);
    c = hh(c, d, a, b, k[3], 16, -722521979);
    b = hh(b, c, d, a, k[6], 23, 76029189);
    a = hh(a, b, c, d, k[9], 4, -640364487);
    d = hh(d, a, b, c, k[12], 11, -421815835);
    c = hh(c, d, a, b, k[15], 16, 530742520);
    b = hh(b, c, d, a, k[2], 23, -995338651);
    a = ii(a, b, c, d, k[0], 6, -198630844);
    d = ii(d, a, b, c, k[7], 10, 1126891415);
    c = ii(c, d, a, b, k[14], 15, -1416354905);
    b = ii(b, c, d, a, k[5], 21, -57434055);
    a = ii(a, b, c, d, k[12], 6, 1700485571);
    d = ii(d, a, b, c, k[3], 10, -1894986606);
    c = ii(c, d, a, b, k[10], 15, -1051523);
    b = ii(b, c, d, a, k[1], 21, -2054922799);
    a = ii(a, b, c, d, k[8], 6, 1873313359);
    d = ii(d, a, b, c, k[15], 10, -30611744);
    c = ii(c, d, a, b, k[6], 15, -1560198380);
    b = ii(b, c, d, a, k[13], 21, 1309151649);
    a = ii(a, b, c, d, k[4], 6, -145523070);
    d = ii(d, a, b, c, k[11], 10, -1120210379);
    c = ii(c, d, a, b, k[2], 15, 718787259);
    b = ii(b, c, d, a, k[9], 21, -343485551);
    x[0] = add32(a, x[0]);
    x[1] = add32(b, x[1]);
    x[2] = add32(c, x[2]);
    x[3] = add32(d, x[3]);
  }

  function cmn(q, a, b, x, s, t) {
    a = add32(add32(a, q), add32(x, t));
    return add32((a << s) | (a >>> (32 - s)), b);
  }

  function ff(a, b, c, d, x, s, t) {
    return cmn((b & c) | ((~b) & d), a, b, x, s, t);
  }

  function gg(a, b, c, d, x, s, t) {
    return cmn((b & d) | (c & (~d)), a, b, x, s, t);
  }

  function hh(a, b, c, d, x, s, t) {
    return cmn(b ^ c ^ d, a, b, x, s, t);
  }

  function ii(a, b, c, d, x, s, t) {
    return cmn(c ^ (b | (~d)), a, b, x, s, t);
  }

  function md51(s) {
    let n = s.length, state = [1732584193, -271733879, -1732584194, 271733878], i;
    for (i = 64; i <= n; i += 64) {
      md5cycle(state, md5blk(s.substring(i - 64, i)));
    }
    s = s.substring(i - 64);
    let tail = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
    for (i = 0; i < s.length; i++) tail[i >> 2] |= s.charCodeAt(i) << ((i % 4) << 3);
    tail[i >> 2] |= 0x80 << ((i % 4) << 3);
    if (i > 55) {
      md5cycle(state, tail);
      for (i = 0; i < 16; i++) tail[i] = 0;
    }
    tail[14] = n * 8;
    md5cycle(state, tail);
    return state;
  }

  function md5blk(s) {
    let md5blks = [], i;
    for (i = 0; i < 64; i += 4) {
      md5blks[i >> 2] = s.charCodeAt(i) + (s.charCodeAt(i + 1) << 8) + (s.charCodeAt(i + 2) << 16) + (s.charCodeAt(i + 3) << 24);
    }
    return md5blks;
  }

  function add32(a, b) {
    return (a + b) & 0xFFFFFFFF;
  }

  return md51(str).map(x => x.toString(16).padStart(8, '0')).join('');
}

// 生成签名（使用同步 MD5）
function generateSignSync(params) {
  const signKey = 'tiebaclient!!!';
  const sortedKeys = Object.keys(params).sort();
  let signStr = '';
  
  for (const key of sortedKeys) {
    signStr += key + '=' + params[key];
  }
  
  signStr += signKey;
  return md5(signStr).toUpperCase();
}

// 获取贴吧帖子列表（解析HTML注释中的数据）
async function fetchTiebaPosts(kw, pageNo = 1) {
  const bduss = await getBDUSS();
  
  try {
    console.log(`正在获取 "${kw}" 的帖子...`);
    
    // 使用贴吧首页接口
    const encodedKw = encodeURIComponent(kw);
    const url = `https://tieba.baidu.com/f?kw=${encodedKw}&pn=${(pageNo - 1) * 50}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'zh-CN,zh;q=0.9',
        'Cookie': bduss ? `BDUSS=${bduss}` : '',
        'Referer': 'https://tieba.baidu.com/'
      }
    });
    
    const html = await response.text();
    console.log('HTTP状态:', response.status);
    
    // 调试：检查HTML内容
    console.log('HTML长度:', html.length);
    
    // 查找HTML注释中的数据（贴吧使用这种隐藏方式传递数据）
    // 格式: <!-- ... --> 或 <code id="pagelet_html_frs-list/pagelet/thread_list"><!-- ... --></code>
    
    // 方法1: 查找pagelet中的注释
    const pageletMatch = html.match(/<code[^>]*id="pagelet_html_frs-list\/pagelet\/thread_list"[^>]*>([\s\S]*?)<\/code>/);
    
    if (pageletMatch) {
      console.log('找到pagelet数据，长度:', pageletMatch[1].length);
      
      // 提取注释内容
      const commentMatch = pageletMatch[1].match(/<!--([\s\S]*?)-->/);
      if (commentMatch) {
        console.log('找到注释内容，长度:', commentMatch[1].length);
        const commentHtml = commentMatch[1];
        return parseThreadListFromHtml(commentHtml, kw);
      } else {
        console.log('pagelet中有内容但没有注释');
        console.log('pagelet内容预览:', pageletMatch[1].substring(0, 500));
      }
    } else {
      console.log('未找到pagelet_html_frs-list/pagelet/thread_list');
    }
    
    // 方法2: 直接查找HTML中的帖子列表
    const threadListMatch = html.match(/<!--([\s\S]*?)-->/g);
    if (threadListMatch) {
      console.log('找到', threadListMatch.length, '个注释块');
      for (let i = 0; i < threadListMatch.length; i++) {
        const commentHtml = threadListMatch[i].replace(/<!--|--> /g, '');
        if (commentHtml.includes('j_thread_list') || commentHtml.includes('thread_list')) {
          console.log('从注释', i, '中找到thread_list');
          return parseThreadListFromHtml(commentHtml, kw);
        }
      }
    } else {
      console.log('未找到任何注释块');
    }
    
    // 方法3: 查找其他可能的数据容器
    if (html.includes('threadlist')) {
      console.log('HTML中包含threadlist');
    }
    if (html.includes('j_th_tit')) {
      console.log('HTML中包含j_th_tit');
    }
    
    // 输出部分HTML用于调试
    console.log('HTML预览:', html.substring(0, 2000));
    console.log('HTML尾部:', html.substring(html.length - 2000));
    return [];
  } catch (error) {
    console.error('获取贴吧帖子失败:', error);
    return [];
  }
}

// 从HTML中解析帖子列表
function parseThreadListFromHtml(html, forumName) {
  const threads = [];
  
  // 使用正则匹配帖子项
  const threadRegex = /<li\s+class="[^"]*j_thread_list[^"]*"[^>]*>([\s\S]*?)<\/li>/g;
  let match;
  
  while ((match = threadRegex.exec(html)) !== null) {
    const itemHtml = match[1];
    
    // 提取标题
    const titleMatch = itemHtml.match(/<a[^>]+class="[^"]*j_th_tit[^"]*"[^>]*>([^<]+)<\/a>/);
    // 提取帖子ID
    const idMatch = itemHtml.match(/tid[=:]\s*["']?(\d+)/);
    // 提取作者
    const authorMatch = itemHtml.match(/class="[^"]*tb_icon_author[^"]*"[^>]*>[\s\S]*?<a[^>]*>([^<]+)<\/a>/);
    // 提取回复数
    const replyMatch = itemHtml.match(/class="[^"]*threadlist_rep_num[^"]*"[^>]*>(\d+)<\/span>/);
    
    if (titleMatch) {
      threads.push({
        id: idMatch ? idMatch[1] : '',
        title: titleMatch[1].trim(),
        author: authorMatch ? authorMatch[1].trim() : '',
        authorId: '',
        content: '',
        replyNum: replyMatch ? parseInt(replyMatch[1]) : 0,
        good: itemHtml.includes('threadlist_top') || itemHtml.includes('is_good'),
        isImage: itemHtml.includes('threadlist_pic'),
        coverUrl: '',
        createTime: Date.now() / 1000,
        lastTime: Date.now() / 1000,
        forumName: forumName
      });
    }
  }
  
  console.log(`成功获取帖子:`, threads.length, '条');
  return threads;
}

// 获取关注的贴吧列表（使用移动端接口）
async function fetchTiebaForums() {
  const bduss = await getBDUSS();
  
  if (!bduss) {
    console.log('未找到 BDUSS，请先登录百度贴吧');
    return [];
  }
  
  try {
    console.log('正在获取贴吧列表...');
    
    // 使用移动端接口获取贴吧列表
    const response = await fetch('https://tieba.baidu.com/mo/q/newmoindex?', {
      headers: {
        'Cookie': `BDUSS=${bduss}`,
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.101 Mobile Safari/537.36'
      }
    });
    
    console.log('HTTP状态:', response.status);
    
    const data = await response.json();
    
    if (data.error_code !== 0 && data.no !== 0) {
      console.log('API返回错误:', data);
      return [];
    }
    
    if (!data.data?.like_forum) {
      console.log('未找到关注的贴吧数据');
      return [];
    }
    
    const forums = data.data.like_forum.map(forum => ({
      id: forum.forum_id || '',
      name: forum.forum_name || '',
      level: forum.user_level || '',
      isSign: forum.is_sign === 1,
      avatar: forum.forum_logo || ''
    }));
    
    console.log('成功获取贴吧列表:', forums.length, '个贴吧');
    console.log('贴吧名称:', forums.map(f => f.name));
    
    return forums;
  } catch (error) {
    console.error('获取贴吧列表失败:', error);
    return [];
  }
}

// 评论帖子
async function postComment(tid, kw, content) {
  const bduss = await getBDUSS();
  const tbs = await getTBS(bduss);
  
  if (!bduss || !tbs) {
    console.log('无法评论：缺少 BDUSS 或 TBS');
    return { success: false, error: '缺少认证信息' };
  }
  
  const timestamp = Math.floor(Date.now() / 1000).toString();
  
  const params = {
    BDUSS: bduss,
    _client_type: '2',
    _client_version: '12.41.1.0',
    _phone_imei: '000000000000000',
    kw: kw,
    tid: tid.toString(),
    content: content,
    tbs: tbs,
    timestamp: timestamp
  };
  
  params.sign = generateSignSync(params);
  
  try {
    const formData = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      formData.append(key, value);
    }
    
    const response = await fetch('https://tieba.baidu.com/c/c/comment/add', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Linux; Android 12; Pixel 3) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.101 Mobile Safari/537.36'
      },
      body: formData.toString()
    });
    
    const data = await response.json();
    
    if (data.error_code === '0') {
      console.log('评论成功:', content);
      return { success: true, data: data };
    } else {
      console.error('评论失败:', data);
      return { success: false, error: data.error_msg || '评论失败' };
    }
  } catch (error) {
    console.error('评论失败:', error);
    return { success: false, error: error.message };
  }
}

// 更新贴吧推送内容（简化版）
async function updateTiebaFeed() {
  const forums = await fetchTiebaForums();
  
  if (forums.length === 0) {
    console.log('未获取到关注的贴吧');
    return;
  }
  
  console.log('贴吧推送更新提示：请访问贴吧页面以获取帖子数据');
  
  // 获取前5个贴吧的最新帖子（仅尝试一次，失败则跳过）
  const allPosts = [];
  const topForums = forums.slice(0, 5);
  
  for (const forum of topForums) {
    try {
      const posts = await fetchTiebaPosts(forum.name, 1);
      allPosts.push(...posts);
    } catch (e) {
      console.log(`获取 "${forum.name}" 帖子失败，跳过`);
    }
  }
  
  if (allPosts.length > 0) {
    const now = new Date().toLocaleString('zh-CN');
    await chrome.storage.local.set({
      'tiebaFeed': allPosts,
      'tiebaForums': forums,
      'tiebaLastUpdate': now
    });
    console.log(`[${now}] 贴吧推送已更新:`, allPosts.length, '条帖子');
  }
}

// ============ B站功能 ============

async function fetchBilibiliFeed(cookie) {
  const url = 'https://api.bilibili.com/x/web-interface/wbi/index/top/feed/rcmd?fresh_type=3&version=1';
  
  try {
    const response = await fetch(url, {
      headers: {
        'Cookie': cookie,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/120.0.0.0'
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.code !== 0 || !data.data?.item) {
      console.error('API response error:', data);
      return [];
    }
    
    return data.data.item.map(item => ({
      title: item.title || '',
      author: item.owner?.name || item.up_name || '',
      cover: item.pic || item.cover || '',
      timestamp: item.pubdate || item.ctime || Date.now()
    }));
  } catch (error) {
    console.error('Fetch Bilibili feed failed:', error);
    return [];
  }
}

async function updateBilibiliFeed() {
  const cookie = await getBilibiliCookies();
  
  if (!cookie) {
    console.log('No Bilibili cookies found');
    return;
  }
  
  const feed = await fetchBilibiliFeed(cookie);
  
  if (feed.length > 0) {
    const now = new Date().toLocaleString('zh-CN');
    await chrome.storage.local.set({ 
      'biliFeed': feed,
      'lastUpdate': now
    });
    console.log(`[${now}] Bilibili feed updated:`, feed.length, 'videos');
  }
}

chrome.runtime.onInstalled.addListener(async () => {
  const cookieStr = await getBilibiliCookies();
  console.log('Bilibili cookies:', cookieStr);
  
  // B站定时任务
  await chrome.alarms.create('updateBiliFeed', {
    delayInMinutes: 0,
    periodInMinutes: 10
  });
  
  // 贴吧定时任务
  await chrome.alarms.create('updateTiebaFeed', {
    delayInMinutes: 0,
    periodInMinutes: 10
  });
  
  // Lofter 定时任务（每15分钟）
  await chrome.alarms.create('updateLofterFeed', {
    delayInMinutes: 0,
    periodInMinutes: 15
  });
  
  // 小红书定时任务（每15分钟）
  await chrome.alarms.create('updateXiaohongshuFeed', {
    delayInMinutes: 0,
    periodInMinutes: 15
  });
  
  // 打印贴吧 cookies
  const tiebaCookie = await getBDUSS();
  console.log('Tieba BDUSS:', tiebaCookie ? '已获取' : '未登录');
  
  // 打印 Lofter cookies
  const lofterCookie = await getLofterCookies();
  console.log('Lofter cookies:', lofterCookie ? '已获取' : '未登录');
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'updateBiliFeed') {
    await updateBilibiliFeed();
  }
  if (alarm.name === 'updateTiebaFeed') {
    await updateTiebaFeed();
  }
  if (alarm.name === 'updateLofterFeed') {
    await updateLofterFeed();
  }
  if (alarm.name === 'updateXiaohongshuFeed') {
    await updateXiaohongshuFeed();
  }
});

// 接收 content-script 发送的贴吧帖子数据
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // 处理刷新B站数据的请求
  if (message.type === 'refresh_bilibili') {
    console.log('收到刷新B站请求');
    updateBilibiliFeed().then(() => {
      sendResponse({ success: true });
    });
    return true; // 保持消息通道开启
  }
  
  if (message.type === 'tieba_posts') {
    console.log('收到贴吧帖子数据:', message.data.length, '条');
    
    // 存储到本地
    const now = new Date().toLocaleString('zh-CN');
    chrome.storage.local.set({
      'tiebaFeed': message.data,
      'tiebaLastUpdate': now
    }).then(() => {
      console.log(`[${now}] 贴吧帖子已存储`);
    });
    
    sendResponse({ success: true });
  }
  
  // 处理刷新Lofter数据的请求
  if (message.type === 'refresh_lofter') {
    console.log('收到刷新Lofter请求');
    updateLofterFeed().then(() => {
      sendResponse({ success: true });
    });
    return true; // 保持消息通道开启
  }
  
  // 处理来自Lofter content script的消息
  if (message.type === 'lofter_posts') {
    console.log('收到Lofter帖子数据:', message.data.length, '条');
    
    const now = new Date().toLocaleString('zh-CN');
    chrome.storage.local.set({
      'lofterFeed': message.data,
      'lofterLastUpdate': now
    }).then(() => {
      console.log(`[${now}] Lofter帖子已存储`);
    });
    
    sendResponse({ success: true });
  }
  
  // 处理刷新小红书数据的请求
  if (message.type === 'refresh_xiaohongshu') {
    console.log('收到刷新小红书请求');
    updateXiaohongshuFeed().then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
  
  // 处理来自小红书 content script的消息
  if (message.type === 'xiaohongshu_posts') {
    console.log('收到小红书帖子数据:', message.data.length, '条');
    
    const now = new Date().toLocaleString('zh-CN');
    chrome.storage.local.set({
      'xiaohongshuFeed': message.data,
      'xiaohongshuLastUpdate': now
    }).then(() => {
      console.log(`[${now}] 小红书帖子已存储`);
    });
    
    sendResponse({ success: true });
  }
});

// ============ Lofter 功能 ============

// 更新 Lofter 推送内容（通过content script提取）
async function updateLofterFeed() {
  // Lofter使用content script提取数据，这里只记录日志
  console.log('Lofter: 请点击"刷新Lofter"按钮打开页面提取数据');
}

// ============ 小红书功能 ============

// 更新小红书推送内容（通过content script提取）
async function updateXiaohongshuFeed() {
  console.log('小红书: 请点击"刷新小红书"按钮打开页面提取数据');
}

// 合并所有平台的内容流
async function mergeAllFeeds() {
  const data = await chrome.storage.local.get(['biliFeed', 'tiebaFeed', 'lofterFeed', 'xiaohongshuFeed']);
  
  const mixedFeed = [];
  
  // 添加 B站内容
  if (data.biliFeed && data.biliFeed.length > 0) {
    data.biliFeed.forEach(item => {
      mixedFeed.push({
        ...item,
        source: 'bilibili'
      });
    });
  }
  
  // 添加贴吧内容
  if (data.tiebaFeed && data.tiebaFeed.length > 0) {
    data.tiebaFeed.forEach(item => {
      mixedFeed.push({
        ...item,
        source: 'tieba'
      });
    });
  }
  
  // 添加 Lofter 内容
  if (data.lofterFeed && data.lofterFeed.length > 0) {
    mixedFeed.push(...data.lofterFeed);
  }
  
  // 添加小红书内容
  if (data.xiaohongshuFeed && data.xiaohongshuFeed.length > 0) {
    mixedFeed.push(...data.xiaohongshuFeed);
  }
  
  // 按时间排序（最新的在前）
  mixedFeed.sort((a, b) => {
    const timeA = a.timestamp || a.createTime || new Date(a.pubDate).getTime() || 0;
    const timeB = b.timestamp || b.createTime || new Date(b.pubDate).getTime() || 0;
    return timeB - timeA;
  });
  
  await chrome.storage.local.set({ 'mixedFeed': mixedFeed });
  console.log('Mixed feed updated:', mixedFeed.length, 'items');
}
