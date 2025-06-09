// Định nghĩa số lượng tối đa công việc mỗi ngày (5 công việc/ngày)
const maxTasksPerDay = 5;

// Khởi tạo đối tượng data để lưu trữ dữ liệu công việc theo tuần
let data = {};

// Biến lưu tuần hiện tại đang được chọn
let currentWeek = "";

// Hàm định dạng ngày thành chuỗi theo chuẩn ISO (YYYY-MM-DD)
function formatDate(date) {
  return date.toISOString().split("T")[0]; // Lấy phần ngày từ chuỗi ISO
}

// Hàm lấy ngày thứ Hai của tuần chứa ngày được truyền vào
function getMonday(d) {
  const date = new Date(d); // Tạo đối tượng Date từ ngày truyền vào
  const day = date.getDay(); // Lấy thứ trong tuần (0 = Chủ Nhật, 1 = Thứ Hai, ...)
  const diff = day === 0 ? -6 : 1 - day; // Tính số ngày cần điều chỉnh để đến thứ Hai
  date.setDate(date.getDate() + diff); // Điều chỉnh ngày về thứ Hai
  return formatDate(date); // Trả về ngày thứ Hai định dạng YYYY-MM-DD
}

// Hàm tạo mảng chứa các ngày trong tuần từ thứ Hai được truyền vào
function getDatesOfWeek(mondayStr) {
  const start = new Date(mondayStr); // Tạo đối tượng Date từ chuỗi ngày thứ Hai
  return Array.from({ length: 7 }, (_, i) => { // Tạo mảng 7 ngày
    const d = new Date(start); // Tạo bản sao ngày bắt đầu
    d.setDate(start.getDate() + i); // Tăng ngày theo thứ tự (0 đến 6)
    return formatDate(d); // Trả về ngày định dạng YYYY-MM-DD
  });
}

// Hàm hiển thị danh sách tuần trong phần tử select
function renderWeekSelector() {
  const select = document.getElementById("weekSelect"); // Lấy phần tử select
  select.innerHTML = ""; // Xóa nội dung cũ của select

  // Lấy ngày hiện tại và tìm thứ Hai của tuần hiện tại
  const today = new Date();
  const currentMonday = getMonday(today);

  // Tạo danh sách 3 tuần từ tuần hiện tại
  const weeksList = [];
  for (let i = 0; i < 3; i++) {
    const weekDate = new Date(currentMonday); // Tạo bản sao ngày thứ Hai
    weekDate.setDate(weekDate.getDate() + (i * 7)); // Tăng 7 ngày để lấy tuần tiếp theo
    const weekStr = formatDate(weekDate); // Định dạng ngày
    weeksList.push(weekStr); // Thêm vào danh sách tuần

    // Khởi tạo dữ liệu tuần mới nếu chưa tồn tại
    if (!data[weekStr]) {
      data[weekStr] = Array.from({ length: maxTasksPerDay }, () => Array(7).fill(null)); // Tạo mảng 5x7 với giá trị null
    }
  }

  // Hiển thị các tuần trong phần tử select
  weeksList.forEach(week => {
    const option = document.createElement("option"); // Tạo phần tử option
    option.value = week; // Gán giá trị là ngày thứ Hai
    const weekEnd = new Date(week); // Tạo ngày kết thúc tuần
    weekEnd.setDate(weekEnd.getDate() + 6); // Tăng 6 ngày để lấy Chủ Nhật
    option.text = `Tuần ${formatDate(new Date(week))} đến ${formatDate(weekEnd)}`; // Hiển thị khoảng thời gian tuần
    select.appendChild(option); // Thêm option vào select
  });

  // Chọn tuần hiện tại làm mặc định
  select.value = currentMonday;
  localStorage.setItem("todoData", JSON.stringify(data)); // Lưu dữ liệu vào localStorage
}

