// xiaohongshu-content-script.js - 在小红书页面中运行，提取发现页数据

(function() {
  console.log('Xiaohongshu content script loaded');
  console.log('页面URL:', window.location.href);
  console.log('页面标题:', document.title);
  
  function extractXiaohongshuPosts() {
    console.log('开始提取小红书帖子...');
    
    const posts = [];
    const seenUrls = new Set();
    
    // 方法1: 直接查找所有包含note链接的a标签
    const allLinks = document.querySelectorAll('a[href*="note"], a[href*="discovery"], a[href*="xhs"]');
    console.log('找到所有链接:', allLinks.length);
    
    // 过滤法律信息和无效链接
    const legalKeywords = ['备案', '许可证', '执照', 'certificate', 'license', 'legal', 'beian', '网安', '经营性', '入驻', 'pdf', 'platform', 'fe-video', 'fe-platform', 'dc.xhscdn'];
    
    allLinks.forEach((link, idx) => {
      const url = link.href;
      
      // 跳过法律信息链接
      const isLegal = legalKeywords.some(kw => url.toLowerCase().includes(kw.toLowerCase()));
      if (isLegal) {
        return;
      }
      
      if (url && !seenUrls.has(url) && (url.includes('/note/') || url.includes('/discovery/'))) {
        seenUrls.add(url);
        
        // 尝试从链接周围获取标题和图片
        let title = '';
        let cover = '';
        
        // 尝试从父元素获取标题
        const parent = link.closest('.note-item, .feeds-item, .explore-item, .note-card, .content-item, .stream-item, div[class*="item"], article, section');
        if (parent) {
          // 获取标题
          const titleEl = parent.querySelector('.title, h3, h4, .desc, .content, [class*="title"], [class*="desc"]');
          if (titleEl) {
            title = titleEl.textContent?.trim() || '';
          }
          // 获取图片
          const imgEl = parent.querySelector('img');
          if (imgEl && imgEl.src && !imgEl.src.includes('avatar') && !imgEl.src.includes('user')) {
            cover = imgEl.src;
          }
        }
        
        // 如果没有找到标题，尝试从链接本身获取
        if (!title) {
          const linkText = link.textContent?.trim() || '';
          if (linkText && linkText.length > 5 && linkText.length < 200) {
            title = linkText;
          }
        }
        
        if (url && (title || cover)) {
          posts.push({
            title: title || '小红书笔记',
            author: '',
            url: url,
            cover: cover,
            pubDate: new Date().toISOString(),
            source: 'xiaohongshu'
          });
          console.log('提取到帖子:', posts.length, '标题:', title?.substring(0, 50), 'URL:', url);
        }
      }
    });
    
    // 方法2: 查找所有图片并提取URL
    if (posts.length === 0) {
      console.log('未找到有效链接，尝试查找图片...');
      const allImages = document.querySelectorAll('img');
      console.log('找到所有图片:', allImages.length);
      
      allImages.forEach((img, idx) => {
        const src = img.src || '';
        // 查找来自小红书的图片（通常是xhscdn域名）
        if (src.includes('xhscdn.com') && !src.includes('avatar') && !src.includes('user') && !src.includes('profile') && !src.includes('fe-video') && !src.includes('fe-platform')) {
          // 尝试从父元素获取链接
          const parent = img.closest('a[href], div[class*="item"], div[class*="note"]');
          let url = '';
          let title = '';
          
          if (parent && parent.tagName === 'A') {
            url = parent.href || '';
          }
          
          // 尝试从父元素获取标题
          if (parent) {
            const titleEl = parent.querySelector('.title, h3, h4, .desc, [class*="title"], [class*="desc"], span');
            if (titleEl && titleEl.textContent) {
              const text = titleEl.textContent.trim();
              if (text && text.length > 3 && text.length < 200) {
                title = text;
              }
            }
          }
          
          // 如果还是没有标题，尝试从父元素的兄弟元素或祖先元素获取
          if (!title && parent) {
            let el = parent;
            while (el && el !== document.body) {
              const text = el.textContent?.trim() || '';
              // 查找包含多个字符但不是太长的文本
              if (text && text.length > 10 && text.length < 150 && !text.includes('登录') && !text.includes('收藏') && !text.includes('点赞')) {
                title = text.substring(0, 100);
                break;
              }
              el = el.parentElement;
            }
          }
          
          // 如果有URL且是有效的帖子链接
          if (url && !legalKeywords.some(kw => url.toLowerCase().includes(kw.toLowerCase())) && !seenUrls.has(url)) {
            seenUrls.add(url);
            posts.push({
              title: title || '小红书笔记',
              author: '',
              url: url,
              cover: src,
              pubDate: new Date().toISOString(),
              source: 'xiaohongshu'
            });
            if (title) {
              console.log('通过图片父链接提取到帖子:', posts.length, '标题:', title.substring(0, 50), 'URL:', url);
            }
          } else if (!url) {
            // 如果没有链接但有图片，也添加到列表
            console.log('发现无链接图片:', src.substring(0, 100));
          }
        }
      });
      
      // 如果还是没有数据，检查是否是登录页面
      if (posts.length === 0) {
        const pageText = document.body.innerText || '';
        if (pageText.includes('登录') && pageText.includes('小红书')) {
          console.log('检测到登录页面，需要登录后才能获取内容');
        } else {
          console.log('未找到任何帖子内容，可能需要登录或页面使用了特殊渲染技术');
        }
      }
    }
    
    // 发送数据
    if (posts.length > 0) {
      chrome.runtime.sendMessage({
        type: 'xiaohongshu_posts',
        data: posts
      }, (response) => {
        console.log('小红书帖子已发送:', response);
      });
    }
    
    return posts;
  }
  
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0) {
        for (const node of mutation.addedNodes) {
          if (node.nodeType === Node.ELEMENT_NODE) {
            if (node.querySelector?.('[data-note-id]') || node.hasAttribute?.('data-note-id')) {
              console.log('检测到新的帖子元素');
              setTimeout(extractXiaohongshuPosts, 1000);
              break;
            }
          }
        }
      }
    }
  });
  
  // 多次尝试提取，给页面更多加载时间
  setTimeout(extractXiaohongshuPosts, 2000);
  setTimeout(extractXiaohongshuPosts, 4000);
  setTimeout(extractXiaohongshuPosts, 8000);
  setTimeout(extractXiaohongshuPosts, 15000);
  
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  
  console.log('小红书帖子提取器已启动');
})();
