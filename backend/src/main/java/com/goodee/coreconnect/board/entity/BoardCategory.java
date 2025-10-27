package com.goodee.coreconnect.board.entity;

import com.goodee.coreconnect.user.entity.User;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "board_category")
@Getter
@Setter
public class BoardCategory {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "board_category_id")
    private Integer id;

    @Column(name = "board_category_name", length = 50, nullable = false)
    private String name;

    @Column(name = "board_category_order_no")
    private Integer orderNo;

    protected BoardCategory() {};
    
    public static BoardCategory createCategory(User user, String name, Integer orderNo) {
      BoardCategory category = new BoardCategory();
      category.name = name;
      category.orderNo = orderNo != null ? orderNo : 0;
      return category;
  }
    
}
