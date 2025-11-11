/**
 * 사용자 관련 API 요청들을 모아둔 유틸 모듈.
 * 사용자 정보, 프로필, 관리자용 유저 관리 등.
 */

import http from "../../../api/http";

// 현재 사용자 프로필 이미지 URL 조회
export async function getMyProfileImage() {
  const { data } = await http.get("/user/profile-image");
  return data?.imageUrl || "";
}

// 현재 사용자 프로필 이미지 업로드 (FormData)
export async function uploadMyProfileImage(file) {
  // FormData: HTML <form> 데이터를 자바스크립트에서 직접 만드는 객체
  const formData = new FormData();
  formData.append("file", file);

  const { data } = await http.post("/user/profile-image", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return data; 
}

// 관리자용 사원 리스트 조회
export const getAdminUsers = () => http.get("/user").then(res => res.data);

// 조직도/사용자 조회
export const getOrganizationChart = () => http.get("/user/organization");