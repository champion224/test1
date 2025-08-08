let data = [];

const form = document.getElementById("itemForm");
const calendar = document.getElementById("calendar");
const monthSelector = document.getElementById("monthSelector");
const submitBtn = document.getElementById("submitBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const editIndexInput = document.getElementById("editIndex");
const exportCsvBtn = document.getElementById("exportCsvBtn");
const detailModal = document.getElementById("detailModal");
const modalItemList = document.getElementById("modalItemList");
const closeModalBtn = document.getElementById("closeModal");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const item = {
    category: document.getElementById("category").value,
    name: document.getElementById("name").value.trim(),
    qty: Number(document.getElementById("qty").value),
    qtyUnit: document.getElementById("qtyUnit").value,
    expiry: document.getElementById("expiry").value,
    note: document.getElementById("note").value.trim(),
  };

  const editIndex = Number(editIndexInput.value);
  if (editIndex >= 0) {
    data[editIndex] = item;
  } else {
    data.push(item);
  }
  resetForm();
  saveData();
  renderCalendar();
  closeAllMenus();
});

cancelEditBtn.addEventListener("click", () => {
  resetForm();
  closeAllMenus();
});

function resetForm() {
  form.reset();
  editIndexInput.value = -1;
  submitBtn.textContent = "추가";
  cancelEditBtn.style.display = "none";
}

function saveData() {
  localStorage.setItem("expiryItems", JSON.stringify(data));
}

function loadData() {
  const saved = localStorage.getItem("expiryItems");
  if (saved) {
    data = JSON.parse(saved);
  }
}

function initMonthSelector() {
  const now = new Date();
  const currentMonth = now.getMonth();
  for (let i = 0; i < 12; i++) {
    const option = document.createElement("option");
    option.value = i;
    option.text = `${i + 1}월`;
    if (i === currentMonth) option.selected = true;
    monthSelector.appendChild(option);
  }
  monthSelector.addEventListener("change", () => {
    renderCalendar();
    closeAllMenus();
  });
}

const categoryColors = {
  카페: "#FFD700",
  주방: "#87CEEB",
  음료: "#98FB98",
  아이스크림: "#FFB6C1",
  아트: "#DDA0DD",
  스넥: "#FFA07A",
  운영물품: "#20B2AA",
  기타: "#D3D3D3",
};

const yearSelector = document.getElementById("yearSelector");

function initYearSelector() {
  const yearSelector = document.getElementById("yearSelector");
  yearSelector.innerHTML = ""; // 초기화

  for (let y = 2023; y <= 2040; y++) {
    const opt = document.createElement("option");
    opt.value = y;
    opt.textContent = `${y}년`;
    yearSelector.appendChild(opt);
  }

  // 현재 연도 선택 기본값 설정 (예: 2023)
  const nowYear = new Date().getFullYear();
  if (nowYear >= 2023 && nowYear <= 2040) {
    yearSelector.value = nowYear;
  } else {
    yearSelector.value = 2023;
  }

  yearSelector.addEventListener("change", () => {
    renderCalendar();
  });
}

// 고정 공휴일 (음력 제외)
const fixedHolidays = [
  "01-01", // 신정
  "03-01", // 삼일절
  "05-05", // 어린이날
  "06-06", // 현충일
  "08-15", // 광복절
  "10-03", // 개천절
  "10-09", // 한글날
  "12-25", // 성탄절
];

