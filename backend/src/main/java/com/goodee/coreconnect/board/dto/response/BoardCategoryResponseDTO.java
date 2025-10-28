package com.goodee.coreconnect.board.dto.response;

import com.goodee.coreconnect.board.entity.BoardCategory;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
/**
 * 게시판 카테고리 응답 DTO
 * - 카테고리 목록 및 단일 조회 시 클라이언트로 반환
 */
public class BoardCategoryResponseDTO {

    private Integer id;       
    private String name;      
    private Integer orderNo;  
    private Boolean deletedYn; 

    /**
     * Entity -> DTO 변환
     */
    public static BoardCategoryResponseDTO toDTO(BoardCategory category) {
        if (category == null) return null;

        return BoardCategoryResponseDTO.builder().id(category.getId())
                                                  .name(category.getName())
                                                  .orderNo(category.getOrderNo())
                                                  .deletedYn(category.getDeletedYn())
                                                  .build();
    }
}
