package com.goodee.coreconnect.board.entity;

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

    // 게시판 작성자
    @Column(name = "user_id")
    private Integer userId;
}