function renderCalendar() {
  calendar.innerHTML = "";

  const year = parseInt(document.getElementById("yearSelector").value, 10);
  const month = parseInt(monthSelector.value, 10);

  const firstDay = new Date(year, month, 1).getDay();
  const lastDate = new Date(year, month + 1, 0).getDate();

  // 전월 마지막 날짜
  const prevLastDate = new Date(year, month, 0).getDate();

  // --- ① 전월 날짜 채우기 ---
  for (let i = firstDay - 1; i >= 0; i--) {
    const d = prevLastDate - i;
    const prevDate = new Date(year, month - 1, d);
    calendar.appendChild(createDayCell(prevDate, true)); // isOtherMonth=true
  }

  // --- ② 이번 달 날짜 채우기 ---
  for (let d = 1; d <= lastDate; d++) {
    const thisDate = new Date(year, month, d);
    calendar.appendChild(createDayCell(thisDate, false));
  }

  // --- ③ 다음 달 날짜 채우기 ---
  const totalCells = firstDay + lastDate;
  const nextDays = (7 - (totalCells % 7)) % 7;
  for (let d = 1; d <= nextDays; d++) {
    const nextDate = new Date(year, month + 1, d);
    calendar.appendChild(createDayCell(nextDate, true)); // isOtherMonth=true
  }
}

