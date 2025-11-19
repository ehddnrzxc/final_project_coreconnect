/**
 * 사용자 관련 API 요청들을 모아둔 유틸 모듈.
 * 사용자 정보, 프로필, 관리자용 유저 관리 등.
 */

import http from "../../../api/http";

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

// 로그인된 사용자의 부서 ID 조회
export async function getUserDeptId() {
  const res = await http.get("/departments/get-dept-id");
  return res.data;
} 

// 로그인된 사용자의 프로필 표시용 정보 조회
export async function getMyProfileInfo() {
  const res = await http.get("/user/profile-info");
  return res.data; 
}

// 비밀번호 변경
export async function changePassword(currentPassword, newPassword, confirmPassword) {
  const res = await http.put("/user/password", {
    currentPassword,
    newPassword,
    confirmPassword,
  });
  return res.data;
}

// 프로필 정보 조회
export async function getDetailProfileInfo() {
  const res = await http.get("/user/detail-profile");
  return res.data;
}

// 프로필 정보 수정
export async function updateDetailProfileInfo(profileData) {
  const res = await http.put("/user/detail-profile", profileData);
  return res.data;
}