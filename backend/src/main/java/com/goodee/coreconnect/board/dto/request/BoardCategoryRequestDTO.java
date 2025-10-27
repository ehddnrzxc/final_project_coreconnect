package com.goodee.coreconnect.board.dto.request;

import com.goodee.coreconnect.board.entity.BoardCategory;
import com.goodee.coreconnect.user.entity.User;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
/**
 * 카테고리 등록/수정 요청
 */
public class BoardCategoryRequestDTO {

    private String name;     // 카테고리명
    private Integer orderNo; // 정렬 순서 번호

    /**
     * DTO-> Entity 변환
     */
    public BoardCategory toEntity(User user) {
        return BoardCategory.createCategory(user, this.name, this.orderNo);
    }
}