// 날짜 셀 생성 함수
function createDayCell(dateObj, isOtherMonth) {
  // 오늘 날짜 구하기 (오늘은 한 번만 계산해도 되지만 간단히 여기서)
  const today = new Date();
  const isToday =
    dateObj.getFullYear() === today.getFullYear() &&
    dateObj.getMonth() === today.getMonth() &&
    dateObj.getDate() === today.getDate();

  const year = dateObj.getFullYear();
  const month = dateObj.getMonth();
  const day = dateObj.getDate();

  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const mmdd = `${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const weekDay = dateObj.getDay();

  const dayEl = document.createElement("div");
  dayEl.className = "day";
  if (isOtherMonth) {
    dayEl.classList.add("other-month");
  }

  // 오늘 날짜면 'today' 클래스 추가
  if (isToday) {
    dayEl.classList.add("today");
  }

  const strongEl = document.createElement("strong");
  strongEl.textContent = day;
  if (weekDay === 0 || fixedHolidays.includes(mmdd)) {
    strongEl.style.color = "red";
  } else if (weekDay === 6) {
    strongEl.style.color = "blue";
  }
  dayEl.appendChild(strongEl);

  // 데이터 매칭
  const matched = data
    .map((item, idx) => ({ ...item, idx }))
    .filter((item) => item.expiry === dateStr);

  matched.forEach((item) => {
    const tag = document.createElement("div");
    tag.className = "expiry";
    if (isDueSoon(item.expiry)) {
      tag.classList.add("due-soon");
    } else {
      const bgColor = categoryColors[item.category] || "#D3D3D3";
      tag.style.backgroundColor = bgColor;
      tag.style.color = "#333";
    }

    const nameSpan = document.createElement("span");
    nameSpan.className = "name-text";
    nameSpan.textContent = item.name;

    const menuBtn = document.createElement("button");
    menuBtn.className = "menu-btn";
    menuBtn.textContent = "⋯";
    menuBtn.title = "메뉴 열기";

    tag.appendChild(nameSpan);
    tag.appendChild(menuBtn);

    let menuPopup = null;
    function createMenu() {
      const menu = document.createElement("div");
      menu.className = "menu-popup";

      const btnEdit = document.createElement("button");
      btnEdit.textContent = "수정";
      btnEdit.addEventListener("click", (e) => {
        e.stopPropagation();
        startEdit(item.idx);
        closeAllMenus();
      });

      const btnDel = document.createElement("button");
      btnDel.textContent = "삭제";
      btnDel.addEventListener("click", (e) => {
        e.stopPropagation();
        if (confirm("정말 삭제할까요?")) {
          data.splice(item.idx, 1);
          saveData();
          renderCalendar();
          if (editIndexInput.value == item.idx) resetForm();
          closeAllMenus();
        }
      });

      menu.appendChild(btnEdit);
      menu.appendChild(btnDel);
      return menu;
    }

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();

      if (menuPopup) {
        menuPopup.remove();
        menuPopup = null;
        return;
      }

      closeAllMenus();
      menuPopup = createMenu();
      document.body.appendChild(menuPopup);

      const rect = menuBtn.getBoundingClientRect();
      menuPopup.style.top = `${rect.top + window.scrollY}px`;
      menuPopup.style.left = `${rect.right + 4 + window.scrollX}px`;
    });

    dayEl.appendChild(tag);
  });

  // 전체보기 버튼
  const showAllBtn = document.createElement("button");
  showAllBtn.textContent = "📋";
  showAllBtn.title = "전체보기";
  showAllBtn.style.position = "absolute";
  showAllBtn.style.top = "5px";
  showAllBtn.style.right = "-4px";
  showAllBtn.style.fontSize = "16px";
  showAllBtn.style.padding = "2px 6px";
  showAllBtn.style.cursor = "pointer";
  showAllBtn.style.border = "none";
  showAllBtn.style.background = "transparent";
  showAllBtn.style.userSelect = "none";
  showAllBtn.style.lineHeight = "1";
  showAllBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    openDetailModal(dateStr);
  });

  dayEl.style.position = "relative";
  dayEl.appendChild(showAllBtn);

  return dayEl;
}

function closeAllMenus() {
  document.querySelectorAll(".menu-popup").forEach((menu) => menu.remove());
}

document.addEventListener("click", () => {
  closeAllMenus();
});

function startEdit(idx) {
  const item = data[idx];
  document.getElementById("category").value = item.category;
  document.getElementById("name").value = item.name;
  document.getElementById("qty").value = item.qty;
  document.getElementById("qtyUnit").value = item.qtyUnit || "";
  document.getElementById("expiry").value = item.expiry;
  document.getElementById("note").value = item.note;
  editIndexInput.value = idx;
  submitBtn.textContent = "수정";
  cancelEditBtn.style.display = "inline-block";
}

function isDueSoon(dateStr) {
  const today = new Date();
  const target = new Date(dateStr);
  const diffTime = target - today;
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays >= 0 && diffDays <= 3;
}

exportCsvBtn.addEventListener("click", () => {
  if (data.length === 0) {
    alert("저장된 데이터가 없습니다.");
    return;
  }

  const startDateStr = document.getElementById("exportStartDate").value;
  const endDateStr = document.getElementById("exportEndDate").value;

  if (!startDateStr || !endDateStr) {
    alert("기간을 모두 선택해주세요.");
    return;
  }

  const startDate = new Date(startDateStr);
  const endDate = new Date(endDateStr);

  if (startDate > endDate) {
    alert("시작일이 종료일보다 늦을 수 없습니다.");
    return;
  }

  // 기간 내 아이템만 필터링
  const filteredData = data.filter((item) => {
    const itemDate = new Date(item.expiry);
    return itemDate >= startDate && itemDate <= endDate;
  });

  if (filteredData.length === 0) {
    alert("선택한 기간에 해당하는 데이터가 없습니다.");
    return;
  }

  const BOM = "\uFEFF"; // 한글 깨짐 방지용 BOM
  const header = ["분류", "상품명", "수량", "단위", "유통기한", "비고"];
  const csvRows = [header.join(",")];

  filteredData.forEach((item) => {
    const row = [
      `"${item.category.replace(/"/g, '""')}"`,
      `"${item.name.replace(/"/g, '""')}"`,
      item.qty,
      `"${item.qtyUnit.replace(/"/g, '""')}"`,
      item.expiry,
      `"${item.note.replace(/"/g, '""')}"`,
    ];
    csvRows.push(row.join(","));
  });

  const csvString = BOM + csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  // 날짜 포맷 YYYY-MM-DD → YYYY.MM.DD 변환 함수
  function formatDate(dateStr) {
    const parts = dateStr.split("-");
    return `${parts[0]}.${parts[1]}.${parts[2]}`;
  }

  const formattedStart = formatDate(startDateStr);
  const formattedEnd = formatDate(endDateStr);

  const filename = `챔피언_유통기한 ${formattedStart}~${formattedEnd}.csv`;

  const a = document.createElement("a");
  a.href = url;
  a.download = filename; // 여기 파일명 변경
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

