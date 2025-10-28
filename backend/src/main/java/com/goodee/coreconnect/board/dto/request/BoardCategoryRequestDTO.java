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
 * 게시판 카테고리 등록/수정 요청 DTO
 * - 관리자 또는 담당자가 새로운 카테고리를 등록하거나 수정할 때 사용
 */
public class BoardCategoryRequestDTO {

    private String name;    
    private Integer orderNo;

    /**
     * DTO -> Entity 변환
     * - Service 계층에서 User 주입
     */
    public BoardCategory toEntity(User user) {
        return BoardCategory.createCategory(user,
                                             this.name,
                                             this.orderNo);
    }
}
