package com.goodee.coreconnect.board.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.board.dto.request.BoardCategoryRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardCategoryResponseDTO;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardCategory;
import com.goodee.coreconnect.board.repository.BoardCategoryRepository;
import com.goodee.coreconnect.board.repository.BoardRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.enums.Role;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardCategoryServiceImpl implements BoardCategoryService {

    private final BoardRepository boardRepository;
    private final BoardCategoryRepository categoryRepository;
    private final UserRepository userRepository;

    /** 관리자 권한 확인 메서드 */
    private void checkAdminRole(String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));
        if (user.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("카테고리 관리 권한이 없습니다.");
        }
    }

    /** 카테고리 등록 (관리자 전용) */
    @Override
    public BoardCategoryResponseDTO createCategory(BoardCategoryRequestDTO dto, String email) {
        checkAdminRole(email);

        if (isCategoryNameExists(dto.getName())) {
            throw new IllegalArgumentException("이미 존재하는 카테고리명입니다: " + dto.getName());
        }
        
        if (categoryRepository.existsByOrderNoAndDeletedYnFalse(dto.getOrderNo())) {
          throw new IllegalArgumentException("이미 사용 중인 순서 번호입니다: " + dto.getOrderNo());
        }
 
        BoardCategory category = dto.toEntity();

        BoardCategory saved = categoryRepository.save(category);
        return BoardCategoryResponseDTO.toDTO(saved);
    }

    /** 카테고리 수정 (관리자 전용) */
    @Override
    public BoardCategoryResponseDTO updateCategory(Integer categoryId, BoardCategoryRequestDTO dto, String email) {
        checkAdminRole(email);

        BoardCategory category = categoryRepository.findByIdAndDeletedYnFalse(categoryId)
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));

        // 기존 순서번호와 변경 요청 순서번호가 다른 경우만 처리
        if (!dto.getOrderNo().equals(category.getOrderNo())) {

            // 변경하려는 orderNo 를 가진 카테고리가 존재하는지 조회
            BoardCategory conflictCategory = categoryRepository
                    .findByOrderNoAndDeletedYnFalse(dto.getOrderNo())
                    .orElse(null);

            if (conflictCategory != null) {

                // 기존 번호 저장 (swap을 위해 반드시 필요)
                Integer oldOrderNo = category.getOrderNo(); // ★ 추가: 기존 번호 저장

                // 1) 충돌 카테고리 임시 번호(-1)로 이동
                conflictCategory.updateCategory(conflictCategory.getName(), -1);
                categoryRepository.flush();

                // 2) 현재 category 에 새 번호 적용
                category.updateCategory(dto.getName(), dto.getOrderNo());
                categoryRepository.flush();

                // 3) 충돌 카테고리에 기존 번호(oldOrderNo) 부여
                conflictCategory.updateCategory(conflictCategory.getName(), oldOrderNo); // ★ category.getOrderNo() 아님!!

            } else {
                // 충돌 없으면 단순 변경
                category.updateCategory(dto.getName(), dto.getOrderNo());
            }

        } else {
            // 번호 동일 → 이름만 변경
            category.updateCategory(dto.getName(), dto.getOrderNo());
        }

        return BoardCategoryResponseDTO.toDTO(category);
    }


    /** 카테고리 삭제 (관리자 전용, Soft Delete) */
    @Override
    public void deleteCategory(Integer categoryId, String email) {
        checkAdminRole(email);

        BoardCategory category = categoryRepository.findByIdAndDeletedYnFalse(categoryId)
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));

        List<Board> boards = boardRepository.findByCategoryIdAndDeletedYnFalse(categoryId);
        for (Board board : boards) {
            board.delete(); // 게시글 soft delete
            board.getReplies().forEach(reply -> reply.delete()); // 댓글도 함께 soft delete
            board.getFiles().forEach(file -> file.delete());    // 파일도 함께 soft delete
        }

        category.delete();
    }

    /** 전체 카테고리 목록 (삭제 제외, 관리자 전용) */
    @Override
    @Transactional(readOnly = true)
    public List<BoardCategoryResponseDTO> getAllCategories() {
        List<BoardCategory> categories = categoryRepository.findByDeletedYnFalseOrderByOrderNoAsc();
        List<BoardCategoryResponseDTO> dtoList = new ArrayList<>();

        for (BoardCategory category : categories) {
            dtoList.add(BoardCategoryResponseDTO.toDTO(category));
        }

        return dtoList;
    }

    /** 카테고리명 중복 여부 확인 */
    @Override
    @Transactional(readOnly = true)
    public boolean isCategoryNameExists(String name) {
        return categoryRepository.existsByNameAndDeletedYnFalse(name);
    }
}