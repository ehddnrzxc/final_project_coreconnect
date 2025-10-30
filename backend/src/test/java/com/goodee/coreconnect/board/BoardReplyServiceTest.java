package com.goodee.coreconnect.board;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.access.AccessDeniedException;

import com.goodee.coreconnect.board.dto.request.BoardReplyRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardReplyResponseDTO;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardReply;
import com.goodee.coreconnect.board.repository.BoardReplyRepository;
import com.goodee.coreconnect.board.repository.BoardRepository;
import com.goodee.coreconnect.board.service.BoardReplyServiceImpl;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;

@ExtendWith(MockitoExtension.class)
@DisplayName("✅ BoardReplyService 단위 테스트")
class BoardReplyServiceTest {

    @Mock
    private BoardReplyRepository replyRepository;

    @Mock
    private BoardRepository boardRepository;

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private BoardReplyServiceImpl replyService;

    private User user;
    private Board board;
    private BoardReply parentReply;
    private BoardReply childReply;

    @BeforeEach
    void setup() {
        // ✅ 단순 Mock 생성 (stubbing 금지)
        user = mock(User.class);
        board = mock(Board.class);

        parentReply = BoardReply.createReply(user, board, null, "부모 댓글 내용");
        childReply = BoardReply.createReply(user, board, parentReply, "대댓글 내용");
    }

    // ───────────────────────────────────────────────
    @Test
    @DisplayName("댓글 등록 성공 (부모 댓글 없음)")
    void testCreateReply_Success_NoParent() {
        BoardReplyRequestDTO dto = new BoardReplyRequestDTO(1, null, "댓글 내용");

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(boardRepository.findById(1)).thenReturn(Optional.of(board));
        when(replyRepository.save(any(BoardReply.class))).thenReturn(parentReply);

        BoardReplyResponseDTO result = replyService.createReply(dto, "user@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEqualTo("부모 댓글 내용");
        verify(replyRepository, times(1)).save(any(BoardReply.class));
    }

    // ───────────────────────────────────────────────
    @Test
    @DisplayName("대댓글 등록 성공 (부모 댓글 존재)")
    void testCreateReply_Success_WithParent() {
        BoardReplyRequestDTO dto = new BoardReplyRequestDTO(1, 100, "대댓글 내용");

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(boardRepository.findById(1)).thenReturn(Optional.of(board));
        when(replyRepository.findById(100)).thenReturn(Optional.of(parentReply));
        when(replyRepository.save(any(BoardReply.class))).thenReturn(childReply);

        BoardReplyResponseDTO result = replyService.createReply(dto, "user@test.com");

        assertThat(result).isNotNull();
        assertThat(result.getContent()).isEqualTo("대댓글 내용");
    }

    // ───────────────────────────────────────────────
    @Test
    @DisplayName("존재하지 않는 게시글에 댓글 등록 시 실패")
    void testCreateReply_Fail_NoBoard() {
        BoardReplyRequestDTO dto = new BoardReplyRequestDTO(999, null, "댓글 내용");

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));
        when(boardRepository.findById(999)).thenReturn(Optional.empty());

        assertThrows(EntityNotFoundException.class, () ->
                replyService.createReply(dto, "user@test.com"));
    }

    // ───────────────────────────────────────────────
    @Test
    @DisplayName("본인 댓글 수정 성공")
    void testUpdateReply_Success() {
        BoardReplyRequestDTO dto = new BoardReplyRequestDTO(1, null, "수정된 댓글");

        when(replyRepository.findById(1)).thenReturn(Optional.of(parentReply));
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        BoardReplyResponseDTO result = replyService.updateReply(1, dto, "user@test.com");

        assertThat(result.getContent()).isEqualTo("수정된 댓글");
    }

    // ───────────────────────────────────────────────
    @Test
    @DisplayName("타인 댓글 수정 시 AccessDeniedException 발생")
    void testUpdateReply_FailByOtherUser() {
        // 🔹 다른 사용자 mock 생성
        User otherUser = mock(User.class);

        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(otherUser));
        when(replyRepository.findById(1)).thenReturn(Optional.of(parentReply));

        assertThrows(AccessDeniedException.class, () ->
                replyService.updateReply(1, new BoardReplyRequestDTO(1, null, "변경 시도"), "user@test.com"));
    }

    // ───────────────────────────────────────────────
    @Test
    @DisplayName("본인 댓글 삭제 성공 (Soft Delete)")
    void testDeleteReply_Success() {
        when(replyRepository.findById(1)).thenReturn(Optional.of(parentReply));
        when(userRepository.findByEmail("user@test.com")).thenReturn(Optional.of(user));

        replyService.softDeleteReply(1, "user@test.com");

        assertThat(parentReply.getDeletedYn()).isTrue();
    }

    // ───────────────────────────────────────────────
    @Test
    @DisplayName("게시글별 댓글 목록 조회 성공")
    void testGetRepliesByBoard() {
        when(replyRepository.findByBoardIdAndDeletedYnFalseOrderByCreatedAtAsc(1))
                .thenReturn(List.of(parentReply, childReply));

        List<BoardReplyResponseDTO> replies = replyService.getRepliesByBoard(1);

        assertThat(replies).hasSize(2);
        assertThat(replies.get(0).getContent()).isEqualTo("부모 댓글 내용");
        assertThat(replies.get(1).getContent()).isEqualTo("대댓글 내용");
    }
}