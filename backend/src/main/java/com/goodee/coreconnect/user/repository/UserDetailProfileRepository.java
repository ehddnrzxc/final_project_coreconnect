package com.goodee.coreconnect.user.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

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
    
    /**
     * 특정 월의 생일자 목록 조회
     */
    @Query("""
        SELECT udp FROM UserDetailProfile udp
        JOIN FETCH udp.user u
        LEFT JOIN FETCH u.department d
        WHERE udp.birthday IS NOT NULL
        AND FUNCTION('MONTH', udp.birthday) = :month
        AND u.status = 'ACTIVE'
        ORDER BY FUNCTION('DAY', udp.birthday), u.name
        """)
    List<UserDetailProfile> findByBirthdayMonth(@Param("month") Integer month);
}

