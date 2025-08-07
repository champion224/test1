// main.js

function loadPage(url) {
  document.getElementById("mainFrame").src = url;
}


const LOGIN_DURATION = 30 * 60 * 1000; // 1분 유효시간

(function () {
  const expireTime = sessionStorage.getItem("expireTime");
  const isLoggedIn = sessionStorage.getItem("isLoggedIn");

  if (!isLoggedIn || !expireTime) {
    alert("⚠️ 로그인 상태가 아닙니다. 다시 로그인 해주세요.");
    window.location.href = "../login/index.html";
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
