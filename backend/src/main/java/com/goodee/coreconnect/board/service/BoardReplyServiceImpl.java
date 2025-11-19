package com.goodee.coreconnect.board.service;

import java.util.ArrayList;
import java.util.List;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.board.dto.request.BoardReplyRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardReplyResponseDTO;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardReply;
import com.goodee.coreconnect.board.repository.BoardReplyRepository;
import com.goodee.coreconnect.board.repository.BoardRepository;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.enums.Role;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardReplyServiceImpl implements BoardReplyService {

    private final BoardReplyRepository replyRepository;
    private final BoardRepository boardRepository;
    private final UserRepository userRepository;

    /** 댓글 등록 */
    @Override
    public BoardReplyResponseDTO createReply(BoardReplyRequestDTO dto, String email) {
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("작성자 정보를 찾을 수 없습니다."));

        Board board = boardRepository.findById(dto.getBoardId())
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        BoardReply parentReply = null;
        if (dto.getParentReplyId() != null) {
          parentReply = replyRepository.findById(dto.getParentReplyId())
                  .orElseThrow(() -> new EntityNotFoundException("부모 댓글을 찾을 수 없습니다."));

          if (parentReply.getParentReply() != null) {
              throw new IllegalArgumentException("2단계 이상 대댓글은 허용되지 않습니다.");
          }
      }

        BoardReply reply = dto.toEntity(user, board, parentReply);
        BoardReply saved = replyRepository.save(reply);

        return BoardReplyResponseDTO.toDTO(saved);
    }

    /** 댓글 수정 */
    @Override
    public BoardReplyResponseDTO updateReply(Integer replyId, BoardReplyRequestDTO dto, String email) {
        BoardReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("사용자 정보를 찾을 수 없습니다."));

        if (!reply.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
          throw new AccessDeniedException("본인 또는 관리자만 수정할 수 있습니다.");
        }

        reply.updateReply(dto.getContent());
        return BoardReplyResponseDTO.toDTO(reply);
    }

    /** 댓글 삭제 (Soft Delete) */
    @Override
    public void softDeleteReply(Integer replyId, String email) {
        BoardReply reply = replyRepository.findById(replyId)
                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));

        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("사용자 정보를 찾을 수 없습니다."));

        if (!reply.getUser().getId().equals(user.getId()) && user.getRole() != Role.ADMIN) {
          throw new AccessDeniedException("본인 또는 관리자만 삭제할 수 있습니다.");
        }

        reply.delete();
    }

    /** 게시글별 댓글 목록 조회 (대댓글 포함, 전체 조회 가능) */
    @Override
    @Transactional(readOnly = true)
    public List<BoardReplyResponseDTO> getRepliesByBoard(Integer boardId) {
        // 삭제된 부모도 포함해 전체 댓글 조회
        List<BoardReply> replies = replyRepository.findAllByBoardIdIncludeDeleted(boardId);
        List<BoardReplyResponseDTO> dtoList = new ArrayList<>();

        for (BoardReply reply : replies) {
            dtoList.add(BoardReplyResponseDTO.toDTO(reply));
        }

        return dtoList;
    }

}