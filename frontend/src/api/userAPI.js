import http from "./http";

// 프로필 이미지 조회
export async function getMyProfileImage() {
  const { data } = await http.get("/user/profile-image");
  return data?.imageUrl || "";
}

// 프로필 이미지 업로드 (로그인 사용자 기준)
export async function uploadMyProfileImage(file) {
  const formData = new FormData();
  formData.append("file", file);

  await http.post("/user/profile-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
}
