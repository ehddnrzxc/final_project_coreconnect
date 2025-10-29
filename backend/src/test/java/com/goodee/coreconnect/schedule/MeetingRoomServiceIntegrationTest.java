package com.goodee.coreconnect.schedule;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.schedule.dto.MeetingRoomDTO;
import com.goodee.coreconnect.schedule.entity.MeetingRoom;
import com.goodee.coreconnect.schedule.repository.MeetingRoomRepository;
import com.goodee.coreconnect.schedule.service.MeetingRoomService;

@SpringBootTest
@Transactional
public class MeetingRoomServiceIntegrationTest {

  @Autowired
  private MeetingRoomService meetingRoomService;

  @Autowired
  private MeetingRoomRepository meetingRoomRepository;

  @Test
  @DisplayName("1️⃣회의실 생성 테스트")
  void testCreateMeetingRoom() {
    MeetingRoomDTO dto = new MeetingRoomDTO();
    dto = MeetingRoomDTO.builder()
            .name("회의실 A")
            .location("본관 1층")
            .capacity(8)
            .build();

    MeetingRoomDTO response = meetingRoomService.createMeetingRoom(dto);

    assertThat(response).isNotNull();
    assertThat(response.getName()).isEqualTo("회의실 A");
    System.out.println("회의실 생성 성공: " + response);
  }

  @Test
  @DisplayName("2️⃣회의실 수정 테스트")
  void testUpdateMeetingRoom() {
    MeetingRoom room = meetingRoomRepository.save(MeetingRoom.createMeetingRoom("테스트룸", "2층", 5));

    MeetingRoomDTO dto = new MeetingRoomDTO();
    dto = MeetingRoomDTO.builder()
            .name("수정된 회의실")
            .location("3층")
            .capacity(10)
            .build();

    MeetingRoomDTO updated = meetingRoomService.updateMeetingRoom(room.getId(), dto);

    assertThat(updated.getName()).isEqualTo("수정된 회의실");
    assertThat(updated.getCapacity()).isEqualTo(10);
    System.out.println("회의실 수정 성공: " + updated);
  }

  @Test
  @DisplayName("3️⃣회의실 목록 조회 테스트")
  void testGetAllRooms() {
    meetingRoomRepository.save(MeetingRoom.createMeetingRoom("룸1", "A동", 5));
    meetingRoomRepository.save(MeetingRoom.createMeetingRoom("룸2", "B동", 10));

    List<MeetingRoomDTO> list = meetingRoomService.getAllRooms();

    assertThat(list).isNotEmpty();
    System.out.println("회의실 목록 조회 성공: " + list.size() + "건");
  }

  @Test
  @DisplayName("4️⃣회의실 삭제 테스트 (Soft Delete)")
  void testDeleteMeetingRoom() {
    MeetingRoom saved = meetingRoomRepository.save(MeetingRoom.createMeetingRoom("삭제룸", "본관", 4));

    meetingRoomService.deleteMeetingRoom(saved.getId());

    MeetingRoom deleted = meetingRoomRepository.findById(saved.getId()).orElseThrow();
    assertThat(deleted.getDeletedYn()).isTrue();
    assertThat(deleted.getAvailableYn()).isFalse();
    System.out.println("회의실 삭제 성공 (Soft Delete): ID=" + deleted.getId());
  }
}
