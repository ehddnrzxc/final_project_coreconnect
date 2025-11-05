package com.goodee.coreconnect.user.service;

import java.io.IOException;
import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.user.dto.request.CreateUserReqDTO;
import com.goodee.coreconnect.user.dto.response.UserDTO;
import com.goodee.coreconnect.user.entity.JobGrade;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.entity.Status;

public interface UserService {
  
  public void updateProfileImage(String email, MultipartFile file) throws IOException;
  public String getProfileImageUrlByEmail(String email);
  public UserDTO createUser(CreateUserReqDTO req);
  public void changeStatus(Integer userId, Status status);
  public List<UserDTO> findAllUsers();
  public void moveUserToDepartment(Integer userId, Integer newDeptId);
  public void moveUserToJobGrade(Integer userId, JobGrade jobGrade);
  public void moveUserToRole(Integer userId, Role newRole);
  public Long getAllUserCount();
  public Long getAllActiveUserCount();

}
