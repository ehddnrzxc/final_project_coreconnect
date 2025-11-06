package com.goodee.coreconnect.user.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import com.goodee.coreconnect.user.entity.Status;
import com.goodee.coreconnect.user.entity.User;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    boolean existsByEmail(String email);
    Optional<User> findByEmail(String email);
    Long countByStatus(Status status);
    
    @Query("""
        SELECT u FROM User u
        LEFT JOIN FETCH u.department d
        WHERE u.status = 'ACTIVE'
        ORDER BY d.deptOrderNo, u.name
        """)
    List<User> findAllForOrganization();
}

