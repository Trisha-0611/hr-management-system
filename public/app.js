document.getElementById("loginBtn").addEventListener("click", async () => {
  const hr_id = document.getElementById("hr_id").value;
  const password = document.getElementById("password").value;

  if (!hr_id || !password) {
    alert("Please enter both HR ID and password");
    return;
  }

  try {
    const response = await fetch("/api/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hr_id, password }),
    });

    const data = await response.json();

    if (response.ok) {
      // Save token for later authenticated requests
      localStorage.setItem("token", data.token);
      localStorage.setItem("hr_id", data.hr_id);

      alert("Login successful!");
      window.location.href = "dashboard.html";
    } else {
      alert(data.error || "Login failed");
    }
  } catch (err) {
    console.error("Error:", err);
    alert("Server not responding");
  }
});
