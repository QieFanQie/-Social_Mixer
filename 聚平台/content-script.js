// content-script.js - 在贴吧页面中运行，提取帖子数据

(function() {
  console.log('Content script loaded for tieba');
  
  // 检测是否是贴吧主页
  function isHomePage() {
    return window.location.pathname === '/' || window.location.pathname === '/index.html';
  }
  
  // 获取当前贴吧名称
  function getForumName() {
    if (isHomePage()) {
      return '贴吧首页';
    }
    
    const title = document.title;
    const match = title.match(/^(.+?)吧/);
    return match ? match[1] : '贴吧';
  }
  
  // 从主页提取热门帖子
  function extractFromHomePage() {
    console.log('检测到贴吧主页');
    
    const posts = [];
    const hotItems = document.querySelectorAll('.hot-list-item, .feed-item, [data-tid], a[href*="/p/"]');
    
    hotItems.forEach(item => {
      let link, title, tid;
      
      // 尝试找到帖子链接
      if (item.tagName === 'A' && item.href.includes('/p/')) {
        link = item;
      } else {
        link = item.querySelector('a[href*="/p/"]');
      }
      
      if (link) {
        const href = link.getAttribute('href');
        const tidMatch = href.match(/\/p\/(\d+)/);
        tid = tidMatch ? tidMatch[1] : '';
        title = link.textContent.trim();
        
        if (title && tid) {
          posts.push({
            id: tid,
            title: title,
            author: '',
            authorId: '',
            content: '',
            replyNum: 0,
            good: false,
            isImage: false,
            coverUrl: '',
            createTime: Date.now() / 1000,
            lastTime: Date.now() / 1000,
            forumName: '贴吧首页'
          });
        }
      }
    });
    
    return posts;
  }
  
  // 从特定贴吧页面提取帖子
  function extractFromForumPage() {
    console.log('检测到特定贴吧页面');
    
    const posts = [];
    const postLinks = document.querySelectorAll('a[href*="/p/"]');
    const forumName = getForumName();
    
    postLinks.forEach(link => {
      const href = link.getAttribute('href');
      const tidMatch = href.match(/\/p\/(\d+)/);
      const tid = tidMatch ? tidMatch[1] : '';
      const title = link.textContent.trim();
      
      let replyNum = 0;
      const container = link.closest('div, li, article');
      if (container) {
        const replyEl = container.querySelector('.threadlist_rep_num, .replies, [class*="reply"]');
        replyNum = replyEl ? parseInt(replyEl.textContent) || 0 : 0;
      }
      
      if (title && tid) {
        posts.push({
          id: tid,
          title: title,
          author: '',
          authorId: '',
          content: '',
          replyNum: replyNum,
          good: false,
          isImage: false,
          coverUrl: '',
          createTime: Date.now() / 1000,
          lastTime: Date.now() / 1000,
          forumName: forumName
        });
      }
    });
    
    return posts;
  }
  
  // 提取帖子数据
  function extractPosts() {
    console.log('检查页面状态...');
    console.log('页面 URL:', window.location.href);
    console.log('是否主页:', isHomePage());
    
    let posts = [];
    
    if (isHomePage()) {
      posts = extractFromHomePage();
    } else {
      posts = extractFromForumPage();
    }
    
    console.log('提取到帖子:', posts.length, '条');
    
    if (posts.length > 0) {
      chrome.runtime.sendMessage({
        type: 'tieba_posts',
        data: posts
      });
      return;
    }
    
    console.log('未找到帖子，等待 3 秒后重试...');
    setTimeout(extractPosts, 3000);
  }
  
  // 监听页面变化
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            const newPosts = node.querySelectorAll?.('a[href*="/p/"]');
            if (newPosts && newPosts.length > 0) {
              console.log('检测到页面更新，重新提取...');
              extractPosts();
              break;
            }
          }
        }
      }
    }
  });
  
  // 延迟执行
  setTimeout(extractPosts, 2000);
  setTimeout(extractPosts, 5000);
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('贴吧帖子提取器已启动');
})();