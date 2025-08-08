/* script2.js -- 전체 통합본
   - 기존 개별등록 / 편집 / 페이지네이션 기능 유지
   - window.items 전역 초기화 (없을 때 생성)
   - 배치 등록 UI: 토글, 20행 생성, 한번에 등록/비우기
   - 유통기한(expiry) 및 비고(note) 포함
*/

(() => {
  // --- 기본 설정 / 전역 변수 ---
  const addItemForm = document.getElementById("addItemForm");
  const dataTableBody = document.querySelector("#dataTable tbody");
  const prevBtn = document.getElementById("prevBtn");
  const nextBtn = document.getElementById("nextBtn");
  const pageInfo = document.getElementById("pageInfo");
  const goExpiryPageBtn = document.getElementById("goExpiryPageBtn");

  let ITEMS_PER_PAGE = 10;
  let currentPage = 1;

  // 전역 items 초기화 (localStorage에 데이터가 없을 때도 전역 배열 존재)
  window.items = window.items || [];
  // items-per-page select 처리 (DOMContentLoaded 내부에 넣으세요)
  const itemsPerPageSelect = document.getElementById("itemsPerPage");
  if (itemsPerPageSelect) {
    // 초기값을 select의 선택값으로 동기화
    ITEMS_PER_PAGE = Number(itemsPerPageSelect.value) || ITEMS_PER_PAGE;

    // 변경 시 페이지 크기 업데이트하고 1페이지로 이동하여 재렌더
    itemsPerPageSelect.addEventListener("change", () => {
      ITEMS_PER_PAGE = Number(itemsPerPageSelect.value) || 10;
      currentPage = 1;
      renderTable(currentPage);
    });
  }

  // --- load / save ---
  // 저장
  function saveItems() {
    localStorage.setItem("expiryItems", JSON.stringify(window.items));
    alert("저장 완료!");
  }

  // 불러오기
  function loadItems() {
    const saved = localStorage.getItem("expiryItems");
    if (saved) {
      window.items = JSON.parse(saved);
      renderTable(currentPage); // <- 이 부분을 renderTable(currentPage)로 바꿔야 해요!
    }
  }

  // --- 렌더링 / 페이지네이션 / 편집 / 삭제 ---
  function renderTable(page = 1) {
    dataTableBody.innerHTML = "";
    currentPage = page;

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = window.items.slice(start, end);

    if (pageItems.length === 0 && page > 1) {
      renderTable(page - 1);
      return;
    }

    pageItems.forEach((item, idx) => {
      const tr = document.createElement("tr");
      tr.dataset.index = start + idx;

      tr.innerHTML = `
        <td>${escapeHtml(item.category)}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.qty}</td>
        <td>${escapeHtml(item.qtyUnit)}</td>
        <td>${escapeHtml(item.expiry || "")}</td>
        <td>${escapeHtml(item.note || "")}</td>
        <td>
          <button class="btn-edit">수정</button>
          <button class="btn-delete">삭제</button>
        </td>
      `;

      tr.querySelector(".btn-edit").addEventListener("click", () => {
        startEdit(tr);
      });

      tr.querySelector(".btn-delete").addEventListener("click", () => {
        if (confirm("정말 삭제할까요?")) {
          window.items.splice(start + idx, 1);
          saveItems();
          renderTable(currentPage);
        }
      });

      dataTableBody.appendChild(tr);
    });

    const totalPages = Math.ceil(window.items.length / ITEMS_PER_PAGE);
    pageInfo.textContent = `페이지 ${currentPage} / ${totalPages || 1}`;
    prevBtn.disabled = currentPage <= 1;
    nextBtn.disabled = currentPage >= totalPages;
  }

  prevBtn.addEventListener("click", () => {
    if (currentPage > 1) renderTable(currentPage - 1);
  });
  nextBtn.addEventListener("click", () => {
    const totalPages = Math.ceil(window.items.length / ITEMS_PER_PAGE);
    if (currentPage < totalPages) renderTable(currentPage + 1);
  });

  function startEdit(tr) {
    const idx = Number(tr.dataset.index);
    const item = window.items[idx];
    if (!item) return;

    tr.innerHTML = `
      <td>
        <select class="edit-category" style="width:100%">
          <option value="카페">카페</option>
          <option value="주방">주방</option>
          <option value="음료">음료</option>
          <option value="아이스크림">아이스크림</option>
          <option value="아트">아트</option>
          <option value="스넥">스넥</option>
          <option value="운영물품">운영물품</option>
          <option value="기타">기타</option>
        </select>
      </td>
      <td><input type="text" class="edit-name" value="${escapeAttr(item.name)}" /></td>
      <td><input type="number" class="edit-qty" min="1" value="${item.qty}" /></td>
      <td>
        <select class="edit-qtyUnit" style="width:100%">
          <option value="EA">EA</option>
          <option value="CT">CT</option>
        </select>
      </td>
      <td><input type="date" class="edit-expiry" value="${escapeAttr(item.expiry || "")}" /></td>
      <td><input type="text" class="edit-note" value="${escapeAttr(item.note || "")}" /></td>
      <td>
        <button class="btn-save">저장</button>
        <button class="btn-cancel">취소</button>
      </td>
    `;

    tr.querySelector(".edit-category").value = item.category;
    tr.querySelector(".edit-qtyUnit").value = item.qtyUnit || "";

    tr.querySelector(".btn-save").addEventListener("click", () => {
      const updatedItem = {
        category: tr.querySelector(".edit-category").value,
        name: tr.querySelector(".edit-name").value.trim(),
        qty: Number(tr.querySelector(".edit-qty").value),
        qtyUnit: tr.querySelector(".edit-qtyUnit").value,
        expiry: tr.querySelector(".edit-expiry").value || "",
        note: tr.querySelector(".edit-note").value.trim(),
      };
      if (
        !updatedItem.category ||
        !updatedItem.name ||
        !updatedItem.qty ||
        !updatedItem.qtyUnit
      ) {
        alert("분류, 상품명, 수량, 단위는 필수입니다.");
        return;
      }
      window.items[idx] = updatedItem;
      saveItems();
      renderTable(currentPage);
    });

    tr.querySelector(".btn-cancel").addEventListener("click", () => {
      renderTable(currentPage);
    });
  }

  // --- 개별 등록 처리 ---
  addItemForm.addEventListener("submit", (e) => {
    e.preventDefault();

    const newItem = {
      category: addItemForm.category.value,
      name: addItemForm.name.value.trim(),
      qty: Number(addItemForm.qty.value),
      qtyUnit: addItemForm.qtyUnit.value,
      expiry: addItemForm.expiry.value || "",
      note: addItemForm.note.value.trim(),
    };

    if (
      !newItem.category ||
      !newItem.name ||
      !newItem.qty ||
      !newItem.qtyUnit
    ) {
      alert("분류, 상품명, 수량, 단위는 필수입니다.");
      return;
    }

    window.items.unshift(newItem); // 최신항목이 위로
    saveItems();
    renderTable(currentPage);
    addItemForm.reset();
  });

  goExpiryPageBtn.addEventListener("click", () => {
    window.open("Expiration Date.html", "_blank");
  });

  // 다른 탭에서 localStorage 변경 시 감지
  window.addEventListener("storage", (e) => {
    if (e.key === "expiryItems") {
      loadItems();
      renderTable(currentPage);
    }
  });

  // --- 배치 등록(한번에 등록) 기능 추가 ---
  const MAX_ROWS = 20;
  const batchToggleBtn = document.getElementById("batchToggleBtn");
  const batchBox = document.getElementById("batchBox");
  const arrow = document.getElementById("arrow");
  const batchRows = document.getElementById("batchRows");
  const batchAddBtn = document.getElementById("batchAddBtn");
  const batchClearBtn = document.getElementById("batchClearBtn");
  const batchInfo = document.getElementById("batchInfo");

  function createRow(index) {
    const wrapper = document.createElement("div");
    wrapper.className = "batch-row";

    // 인라인 그리드 스타일
    wrapper.style.display = "grid";
    wrapper.style.gridTemplateColumns = "1fr 1.8fr 80px 130px 130px 1.5fr 60px";
    wrapper.style.gap = "8px";
    wrapper.style.alignItems = "center";

    // 분류 select
    const categorySelect = document.createElement("select");
    categorySelect.innerHTML = `
    <option value="" disabled selected>분류 선택</option>
    <option value="카페">카페</option>
    <option value="주방">주방</option>
    <option value="음료">음료</option>
    <option value="아이스크림">아이스크림</option>
    <option value="아트">아트</option>
    <option value="스넥">스넥</option>
    <option value="운영물품">운영물품</option>
    <option value="기타">기타</option>
  `;
    categorySelect.style.padding = "6px";

    // 수동 변경 체크용 플래그
    let userChangedCategory = false;
    categorySelect.addEventListener("change", () => {
      userChangedCategory = true;
    });

    // 상품명
    const nameInput = document.createElement("input");
    nameInput.type = "text";
    nameInput.placeholder = index + 1 + ". 상품명";
    nameInput.style.padding = "6px";

    // 상품명에 포커스나 입력 시 자동 세팅 (사용자가 직접 바꾸지 않았다면)
    nameInput.addEventListener("focus", () => {
      if (!userChangedCategory) {
        const selectedCategory = document.getElementById(
          "batchCategoryFilter",
        ).value;
        if (selectedCategory) {
          categorySelect.value = selectedCategory;
        }
      }
    });
    nameInput.addEventListener("input", () => {
      if (!userChangedCategory) {
        const selectedCategory = document.getElementById(
          "batchCategoryFilter",
        ).value;
        if (selectedCategory && !categorySelect.value) {
          categorySelect.value = selectedCategory;
        }
      }
    });

    // 수량
    const qtyInput = document.createElement("input");
    qtyInput.type = "number";
    qtyInput.min = "1";
    qtyInput.placeholder = "수량";
    qtyInput.style.padding = "6px";

    // 단위
    const unitSelect = document.createElement("select");
    unitSelect.innerHTML = `
    <option value="" disabled selected>단위</option>
    <option value="EA">EA</option>
    <option value="CT">CT</option>
  `;
    unitSelect.style.padding = "6px";

    // 유통기한 (날짜)
    const expiryInput = document.createElement("input");
    expiryInput.type = "date";
    expiryInput.style.padding = "6px";

    // 날짜 자동 세팅 (기존과 동일)
    nameInput.addEventListener("focus", () => {
      const selectedDate = document.getElementById("batchDateFilter").value;
      if (selectedDate) {
        expiryInput.value = selectedDate;
      }
    });
    nameInput.addEventListener("input", () => {
      const selectedDate = document.getElementById("batchDateFilter").value;
      if (selectedDate && !expiryInput.value) {
        expiryInput.value = selectedDate;
      }
    });

    // 비고
    const noteInput = document.createElement("input");
    noteInput.type = "text";
    noteInput.placeholder = "비고";
    noteInput.style.padding = "6px";

    // 삭제 버튼
    const delBtn = document.createElement("button");
    delBtn.type = "button";
    delBtn.className = "btn-delete";
    delBtn.textContent = "삭제";
    delBtn.style.padding = "6px";
    delBtn.addEventListener("click", () => {
      if (!confirm("이 입력 행을 정말 삭제하시겠습니까?")) return;
      wrapper.remove();
      updateInfo(); // 필요 시 구현
    });

    wrapper.appendChild(categorySelect);
    wrapper.appendChild(nameInput);
    wrapper.appendChild(qtyInput);
    wrapper.appendChild(unitSelect);
    wrapper.appendChild(expiryInput);
    wrapper.appendChild(noteInput);
    wrapper.appendChild(delBtn);

    return wrapper;
  }

  function initBatchRows() {
    if (!batchRows) return;
    if (batchRows.children.length === 0) {
      for (let i = 0; i < MAX_ROWS; i++) {
        batchRows.appendChild(createRow(i));
      }
      updateInfo();
    }
  }

  function openBox() {
    initBatchRows();
    if (batchBox) {
      batchBox.style.maxHeight = "1200px";
      batchBox.style.padding = "18px";
    }
    if (batchToggleBtn) batchToggleBtn.setAttribute("aria-expanded", "true");
    if (arrow) arrow.style.transform = "rotate(180deg)";
  }
  function closeBox() {
    if (batchBox) {
      batchBox.style.maxHeight = "0";
      batchBox.style.padding = "0 24px";
    }
    if (batchToggleBtn) batchToggleBtn.setAttribute("aria-expanded", "false");
    if (arrow) arrow.style.transform = "rotate(0deg)";
  }

  if (batchToggleBtn) {
    batchToggleBtn.addEventListener("click", () => {
      const expanded = batchToggleBtn.getAttribute("aria-expanded") === "true";
      if (expanded) closeBox();
      else openBox();
    });
  }

  if (batchAddBtn) {
    batchAddBtn.addEventListener("click", () => {
      if (!Array.isArray(window.items)) {
        window.items = [];
      }
      const rows = Array.from(batchRows.querySelectorAll(".batch-row"));
      let addedCount = 0;

      rows.forEach((row) => {
        const category = row.children[0].value;
        const name = row.children[1].value.trim();
        const qty = row.children[2].value.trim();
        const qtyUnit = row.children[3].value;
        const expiry = row.children[4].value || "";
        const note = row.children[5].value.trim() || "";

        // 필수 체크: 분류, 상품명, 수량, 단위
        if (!category || !name || !qty || !qtyUnit) return;

        const newItem = {
          category,
          name,
          qty: Number(qty),
          qtyUnit,
          expiry,
          note,
        };
        window.items.unshift(newItem);
        addedCount++;

        // 입력 초기화
        row.children[0].value = "";
        row.children[1].value = "";
        row.children[2].value = "";
        row.children[3].value = "";
        row.children[4].value = "";
        row.children[5].value = "";
      });

      if (addedCount === 0) {
        alert("최소 한 개 이상의 분류, 상품명, 수량, 단위를 입력하세요.");
        return;
      }

      saveItems();
      renderTable(currentPage);
      updateInfo();

      // ← 여기 추가!
      alert("등록이 완료되었습니다.");
      openBox(); // 등록 후 박스 열기
    });
  }

  if (batchClearBtn) {
    batchClearBtn.addEventListener("click", () => {
      if (!confirm("정말 모든 입력 내용을 비우시겠습니까?")) {
        return; // 취소 시 아무 동작 안 함
      }
      batchRows.querySelectorAll(".batch-row").forEach((row) => {
        row.children[0].value = "";
        row.children[1].value = "";
        row.children[2].value = "";
        row.children[3].value = "";
        row.children[4].value = "";
        row.children[5].value = "";
      });
      updateInfo();
    });
  }

  function updateInfo() {
    if (!batchRows || !batchInfo) return;
    const emptyCount = Array.from(
      batchRows.querySelectorAll(".batch-row"),
    ).filter((row) => {
      return (
        !row.children[0].value &&
        !row.children[1].value.trim() &&
        !row.children[2].value.trim() &&
        !row.children[3].value
      );
    }).length;
    batchInfo.textContent = `비어있는 입력 칸: ${emptyCount} / ${MAX_ROWS}`;
  }

  if (batchRows) {
    batchRows.addEventListener("input", updateInfo);
  }

  // --- 유틸: 간단한 escape (XSS 방지 최소화용) ---
  function escapeHtml(str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }
  function escapeAttr(str) {
    if (typeof str !== "string") return str;
    return str
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }

  // --- 초기화 실행 ---
  document.addEventListener("DOMContentLoaded", () => {
    // 배치박스 숨김 초기화 (안 보이게)
    if (batchBox) {
      batchBox.style.maxHeight = "0";
      batchBox.style.padding = "0 24px";
      batchBox.style.overflow = "hidden";
    }

    // load items from localStorage and render
    loadItems();
    renderTable(1);
    // batch rows는 토글 시 생성(초기 로드에서 생성하고 싶으면 initBatchRows(); 호출)
  });
})();

