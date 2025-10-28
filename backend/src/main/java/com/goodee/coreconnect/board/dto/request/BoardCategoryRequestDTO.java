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
 * - 관리자 또는 담당자가 새로운 카테고리를 등록하거나 수정할 때 사용
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
