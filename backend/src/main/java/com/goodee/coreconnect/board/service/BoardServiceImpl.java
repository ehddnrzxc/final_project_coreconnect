package com.goodee.coreconnect.board.service;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.PageImpl;
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
    private final BoardCategoryRepository categoryRepository;
    private final UserRepository userRepository;

    /** ✅ 게시글 등록 (이메일 기반) */
    @Override
    public BoardResponseDTO createBoard(BoardRequestDTO dto, String email) {
        // 로그인 사용자 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("로그인된 사용자 정보를 찾을 수 없습니다."));

        // 카테고리 확인
        BoardCategory category = categoryRepository.findByIdAndDeletedYnFalse(dto.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));

        // 엔티티 생성
        Board board = Board.createBoard(
                user,
                category,
                dto.getTitle(),
                dto.getContent(),
                dto.getNoticeYn(),
                dto.getPrivateYn()
        );

        Board saved = boardRepository.save(board);
        return BoardResponseDTO.toDTO(saved);
    }

    /** 게시글 수정 */
    @Override
    public BoardResponseDTO updateBoard(Integer boardId, BoardRequestDTO dto) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        BoardCategory category = null;
        if (dto.getCategoryId() != null) {
            category = categoryRepository.findByIdAndDeletedYnFalse(dto.getCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));
        }

        board.updateBoard(
                category,
                dto.getTitle(),
                dto.getContent(),
                dto.getNoticeYn(),
                dto.getPrivateYn()
        );

        return BoardResponseDTO.toDTO(board);
    }

    /** 게시글 삭제 (Soft Delete) */
    @Override
    public void softDeleteBoard(Integer boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        board.delete();

        // 댓글, 파일도 함께 soft delete
        board.getReplies().forEach(reply -> reply.delete());
        board.getFiles().forEach(file -> file.delete());
    }

    /** 게시글 상세 조회 (조회수 증가 포함) */
    @Override
    @Transactional(readOnly = false)
    public BoardResponseDTO getBoardById(Integer boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        if (board.getDeletedYn()) {
            throw new IllegalStateException("삭제된 게시글입니다.");
        }

        board.increaseViewCount();
        return BoardResponseDTO.toDTO(board);
    }

    /** 전체 게시글 목록 */
    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDTO> getAllBoards(Pageable pageable) {
        Page<Board> boardPage = boardRepository.findByDeletedYnFalse(pageable);
        List<BoardResponseDTO> dtoList = boardPage.getContent()
                                                  .stream()
                                                  .map(BoardResponseDTO::toDTO)
                                                  .toList();
        return new PageImpl<>(dtoList, pageable, boardPage.getTotalElements());
    }

    /** 카테고리별 게시글 목록 */
    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDTO> getBoardsByCategory(Integer categoryId, Pageable pageable) {
        Page<Board> boardPage = boardRepository.findByCategoryIdAndDeletedYnFalse(categoryId, pageable);
        List<BoardResponseDTO> dtoList = boardPage.getContent()
                                                  .stream()
                                                  .map(BoardResponseDTO::toDTO)
                                                  .toList();
        return new PageImpl<>(dtoList, pageable, boardPage.getTotalElements());
    }

    /** ✅ 사용자 이메일 기반 게시글 목록 */
    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDTO> getBoardsByUser(String email, Pageable pageable) {
        Page<Board> boardPage = boardRepository.findByUserEmailAndDeletedYnFalse(email, pageable);
        List<BoardResponseDTO> dtoList = boardPage.getContent()
                                                  .stream()
                                                  .map(BoardResponseDTO::toDTO)
                                                  .toList();
        return new PageImpl<>(dtoList, pageable, boardPage.getTotalElements());
    }

    /** 공지글 목록 조회 */
    @Override
    @Transactional(readOnly = true)
    public List<BoardResponseDTO> getNoticeBoards() {
        List<Board> boardList = boardRepository.findByNoticeYnTrueAndDeletedYnFalse();
        return boardList.stream()
                        .map(BoardResponseDTO::toDTO)
                        .toList();
    }

    /** 게시글 검색 (제목 / 내용 / 작성자명 중 선택형) */
    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDTO> searchBoards(String type, String keyword, Pageable pageable) {
        Page<Board> result;

        switch (type) {
            case "title" -> result = boardRepository.searchByTitle(keyword, pageable);
            case "content" -> result = boardRepository.searchByContent(keyword, pageable);
            case "author" -> result = boardRepository.searchByAuthor(keyword, pageable);
            default -> throw new IllegalArgumentException("유효하지 않은 검색 타입입니다: " + type);
        }

        List<BoardResponseDTO> dtoList = result.getContent()
                                               .stream()
                                               .map(BoardResponseDTO::toDTO)
                                               .toList();
        return new PageImpl<>(dtoList, pageable, result.getTotalElements());
    }
}