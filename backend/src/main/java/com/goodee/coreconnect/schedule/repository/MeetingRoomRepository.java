package com.goodee.coreconnect.schedule.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.schedule.entity.MeetingRoom;

public interface MeetingRoomRepository extends JpaRepository<MeetingRoom, Integer> {

}
