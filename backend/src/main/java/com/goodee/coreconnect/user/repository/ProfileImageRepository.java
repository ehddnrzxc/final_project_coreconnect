package com.goodee.coreconnect.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.user.entity.ProfileImage;

public interface ProfileImageRepository extends JpaRepository<ProfileImage, Integer> {

  
}
