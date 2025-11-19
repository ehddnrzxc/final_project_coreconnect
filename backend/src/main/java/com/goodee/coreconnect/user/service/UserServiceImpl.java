package com.goodee.coreconnect.user.service;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;

import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

import com.goodee.coreconnect.common.service.S3Service;
import com.goodee.coreconnect.user.dto.response.OrganizationUserResponseDTO;
import com.goodee.coreconnect.user.dto.response.UserDTO;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final S3Service s3Service;
  private final PasswordEncoder passwordEncoder;
  

  /** 프로필 이미지를 업로드 */
  @Override
  public void updateProfileImage(String email, MultipartFile file) throws IOException {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

    String key = s3Service.uploadProfileImage(file, user.getEmail());

    user.updateProfileImage(key);
    userRepository.save(user);
  }

  /** 프로필 이미지 URL을 조회 */
  @Override
  public String getProfileImageUrlByEmail(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
    String key = user.getProfileImageKey();
    if (key == null || key.isBlank()) {
      return "";
    }
    return s3Service.getFileUrl(key);
  }

  

  /** 전체 사용자 목록을 조회 */
  @Override
  @Transactional(readOnly = true)
  public List<UserDTO> findAllUsers() {
    return userRepository.findAll()
        .stream()
        .map(UserDTO::toDTO)
        .toList();
  }

  /** 조직도용 사용자 목록을 조회 */
  @Override
  @Transactional(readOnly = true)
  public List<OrganizationUserResponseDTO> getOrganizationChart() {
    List<User> users = userRepository.findAllForOrganization();
    return users.stream()
        .map(OrganizationUserResponseDTO::fromEntity)
        .collect(Collectors.toList());
  }

  /** 이메일로 사용자 엔티티를 조회 */
  @Override
  @Transactional(readOnly = true)
  public User getUserByEmail(String email) {
    return userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다."));
  }

  /** 이메일로 사용자의 부서 ID를 조회 */
  @Override
  @Transactional(readOnly = true)
  public Integer getDeptIdByEmail(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    return user.getDepartment() != null ? user.getDepartment().getId() : null;
  }
  
  /** 이메일로 프로필 카드 표시용 사용자의 정보를 조회 */
  @Override
  public UserDTO getProfile(String email) {
    User user = userRepository.findByEmail(email)
                              .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    UserDTO dto = UserDTO.toDTO(user);
    
    // profileImageKey를 URL로 변환
    String imageUrl = "";
    if (dto.profileImageKey() != null && !dto.profileImageKey().isBlank()) {
      imageUrl = s3Service.getFileUrl(dto.profileImageKey());
    }
    
    // profileImageUrl을 포함한 새 DTO 반환
    return new UserDTO(
        dto.id(),
        dto.email(),
        dto.name(),
        dto.phone(),
        dto.role(),
        dto.status(),
        dto.deptId(),
        dto.deptName(),
        dto.joinDate(),
        dto.jobGrade(),
        dto.profileImageKey(),
        imageUrl,
        dto.employeeNumber()
    );
  }
  
  /** 비밀번호 변경 */
  @Override
  @Transactional
  public void changePassword(String email, String currentPassword, String newPassword) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    
    // 현재 비밀번호 확인
    if (!passwordEncoder.matches(currentPassword, user.getPassword())) {
      throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "현재 비밀번호가 일치하지 않습니다.");
    }
    
    // 새 비밀번호 암호화
    String encodedNewPassword = passwordEncoder.encode(newPassword);
    user.changePassword(encodedNewPassword);
    userRepository.save(user);
  }
  
}
