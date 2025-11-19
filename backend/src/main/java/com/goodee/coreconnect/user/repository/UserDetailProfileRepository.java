package com.goodee.coreconnect.user.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.entity.UserDetailProfile;

public interface UserDetailProfileRepository extends JpaRepository<UserDetailProfile, Integer> {
    
    /**
     * 사용자로 프로필 조회
     */
    Optional<UserDetailProfile> findByUser(User user);
    
    /**
     * 사용자 ID로 프로필 조회
     */
    Optional<UserDetailProfile> findByUser_Id(Integer userId);
    
    /**
     * 사용자 이메일로 프로필 조회
     */
    Optional<UserDetailProfile> findByUser_Email(String email);
}

