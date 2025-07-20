// Simple toast notification utility

export function showToast(message: string, type: 'info' | 'warning' | 'error' = 'info', duration: number = 5000) {
  // Remove any existing toasts
  const existingToast = document.getElementById('gainz-toast');
  if (existingToast) {
    existingToast.remove();
  }

  // Create toast element
  const toast = document.createElement('div');
  toast.id = 'gainz-toast';
  toast.className = `fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg max-w-sm transition-all duration-300 transform translate-x-full`;
  
  // Style based on type
  const styles = {
    info: 'bg-blue-500 text-white',
    warning: 'bg-orange-500 text-white', 
    error: 'bg-red-500 text-white'
  };
  
  toast.className += ` ${styles[type]}`;
  
  // Add content
  toast.innerHTML = `
    <div class="flex items-center gap-3">
      <div class="flex-1">
        <p class="text-sm font-medium">${message}</p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" class="text-white hover:text-gray-200">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>
  `;
  
  // Add to page
  document.body.appendChild(toast);
  
  // Slide in
  setTimeout(() => {
    toast.style.transform = 'translateX(0)';
  }, 100);
  
  // Auto-dismiss
  setTimeout(() => {
    if (toast.parentNode) {
      toast.style.transform = 'translateX(full)';
      setTimeout(() => {
        if (toast.parentNode) {
          toast.remove();
        }
      }, 300);
    }
  }, duration);
}