// Hàm hiển thị bảng thời gian công việc
function render() {
  const container = document.getElementById("timetable"); // Lấy phần tử container
  container.innerHTML = ""; // Xóa nội dung cũ
  const start = currentWeek; // Lấy tuần hiện tại
  if (!start) return; // Nếu không có tuần, thoát hàm

  const weekDates = getDatesOfWeek(start); // Lấy danh sách ngày trong tuần
  const headerDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"]; // Tiêu đề các ngày

  // Thêm tiêu đề cột
  container.innerHTML += `<div class="header">Thứ tự</div>`;
  headerDays.forEach(d => container.innerHTML += `<div class="header">${d}</div>`);
  // Thêm hàng chứa ngày
  container.innerHTML += `<div class="date-row">Ngày</div>`;
  weekDates.forEach(d => container.innerHTML += `<div class="date-row">${d}</div>`);

  // Lấy dữ liệu tuần hiện tại, nếu không có thì khởi tạo mảng rỗng
  const weekData = data[start] || Array.from({ length: maxTasksPerDay }, () => Array(7).fill(null));

  // Hiển thị từng hàng công việc
  weekData.forEach((row, i) => {
    container.innerHTML += `<div class="header">${i + 1}</div>`; // Thêm số thứ tự hàng
    row.forEach((cell, j) => {
      if (cell) { // Nếu ô có công việc
        container.innerHTML += `
        <div class="task ${cell.done ? 'completed' : ''}" draggable="true"
          ondragstart="drag(event, ${i}, ${j})" ondrop="drop(event, ${i}, ${j})" ondragover="allowDrop(event)">
          <span ondblclick="editTask(${i}, ${j})">${cell.text}</span>
          <div class="actions">
            <button onclick="toggleDone(${i}, ${j})">✅</button>
            <button onclick="confirmDelete(${i}, ${j})">❌</button>
          </div>
        </div>`;
      } else { // Nếu ô trống
        container.innerHTML += `<div class="empty" ondrop="drop(event, ${i}, ${j})" ondragover="allowDrop(event)"></div>`;
      }
    });
  });
}

// Hàm thêm công việc mới
function addTask() {
  const task = document.getElementById("taskInput").value.trim(); // Lấy nội dung công việc
  const day = parseInt(document.getElementById("daySelect").value); // Lấy ngày được chọn
  const start = currentWeek; // Lấy tuần hiện tại
  if (!task || !start) return alert("Nhập nội dung và chọn ngày!"); // Kiểm tra đầu vào

  // Khởi tạo dữ liệu tuần nếu chưa tồn tại
  if (!data[start]) {
    data[start] = Array.from({ length: maxTasksPerDay }, () => Array(7).fill(null));
    renderWeekSelector();
  }

  const week = data[start]; // Lấy dữ liệu tuần
  let added = false; // Biến kiểm tra việc thêm công việc
  for (let i = 0; i < maxTasksPerDay; i++) {
    if (!week[i][day]) { // Tìm ô trống trong ngày được chọn
      week[i][day] = { text: task, done: false }; // Thêm công việc mới
      added = true;
      break;
    }
  }

  if (!added) alert("Hết chỗ trống cho ngày này."); // Thông báo nếu không còn chỗ
  else {
    localStorage.setItem("todoData", JSON.stringify(data)); // Lưu dữ liệu
    document.getElementById("taskInput").value = ""; // Xóa input
    render(); // Cập nhật giao diện
  }
}

// Hàm chỉnh sửa nội dung công việc
function editTask(row, col) {
  const newText = prompt("Chỉnh sửa nội dung:", data[currentWeek][row][col].text); // Hiển thị hộp thoại chỉnh sửa
  if (newText !== null) { // Nếu người dùng không hủy
    data[currentWeek][row][col].text = newText.trim(); // Cập nhật nội dung
    localStorage.setItem("todoData", JSON.stringify(data)); // Lưu dữ liệu
    render(); // Cập nhật giao diện
  }
}

// Hàm đánh dấu hoàn thành/chưa hoàn thành công việc
function toggleDone(row, col) {
  data[currentWeek][row][col].done = !data[currentWeek][row][col].done; // Đảo trạng thái
  localStorage.setItem("todoData", JSON.stringify(data)); // Lưu dữ liệu
  render(); // Cập nhật giao diện
}

// Hàm xác nhận xóa công việc
function confirmDelete(row, col) {
  showModal("Bạn có chắc muốn xoá?", (ok) => { // Hiển thị modal xác nhận
    if (ok) { // Nếu người dùng xác nhận
      data[currentWeek][row][col] = null; // Xóa công việc
      localStorage.setItem("todoData", JSON.stringify(data)); // Lưu dữ liệu
      render(); // Cập nhật giao diện
    }
  });
}