const arrowDiv = document.getElementById("expiryToggleArrow");
const backupContainer = document.getElementById("expiryBackupContainer");
const periodButtons = document.querySelectorAll(
  "#periodButtons button[data-period]",
);
const startDateInput = document.getElementById("backupStartDate");
const endDateInput = document.getElementById("backupEndDate");
const downloadBtn = document.getElementById("downloadBackupBtn");

// 분류 버튼들 (예: 분류 버튼 컨테이너 안에 있는 버튼들)
const categoryButtons = document.querySelectorAll(
  "#categoryButtons .category-btn",
);
let selectedCategory = ""; // 빈 문자열이면 전체 선택

// 분류 버튼 클릭 이벤트 처리
categoryButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // active 클래스 토글 (활성화 표시용)
    categoryButtons.forEach((btn) => btn.classList.remove("active"));
    button.classList.add("active");

    // 선택된 분류 저장
    selectedCategory = button.dataset.category;

    // 필요하면 필터링이나 렌더링 함수 호출 가능
  });
});

// 토글 화살표 클릭 시 백업 컨테이너 보이기/숨기기
arrowDiv.addEventListener("click", () => {
  if (
    backupContainer.style.display === "none" ||
    backupContainer.style.display === ""
  ) {
    backupContainer.style.display = "block";
    arrowDiv.querySelector("span").style.transform = "rotate(180deg)";
  } else {
    backupContainer.style.display = "none";
    arrowDiv.querySelector("span").style.transform = "rotate(0deg)";
  }
});

