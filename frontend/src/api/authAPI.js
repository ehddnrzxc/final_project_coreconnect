import http from "./http";

// 로그인
export async function login(email, password) {
  const { data } = await http.post("/auth/login", { email, password });
  console.log("서버 응답:", data);
  return data; // { accessToken, user }
}

// 액세스 재발급
export async function refreshAccessToken() {
  const { data } = await http.post("/auth/refresh", {}); 
  return data; // { accessToken }
}

// 로그아웃
export async function logout() {
  await http.post("/auth/logout", {}); 
}