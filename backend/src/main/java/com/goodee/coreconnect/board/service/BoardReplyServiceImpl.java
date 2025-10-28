//package com.goodee.coreconnect.board.service;
//
//import java.util.List;
//import java.util.stream.Collectors;
//
//import org.springframework.stereotype.Service;
//import org.springframework.transaction.annotation.Transactional;
//
//import com.goodee.coreconnect.board.dto.request.BoardReplyRequestDTO;
//import com.goodee.coreconnect.board.dto.response.BoardReplyResponseDTO;
//import com.goodee.coreconnect.board.entity.Board;
//import com.goodee.coreconnect.board.entity.BoardReply;
//import com.goodee.coreconnect.board.repository.BoardReplyRepository;
//import com.goodee.coreconnect.board.repository.BoardRepository;
//import com.goodee.coreconnect.user.entity.User;
//import com.goodee.coreconnect.user.repository.UserRepository;
//
//import jakarta.persistence.EntityNotFoundException;
//import lombok.RequiredArgsConstructor;
//
//@Service
//@RequiredArgsConstructor
//@Transactional
//public class BoardReplyServiceImpl implements BoardReplyService {
//
//    private final BoardReplyRepository boardReplyRepository;
//    private final BoardRepository boardRepository;
//    private final UserRepository userRepository;
//
//    /**
//     * 댓글/대댓글 등록
//     */
//    @Override
//    public BoardReplyResponseDTO createReply(BoardReplyRequestDTO dto, Integer userId) {
//        User user = userRepository.findById(userId)
//                .orElseThrow(() -> new EntityNotFoundException("작성자를 찾을 수 없습니다."));
//
//        Board board = boardRepository.findById(dto.getBoardId())
//                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));
//
//        // 부모 댓글(대댓글인 경우) 확인
//        BoardReply parentReply = null;
//        if (dto.getParentReplyId() != null) {
//            parentReply = boardReplyRepository.findById(dto.getParentReplyId())
//                    .orElseThrow(() -> new EntityNotFoundException("부모 댓글을 찾을 수 없습니다."));
//
//            // 중첩 대댓글 방지
//            if (parentReply.getParentReply() != null) {
//                throw new IllegalStateException("대댓글의 대댓글은 작성할 수 없습니다.");
//            }
//        }
//
//        BoardReply reply = dto.toEntity(user, board, parentReply);
//        boardReplyRepository.save(reply);
//
//        return BoardReplyResponseDTO.toDTO(reply);
//    }
//
//    /**
//     * 댓글 수정
//     */
//    @Override
//    public BoardReplyResponseDTO updateReply(Integer replyId, String content) {
//        BoardReply reply = boardReplyRepository.findById(replyId)
//                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
//
//        if (Boolean.TRUE.equals(reply.getDeletedYn())) {
//            throw new IllegalStateException("삭제된 댓글은 수정할 수 없습니다.");
//        }
//
//        reply.setContent(content);
//        return BoardReplyResponseDTO.toDTO(reply);
//    }
//
//    /**
//     * 댓글 삭제 (Soft Delete)
//     */
//    @Override
//    public BoardReplyResponseDTO softDeleteReply(Integer replyId) {
//        BoardReply reply = boardReplyRepository.findById(replyId)
//                .orElseThrow(() -> new EntityNotFoundException("댓글을 찾을 수 없습니다."));
//
//        reply.setDeletedYn(true);
//        return BoardReplyResponseDTO.toDTO(reply);
//    }
//
//    /**
//     * 게시글별 댓글 목록 (deletedYn = false)
//     */
//    @Override
//    @Transactional(readOnly = true)
//    public List<BoardReplyResponseDTO> getRepliesByBoard(Integer boardId) {
//        return boardReplyRepository.findByBoardId(boardId).stream()
//                .filter(r -> !Boolean.TRUE.equals(r.getDeletedYn()))
//                .map(BoardReplyResponseDTO::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    /**
//     * 특정 사용자가 작성한 댓글 목록
//     */
//    @Override
//    @Transactional(readOnly = true)
//    public List<BoardReplyResponseDTO> getRepliesByUser(Integer userId) {
//        return boardReplyRepository.findByUserId(userId).stream()
//                .filter(r -> !Boolean.TRUE.equals(r.getDeletedYn()))
//                .map(BoardReplyResponseDTO::toDTO)
//                .collect(Collectors.toList());
//    }
//
//    /**
//     * 특정 댓글의 대댓글 목록 (1차까지만)
//     */
//    @Override
//    @Transactional(readOnly = true)
//    public List<BoardReplyResponseDTO> getRepliesByParent(Integer parentReplyId) {
//        return boardReplyRepository.findByParentReplyId(parentReplyId).stream()
//                .filter(r -> !Boolean.TRUE.equals(r.getDeletedYn()))
//                .map(BoardReplyResponseDTO::toDTO)
//                .collect(Collectors.toList());
//    }
//}
