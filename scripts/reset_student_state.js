/**
 * Reset Script - 重置學生偏好和提交狀態
 * 可以在瀏覽器控制台運行，或作為 bookmarklet 使用
 */

// 重置前端狀態
function resetStudentState() {
  const studentId = sessionStorage.getItem('studentId') || 'S001';
  
  // 清除 sessionStorage
  sessionStorage.removeItem('proposalSubmitted');
  
  // 清除 localStorage
  localStorage.removeItem(`studentPreferences_${studentId}`);
  
  // 調用後端 reset API
  fetch('/api/admin/reset', { method: 'POST' })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        alert('✅ Reset completed!\n\nFrontend and backend state have been cleared.\nPlease refresh the page.');
        // 可選：自動刷新頁面
        // window.location.reload();
      } else {
        alert('❌ Reset failed: ' + (data.message || 'Unknown error'));
      }
    })
    .catch(err => {
      console.error('Reset error:', err);
      alert('❌ Reset failed: ' + err.message);
    });
}

// 如果直接運行，執行重置
if (typeof window !== 'undefined') {
  if (confirm('Reset all student preferences and submission status?\n\nThis will:\n- Clear all preferences\n- Reset submission status\n- Allow students to submit again')) {
    resetStudentState();
  }
}

// 導出函數供其他腳本使用
if (typeof module !== 'undefined' && module.exports) {
  module.exports = resetStudentState;
}
