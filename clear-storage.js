// 清理本地存储中可能损坏的数据
// 在浏览器控制台中运行此脚本

console.log('清理本地存储数据...');

// 清理 localStorage
try {
  localStorage.removeItem('searchHistory');
  localStorage.removeItem('recentSearches');
  localStorage.removeItem('userSettings');
  console.log('✅ localStorage 数据已清理');
} catch (error) {
  console.error('❌ 清理 localStorage 失败:', error);
}

// 清理 Chrome 扩展存储（如果在扩展环境中）
if (typeof chrome !== 'undefined' && chrome.storage) {
  try {
    chrome.storage.local.clear(() => {
      console.log('✅ Chrome local storage 数据已清理');
    });
    chrome.storage.sync.clear(() => {
      console.log('✅ Chrome sync storage 数据已清理');
    });
  } catch (error) {
    console.error('❌ 清理 Chrome storage 失败:', error);
  }
}

console.log('🔄 请刷新页面以重新初始化数据');
