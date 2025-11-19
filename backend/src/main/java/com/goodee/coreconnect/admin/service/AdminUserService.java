package com.goodee.coreconnect.admin.service;

import com.goodee.coreconnect.admin.dto.request.CreateUserReqDTO;
import com.goodee.coreconnect.admin.dto.request.UpdateUserReqDTO;
import com.goodee.coreconnect.user.dto.response.UserDTO;
import com.goodee.coreconnect.user.enums.JobGrade;
import com.goodee.coreconnect.user.enums.Role;
import com.goodee.coreconnect.user.enums.Status;

public interface AdminUserService {
  UserDTO createUser(CreateUserReqDTO req);
  UserDTO updateUser(Integer userId, UpdateUserReqDTO req);
  void changeStatus(Integer userId, Status status);
  void changeUserDepartment(Integer userId, Integer deptId);
  void changeUserJobGrade(Integer userId, JobGrade jobGrade);
  void changeUserRole(Integer userId, Role newRole);
  long getAllUserCount();
  long getAllActiveUserCount();
}
