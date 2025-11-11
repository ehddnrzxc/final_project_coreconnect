package com.goodee.coreconnect.leave.dto.request;

import java.time.LocalDate;
import java.util.Map;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.goodee.coreconnect.approval.dto.request.DocumentCreateRequestDTO;
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
    String reason,
    
    Integer documentId
) {
  /** 요청 DTO -> Entity 변환 메소드 */
  public LeaveRequest toEntity(User user) {
    return LeaveRequest.createLeaveRequest(user,
                                           startDate, 
                                           endDate,
                                           type,
                                           reason,
                                           documentId
    );
  }  
  
  /** DocumentCreateRequestDTO -> CreateLeaveRequestDTO 변환 */
  public static CreateLeaveRequestDTO toCreateLeaveRequestDTO(DocumentCreateRequestDTO docDto,
                                                              Integer documentId,
                                                              ObjectMapper objectMapper) {
      try {
          // documentDataJson 파싱
          TypeReference<Map<String, Object>> typeRef = new TypeReference<>() {};
          Map<String, Object> data = objectMapper.readValue(docDto.getDocumentDataJson(), typeRef);

          String type   = (String) data.get("vacationType");   
          String reason = (String) data.get("reason");
          String start  = (String) data.get("startDate");   
          String end    = (String) data.get("endDate");

          LocalDate startDate = LocalDate.parse(start);
          LocalDate endDate   = LocalDate.parse(end);

          return new CreateLeaveRequestDTO(startDate, endDate, type, reason, documentId);

      } catch (Exception e) {
          throw new IllegalStateException("휴가 데이터 파싱 중 오류 발생", e);
      }
  }
}
