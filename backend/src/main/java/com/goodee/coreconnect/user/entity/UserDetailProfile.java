package com.goodee.coreconnect.user.entity;

import java.time.LocalDate;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.OneToOne;
import jakarta.persistence.Table;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/**
 * 사용자 추가 프로필 정보 엔티티
 * User와 OneToOne 관계
 */
@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "user_detail_profiles")
public class UserDetailProfile {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Integer id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", unique = true, nullable = false)
    private User user;

    @Column(name = "company_name", length = 100)
    private String companyName; // 회사이름

    @Column(name = "direct_phone", length = 20)
    private String directPhone; // 직통전화

    @Column(name = "fax", length = 20)
    private String fax; // 팩스

    @Column(name = "address", length = 500)
    private String address; // 주소

    @Column(name = "birthday")
    private LocalDate birthday; // 생일

    @Column(name = "bio", columnDefinition = "TEXT")
    private String bio; // 자기소개

    @Column(name = "external_email", length = 255)
    private String externalEmail; // 외부 메일

    /**
     * 정적 팩토리 메서드 - 새 프로필 생성
     */
    public static UserDetailProfile createProfile(User user) {
        UserDetailProfile profile = new UserDetailProfile();
        profile.user = user;
        return profile;
    }

    /**
     * 회사이름 변경
     */
    public void updateCompanyName(String companyName) {
        this.companyName = companyName;
    }

    /**
     * 직통전화 변경
     */
    public void updateDirectPhone(String directPhone) {
        this.directPhone = directPhone;
    }

    /**
     * 팩스 변경
     */
    public void updateFax(String fax) {
        this.fax = fax;
    }

    /**
     * 주소 변경
     */
    public void updateAddress(String address) {
        this.address = address;
    }

    /**
     * 생일 변경
     */
    public void updateBirthday(LocalDate birthday) {
        this.birthday = birthday;
    }

    /**
     * 자기소개 변경
     */
    public void updateBio(String bio) {
        this.bio = bio;
    }

    /**
     * 외부 메일 변경
     */
    public void updateExternalEmail(String externalEmail) {
        this.externalEmail = externalEmail;
    }

    /**
     * 전체 프로필 정보 업데이트
     */
    public void updateProfile(
            String companyName,
            String directPhone,
            String fax,
            String address,
            LocalDate birthday,
            String bio,
            String externalEmail
    ) {
        this.companyName = companyName;
        this.directPhone = directPhone;
        this.fax = fax;
        this.address = address;
        this.birthday = birthday;
        this.bio = bio;
        this.externalEmail = externalEmail;
    }
}

