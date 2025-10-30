package com.goodee.coreconnect.schedule.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.schedule.entity.MeetingRoom;

public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Integer> {

  /** 삭제 여부로 조회 */
  List<MeetingRoom> findByDeletedYn(Boolean deletedYn);

  /** 예약 가능 여부로 조회 */
  List<MeetingRoom> findByAvailableYn(Boolean availableYn);

  /** 삭제 여부 + 예약 가능 여부로 조회 */
  List<MeetingRoom> findByDeletedYnAndAvailableYn(Boolean deletedYn, Boolean availableYn);
  
}
