const maxTasksPerDay = 5;

let data = {};
let currentWeek = "";

function formatDate(date) {
  return date.toISOString().split("T")[0];
}

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  date.setDate(date.getDate() + diff);
  return formatDate(date);
}

function getDatesOfWeek(mondayStr) {
  const start = new Date(mondayStr);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return formatDate(d);
  });
}

function renderWeekSelector() {
  const select = document.getElementById("weekSelect");
  select.innerHTML = "";
  
  // Lấy ngày hiện tại
  const today = new Date();
  const currentMonday = getMonday(today);
  
  // Tạo danh sách 3 tuần từ tuần hiện tại
  const weeksList = [];
  for(let i = 0; i < 3; i++) {
    const weekDate = new Date(currentMonday);
    weekDate.setDate(weekDate.getDate() + (i * 7));
    const weekStr = formatDate(weekDate);
    weeksList.push(weekStr);
    
    // Tạo tuần mới nếu chưa tồn tại
    if(!data[weekStr]) {
      data[weekStr] = Array.from({ length: maxTasksPerDay }, () => Array(7).fill(null));
    }
  }

  // Hiển thị các tuần
  weeksList.forEach(week => {
    const option = document.createElement("option");
    option.value = week;
    const weekEnd = new Date(week);
    weekEnd.setDate(weekEnd.getDate() + 6);
    option.text = `Tuần ${formatDate(new Date(week))} đến ${formatDate(weekEnd)}`;
    select.appendChild(option);
  });

  // Chọn tuần hiện tại
  select.value = currentMonday;
  localStorage.setItem("todoData", JSON.stringify(data));
}

function render() {
  const container = document.getElementById("timetable");
  container.innerHTML = "";
  const start = currentWeek;
  if (!start) return;

  const weekDates = getDatesOfWeek(start);
  const headerDays = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"];

  container.innerHTML += `<div class="header">Thứ tự</div>`;
  headerDays.forEach(d => container.innerHTML += `<div class="header">${d}</div>`);
  container.innerHTML += `<div class="date-row">Ngày</div>`;
  weekDates.forEach(d => container.innerHTML += `<div class="date-row">${d}</div>`);

  const weekData = data[start] || Array.from({ length: maxTasksPerDay }, () => Array(7).fill(null));

  weekData.forEach((row, i) => {
    container.innerHTML += `<div class="header">${i + 1}</div>`;
    row.forEach((cell, j) => {
      if (cell) {
        container.innerHTML += `
        <div class="task ${cell.done ? 'completed' : ''}" draggable="true"
          ondragstart="drag(event, ${i}, ${j})" ondrop="drop(event, ${i}, ${j})" ondragover="allowDrop(event)">
          <span ondblclick="editTask(${i}, ${j})">${cell.text}</span>
          <div class="actions">
            <button onclick="toggleDone(${i}, ${j})">✅</button>
            <button onclick="confirmDelete(${i}, ${j})">❌</button>
          </div>
        </div>`;
      } else {
        container.innerHTML += `<div class="empty" ondrop="drop(event, ${i}, ${j})" ondragover="allowDrop(event)"></div>`;
      }
    });
  });
}

function addTask() {
  const task = document.getElementById("taskInput").value.trim();
  const day = parseInt(document.getElementById("daySelect").value);
  const start = currentWeek;
  if (!task || !start) return alert("Nhập nội dung và chọn ngày!");

  if (!data[start]) {
    data[start] = Array.from({ length: maxTasksPerDay }, () => Array(7).fill(null));
    renderWeekSelector();
  }

  const week = data[start];
  let added = false;
  for (let i = 0; i < maxTasksPerDay; i++) {
    if (!week[i][day]) {
      week[i][day] = { text: task, done: false };
      added = true;
      break;
    }
  }

  if (!added) alert("Hết chỗ trống cho ngày này.");
  else {
    localStorage.setItem("todoData", JSON.stringify(data));
    document.getElementById("taskInput").value = "";
    render();
  }
}

function editTask(row, col) {
  const newText = prompt("Chỉnh sửa nội dung:", data[currentWeek][row][col].text);
  if (newText !== null) {
    data[currentWeek][row][col].text = newText.trim();
    localStorage.setItem("todoData", JSON.stringify(data));
    render();
  }
}

function toggleDone(row, col) {
  data[currentWeek][row][col].done = !data[currentWeek][row][col].done;
  localStorage.setItem("todoData", JSON.stringify(data));
  render();
}

function confirmDelete(row, col) {
  showModal("Bạn có chắc muốn xoá?", (ok) => {
    if (ok) {
      data[currentWeek][row][col] = null;
      localStorage.setItem("todoData", JSON.stringify(data));
      render();
    }
  });
}

let dragSrc = null;
function drag(ev, row, col) {
  dragSrc = { row, col };
}
function allowDrop(ev) {
  ev.preventDefault();
}
function drop(ev, row, col) {
  if (!dragSrc) return;
  const temp = data[currentWeek][row][col];
  data[currentWeek][row][col] = data[currentWeek][dragSrc.row][dragSrc.col];
  data[currentWeek][dragSrc.row][dragSrc.col] = temp;
  dragSrc = null;
  localStorage.setItem("todoData", JSON.stringify(data));
  render();
}

function showModal(message, callback) {
  document.getElementById("modalText").innerText = message;
  document.getElementById("overlay").style.display = "block";
  const modal = document.getElementById("modal");
  modal.style.display = "block";
  if (window.innerWidth <= 600) {
    modal.style.top = "60%";
  } else {
    modal.style.top = "40%";
  }
  window.modalCallback = callback;
}

function confirmModal(choice) {
  document.getElementById("overlay").style.display = "none";
  document.getElementById("modal").style.display = "none";
  if (window.modalCallback) window.modalCallback(choice);
}

document.getElementById("weekSelect").addEventListener("change", (e) => {
  currentWeek = e.target.value;
  render();
});

window.onload = function () {
  const saved = localStorage.getItem("todoData");
  if (saved) data = JSON.parse(saved);

  const today = new Date();
  const monday = getMonday(today);

  if (!data[monday]) {
    data[monday] = Array.from({ length: maxTasksPerDay }, () => Array(7).fill(null));
  }

  currentWeek = monday;
  renderWeekSelector();
  render();
};

// Thêm hàm này sau các hàm hiện có
function getNextWeek(currentMondayStr) {
  const currentMonday = new Date(currentMondayStr);
  const nextMonday = new Date(currentMonday);
  nextMonday.setDate(currentMonday.getDate() + 7);
  return formatDate(nextMonday);
}

function addNextWeek() {
  const nextMonday = getNextWeek(currentWeek);
  if (!data[nextMonday]) {
    data[nextMonday] = Array.from({ length: maxTasksPerDay }, () => Array(7).fill(null));
    localStorage.setItem("todoData", JSON.stringify(data));
    renderWeekSelector();
    currentWeek = nextMonday;
    render();
  } else {
    alert("Tuần kế tiếp đã tồn tại!");
  }
}
