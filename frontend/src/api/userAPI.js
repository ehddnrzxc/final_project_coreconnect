import http from "./http";

// 내 프로필 이미지 URL 가져오기
export async function getMyProfileImage() {
  const { data } = await http.get("/api/user/profile-image");
  // 백엔드가 { imageUrl: "..." } 형태라고 가정
  // 상대경로로 오면 서버 베이스 붙여주기
  const raw = data?.imageUrl || "";
  const absolute = raw.startsWith("/images")
    ? `${http.defaults.baseURL}${raw}`
    : raw;
  // 캐시 무효화 쿼리스트링
  return `${absolute}?v=${Date.now()}`;
}

// 프로필 이미지 업로드 (이메일로 식별하는 현재 코드에 맞춤)
export async function uploadMyProfileImageByEmail(email, file) {
  const formData = new FormData();
  formData.append("file", file);

  await http.post(`/api/user/${encodeURIComponent(email)}/profile-image`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  // 업로드만 하고 URL은 별도 조회
}