function openDetailModal(dateStr) {
  modalItemList.innerHTML = "";
  const itemsForDate = data.filter((item) => item.expiry === dateStr);

  if (itemsForDate.length === 0) {
    modalItemList.innerHTML = "<li>해당 날짜에 상품이 없습니다.</li>";
    detailModal.style.display = "flex";
    return;
  }

  const grouped = itemsForDate.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {});

  for (const category in grouped) {
    const categoryTitle = document.createElement("li");
    categoryTitle.textContent = `\u2022 ${category}`;
    categoryTitle.style.fontWeight = "bold";
    categoryTitle.style.marginTop = "10px";
    categoryTitle.style.listStyleType = "none";
    modalItemList.appendChild(categoryTitle);

    grouped[category].forEach((item) => {
      const li = document.createElement("li");
      li.textContent =
        `${item.name} (${item.qty}${item.qtyUnit}) ${item.expiry} ${item.note}`.trim();
      li.style.listStyleType = "none";
      li.style.marginLeft = "16px";
      modalItemList.appendChild(li);
    });
  }

  detailModal.style.display = "flex";
}

closeModalBtn.addEventListener("click", () => {
  detailModal.style.display = "none";
});

detailModal.addEventListener("click", (e) => {
  if (e.target === detailModal) {
    detailModal.style.display = "none";
  }
});

loadData();
initYearSelector();
initMonthSelector();
renderCalendar();

const csvFileInput = document.getElementById("csvFileInput");
const fileNameDisplay = document.getElementById("fileNameDisplay");

csvFileInput.addEventListener("change", () => {
  if (csvFileInput.files.length > 0) {
    fileNameDisplay.textContent = csvFileInput.files[0].name;
    fileNameDisplay.style.color = "#333";
  } else {
    fileNameDisplay.textContent = "선택된 파일 없음";
    fileNameDisplay.style.color = "#666";
  }
});

const uploadCsvBtn = document.getElementById("uploadCsvBtn");

uploadCsvBtn.addEventListener("click", () => {
  const file = csvFileInput.files[0];
  if (!file) {
    alert("CSV 파일을 선택해 주세요.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const text = e.target.result;
    parseAndAddCsv(text);
  };
  reader.readAsText(file, "utf-8");
});

const allowedUnits = ["EA", "CT"];

function parseAndAddCsv(csvText) {
  const lines = csvText.trim().split("\n");

  if (lines.length < 2) {
    alert("CSV에 데이터가 없습니다.");
    return;
  }

  const header = lines[0].split(",").map((h) => h.trim());
  const requiredFields = ["분류", "상품명", "수량", "단위", "유통기한", "비고"];
  for (const field of requiredFields) {
    if (!header.includes(field)) {
      alert(`CSV에 필수 헤더 '${field}' 가 없습니다.`);
      return;
    }
  }

  const idxCategory = header.indexOf("분류");
  const idxName = header.indexOf("상품명");
  const idxQty = header.indexOf("수량");
  const idxUnit = header.indexOf("단위");
  const idxExpiry = header.indexOf("유통기한");
  const idxNote = header.indexOf("비고");

  let addedCount = 0;
  let invalidRows = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = line.split(",");

    const unit = cols[idxUnit] ? cols[idxUnit].replace(/^"|"$/g, "") : "";

    if (!allowedUnits.includes(unit)) {
      invalidRows.push(i + 1); // 줄 번호 (헤더 제외 +1)
      continue; // 무시
    }

    const item = {
      category: cols[idxCategory]
        ? cols[idxCategory].replace(/^"|"$/g, "")
        : "",
      name: cols[idxName] ? cols[idxName].replace(/^"|"$/g, "") : "",
      qty: cols[idxQty] ? Number(cols[idxQty]) : 0,
      qtyUnit: unit,
      expiry: cols[idxExpiry] ? cols[idxExpiry].replace(/^"|"$/g, "") : "",
      note: cols[idxNote] ? cols[idxNote].replace(/^"|"$/g, "") : "",
    };

    if (item.category && item.name && item.qty && item.expiry) {
      data.push(item);
      addedCount++;
    }
  }

  if (addedCount === 0) {
    alert("추가할 유효한 데이터가 없습니다.");
    return;
  }

  saveData();
  renderCalendar();
  resetForm();
  csvFileInput.value = "";
  alert(`${addedCount}개의 아이템이 추가되었습니다.`);
}

