package com.goodee.coreconnect.admin.service;

import com.goodee.coreconnect.admin.dto.request.CreateUserReqDTO;
import com.goodee.coreconnect.admin.dto.request.UpdateUserReqDTO;
import com.goodee.coreconnect.user.dto.response.UserDTO;

public interface AdminUserService {
  UserDTO createUser(CreateUserReqDTO req);
  UserDTO updateUser(Integer userId, UpdateUserReqDTO req);
  long getAllUserCount();
  long getAllActiveUserCount();
}
