import { data, currentWeek, render } from './script.js';
// --- BẮT ĐẦU: MÃ KÉO THẢ CHO DI ĐỘNG ---

let pressTimer = null;      // Biến để lưu bộ đếm thời gian cho việc nhấn giữ
let draggedElement = null;    // Phần tử đang được kéo
let dropTargetElement = null; // Phần tử đích để thả
let dragSrc = null;

// Hàm gắn các sự kiện cảm ứng vào các ô công việc
export function addTouchListeners() {
  const tasks = document.querySelectorAll('.task');
  tasks.forEach(task => {
    task.addEventListener('touchstart', handleTouchStart, { passive: true }); // passive: true để cuộn mượt hơn
    task.addEventListener('touchmove', handleTouchMove, { passive: false });
    task.addEventListener('touchend', handleTouchEnd);
    task.addEventListener('touchcancel', handleTouchCancel);
  });
}

// Xử lý khi bắt đầu chạm vào một công việc
function handleTouchStart(e) {
  const target = e.target;

  // Nếu người dùng chạm vào một nút, không làm gì cả
  if (target.tagName === 'BUTTON' || target.closest('.actions')) {
    return;
  }
  
  const taskElement = target.closest('.task');
  if (!taskElement) return;

  // Bắt đầu một bộ đếm thời gian. Nếu giữ đủ lâu, nó sẽ kích hoạt chế độ kéo.
  pressTimer = setTimeout(() => {
    // Kích hoạt chế độ kéo
    draggedElement = taskElement;
    const row = parseInt(draggedElement.dataset.row);
    const col = parseInt(draggedElement.dataset.col);
    dragSrc = { row, col };
    draggedElement.classList.add('dragging');

    // Rung nhẹ để báo hiệu cho người dùng (hoạt động trên các thiết bị hỗ trợ)
    if (navigator.vibrate) {
        navigator.vibrate(50);
    }
    
    pressTimer = null; // Xóa timer sau khi đã kích hoạt
  }, 1000); // Giữ trong 1000ms (1 giây) để kéo. Bạn có thể thay đổi thời gian này.
}

// Xử lý khi di chuyển ngón tay trên màn hình
function handleTouchMove(e) {
  // Nếu người dùng di chuyển ngón tay, hủy bộ đếm thời gian (đây là hành vi cuộn, không phải nhấn giữ)
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
  }

  // Nếu chưa ở trong chế độ kéo, không làm gì cả
  if (!draggedElement) return;
  
  // Ngăn cuộn trang khi đang kéo một mục
  e.preventDefault();

  const touch = e.touches[0];
  const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
  
  if (!elementUnderTouch) return;

  const newDropTarget = elementUnderTouch.closest('.task, .empty');

  if (dropTargetElement && dropTargetElement !== newDropTarget) {
    dropTargetElement.classList.remove('drop-hover');
  }

  if (newDropTarget) {
    newDropTarget.classList.add('drop-hover');
    dropTargetElement = newDropTarget;
  }
}

// Xử lý khi kết thúc chạm (nhấc ngón tay)
function handleTouchEnd(e) {
  // Nếu `pressTimer` vẫn còn, có nghĩa là người dùng đã nhấc ngón tay ra trước 1 giây.
  // Đây là một cú "chạm" (tap).
  if (pressTimer) {
    clearTimeout(pressTimer);
    pressTimer = null;
    
    // Gọi hàm chỉnh sửa công việc
    const taskElement = e.target.closest('.task');
    if (taskElement) {
        const row = parseInt(taskElement.dataset.row);
        const col = parseInt(taskElement.dataset.col);
        editTask(row, col); // Dùng lại hàm editTask đã có
    }
    return;
  }

  // Nếu không phải là một cú chạm, thì đây là lúc thả một mục đã được kéo.
  if (!draggedElement) return;

  draggedElement.classList.remove('dragging');

  if (dropTargetElement) {
    dropTargetElement.classList.remove('drop-hover');

    const destRow = parseInt(dropTargetElement.dataset.row);
    const destCol = parseInt(dropTargetElement.dataset.col);

    if (dragSrc && (dragSrc.row !== destRow || dragSrc.col !== destCol)) {
        const temp = data[currentWeek][destRow][destCol];
        data[currentWeek][destRow][destCol] = data[currentWeek][dragSrc.row][dragSrc.col];
        data[currentWeek][dragSrc.row][dragSrc.col] = temp;
        
        localStorage.setItem("todoData", JSON.stringify(data));
        render();
    }
  }
  
  // Dọn dẹp
  handleTouchCancel();
}

// Hàm dọn dẹp khi cử chỉ bị hủy
function handleTouchCancel() {
    if (pressTimer) {
        clearTimeout(pressTimer);
        pressTimer = null;
    }
    if (draggedElement) {
        draggedElement.classList.remove('dragging');
    }
    if (dropTargetElement) {
        dropTargetElement.classList.remove('drop-hover');
    }
    draggedElement = null;
    dragSrc = null;
    dropTargetElement = null;
}

// --- KẾT THÚC: MÃ KÉO THẢ CHO DI ĐỘNG (PHIÊN BẢN NÂNG CẤP) ---