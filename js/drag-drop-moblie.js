import { data, currentWeek, render } from './script.js';

// --- BẮT ĐẦU: MÃ KÉO THẢ CHO THIẾT BỊ DI ĐỘNG ---

let draggedElement = null; // Phần tử đang được kéo
let dropTargetElement = null; // Phần tử đích để thả
let dragSrc = null; // Vị trí nguồn của phần tử đang kéo

// Hàm gắn các sự kiện cảm ứng vào các ô công việc
export function addTouchListeners() {
  const tasks = document.querySelectorAll('.task');
  tasks.forEach(task => {
    task.addEventListener('touchstart', handleTouchStart, { passive: false });
    task.addEventListener('touchmove', handleTouchMove, { passive: false });
    task.addEventListener('touchend', handleTouchEnd);
  });
}

// Xử lý khi bắt đầu chạm vào một công việc
function handleTouchStart(e) {
  // Ngăn hành vi mặc định (như cuộn trang) khi bắt đầu kéo
  e.preventDefault();
  
  draggedElement = e.target.closest('.task');
  if (!draggedElement) return;

  // Lấy vị trí dòng và cột từ thuộc tính data-*
  const row = parseInt(draggedElement.dataset.row);
  const col = parseInt(draggedElement.dataset.col);

  // Lưu lại vị trí nguồn, tương tự hàm drag()
  dragSrc = { row, col };
  
  // Thêm class để tạo hiệu ứng đang kéo
  draggedElement.classList.add('dragging');
}

// Xử lý khi di chuyển ngón tay trên màn hình
function handleTouchMove(e) {
  if (!draggedElement) return;
  // Ngăn cuộn trang
  e.preventDefault();

  // Lấy tọa độ của điểm chạm
  const touch = e.touches[0];
  // Tìm phần tử nằm dưới điểm chạm
  const elementUnderTouch = document.elementFromPoint(touch.clientX, touch.clientY);
  
  if (!elementUnderTouch) return;

  const newDropTarget = elementUnderTouch.closest('.task, .empty');

  // Xóa hiệu ứng hover khỏi ô đích cũ
  if (dropTargetElement && dropTargetElement !== newDropTarget) {
    dropTargetElement.classList.remove('drop-hover');
  }

  // Nếu tìm thấy ô đích mới, thêm hiệu ứng hover
  if (newDropTarget) {
    newDropTarget.classList.add('drop-hover');
    dropTargetElement = newDropTarget;
  }
}

// Xử lý khi kết thúc chạm (nhấc ngón tay)
function handleTouchEnd(e) {
  if (!draggedElement) return;

  // Xóa class hiệu ứng khỏi phần tử đã kéo
  draggedElement.classList.remove('dragging');

  // Nếu có ô đích và ô đích khác ô nguồn
  if (dropTargetElement) {
    dropTargetElement.classList.remove('drop-hover');

    const destRow = parseInt(dropTargetElement.dataset.row);
    const destCol = parseInt(dropTargetElement.dataset.col);

    if (dragSrc && (dragSrc.row !== destRow || dragSrc.col !== destCol)) {
        // Hoán đổi dữ liệu (logic tương tự hàm drop())
        const temp = data[currentWeek][destRow][destCol];
        data[currentWeek][destRow][destCol] = data[currentWeek][dragSrc.row][dragSrc.col];
        data[currentWeek][dragSrc.row][dragSrc.col] = temp;
        
        localStorage.setItem("todoData", JSON.stringify(data));
        render(); // Vẽ lại giao diện
    }
  }

  // Reset các biến
  draggedElement = null;
  dragSrc = null;
  dropTargetElement = null;
}

// --- KẾT THÚC: MÃ KÉO THẢ CHO THIẾT BỊ DI ĐỘNG ---