const downloadTemplateBtn = document.getElementById("downloadTemplateBtn");

downloadTemplateBtn.addEventListener("click", () => {
  const BOM = "\uFEFF"; // 한글 깨짐 방지용 BOM
  const header = ["분류", "상품명", "수량", "단위", "유통기한", "비고"];
  const exampleRow = [
    "카페",
    "아메리카노",
    "10",
    "EA",
    "2025-08-05",
    "시원한 음료",
  ];
  const noteLines = [
    "# 주의사항:",
    '# 1. "수량"은 숫자만 입력하세요.',
    '# 2. "유통기한"은 YYYY-MM-DD 형식으로 입력하세요.',
    "# 3. 빈 칸이 있으면 데이터가 무시될 수 있습니다.",
    "# 4. CSV 파일은 UTF-8 인코딩으로 저장하세요.",
  ];

  const csvRows = [
    header.join(","),
    exampleRow.map((s) => `"${s}"`).join(","),
    "",
    ...noteLines.map((line) => `"${line}"`),
  ];

  const csvString = BOM + csvRows.join("\n");
  const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "챔피언_시흥은계점_템플릿.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});

document.addEventListener("DOMContentLoaded", () => {
  const exportStartDate = document.getElementById("exportStartDate");
  const exportEndDate = document.getElementById("exportEndDate");
  const periodButtons = document.querySelectorAll(".period-btn");

  if (!exportStartDate || !exportEndDate) {
    console.error("exportStartDate/exportEndDate 요소를 찾을 수 없습니다.");
    return;
  }

  // 로컬 시간 기준으로 YYYY-MM-DD 문자열 생성 (UTC 이슈 방지)
  function formatDateLocal(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  // 오늘 날짜(로컬)
  const today = new Date();
  exportStartDate.value = formatDateLocal(today);
  exportEndDate.value = formatDateLocal(today);

  function setDateRange(period) {
    const today = new Date();
    let start, end;

    end = new Date(today); // 종료일은 오늘

    switch (period) {
      case "month": // 당월 1일부터 이번달 말일까지
        start = new Date(today.getFullYear(), today.getMonth(), 1);
        end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
        break;

      case "week": // 오늘 기준 7일간 (오늘 포함)
        start = new Date(today);
        start.setDate(start.getDate() - 7);
        break;

      case "1m": // 오늘 기준 1개월 전부터 오늘까지
        start = new Date(today);
        start.setMonth(start.getMonth() - 1);
        break;

      case "2m":
        start = new Date(today);
        start.setMonth(start.getMonth() - 2);
        break;

      case "3m":
        start = new Date(today);
        start.setMonth(start.getMonth() - 3);
        break;

      case "6m":
        start = new Date(today);
        start.setMonth(start.getMonth() - 6);
        break;

      case "1y":
        start = new Date(today);
        start.setFullYear(start.getFullYear() - 1);
        break;

      default:
        start = new Date(today);
        end = new Date(today);
    }

    // 디버그 로그 — 이 값들이 뭔지 먼저 확인하세요
    console.log("setDateRange:", period, "start=", start, "end=", end);
    exportStartDate.value = formatDateLocal(start);
    exportEndDate.value = formatDateLocal(end);
    // 그리고 입력값도 콘솔에 다시 찍어봅시다 (확인용)
    console.log(
      "input values set ->",
      exportStartDate.value,
      exportEndDate.value,
    );
  }

  // 버튼 이벤트 연결
  periodButtons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      periodButtons.forEach((b) => b.classList.remove("active"));
      e.currentTarget.classList.add("active");
      const p = e.currentTarget.getAttribute("data-period");
      setDateRange(p);
    });
  });
});

