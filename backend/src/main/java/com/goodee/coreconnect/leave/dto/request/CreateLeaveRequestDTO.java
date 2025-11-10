package com.goodee.coreconnect.leave.dto.request;

import java.time.LocalDate;

import com.goodee.coreconnect.leave.entity.LeaveRequest;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record CreateLeaveRequestDTO(
    @NotNull(message = "시작일은 필수입니다.")
    LocalDate startDate,
    
    @NotNull(message = "종료일은 필수입니다.")
    LocalDate endDate,
    
    @NotBlank(message = "휴가 종류는 필수입니다.")
    @Size(max = 50)
    String type,
    
    @Size(max = 255)
    String reason
) {
  /** 요청 DTO -> Entity 변환 메소드 */
  public LeaveRequest toEntity(User user) {
    return LeaveRequest.createLeaveRequest(user,
                                           startDate, 
                                           endDate,
                                           type,
                                           reason
    );
  }  
}
