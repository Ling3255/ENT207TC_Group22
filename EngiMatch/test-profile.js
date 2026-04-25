const BASE = "http://localhost:3001";

async function login(email, password) {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  console.log(`Login ${email}:`, data.success ? "OK" : `FAIL: ${data.error}`);
  return data;
}

async function getProfile() {
  const res = await fetch(`${BASE}/api/auth/profile`, { credentials: "include" });
  const data = await res.json();
  console.log("Profile:", JSON.stringify(data.data || data.error));
  return data;
}

async function updateProfile(name) {
  const res = await fetch(`${BASE}/api/auth/profile`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
    credentials: "include",
  });
  const data = await res.json();
  console.log(`Update name to "${name}":`, data.success ? "OK" : `FAIL: ${data.error}`);
  return data;
}

async function changePassword(currentPassword, newPassword) {
  const res = await fetch(`${BASE}/api/auth/password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ currentPassword, newPassword }),
    credentials: "include",
  });
  const data = await res.json();
  console.log(`Change password:`, data.success ? `OK: ${data.data?.message}` : `FAIL: ${data.data?.error || data.error}`);
  return data;
}

async function getSession() {
  const res = await fetch(`${BASE}/api/auth/session`, { credentials: "include" });
  const data = await res.json();
  console.log("Session:", JSON.stringify(data.data));
  return data;
}

async function main() {
  console.log("=== Test 1: Student login + profile ===");
  await login("student@engimatch.com", "123456");
  await getSession();
  await getProfile();
  await updateProfile("王小明 Updated");
  await getProfile();

  console.log("\n=== Test 2: Admin login + profile ===");
  await login("admin@engimatch.com", "123456");
  await getSession();
  await getProfile();
  await updateProfile("超级管理员 Updated");

  console.log("\n=== Test 3: Change password (will change back) ===");
  await changePassword("123456", "newpass123");
  await login("student@engimatch.com", "newpass123");
  await changePassword("newpass123", "123456");
  await login("student@engimatch.com", "123456");

  console.log("\n=== Test 4: Wrong current password ===");
  await changePassword("wrongpass", "newpass123");

  console.log("\n=== Test 5: Staff login + profile ===");
  await login("staff@engimatch.com", "123456");
  await getProfile();

  console.log("\n=== All tests completed ===");
}

main().catch(console.error);