// 기간 버튼 클릭 시 시작일/종료일 세팅
function setDatesByPeriod(value) {
  const today = new Date();
  let start, end;

  switch (value) {
    case "thisMonth":
      start = new Date(today.getFullYear(), today.getMonth(), 2);
      end = new Date(today.getFullYear(), today.getMonth() + 1, 0);
      break;
    case "week":
      start = new Date(today);
      start.setDate(today.getDate() - 7);
      end = today;
      break;
    case "1month":
      start = new Date(today);
      start.setMonth(today.getMonth() - 1);
      end = today;
      break;
    case "2months":
      start = new Date(today);
      start.setMonth(today.getMonth() - 2);
      end = today;
      break;
    case "3months":
      start = new Date(today);
      start.setMonth(today.getMonth() - 3);
      end = today;
      break;
    case "6months":
      start = new Date(today);
      start.setMonth(today.getMonth() - 6);
      end = today;
      break;
    case "1year":
      start = new Date(today);
      start.setFullYear(today.getFullYear() - 1);
      end = today;
      break;
    default:
      start = new Date(today.getFullYear(), today.getMonth(), 1);
      end = today;
  }

  // 날짜 형식 YYYY-MM-DD로 맞춤
  startDateInput.value = start.toISOString().slice(0, 10);
  endDateInput.value = end.toISOString().slice(0, 10);
}

