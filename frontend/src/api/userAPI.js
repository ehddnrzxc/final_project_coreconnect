// src/api/userAPI.js
import http from "./http";

// 현재 사용자 프로필 이미지 URL 조회
export async function getMyProfileImage() {
  const { data } = await http.get("/user/profile-image");
  // 백엔드가 { imageUrl: "..." } 반환
  return data?.imageUrl || "";
}

// 현재 사용자 프로필 이미지 업로드 (FormData)
export async function uploadMyProfileImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await http.post("/user/profile-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; // 필요 시 서버 응답 활용
}
