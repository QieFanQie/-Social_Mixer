// lofter-content-script.js - 在Lofter页面中运行，提取发现页数据

(function() {
  console.log('Lofter content script loaded');
  
  // 提取帖子数据
  function extractLofterPosts() {
    console.log('开始提取Lofter帖子...');
    
    const posts = [];
    
    // 获取所有帖子（发现页使用 .m-post）
    const mPosts = document.querySelectorAll('.m-post');
    
    console.log('找到 m-post:', mPosts.length, '个');
    
    // 遍历帖子
    mPosts.forEach((post) => {
      // 获取作者名
      const nickLink = post.querySelector('a.nick');
      const author = nickLink?.textContent?.trim() || '';
      
      // 获取作者主页URL
      const authorUrl = nickLink?.href || '';
      
      // 构造帖子链接
      let url = '';
      if (authorUrl && authorUrl.includes('.lofter.com')) {
        const blogName = authorUrl.replace('https://', '').replace('http://', '').split('.lofter.com')[0];
        const permalink = post.getAttribute('permalink');
        if (blogName && permalink) {
          url = `https://${blogName}.lofter.com/post/${permalink}`;
        }
      }
      
      if (!url) return; // 跳过无效帖子
      
      // 获取封面图
      let cover = '';
      const coverImg = post.querySelector('.img img');
      if (coverImg && coverImg.src) {
        cover = coverImg.src;
      }
      
      // 获取帖子内容（作为标题）
      const txtEl = post.querySelector('.cnt .txt');
      let title = txtEl?.textContent?.trim() || '';
      // 去掉日期前缀
      title = title.replace(/^\d{4}-\d{2}-\d{2}[，,]/, '');
      if (!title) {
        title = author ? `${author} 的帖子` : 'Lofter 帖子';
      }
      
      // 发布时间（使用当前时间）
      const pubDate = new Date().toISOString();
      
      posts.push({
        title,
        author,
        url,
        cover,
        pubDate,
        source: 'lofter'
      });
    });
    
    console.log('提取到帖子:', posts.length, '条');
    
    if (posts.length > 0) {
      // 发送到 background script
      chrome.runtime.sendMessage({
        type: 'lofter_posts',
        data: posts
      }, (response) => {
        console.log('Lofter帖子已发送:', response);
      });
    }
    
    return posts;
  }
  
  // 监听页面变化（帖子可能动态加载）
  const observer = new MutationObserver((mutations) => {
    let hasNewContent = false;
    
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            // 检查是否有新的 m-post
            if (node.querySelector && node.querySelector('.m-post')) {
              hasNewContent = true;
              break;
            }
            // 检查自身是否是 m-post
            if (node.classList && node.classList.contains('m-post')) {
              hasNewContent = true;
              break;
            }
          }
        }
      }
    }
    
    if (hasNewContent) {
      console.log('检测到新内容，重新提取...');
      setTimeout(extractLofterPosts, 1000);
    }
  });
  
  // 延迟执行，等待页面加载完成
  setTimeout(() => {
    extractLofterPosts();
  }, 3000);
  
  // 5秒后再尝试一次
  setTimeout(() => {
    extractLofterPosts();
  }, 5000);
  
  // 开始监听页面变化
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('Lofter帖子提取器已启动');
})();
