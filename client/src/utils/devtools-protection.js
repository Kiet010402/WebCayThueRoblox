// DevTools và Source Code Protection - Enhanced Version
(function() {
  // Wait for DOM to be ready
  function initProtection() {
    let devtoolsOpen = false;
    
    // ========== 1. CHẶN PHÍM TẮT ==========
    document.addEventListener('keydown', function(e) {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+I (DevTools)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+J (Console)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+K (Console - Firefox)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 75) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+U (View Source)
      if (e.ctrlKey && e.keyCode === 85) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+S (Save Page)
      if (e.ctrlKey && e.keyCode === 83) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+C (Inspect Element)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 67) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+P (Print)
      if (e.ctrlKey && e.keyCode === 80) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
      // Ctrl+Shift+Delete (Clear Data)
      if (e.ctrlKey && e.shiftKey && e.keyCode === 46) {
        e.preventDefault();
        e.stopPropagation();
        return false;
      }
    }, true);

    // ========== 2. CHẶN CHUỘT PHẢI ==========
    document.addEventListener('contextmenu', function(e) {
      e.preventDefault();
      e.stopPropagation();
      return false;
    }, true);

    // ========== 3. CHẶN TEXT SELECTION (Tùy chọn) ==========
    // Uncomment nếu muốn chặn hoàn toàn
    // document.addEventListener('selectstart', function(e) {
    //   e.preventDefault();
    //   return false;
    // }, true);

    // ========== 4. CHẶN DRAG & DROP ==========
    document.addEventListener('dragstart', function(e) {
      e.preventDefault();
      return false;
    }, true);

    // ========== 5. ANTI-DEBUGGING: Phát hiện debugger statement ==========
    function detectDebugger() {
      const start = performance.now();
      // eslint-disable-next-line no-debugger
      debugger;
      const end = performance.now();
      // Nếu thời gian vượt quá 100ms, có thể đang có debugger
      if (end - start > 100) {
        devtoolsOpen = true;
        handleDevToolsDetected();
      }
    }

    // ========== 6. PHÁT HIỆN DEVTOOLS - Multiple Methods ==========
    
    // Method 1: Window size detection
    function checkWindowSize() {
      const threshold = 160;
      const widthDiff = window.outerWidth - window.innerWidth;
      const heightDiff = window.outerHeight - window.innerHeight;
      
      if (widthDiff > threshold || heightDiff > threshold) {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          handleDevToolsDetected();
        }
      } else {
        devtoolsOpen = false;
      }
    }

    // Method 2: Console detection
    let consoleOpened = false;
    function detectConsole() {
      const element = new Image();
      Object.defineProperty(element, 'id', {
        get: function() {
          if (!consoleOpened) {
            consoleOpened = true;
            devtoolsOpen = true;
            handleDevToolsDetected();
          }
          return 'console-detector';
        }
      });
      // eslint-disable-next-line no-console
      console.log(element);
    }

    // Method 3: DevTools detector (chrome devtools)
    function detectDevTools() {
      const devtools = /./;
      devtools.toString = function() {
        if (!devtoolsOpen) {
          devtoolsOpen = true;
          handleDevToolsDetected();
        }
        return '';
      };
      // eslint-disable-next-line no-console
      console.log('%c', devtools);
    }

    // Method 4: Element inspector detection
    let lastElement = null;
    function detectInspector() {
      setInterval(function() {
        if (lastElement && document.activeElement !== lastElement && document.activeElement.tagName === 'IFRAME') {
          devtoolsOpen = true;
          handleDevToolsDetected();
        }
        lastElement = document.activeElement;
      }, 1000);
    }

    // ========== 7. XỬ LÝ KHI PHÁT HIỆN DEVTOOLS ==========
    function handleDevToolsDetected() {
      // Clear console
      console.clear();
      
      // Warning message
      console.log('%c⚠️ DỪNG LẠI! ⚠️', 'color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 2px black;');
      console.log('%cHành vi này có thể vi phạm điều khoản sử dụng!', 'color: red; font-size: 20px;');
      console.log('%cDevTools đã bị phát hiện. Vui lòng đóng DevTools để tiếp tục.', 'color: orange; font-size: 16px;');
      
      // Có thể thêm các hành động khác ở đây:
      // - Redirect
      // - Log to server
      // - Disable functionality
      
      // Disable console methods
      disableConsoleMethods();
      
      // Trigger anti-debugging
      setInterval(detectDebugger, 500);
    }

    // ========== 8. VÔ HIỆU HÓA CONSOLE ==========
    const noop = function() {};
    const consoleMethods = [
      'log', 'debug', 'info', 'warn', 'error', 'assert', 
      'dir', 'dirxml', 'group', 'groupEnd', 'time', 'timeEnd', 
      'count', 'trace', 'profile', 'profileEnd', 'table',
      'clear', 'exception', 'timeStamp', 'groupCollapsed'
    ];
    
    let consoleDisabled = false;
    function disableConsoleMethods() {
      if (consoleDisabled) return;
      consoleDisabled = true;
      
      consoleMethods.forEach(function(method) {
        try {
          console[method] = noop;
        } catch (e) {
          // Ignore errors
        }
      });
    }

    // ========== 9. CHẶN CÁC HÀM DEBUG ==========
    // Override debugger keyword
    // eslint-disable-next-line no-eval
    const originalEval = window.eval;
    // eslint-disable-next-line no-eval
    window.eval = function(code) {
      if (code && typeof code === 'string' && code.indexOf('debugger') !== -1) {
        return;
      }
      // eslint-disable-next-line no-eval
      return originalEval.apply(this, arguments);
    };

    // ========== 10. CHẶN INSPECT ELEMENT (Mobile) ==========
    document.addEventListener('touchstart', function(e) {
      if (e.touches.length > 1) {
        e.preventDefault();
        return false;
      }
    }, { passive: false });

    // ========== 11. PROTECT WINDOW OBJECT ==========
    Object.defineProperty(window, 'devtools', {
      get: function() {
        return { open: devtoolsOpen };
      },
      set: function() {
        // Prevent setting
      },
      configurable: false
    });

    // ========== 12. CHẶN COPY/PASTE (Tùy chọn) ==========
    // Uncomment nếu muốn chặn
    // document.addEventListener('copy', function(e) {
    //   e.preventDefault();
    //   return false;
    // }, true);
    // document.addEventListener('cut', function(e) {
    //   e.preventDefault();
    //   return false;
    // }, true);

    // ========== 13. CHẠY CÁC DETECTION ==========
    // Window size check (mỗi 500ms)
    setInterval(checkWindowSize, 500);

    // Console detection (mỗi 2 giây)
    setInterval(function() {
      if (!devtoolsOpen) {
        detectConsole();
        detectDevTools();
      }
    }, 2000);

    // Inspector detection
    detectInspector();

    // Initial console detection
    setTimeout(function() {
      detectConsole();
      detectDevTools();
    }, 1000);

    // ========== 14. BLUR/FOCUS DETECTION ==========
    let isBlurred = false;
    window.addEventListener('blur', function() {
      isBlurred = true;
    });
    
    window.addEventListener('focus', function() {
      if (isBlurred) {
        // Check if DevTools was opened while blurred
        setTimeout(function() {
          checkWindowSize();
          detectConsole();
          detectDevTools();
        }, 100);
      }
      isBlurred = false;
    });
  }

  // ========== INITIALIZE ==========
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initProtection);
  } else {
    initProtection();
  }

})();
