package com.goodee.coreconnect.user.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "profile_image")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
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
    @JoinColumn(name = "user_id")
    private User user;
}