document.addEventListener("DOMContentLoaded", function () {
  const toggleBtn = document.getElementById("toggleBoxBtn");
  const inputBox = document.getElementById("inputBox");
  const body = document.body;

  // 모달 오버레이 엘리먼트 생성 (HTML 변경 없이 JS로 동적 생성)
  let overlay = document.getElementById("modalOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "modalOverlay";
    document.body.appendChild(overlay);
  }

  // 열기/닫기 함수
  function openModal() {
    inputBox.classList.add("open");
    overlay.classList.add("show");
    // 바디 스크롤 막기
    body.style.overflow = "hidden";
    toggleBtn.textContent = "✖️ 설정 닫기";
  }

  function closeModal() {
    inputBox.classList.remove("open");
    overlay.classList.remove("show");
    body.style.overflow = "";
    toggleBtn.textContent = "📂 설정 열기";
  }

  // 토글 버튼 동작
  toggleBtn.addEventListener("click", function (e) {
    e.preventDefault();
    if (inputBox.classList.contains("open")) closeModal();
    else openModal();
  });

  // 오버레이 클릭하면 닫기
  overlay.addEventListener("click", function () {
    closeModal();
  });

  // ESC 키로 닫기
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape" && inputBox.classList.contains("open")) {
      closeModal();
    }
  });

  // 모달 내부에서 submit 버튼 클릭 시 동작 예시 (원래 로직이 따로 있다면 그걸 호출하도록 바꿔서 사용)
  const itemForm = document.getElementById("itemForm");
  if (itemForm) {
    itemForm.addEventListener("submit", function (ev) {
      ev.preventDefault();
      // 예시: 폼 유효성 검사 후 닫기
      // 실제 데이터 처리 로직 (아이템 추가 등)은 기존 코드로 연결하세요.
      // 여기선 간단히 닫기만 시킵니다.
      closeModal();
    });
  }

  // CSV 파일 선택 표시 (파일 이름)
  const csvInput = document.getElementById("csvFileInput");
  const fileNameDisplay = document.getElementById("fileNameDisplay");
  if (csvInput && fileNameDisplay) {
    csvInput.addEventListener("change", function () {
      if (csvInput.files && csvInput.files.length > 0) {
        fileNameDisplay.textContent = csvInput.files[0].name;
      } else {
        fileNameDisplay.textContent = "선택된 파일 없음";
      }
    });
  }

  // "CSV 템플릿 다운로드" 버튼 예시 동작 (파일 생성 / 다운로드)
  const downloadBtn = document.getElementById("downloadTemplateBtn");
  if (downloadBtn) {
    downloadBtn.addEventListener("click", function () {
      // 임시 CSV 템플릿 내용. 필요하면 실제 템플릿으로 수정하세요.
      const csvContent =
        "분류,상품명,수량,단위,유통기한,비고\n카페,아메리카노,10,EA,2025-12-31,테스트\n";
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "template.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    });
  }

  // 만약 inputBox 안에 닫기 버튼을 별도로 만들고 싶다면 누르면 closeModal 호출하도록 하세요.
  // 예: document.getElementById('myCloseBtn').addEventListener('click', closeModal);

  // --- 기존 달력 관련 스크립트와 충돌하지 않게 보수적으로 동작하도록 구성했습니다. ---
  // 달력과 관련된 기존 script 코드가 있다면 그것을 이 파일 아래에 추가하거나,
  // 기존 파일에서 calendar 초기화 부분을 유지하세요.
});

