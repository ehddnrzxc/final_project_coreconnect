package com.goodee.coreconnect.board.dto.request;

import com.goodee.coreconnect.board.entity.BoardCategory;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
/**
 * 게시판 카테고리 등록/수정 요청 DTO
 */
public class BoardCategoryRequestDTO {

    private String name;    
    private Integer orderNo;

    /**
     * DTO -> Entity 변환
     */
    public BoardCategory toEntity() {
        return BoardCategory.createCategory(this.name, this.orderNo);
    }
}
