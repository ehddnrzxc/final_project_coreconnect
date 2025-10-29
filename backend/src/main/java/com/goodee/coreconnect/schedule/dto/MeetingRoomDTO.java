package com.goodee.coreconnect.schedule.dto;

import com.goodee.coreconnect.schedule.entity.MeetingRoom;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.ToString;

@NoArgsConstructor
@AllArgsConstructor
@Getter
@Builder
@ToString
public class MeetingRoomDTO {

  private Integer id;
  
  private String name;
  
  private String location;
  
  private Integer capacity;
  
  private Boolean deletedYn;
  
  private Boolean availableYn;

  /** DTO → Entity 변환 */
  public MeetingRoom toEntity() {
      return MeetingRoom.createMeetingRoom(name, location, capacity);
  }

  /** Entity → DTO 변환 */
  public static MeetingRoomDTO toDTO(MeetingRoom entity) {
    MeetingRoomDTO dto = new MeetingRoomDTO();
    dto.id = entity.getId();
    dto.name = entity.getName();
    dto.location = entity.getLocation();
    dto.capacity = entity.getCapacity();
    dto.deletedYn = entity.getDeletedYn();
    dto.availableYn = entity.getAvailableYn();
    return dto;
  }
  
}
