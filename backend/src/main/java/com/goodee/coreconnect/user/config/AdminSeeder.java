package com.goodee.coreconnect.user.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import com.goodee.coreconnect.department.entity.Department;
import com.goodee.coreconnect.department.repository.DepartmentRepository;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.entity.Status;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;

@Configuration
@RequiredArgsConstructor
public class AdminSeeder {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final DepartmentRepository departmentRepository; 

    private static final String ADMIN_EMAIL = "admin@example.com";
    private static final String ADMIN_NAME  = "시스템관리자";
    private static final String ADMIN_PHONE = "010-0000-0000";
    private static final String ADMIN_RAW_PASSWORD = "coreconnect@admin"; 
    private static final Integer ADMIN_DEPT_ID = null; 

    @Bean
    public CommandLineRunner seedAdminRunner() {
        return args -> seedAdminIfNeeded();
    }

    @Transactional
    protected void seedAdminIfNeeded() {
        if (userRepository.existsByEmail(ADMIN_EMAIL)) {
            return; 
        }

        Department dept = null;
        if (ADMIN_DEPT_ID != null) {
            dept = departmentRepository.findById(ADMIN_DEPT_ID)
                    .orElse(null);
        }

        String encoded = passwordEncoder.encode(ADMIN_RAW_PASSWORD);

        User admin = User.createUser(
                encoded,                // password (BCrypt)
                ADMIN_NAME,             // name
                Role.ADMIN,             // role
                ADMIN_EMAIL,            // email
                ADMIN_PHONE,            // phone
                dept,                   // department (null 가능)
                null                    // jobGrade (초기값: null)
        );

        // 상태 등 추가 설정이 필요하면 여기서 조정 가능
        // admin.deactivate(); // 예: 비활성화 등

        userRepository.save(admin);
    }
}