// --- 오버레이 생성 및 반환 ---
function ensureOverlay() {
  let overlay = document.getElementById("modalOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "modalOverlay";
    // 스타일은 CSS에서 관리
    document.body.appendChild(overlay);

    // 오버레이 클릭 시 닫기
    overlay.addEventListener("click", () => closeInputBox());
  }
  return overlay;
}

// --- 모달 열기 ---
function openInputBox() {
  const inputBox = document.getElementById("inputBox");
  if (!inputBox) return;
  const overlay = ensureOverlay();

  overlay.classList.add("show");
  inputBox.classList.add("open");

  document.body.style.overflow = "hidden";

  // 첫 번째 입력요소 포커스
  const firstInput = inputBox.querySelector("select, input, textarea, button");
  if (firstInput) firstInput.focus();
}

// --- 모달 닫기 ---
function closeInputBox() {
  const inputBox = document.getElementById("inputBox");
  const overlay = document.getElementById("modalOverlay");

  if (overlay) overlay.classList.remove("show");
  if (!inputBox) return;
  inputBox.classList.remove("open");

  document.body.style.overflow = "";

  // 폼 리셋 및 편집 인덱스 초기화
  const form = document.getElementById("itemForm");
  if (form) form.reset();

  const editIndexInput = document.getElementById("editIndex");
  if (editIndexInput) editIndexInput.value = -1;

  // 버튼 텍스트 및 취소 버튼 숨기기
  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.textContent = "추가";

  const cancelEditBtn = document.getElementById("cancelEditBtn");
  if (cancelEditBtn) cancelEditBtn.style.display = "none";
}

// --- 편집 시작 함수 ---
function startEdit(idx) {
  const item = data[idx];
  if (!item) return;

  const categoryEl = document.getElementById("category");
  const nameEl = document.getElementById("name");
  const qtyEl = document.getElementById("qty");
  const qtyUnitEl = document.getElementById("qtyUnit");
  const expiryEl = document.getElementById("expiry");
  const noteEl = document.getElementById("note");
  const editIndexInput = document.getElementById("editIndex");

  if (categoryEl) categoryEl.value = item.category || "";
  if (nameEl) nameEl.value = item.name || "";
  if (qtyEl) qtyEl.value = item.qty || "";
  if (qtyUnitEl) qtyUnitEl.value = item.qtyUnit || "";
  if (expiryEl) expiryEl.value = item.expiry || "";
  if (noteEl) noteEl.value = item.note || "";
  if (editIndexInput) editIndexInput.value = String(idx);

  const submitBtn = document.getElementById("submitBtn");
  if (submitBtn) submitBtn.textContent = "수정";

  const cancelEditBtn = document.getElementById("cancelEditBtn");
  if (cancelEditBtn) cancelEditBtn.style.display = "inline-block";

  openInputBox();
}

// --- 취소 버튼에 닫기 연결 ---
(function attachCancel() {
  const cancel = document.getElementById("cancelEditBtn");
  if (cancel) {
    cancel.addEventListener("click", (e) => {
      e.preventDefault();
      closeInputBox();
    });
  }
})();

function loadData() {
  const saved = localStorage.getItem("expiryItems");
  if (saved) {
    data = JSON.parse(saved);
  } else {
    data = [];
  }
}

window.onload = () => {
  initYearSelector();
  initMonthSelector();
  loadData();
  renderCalendar();
};

window.addEventListener("storage", (e) => {
  if (e.key === "expiryItems") {
    loadData(); // localStorage에서 최신 데이터 다시 불러오기
    renderCalendar(); // 달력 다시 렌더링
  }
});

// 수정/삭제 후 데이터 저장 예시
function saveData() {
  localStorage.setItem("expiryItems", JSON.stringify(data));
}
