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
import com.goodee.coreconnect.user.dto.request.UserDetailProfileUpdateRequestDTO;
import com.goodee.coreconnect.user.dto.response.BirthdayUserDTO;
import com.goodee.coreconnect.user.dto.response.OrganizationUserResponseDTO;
import com.goodee.coreconnect.user.dto.response.UserDTO;
import com.goodee.coreconnect.user.dto.response.UserDetailProfileDTO;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.entity.UserDetailProfile;
import com.goodee.coreconnect.user.repository.UserDetailProfileRepository;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserServiceImpl implements UserService {

  private final UserRepository userRepository;
  private final UserDetailProfileRepository userDetailProfileRepository;
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
    // Department를 함께 로드하여 LazyInitializationException 방지
    return userRepository.findAllWithDepartment()
        .stream()
        .map(user -> {
          UserDTO dto = UserDTO.toDTO(user);
          
          // user.getProfileImageKey()를 직접 사용하여 S3 URL로 변환
          String imageUrl = "";
          String profileImageKey = user.getProfileImageKey();
          
          if (profileImageKey != null && !profileImageKey.isBlank()) {
            try {
              imageUrl = s3Service.getFileUrl(profileImageKey);
              System.out.println("[UserServiceImpl.findAllUsers] userId: " + user.getId() + 
                                ", profileImageKey: " + profileImageKey + 
                                ", profileImageUrl: " + imageUrl.substring(0, Math.min(50, imageUrl.length())) + "...");
            } catch (Exception e) {
              System.err.println("[UserServiceImpl.findAllUsers] S3 URL 변환 실패: userId=" + user.getId() + 
                               ", profileImageKey=" + profileImageKey + ", error=" + e.getMessage());
              imageUrl = "";
            }
          } else {
            System.out.println("[UserServiceImpl.findAllUsers] userId: " + user.getId() + 
                             ", profileImageKey가 null 또는 빈 문자열");
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
              profileImageKey, // 원본 profileImageKey 사용
              imageUrl,        // 변환된 S3 URL
              dto.employeeNumber()
          );
        })
        .toList();
  }

  /** 조직도용 사용자 목록을 조회 */
  @Override
  @Transactional(readOnly = true)
  public List<OrganizationUserResponseDTO> getOrganizationChart() {
    List<User> users = userRepository.findAllForOrganization();
    System.out.println("[UserServiceImpl.getOrganizationChart] 전체 사용자 수: " + users.size());
    
    List<OrganizationUserResponseDTO> result = users.stream()
        .map(user -> {
          OrganizationUserResponseDTO dto = OrganizationUserResponseDTO.fromEntity(user, s3Service);
          // 변환 결과 확인
          if (dto != null && dto.getProfileImageUrl() != null && !dto.getProfileImageUrl().isBlank()) {
            System.out.println("[UserServiceImpl.getOrganizationChart] ✅ 프로필 이미지 URL 생성 성공 - userId: " + 
                             user.getId() + ", name: " + user.getName() + ", url: " + 
                             dto.getProfileImageUrl().substring(0, Math.min(50, dto.getProfileImageUrl().length())) + "...");
          } else {
            System.out.println("[UserServiceImpl.getOrganizationChart] ⚠️ 프로필 이미지 URL 없음 - userId: " + 
                             user.getId() + ", name: " + user.getName() + ", profileImageKey: " + user.getProfileImageKey());
          }
          return dto;
        })
        .collect(Collectors.toList());
    
    // 프로필 이미지가 있는 사용자 수 확인
    long usersWithImage = result.stream()
        .filter(dto -> dto != null && dto.getProfileImageUrl() != null && 
                      !dto.getProfileImageUrl().isBlank() && 
                      dto.getProfileImageUrl().startsWith("http"))
        .count();
    
    System.out.println("[UserServiceImpl.getOrganizationChart] 프로필 이미지 통계 - 전체: " + result.size() + 
                      ", 이미지 있음: " + usersWithImage + ", 이미지 없음: " + (result.size() - usersWithImage));
    
    return result;
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
  
  /** 프로필 정보 조회 */
  @Override
  @Transactional(readOnly = true)
  public UserDetailProfileDTO getDetailProfileInfo(String email) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    
    UserDetailProfile profile = userDetailProfileRepository.findByUser(user)
        .orElse(null);
    
    return UserDetailProfileDTO.toDTO(profile);
  }
  
  /** 프로필 정보 수정 */
  @Override
  @Transactional
  public void updateDetailProfileInfo(String email, UserDetailProfileUpdateRequestDTO requestDTO) {
    User user = userRepository.findByEmail(email)
        .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "사용자를 찾을 수 없습니다."));
    
    UserDetailProfile profile = userDetailProfileRepository.findByUser(user)
        .orElseGet(() -> {
            // 프로필이 없으면 새로 생성
            UserDetailProfile newProfile = UserDetailProfile.createProfile(user);
            return userDetailProfileRepository.save(newProfile);
        });
    
    // 프로필 정보 업데이트
    profile.updateProfile(
        requestDTO.companyName(),
        requestDTO.directPhone(),
        requestDTO.fax(),
        requestDTO.address(),
        requestDTO.birthday(),
        requestDTO.bio(),
        requestDTO.externalEmail()
    );
    
    userDetailProfileRepository.save(profile);
  }
  
  /** 특정 월의 생일자 목록 조회 */
  @Override
  @Transactional(readOnly = true)
  public List<BirthdayUserDTO> getBirthdayUsers(Integer year, Integer month) {
    List<UserDetailProfile> profiles = userDetailProfileRepository.findByBirthdayMonth(month);
    
    return profiles.stream()
        .map(profile -> {
          User user = profile.getUser();
          String imageUrl = "";
          if (user.getProfileImageKey() != null && !user.getProfileImageKey().isBlank()) {
            imageUrl = s3Service.getFileUrl(user.getProfileImageKey());
          }
          
          return new BirthdayUserDTO(
              user.getId(),
              user.getName(),
              user.getEmail(),
              user.getDepartment() != null ? user.getDepartment().getDeptName() : null,
              imageUrl,
              profile.getBirthday(),
              user.getEmployeeNumber()
          );
        })
        .toList();
  }
  
}
