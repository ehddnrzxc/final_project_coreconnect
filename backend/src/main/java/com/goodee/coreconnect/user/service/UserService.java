package com.goodee.coreconnect.user.service;

import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.user.dto.request.CreateUserReq;
import com.goodee.coreconnect.user.dto.response.UserDto;
import com.goodee.coreconnect.user.entity.Status;

public interface UserService {
  
  public void updateProfileImage(String email, MultipartFile file) throws IOException;
  public String getProfileImageUrlByEmail(String email);
  public UserDto createUser(CreateUserReq req);
  public void changeStatus(Integer userId, Status status);

}
