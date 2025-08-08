function loadPage(url) {
  document.getElementById("mainFrame").src = url;
}

document.getElementById("login-form").addEventListener("submit", function (e) {
  e.preventDefault();

  const username = document.getElementById("username").value.trim();
  const password = document.getElementById("password").value.trim();
  const errorText = document.getElementById("login-error");

  // 실제 아이디와 비밀번호를 여기에 설정
  const validUsername = "champion224";
  const validPassword = "1234";

  if (username === validUsername && password === validPassword) {
    // 로그인 성공 시 이동
    location.href = "Dashboard.html";
  } else {
    // 로그인 실패 시 오류 메시지 표시
    errorText.textContent = "아이디 또는 비밀번호가 올바르지 않습니다.";
    errorText.style.display = "block";
  }
});
