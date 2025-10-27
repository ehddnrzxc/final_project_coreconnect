package com.goodee.coreconnect.board.dto.response;

import com.goodee.coreconnect.board.entity.BoardCategory;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BoardCategoryResponseDTO {

    private Integer id;       // 카테고리 ID
    private String name;      // 카테고리 이름
    private Integer orderNo;  // 정렬 순서

    /**
     * Entity -> DTO 변환
     */
    public static BoardCategoryResponseDTO toDTO(BoardCategory category) {
        return BoardCategoryResponseDTO.builder()
                                        .id(category.getId())
                                        .name(category.getName())
                                        .orderNo(category.getOrderNo())
                                        .build();
    }
}
