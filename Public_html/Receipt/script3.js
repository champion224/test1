/* script2.js -- 전체 통합본
   - 기존 개별등록 / 편집 / 페이지네이션 기능 유지
   - window.items 전역 초기화 (없을 때 생성)
   - 배치 등록 UI: 토글, 20행 생성, 한번에 등록/비우기
   - 유통기한(expiry) 및 비고(note) 포함
*/

(() => {
  // --- 기본 설정 / 전역 변수 ---
  const addItemForm = document.getElementById('addItemForm');
  const dataTableBody = document.querySelector('#dataTable tbody');
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  const pageInfo = document.getElementById('pageInfo');
  const goExpiryPageBtn = document.getElementById('goExpiryPageBtn');

  let ITEMS_PER_PAGE = 10; 
  let currentPage = 1;

  // 전역 items 초기화 (localStorage에 데이터가 없을 때도 전역 배열 존재)
  window.items = window.items || [];
  // items-per-page select 처리 (DOMContentLoaded 내부에 넣으세요)
const itemsPerPageSelect = document.getElementById('itemsPerPage');
if (itemsPerPageSelect) {
  // 초기값을 select의 선택값으로 동기화
  ITEMS_PER_PAGE = Number(itemsPerPageSelect.value) || ITEMS_PER_PAGE;

  // 변경 시 페이지 크기 업데이트하고 1페이지로 이동하여 재렌더
  itemsPerPageSelect.addEventListener('change', () => {
    ITEMS_PER_PAGE = Number(itemsPerPageSelect.value) || 10;
    currentPage = 1;
    renderTable(currentPage);
  });
}


  // --- load / save ---
  function saveItems() {
  fetch('http://192.168.0.117:49164/Receipt/DB/saveItem.php', {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(window.items)
  })
  .then(res => res.json())
  .then(data => {
    if(data.status === 'success') {
      console.log('서버 저장 완료');
    } else {
      alert('서버 저장 실패: ' + (data.message || ''));
    }
  })
  .catch(() => {
    alert('서버 저장 중 오류가 발생했습니다.');
  });
}

function loadItems() {
  fetch('/Receipt/DB/load.php')
    .then(res => res.json())
    .then(data => {
      window.items = Array.isArray(data) ? data : [];
      renderTable(currentPage);
    })
    .catch(() => {
      window.items = [];
      renderTable(currentPage);
    });
} 

  // --- 렌더링 / 페이지네이션 / 편집 / 삭제 ---
  function renderTable(page = 1) {
    dataTableBody.innerHTML = '';
    currentPage = page;

    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = window.items.slice(start, end);

    if (pageItems.length === 0 && page > 1) {
      renderTable(page - 1);
      return;
    }

    pageItems.forEach((item, idx) => {
      const tr = document.createElement('tr');
      tr.dataset.index = start + idx;

      tr.innerHTML = `
        <td>${escapeHtml(item.category)}</td>
        <td>${escapeHtml(item.name)}</td>
        <td>${item.qty}</td>
        <td>${escapeHtml(item.qtyUnit)}</td>
        <td>${escapeHtml(item.expiry || '')}</td>
        <td>${escapeHtml(item.note || '')}</td>
        <td>
          <button class="btn-edit">수정</button>
          <button class="btn-delete">삭제</button>
        </td>
      `;

      tr.querySelector('.btn-edit').addEventListener('click', () => {
        startEdit(tr);
      });

      tr.querySelector('.btn-delete').addEventListener('click', () => {
        if (confirm('정말 삭제할까요?')) {
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

  prevBtn.addEventListener('click', () => {
    if (currentPage > 1) renderTable(currentPage - 1);
  });
  nextBtn.addEventListener('click', () => {
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
      <td><input type="date" class="edit-expiry" value="${escapeAttr(item.expiry || '')}" /></td>
      <td><input type="text" class="edit-note" value="${escapeAttr(item.note || '')}" /></td>
      <td>
        <button class="btn-save">저장</button>
        <button class="btn-cancel">취소</button>
      </td>
    `;

    tr.querySelector('.edit-category').value = item.category;
    tr.querySelector('.edit-qtyUnit').value = item.qtyUnit || '';

    tr.querySelector('.btn-save').addEventListener('click', () => {
      const updatedItem = {
        category: tr.querySelector('.edit-category').value,
        name: tr.querySelector('.edit-name').value.trim(),
        qty: Number(tr.querySelector('.edit-qty').value),
        qtyUnit: tr.querySelector('.edit-qtyUnit').value,
        expiry: tr.querySelector('.edit-expiry').value || "",
        note: tr.querySelector('.edit-note').value.trim()
      };
      if (!updatedItem.category || !updatedItem.name || !updatedItem.qty || !updatedItem.qtyUnit) {
        alert('분류, 상품명, 수량, 단위는 필수입니다.');
        return;
      }
      window.items[idx] = updatedItem;
      saveItems();
      renderTable(currentPage);
    });

    tr.querySelector('.btn-cancel').addEventListener('click', () => {
      renderTable(currentPage);
    });
  }

  // --- 개별 등록 처리 ---
  addItemForm.addEventListener('submit', e => {
    e.preventDefault();

    const newItem = {
      category: addItemForm.category.value,
      name: addItemForm.name.value.trim(),
      qty: Number(addItemForm.qty.value),
      qtyUnit: addItemForm.qtyUnit.value,
      expiry: addItemForm.expiry.value || "",
      note: addItemForm.note.value.trim()
    };

    if (!newItem.category || !newItem.name || !newItem.qty || !newItem.qtyUnit) {
      alert('분류, 상품명, 수량, 단위는 필수입니다.');
      return;
    }

    window.items.unshift(newItem); // 최신항목이 위로
    saveItems();
    renderTable(currentPage);
    addItemForm.reset();
  });

  goExpiryPageBtn.addEventListener('click', () => {
    window.open('../Expiration Date/index2.html', '_blank');
  });

  // 다른 탭에서 localStorage 변경 시 감지
  window.addEventListener('storage', (e) => {
    if (e.key === 'expiryItems') {
      loadItems();
      renderTable(currentPage);
    }
  });

  // --- 배치 등록(한번에 등록) 기능 추가 ---
  const MAX_ROWS = 20;
  const batchToggleBtn = document.getElementById('batchToggleBtn');
  const batchBox = document.getElementById('batchBox');
  const arrow = document.getElementById('arrow');
  const batchRows = document.getElementById('batchRows');
  const batchAddBtn = document.getElementById('batchAddBtn');
  const batchClearBtn = document.getElementById('batchClearBtn');
  const batchInfo = document.getElementById('batchInfo');

  

  function createRow(index) {
  const wrapper = document.createElement('div');
  wrapper.className = 'batch-row';

  // 인라인 그리드 스타일
  wrapper.style.display = 'grid';
  wrapper.style.gridTemplateColumns = '1fr 1.8fr 80px 130px 130px 1.5fr 60px';
  wrapper.style.gap = '8px';
  wrapper.style.alignItems = 'center';

  // 분류 select
  const categorySelect = document.createElement('select');
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
  categorySelect.style.padding = '6px';

  // 수동 변경 체크용 플래그
  let userChangedCategory = false;
  categorySelect.addEventListener('change', () => {
    userChangedCategory = true;
  });

  // 상품명
  const nameInput = document.createElement('input');
  nameInput.type = 'text';
  nameInput.placeholder = (index + 1) + '. 상품명';
  nameInput.style.padding = '6px';

  // 상품명에 포커스나 입력 시 자동 세팅 (사용자가 직접 바꾸지 않았다면)
  nameInput.addEventListener('focus', () => {
    if (!userChangedCategory) {
      const selectedCategory = document.getElementById('batchCategoryFilter').value;
      if (selectedCategory) {
        categorySelect.value = selectedCategory;
      }
    }
  });
  nameInput.addEventListener('input', () => {
    if (!userChangedCategory) {
      const selectedCategory = document.getElementById('batchCategoryFilter').value;
      if (selectedCategory && !categorySelect.value) {
        categorySelect.value = selectedCategory;
      }
    }
  });

  // 수량
  const qtyInput = document.createElement('input');
  qtyInput.type = 'number';
  qtyInput.min = '1';
  qtyInput.placeholder = '수량';
  qtyInput.style.padding = '6px';

  // 단위
  const unitSelect = document.createElement('select');
  unitSelect.innerHTML = `
    <option value="" disabled selected>단위</option>
    <option value="EA">EA</option>
    <option value="CT">CT</option>
  `;
  unitSelect.style.padding = '6px';

  // 유통기한 (날짜)
  const expiryInput = document.createElement('input');
  expiryInput.type = 'date';
  expiryInput.style.padding = '6px';

  // 날짜 자동 세팅 (기존과 동일)
  nameInput.addEventListener('focus', () => {
    const selectedDate = document.getElementById('batchDateFilter').value;
    if (selectedDate) {
      expiryInput.value = selectedDate;
    }
  });
  nameInput.addEventListener('input', () => {
    const selectedDate = document.getElementById('batchDateFilter').value;
    if (selectedDate && !expiryInput.value) {
      expiryInput.value = selectedDate;
    }
  });

  // 비고
  const noteInput = document.createElement('input');
  noteInput.type = 'text';
  noteInput.placeholder = '비고';
  noteInput.style.padding = '6px';

  // 삭제 버튼
  const delBtn = document.createElement('button');
  delBtn.type = 'button';
  delBtn.className = 'btn-delete';
  delBtn.textContent = '삭제';
  delBtn.style.padding = '6px';
  delBtn.addEventListener('click', () => {
    if (!confirm('이 입력 행을 정말 삭제하시겠습니까?')) return;
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
      batchBox.style.maxHeight = '1200px';
      batchBox.style.padding = '18px';
    }
    if (batchToggleBtn) batchToggleBtn.setAttribute('aria-expanded', 'true');
    if (arrow) arrow.style.transform = 'rotate(180deg)';
  }
  function closeBox() {
    if (batchBox) {
      batchBox.style.maxHeight = '0';
      batchBox.style.padding = '0 24px';
    }
    if (batchToggleBtn) batchToggleBtn.setAttribute('aria-expanded', 'false');
    if (arrow) arrow.style.transform = 'rotate(0deg)';
  }

  if (batchToggleBtn) {
    batchToggleBtn.addEventListener('click', () => {
      const expanded = batchToggleBtn.getAttribute('aria-expanded') === 'true';
      if (expanded) closeBox();
      else openBox();
    });
  }

  if (batchAddBtn) {
    batchAddBtn.addEventListener('click', () => {
      if (!Array.isArray(window.items)) {
        window.items = [];
      }
      const rows = Array.from(batchRows.querySelectorAll('.batch-row'));
      let addedCount = 0;

      rows.forEach(row => {
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
          note
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
        alert('최소 한 개 이상의 분류, 상품명, 수량, 단위를 입력하세요.');
        return;
      }

      saveItems();
      renderTable(currentPage);
      updateInfo();

      // ← 여기 추가!
    alert('등록이 완료되었습니다.');
    openBox(); // 등록 후 박스 열기
    });
  }

  if (batchClearBtn) {
  batchClearBtn.addEventListener('click', () => {
    if (!confirm('정말 모든 입력 내용을 비우시겠습니까?')) {
      return; // 취소 시 아무 동작 안 함
    }
    batchRows.querySelectorAll('.batch-row').forEach(row => {
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
    const emptyCount = Array.from(batchRows.querySelectorAll('.batch-row')).filter(row => {
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
    batchRows.addEventListener('input', updateInfo);
  }

  // --- 유틸: 간단한 escape (XSS 방지 최소화용) ---
  function escapeHtml(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/"/g, '&quot;');
  }
  function escapeAttr(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  // --- 초기화 실행 ---
  document.addEventListener('DOMContentLoaded', () => {
    // 배치박스 숨김 초기화 (안 보이게)
    if (batchBox) {
      batchBox.style.maxHeight = '0';
      batchBox.style.padding = '0 24px';
      batchBox.style.overflow = 'hidden';
    }

    // load items from localStorage and render
    loadItems();
    renderTable(1);
    // batch rows는 토글 시 생성(초기 로드에서 생성하고 싶으면 initBatchRows(); 호출)
  });

})();


const LOGIN_DURATION = 30 * 60 * 1000; // 1분 유효시간

(function () {
  const expireTime = sessionStorage.getItem("expireTime");
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");

  if (!isLoggedIn || !expireTime) {
    alert("⚠️ 로그인 상태가 아닙니다. 다시 로그인 해주세요.");
    window.location.href = "login.html";
    return;
  }

  let expireTimeNum = Number(expireTime);

  // 모달 요소들
  const modal = document.getElementById("session-modal");
  const timeText = document.getElementById("session-time-text");
  const extendBtn = document.getElementById("extend-session-btn");
  const logoutBtn = document.getElementById("logout-now-btn");

  function formatTime(ms) {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, "0");
    const seconds = String(totalSeconds % 60).padStart(2, "0");
    return `${minutes}:${seconds}`;
  }

  function logout() {
  alert("⏰ 세션이 만료되어 자동 로그아웃 됩니다.");
  sessionStorage.clear();
  window.location.href = "../login/index.html";
}

logoutBtn.addEventListener("click", () => {
  modal.style.display = "none";
  logout(); // 연장 안함 누르면 즉시 로그아웃
});


  // 연장 버튼 클릭 시 실행
  extendBtn.addEventListener("click", () => {
    expireTimeNum = Date.now() + LOGIN_DURATION;
    sessionStorage.setItem("expireTime", expireTimeNum.toString());
    modal.style.display = "none";
  });

  // 연장 안함 버튼 클릭 시 실행
  logoutBtn.addEventListener("click", () => {
    modal.style.display = "none";
  });

  // 1초마다 타이머 업데이트 및 조건 체크
  const intervalId = setInterval(() => {
    const now = Date.now();
    const remaining = expireTimeNum - now;

    if (remaining <= 0) {
      clearInterval(intervalId);
      logout();
      return;
    }

    // 모달에 남은 시간 표시
    timeText.textContent = `남은 로그인 시간: ${formatTime(remaining)}`;

    // 30초 이하이면 모달 띄우기 (한번만 띄우기 위해 display 상태 체크)
    if (remaining <= 30 * 1000 && modal.style.display === "none") {
      modal.style.display = "flex";
    }
  }, 1000);
})();

