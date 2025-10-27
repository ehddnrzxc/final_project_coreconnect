package com.goodee.coreconnect.board.entity;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board_category")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_category_id")
    private Integer id;

    @Column(name = "board_category_name", length = 50, nullable = false)
    private String name;

    @Column(name = "board_category_order_no")
    private Integer orderNo;

    /**
     * N:1 관계 매핑 (user 테이블과 매핑)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;
}
