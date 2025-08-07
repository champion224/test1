const LOGIN_DURATION = 30 * 60 * 1000; // 30초 예시 (필요시 변경)

document.addEventListener("DOMContentLoaded", () => {
  const loginForm = document.getElementById("login-form");
  const errorMsg = document.getElementById("login-error");

  loginForm.addEventListener("submit", function (e) {
    e.preventDefault();

    const usernameInput = document.getElementById("username");
    const passwordInput = document.getElementById("password");

    const username = usernameInput.value.trim();
    const password = passwordInput.value.trim();

    const validId = "champion224";
    const validPw = "1234";

    if (username === validId && password === validPw) {
      // 로그인 성공
      const expireTime = Date.now() + LOGIN_DURATION;
      sessionStorage.setItem("isLoggedIn", "true");
      sessionStorage.setItem("expireTime", expireTime.toString());

      alert("✅ 로그인이 완료되었습니다.");
      window.location.href = "../Main/main.html";
      // 로그인 실패
      errorMsg.textContent = "❌ 아이디 또는 비밀번호가 틀렸습니다.";
      errorMsg.style.display = "block";

      usernameInput.value = "";
      passwordInput.value = "";
      usernameInput.focus();
    }
  });
});
