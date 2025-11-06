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

import com.goodee.coreconnect.common.S3Service;
import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.department.repository.DepartmentRepository;
import com.goodee.coreconnect.user.dto.request.CreateUserReqDTO;
import com.goodee.coreconnect.user.dto.response.OrganizationUserResponseDTO;
import com.goodee.coreconnect.user.dto.response.UserDTO;
import com.goodee.coreconnect.user.entity.JobGrade;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.entity.Status;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final S3Service s3Service; 
  private final DepartmentRepository departmentRepository;
  private final PasswordEncoder passwordEncoder;

  /** 프로필 이미지 업로드 */
  @Override
  public void updateProfileImage(String email, MultipartFile file) throws IOException {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));

    // 1. S3에 업로드 -> key 반환
    String key = s3Service.uploadProfileImage(file, user.getEmail());

    // 2. DB에 key 저장
    user.updateProfileImage(key);
    userRepository.save(user);
  }

  /** 프로필 이미지 URL 반환 */
  @Override
  public String getProfileImageUrlByEmail(String email) {
    // email로 User 엔티티 조회
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "USER_NOT_FOUND"));
    // User 엔티티에서 profileImageKey 필드를 조회
    String key = user.getProfileImageKey();
    // 기본 이미지 없으면 빈문자열 or 기본 URL 리턴
    if (key == null || key.isBlank()) {
      return ""; 
    }

    // S3Service 통해 공개 URL 반환
    return s3Service.getFileUrl(key);
  }

  @Override
  @Transactional
  public UserDTO createUser(CreateUserReqDTO req) {
    // 1) 중복 이메일 방지
    if (userRepository.existsByEmail(req.email())) {
      throw new IllegalArgumentException("이미 등록된 이메일입니다: " + req.email());
    }

    // 2) 부서 조회(선택)
    Department dept = null;
    if (req.deptId() != null) {
      dept = departmentRepository.findById(req.deptId())
          .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 부서 ID: " + req.deptId()));
    }

    // 3) 패스워드 해시
    String hash = passwordEncoder.encode(req.tempPassword());

    // 4) 유저 생성(정적 팩토리 사용)
    User user = User.createUser(
        hash,
        req.name(),
        req.role(),
        req.email(),
        req.phone(),
        dept,
        req.jobGrade()

        );

    // (옵션) 기본 상태 보정
    if (user.getStatus() == null) {
      // createUser에서 ACTIVE로 넣고 있으므로 보통 필요 없음
      // user.activate() 같은 메서드가 있다면 호출
    }

    // 5) 저장 & 반환
    return UserDTO.toDTO(userRepository.save(user));
  }
  @Override
  @Transactional
  public void changeStatus(Integer userId, Status status) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("유저가 존재하지 않습니다: " + userId));
    if (status == Status.ACTIVE) {
      user.activate();
    } else if (status == Status.INACTIVE) {
      user.deactivate();
    }
  }
  @Override
  @Transactional(readOnly = true)
  public List<UserDTO> findAllUsers() {
    List<UserDTO> userList = userRepository.findAll()
        .stream()
        .map(UserDTO::toDTO)
        .toList();
    return userList;
  }
  /**
   * 유저의 부서 변경 메소드
   */
  @Override
  @Transactional
  public void moveUserToDepartment(Integer userId, Integer newDeptId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    Department newDept = departmentRepository.findById(newDeptId)
        .orElseThrow(() -> new IllegalArgumentException("부서를 찾을 수 없습니다."));

    user.changeDepartment(newDept);
  }
  /**
   * 유저의 직급 변경 메소드
   */
  @Override
  @Transactional
  public void moveUserToJobGrade(Integer userId, JobGrade jobGrade) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    user.changeJobGrade(jobGrade);
  }

  /**
   * 유저의 권한(Role) 변경 메소드
   */
  @Override
  @Transactional
  public void moveUserToRole(Integer userId, Role newRole) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    user.changeRole(newRole);
  }

  /** 모든 사용자 수를 조회하는 메소드 */
  @Override
  public Long getAllUserCount() {
    return userRepository.count();
  }

  /** 모든 활성화된 사용자 수를 조회하는 메소드 */
  @Override
  public Long getAllActiveUserCount() {
    return userRepository.countByStatus(Status.ACTIVE);
  }

  /** 조직도 전체 사용자 목록 조회 */
  @Override
  public List<OrganizationUserResponseDTO> getOrganizationChart() {
    List<User> users = userRepository.findAllForOrganization();
    return users.stream()
        .map(OrganizationUserResponseDTO::fromEntity)
        .collect(Collectors.toList());
  }




}