// 기간 버튼 이벤트 연결
periodButtons.forEach((button) => {
  button.addEventListener("click", () => {
    // 기존 active 제거
    periodButtons.forEach((btn) => btn.classList.remove("active"));

    // 클릭한 버튼만 active 추가
    button.classList.add("active");

    // 기존 날짜 설정 함수 호출
    setDatesByPeriod(button.dataset.period);
  });
});

// 초기값 당월로 세팅
setDatesByPeriod("thisMonth");

// 백업 다운로드 버튼 이벤트
downloadBtn.addEventListener("click", () => {
  if (window.items.length === 0) {
    alert("백업할 데이터가 없습니다.");
    return;
  }

  const start = new Date(startDateInput.value);
  const end = new Date(endDateInput.value);

  // window.items 기준으로 분류 필터 + 기간 필터 적용
  const filteredData = window.items.filter((item) => {
    if (!item.expiry) return false;

    // 분류 필터 적용 (선택 없으면 전체 포함)
    if (
      selectedCategory &&
      selectedCategory !== "" &&
      item.category !== selectedCategory
    ) {
      return false;
    }

    const expiryDate = new Date(item.expiry);
    return expiryDate >= start && expiryDate <= end;
  });

  if (filteredData.length === 0) {
    alert("해당 기간 및 분류에 등록된 데이터가 없습니다.");
    return;
  }

  const csvHeader = ["분류", "상품명", "수량", "단위", "유통기한", "비고"];
  const csvRows = filteredData.map((item) => [
    item.category,
    item.name,
    item.qty,
    item.qtyUnit,
    item.expiry,
    item.note,
  ]);

  const csvContent = [csvHeader, ...csvRows]
    .map((row) =>
      row
        .map((cell) => `"${(cell || "").toString().replace(/"/g, '""')}"`)
        .join(","),
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `유통기한_백업_${startDateInput.value}_~_${endDateInput.value}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
});
