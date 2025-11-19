package com.goodee.coreconnect.admin.service;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.admin.dto.request.CreateUserReqDTO;
import com.goodee.coreconnect.admin.dto.request.UpdateUserReqDTO;
import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.department.repository.DepartmentRepository;
import com.goodee.coreconnect.user.dto.response.UserDTO;
import com.goodee.coreconnect.user.entity.JobGrade;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.entity.Status;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;
import com.goodee.coreconnect.user.service.EmployeeNumberService;

import lombok.RequiredArgsConstructor;

/** 관리자용 사용자 관리 서비스 */
@Service
@RequiredArgsConstructor
@Transactional
public class AdminUserServiceImpl implements AdminUserService {

  private final UserRepository userRepository;
  private final DepartmentRepository departmentRepository;
  private final PasswordEncoder passwordEncoder;
  private final EmployeeNumberService employeeNumberService;

  /** 신규 사용자 생성 */
  @Override
  public UserDTO createUser(CreateUserReqDTO req) {
    if (userRepository.existsByEmail(req.email())) {
      throw new IllegalArgumentException("이미 등록된 이메일입니다: " + req.email());
    }

    Department department = null;
    if (req.deptId() != null) {
      department = departmentRepository.findById(req.deptId())
          .orElseThrow(() -> new IllegalArgumentException("존재하지 않는 부서 ID: " + req.deptId()));
    }

    // 사번 자동 생성 (연도 4자리 + 자동 증가 3자리)
    String employeeNumber = employeeNumberService.generateEmployeeNumber();

    User user = User.createUser(
        passwordEncoder.encode(req.tempPassword()),
        req.name(),
        req.role(),
        req.email(),
        req.phone(),
        department,
        req.jobGrade(),
        employeeNumber);

    return UserDTO.toDTO(userRepository.save(user));
  }

  /** 사용자 정보 수정 */
  @Override
  public UserDTO updateUser(Integer userId, UpdateUserReqDTO req) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    if (req.name() != null && !req.name().isBlank()) {
      user.changeName(req.name());
    }

    if (req.phone() != null) {
      user.changePhone(req.phone());
    }

    if (req.status() != null) {
      if (req.status() == Status.ACTIVE) {
        user.activate();
      } else if (req.status() == Status.INACTIVE) {
        user.deactivate();
      }
    }

    if (req.role() != null) {
      user.changeRole(req.role());
    }

    if (req.jobGrade() != null) {
      user.changeJobGrade(req.jobGrade());
    }

    if (req.deptId() != null) {
      Department department = departmentRepository.findById(req.deptId())
          .orElseThrow(() -> new IllegalArgumentException("부서를 찾을 수 없습니다."));
      user.changeDepartment(department);
    }

    return UserDTO.toDTO(user);
  }

  /** 사용자 상태 변경 */
  @Override
  public void changeStatus(Integer userId, Status status) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자가 존재하지 않습니다: " + userId));

    if (status == Status.ACTIVE) {
      user.activate();
    } else if (status == Status.INACTIVE) {
      user.deactivate();
    }
  }

  /** 사용자 부서 변경 */
  @Override
  public void changeUserDepartment(Integer userId, Integer deptId) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));

    if (deptId == null) {
      user.changeDepartment(null);
      return;
    }

    Department department = departmentRepository.findById(deptId)
        .orElseThrow(() -> new IllegalArgumentException("부서를 찾을 수 없습니다."));
    user.changeDepartment(department);
  }

  /** 사용자 직급 변경 */
  @Override
  public void changeUserJobGrade(Integer userId, JobGrade jobGrade) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    user.changeJobGrade(jobGrade);
  }

  /** 사용자 권한(Role) 변경 */
  @Override
  public void changeUserRole(Integer userId, Role newRole) {
    User user = userRepository.findById(userId)
        .orElseThrow(() -> new IllegalArgumentException("사용자를 찾을 수 없습니다."));
    user.changeRole(newRole);
  }

  /** 전체 사용자 수 조회 */
  @Override
  @Transactional(readOnly = true)
  public long getAllUserCount() {
    return userRepository.count();
  }

  /** 활성 사용자 수 조회 */
  @Override
  @Transactional(readOnly = true)
  public long getAllActiveUserCount() {
    return userRepository.countByStatus(Status.ACTIVE);
  }
}