// Biến lưu thông tin ô đang được kéo
let dragSrc = null;

// Hàm bắt đầu kéo công việc
function drag(ev, row, col) {
  dragSrc = { row, col }; // Lưu vị trí ô được kéo
}

// Hàm cho phép thả công việc vào ô
function allowDrop(ev) {
  ev.preventDefault(); // Ngăn hành vi mặc định để cho phép thả
}

// Hàm xử lý khi thả công việc vào ô mới
function drop(ev, row, col) {
  if (!dragSrc) return; // Nếu không có ô nguồn, thoát hàm
  // Hoán đổi dữ liệu giữa ô nguồn và ô đích
  const temp = data[currentWeek][row][col];
  data[currentWeek][row][col] = data[currentWeek][dragSrc.row][dragSrc.col];
  data[currentWeek][dragSrc.row][dragSrc.col] = temp;
  dragSrc = null; // Xóa thông tin ô nguồn
  localStorage.setItem("todoData", JSON.stringify(data)); // Lưu dữ liệu
  render(); // Cập nhật giao diện
}

// Hàm hiển thị modal xác nhận
function showModal(message, callback) {
  document.getElementById("modalText").innerText = message; // Hiển thị thông điệp
  document.getElementById("overlay").style.display = "block"; // Hiển thị lớp phủ
  const modal = document.getElementById("modal");
  modal.style.display = "block"; // Hiển thị modal
  // Điều chỉnh vị trí modal dựa trên kích thước màn hình
  if (window.innerWidth <= 600) {
    modal.style.top = "60%"; // Di động
  } else {
    modal.style.top = "40%"; // Máy tính
  }
  window.modalCallback = callback; // Lưu hàm callback
}

// Hàm xử lý khi người dùng chọn trong modal
function confirmModal(choice) {
  document.getElementById("overlay").style.display = "none"; // Ẩn lớp phủ
  document.getElementById("modal").style.display = "none"; // Ẩn modal
  if (window.modalCallback) window.modalCallback(choice); // Gọi hàm callback
}

// Sự kiện khi thay đổi tuần trong select
document.getElementById("weekSelect").addEventListener("change", (e) => {
  currentWeek = e.target.value; // Cập nhật tuần hiện tại
  render(); // Cập nhật giao diện
});

// Hàm khởi tạo khi tải trang
window.onload = function () {
  const saved = localStorage.getItem("todoData"); // Lấy dữ liệu từ localStorage
  if (saved) data = JSON.parse(saved); // Khôi phục dữ liệu

  const today = new Date(); // Lấy ngày hiện tại
  const monday = getMonday(today); // Lấy thứ Hai của tuần hiện tại

  // Khởi tạo dữ liệu tuần hiện tại nếu chưa tồn tại
  if (!data[monday]) {
    data[monday] = Array.from({ length: maxTasksPerDay }, () => Array(7).fill(null));
  }

  currentWeek = monday; // Đặt tuần hiện tại
  renderWeekSelector(); // Hiển thị danh sách tuần
  render(); // Hiển thị bảng công việc
};

// Hàm lấy ngày thứ Hai của tuần tiếp theo
function getNextWeek(currentMondayStr) {
  const currentMonday = new Date(currentMondayStr); // Tạo đối tượng Date từ chuỗi
  const nextMonday = new Date(currentMonday); // Tạo bản sao
  nextMonday.setDate(currentMonday.getDate() + 7); // Tăng 7 ngày
  return formatDate(nextMonday); // Trả về ngày định dạng YYYY-MM-DD
}

// Hàm thêm tuần mới
function addNextWeek() {
  const nextMonday = getNextWeek(currentWeek); // Lấy thứ Hai của tuần tiếp theo
  if (!data[nextMonday]) { // Nếu tuần chưa tồn tại
    data[nextMonday] = Array.from({ length: maxTasksPerDay }, () => Array(7).fill(null)); // Khởi tạo dữ liệu tuần
    localStorage.setItem("todoData", JSON.stringify(data)); // Lưu dữ liệu
    renderWeekSelector(); // Cập nhật danh sách tuần
    currentWeek = nextMonday; // Chuyển sang tuần mới
    render(); // Cập nhật giao diện
  } else {
    alert("Tuần kế tiếp đã tồn tại!"); // Thông báo nếu tuần đã tồn tại
  }
}