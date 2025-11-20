package com.goodee.coreconnect.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.enums.Status;

import jakarta.persistence.LockModeType;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    
    /**
     * ⭐ Department를 함께 로드하여 LazyInitializationException 방지
     * @param email 사용자 이메일
     * @return Department가 함께 로드된 User Optional
     */
    @Query("""
        SELECT u FROM User u
        LEFT JOIN FETCH u.department
        WHERE u.email = :email
        """)
    Optional<User> findByEmailWithDepartment(@Param("email") String email);
    
    Long countByStatus(Status status);
    
    @Query("""
        SELECT u FROM User u
        LEFT JOIN FETCH u.department d
        WHERE u.status = 'ACTIVE'
        ORDER BY d.deptOrderNo, u.name
        """)
    List<User> findAllForOrganization();
    
    /**
     * ⭐ Department를 함께 로드하여 LazyInitializationException 방지
     * @param id 사용자 ID
     * @return Department가 함께 로드된 User Optional
     */
    @Query("""
        SELECT u FROM User u
        LEFT JOIN FETCH u.department
        WHERE u.id = :id
        """)
    Optional<User> findByIdWithDepartment(@Param("id") Integer id);
    
    /**
     * 특정 연도로 시작하는 사번 중 최대값 조회 (동시성 처리를 위한 락 사용)
     * @param yearPrefix 연도 4자리 (예: "2024")
     * @return 최대 사번의 마지막 3자리 숫자, 없으면 0
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("""
        SELECT COALESCE(MAX(CAST(SUBSTRING(u.employeeNumber, 5) AS int)), 0)
        FROM User u
        WHERE u.employeeNumber LIKE :yearPrefix || '%'
        """)
    Integer findMaxEmployeeNumberByYear(@Param("yearPrefix") String yearPrefix);
}

