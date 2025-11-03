package com.goodee.coreconnect.user.entity;

import java.time.LocalDateTime;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
@Table(name = "profile_image")
public class ProfileImage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "profile_id")
    private Integer profileId;

    @Column(name = "profile_image_url", columnDefinition = "TEXT", nullable = false)
    private String imageUrl;

    @Column(name = "profile_thumbnail_yn", nullable = false)
    private Boolean thumbnailYn;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", foreignKey = @ForeignKey(name = "fk_profile_image_user"))
    private User user;

    @Column(name = "profile_uploaded_at", nullable = false)
    private LocalDateTime uploadedAt;


    /** 정적 팩토리 메서드 */
    public static ProfileImage createProfileImage(User user, String imageUrl, boolean thumbnailYn) {
        ProfileImage profileImage = new ProfileImage();
        profileImage.user = user;
        profileImage.imageUrl = imageUrl;
        profileImage.thumbnailYn = thumbnailYn;
        profileImage.uploadedAt = LocalDateTime.now();
        return profileImage;
    }

    /** 썸네일 여부 변경 */
    public void changeThumbnail(boolean thumbnailYn) {
        this.thumbnailYn = thumbnailYn;
    }

    /** 이미지 URL 변경 */
    public void changeImageUrl(String newUrl) {
        this.imageUrl = newUrl;
    }
}
