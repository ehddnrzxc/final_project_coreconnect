package com.goodee.coreconnect.security.userdetails;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.goodee.coreconnect.user.entity.JobGrade;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.entity.Status;
import com.goodee.coreconnect.user.entity.User;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * DB User 엔티티를 Spring Security가 인식할 수 있는 형태로 감싼 클래스
 */
@Getter
@RequiredArgsConstructor
public class CustomUserDetails implements UserDetails {

    private final Integer id;
    private final String email;
    private final String password;
    private final String name;
    private final Role role;
    private final Status status;
    private final Integer deptId;          
    private final JobGrade jobGrade;
    private final String profileImageKey;


    /** 권한 목록 */
    @Override
    public Collection<? extends GrantedAuthority> getAuthorities() {
        List<GrantedAuthority> authorities = new ArrayList<>();
        authorities.add(new SimpleGrantedAuthority("ROLE_" + role.name()));
        return authorities;
    }

    /** 로그인에 사용할 이메일 */
    @Override
    public String getUsername() {
        return email;
    }

    /** 비밀번호 비교 */
    @Override
    public String getPassword() {
        return password;
    }

    /** 계정 만료 여부 */
    @Override
    public boolean isAccountNonExpired() {
        return true;
    }

    /** 계정 잠김 여부 */
    @Override
    public boolean isAccountNonLocked() {
        return true;
    }

    /** 비밀번호 만료 여부 */
    @Override
    public boolean isCredentialsNonExpired() {
        return true;
    }

    /** 계정 활성 여부 */
    @Override
    public boolean isEnabled() {
        return status == Status.ACTIVE;
    }

    /** User 엔티티 -> CustomUserDetails 변환용 정적 메소드 */
    public static CustomUserDetails from(User user) {
        Integer deptId = (user.getDepartment() != null)
                ? user.getDepartment().getId()
                : null;

        return new CustomUserDetails(
                user.getId(),
                user.getEmail(),
                user.getPassword(),
                user.getName(),
                user.getRole(),
                user.getStatus(),
                deptId,
                user.getJobGrade(),
                user.getProfileImageKey()
        );
    }
}
