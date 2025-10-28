package com.goodee.coreconnect.board.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.board.dto.request.BoardRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardResponseDTO;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardCategory;
import com.goodee.coreconnect.board.repository.BoardCategoryRepository;
import com.goodee.coreconnect.board.repository.BoardRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardServiceImpl implements BoardService {

    private final BoardRepository boardRepository;
    private final BoardCategoryRepository boardCategoryRepository;
    private final UserRepository userRepository;

    /**
     * ✅ 게시글 등록
     */
    @Override
    public BoardResponseDTO createBoard(BoardRequestDTO dto, Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new EntityNotFoundException("작성자를 찾을 수 없습니다."));

        BoardCategory category = boardCategoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));

        Board board = Board.createBoard(
                user,
                category,
                dto.getTitle(),
                dto.getContent(),
                dto.getNoticeYn(),
                dto.getPrivateYn()
        );

        boardRepository.save(board);
        return BoardResponseDTO.toDTO(board);
    }

    /**
     * ✅ 게시글 수정 (setter 없음 → 엔티티 update 메서드 직접 구현)
     */
    @Override
    public BoardResponseDTO updateBoard(Integer boardId, BoardRequestDTO dto) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        BoardCategory category = boardCategoryRepository.findById(dto.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));

        // ⚙️ update 로직 (엔티티 내부 setter 대신 직접 필드 접근)
        Board updated = Board.createBoard(
                board.getUser(),
                category,
                dto.getTitle(),
                dto.getContent(),
                dto.getNoticeYn(),
                dto.getPrivateYn()
        );

        // 동일 ID로 업데이트하기 위해 수동 매핑
        updated = overwriteExistingBoard(board, updated);

        return BoardResponseDTO.toDTO(updated);
    }

    /**
     * ✅ 게시글 삭제 (Soft Delete)
     */
    @Override
    public BoardResponseDTO softDeleteBoard(Integer boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        // soft delete
        try {
            var deletedField = Board.class.getDeclaredField("deletedYn");
            deletedField.setAccessible(true);
            deletedField.set(board, true);
        } catch (Exception e) {
            throw new RuntimeException("삭제 처리 중 오류 발생", e);
        }

        return BoardResponseDTO.toDTO(board);
    }

    /**
     * ✅ 게시글 단건 조회
     */
    @Override
    @Transactional(readOnly = true)
    public BoardResponseDTO getBoardById(Integer boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
        return BoardResponseDTO.toDTO(board);
    }

    /**
     * ✅ 카테고리별 게시글 목록 조회
     */
    @Override
    @Transactional(readOnly = true)
    public List<BoardResponseDTO> getBoardsByCategory(Integer categoryId) {
        return boardRepository.findByCategoryId(categoryId).stream()
                .map(BoardResponseDTO::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * ✅ 사용자별 게시글 목록 조회
     */
    @Override
    @Transactional(readOnly = true)
    public List<BoardResponseDTO> getBoardsByUser(Integer userId) {
        return boardRepository.findByUserId(userId).stream()
                .map(BoardResponseDTO::toDTO)
                .collect(Collectors.toList());
    }

    /**
     * ✅ 공지글 목록 조회
     */
    @Override
    @Transactional(readOnly = true)
    public List<BoardResponseDTO> getNoticeBoards() {
        return boardRepository.findBynoticeYnTrue().stream()
                .map(BoardResponseDTO::toDTO)
                .collect(Collectors.toList());
    }

    // ⚙️ 내부 헬퍼: 기존 board의 ID, viewCount, createdAt 유지
    private Board overwriteExistingBoard(Board original, Board updated) {
        try {
            var idField = Board.class.getDeclaredField("id");
            idField.setAccessible(true);
            idField.set(updated, original.getId());

            var createdAtField = Board.class.getDeclaredField("createdAt");
            createdAtField.setAccessible(true);
            createdAtField.set(updated, original.getCreatedAt());

            var viewCountField = Board.class.getDeclaredField("viewCount");
            viewCountField.setAccessible(true);
            viewCountField.set(updated, original.getViewCount());
        } catch (Exception e) {
            throw new RuntimeException("엔티티 매핑 오류", e);
        }

        boardRepository.save(updated);
        return updated;
    }
}
