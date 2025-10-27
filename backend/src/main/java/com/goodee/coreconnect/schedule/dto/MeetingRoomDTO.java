package com.goodee.coreconnect.schedule.dto;

import com.goodee.coreconnect.schedule.entity.MeetingRoom;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
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
    dto.setId(entity.getId());
    dto.setName(entity.getName());
    dto.setLocation(entity.getLocation());
    dto.setCapacity(entity.getCapacity());
    dto.setDeletedYn(entity.getDeletedYn());
    dto.setAvailableYn(entity.getAvailableYn());
    return dto;
  }
  
}
