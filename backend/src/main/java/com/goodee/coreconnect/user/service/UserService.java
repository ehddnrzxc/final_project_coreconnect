package com.goodee.coreconnect.user.service;

import java.io.IOException;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.user.dto.request.UserDetailProfileUpdateRequestDTO;
import com.goodee.coreconnect.user.dto.response.OrganizationUserResponseDTO;
import com.goodee.coreconnect.user.dto.response.UserDTO;
import com.goodee.coreconnect.user.dto.response.UserDetailProfileDTO;
import com.goodee.coreconnect.user.entity.User;

public interface UserService {
  /** 프로필 이미지를 업로드 */
  void updateProfileImage(String email, MultipartFile file) throws IOException;

  /** 프로필 이미지 URL을 조회 */
  String getProfileImageUrlByEmail(String email);

  /** 전체 사용자 목록을 조회 */
  List<UserDTO> findAllUsers();

  /** 조직도용 사용자 목록을 조회 */
  List<OrganizationUserResponseDTO> getOrganizationChart();

  /** 이메일로 사용자 엔티티를 조회 */
  User getUserByEmail(String email);

  /** 이메일로 사용자의 부서 ID를 조회 */
  Integer getDeptIdByEmail(String email);
  
  /** 이메일로 프로필 카드 표시용 사용자의 정보를 조회 */
  UserDTO getProfile(String email);
  
  /** 비밀번호 변경 */
  void changePassword(String email, String currentPassword, String newPassword);
  
  /** 프로필 정보 조회 */
  UserDetailProfileDTO getDetailProfileInfo(String email);
  
  /** 프로필 정보 수정 */
  void updateDetailProfileInfo(String email, UserDetailProfileUpdateRequestDTO requestDTO);
}
