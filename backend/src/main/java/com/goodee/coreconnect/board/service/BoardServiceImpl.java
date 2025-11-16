package com.goodee.coreconnect.board.service;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.goodee.coreconnect.board.dto.request.BoardRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardFileResponseDTO;
import com.goodee.coreconnect.board.dto.response.BoardResponseDTO;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardCategory;
import com.goodee.coreconnect.board.entity.BoardFile;
import com.goodee.coreconnect.board.entity.BoardViewHistory;
import com.goodee.coreconnect.board.repository.BoardCategoryRepository;
import com.goodee.coreconnect.board.repository.BoardFileRepository;
import com.goodee.coreconnect.board.repository.BoardRepository;
import com.goodee.coreconnect.board.repository.BoardViewHistoryRepository;
import com.goodee.coreconnect.common.notification.enums.NotificationType;
import com.goodee.coreconnect.common.notification.service.NotificationService;
import com.goodee.coreconnect.user.entity.Role;
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
    private final NotificationService notificationService;
    private final BoardViewHistoryRepository viewHistoryRepository;
    private final BoardFileRepository boardFileRepository;
    private final BoardFileService boardFileService; 
    
    // 미리보기 적용 메소드
    private void applyPreview(Board board, BoardResponseDTO dto) { 
      List<BoardFile> files = boardFileRepository                   
              .findByBoardIdAndDeletedYnFalse(board.getId());       

      if (!files.isEmpty()) {                                       
          BoardFile first = files.get(0);                           
          String url = boardFileService.getPresignedUrlInternal(first.getS3ObjectKey());                          

          dto.setFiles(List.of(BoardFileResponseDTO.toDTO(first, url)));                                                        
          
          dto.setHasImage(true);
      } else {
          dto.setFiles(List.of());                                  
          dto.setHasImage(false); 
      }
  }

    /** 게시글 등록 (이메일 기반) */
    @Override
    public BoardResponseDTO createBoard(BoardRequestDTO dto, String email) {
        // 로그인 사용자 조회
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("로그인된 사용자 정보를 찾을 수 없습니다."));

        // 공지글 권한 제한 (ADMIN, MANAGER만 가능)
        if (dto.getNoticeYn() != null && dto.getNoticeYn()) {
            if (user.getRole() != Role.ADMIN && user.getRole() != Role.MANAGER) {
                throw new SecurityException("공지글은 관리자 또는 매니저만 등록할 수 있습니다.");
            }
            
            // 공지글이면서 비공개로 요청한 경우 예외 처리
            if (Boolean.TRUE.equals(dto.getPrivateYn())) {
                throw new IllegalArgumentException("공지글은 비공개로 설정할 수 없습니다.");
            }
            
            // 공지글은 항상 공개 처리 (비공개 옵션 무시)
            dto.setPrivateYn(false);
        }
        
        // 공지글이 아닌데 상단고정 true인 경우 방지
        if (!Boolean.TRUE.equals(dto.getNoticeYn()) && Boolean.TRUE.equals(dto.getPinned())) {
            throw new IllegalArgumentException("상단고정은 공지글만 설정할 수 있습니다.");
        }

        // 카테고리 확인
        BoardCategory category = categoryRepository.findByIdAndDeletedYnFalse(dto.getCategoryId())
                .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));
        
        // 같은 카테고리 내 기존 pinned 해제
        if (Boolean.TRUE.equals(dto.getPinned())) {
            boardRepository.findByCategoryIdAndPinnedTrueAndDeletedYnFalse(dto.getCategoryId())
                    .ifPresent(Board::unpin);
        }

        // 게시글 저장
        Board board = dto.toEntity(user, category);
        Board saved = boardRepository.save(board);

        // 공지글일 경우 -> 알림 전송
        if (Boolean.TRUE.equals(dto.getNoticeYn())) {
            String message = "공지사항입니다: " + dto.getTitle();

            if (user.getRole() == Role.ADMIN) {
                // 전체 유저 조회
                List<Integer> allUserIds = userRepository.findAll().stream()
                                                         .map(u -> u.getId())
                                                         .filter(id -> !id.equals(user.getId())) // 작성자 본인은 제외
                                                         .toList();

                notificationService.sendNotificationToUsers(allUserIds,
                                                            NotificationType.NOTICE,
                                                            message,
                                                            null, null,
                                                            user.getId(),
                                                            user.getName());

            } else if (user.getRole() == Role.MANAGER) {
                // 자신의 부서 유저만 조회
                Integer deptId = user.getDepartment() != null ? user.getDepartment().getId() : null;
                if (deptId != null) {
                    List<Integer> deptUserIds = userRepository.findAll().stream()
                                                              .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(deptId))
                                                              .map(u -> u.getId())
                                                              .filter(id -> !id.equals(user.getId())) // 작성자 본인은 제외
                                                              .toList();

                    notificationService.sendNotificationToUsers(deptUserIds,
                                                                NotificationType.NOTICE,
                                                                message,
                                                                null, null,
                                                                user.getId(),
                                                                user.getName());
                }
            }
        }
        
        return BoardResponseDTO.toDTO(saved);
    }

    /** 게시글 수정 */
    @Override
    public BoardResponseDTO updateBoard(Integer boardId, BoardRequestDTO dto) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        // 로그인 사용자 정보 확인
        User loginUser = User.getAuthenticatedUser(userRepository);
        if (loginUser == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        // 공지글 수정 권한 확인 (ADMIN, MANAGER만 가능)
        if (dto.getNoticeYn() != null && dto.getNoticeYn()) {
            if (loginUser.getRole() != Role.ADMIN && loginUser.getRole() != Role.MANAGER) {
                throw new SecurityException("공지글은 관리자 또는 매니저만 수정할 수 있습니다.");
            }
        }

        // 일반글 수정 — 본인만 가능 (단, 관리자 예외 허용)
        if (!loginUser.getId().equals(board.getUser().getId())
                && loginUser.getRole() != Role.ADMIN) {
            throw new SecurityException("본인 게시글만 수정할 수 있습니다.");
        }

        // 카테고리 변경 처리 (null일 경우 기존 카테고리 유지)
        BoardCategory category;
        if (dto.getCategoryId() != null) {
            category = categoryRepository.findByIdAndDeletedYnFalse(dto.getCategoryId())
                    .orElseThrow(() -> new EntityNotFoundException("카테고리를 찾을 수 없습니다."));
        } else {
            category = board.getCategory(); // 기존 카테고리 유지
        }
        
        // 수정 전 공지/상단고정 상태 저장
        boolean wasNotice = Boolean.TRUE.equals(board.getNoticeYn());
        boolean wasPinned = Boolean.TRUE.equals(board.getPinned());

        // 카테고리별 pinned 중복 방지 (category가 null이어도 안전)
        if (Boolean.TRUE.equals(dto.getPinned()) && category != null) {
            boardRepository.findByCategoryIdAndPinnedTrueAndDeletedYnFalse(category.getId())
                    .ifPresent(existingPinned -> {
                        if (!existingPinned.getId().equals(board.getId())) {
                            existingPinned.unpin();
                        }
                    });
        }
        
        board.updateBoard(category,
                          dto.getTitle(),
                          dto.getContent(),
                          dto.getNoticeYn(),
                          dto.getPinned(),
                          dto.getPrivateYn());
        
        // 상단고정으로 수정 시 동일 카테고리 내 기존 고정글 해제
        if (Boolean.TRUE.equals(dto.getPinned())) {
            List<Board> pinnedBoards = boardRepository.findByCategoryIdAndDeletedYnFalse(
                board.getCategory().getId()).stream()
                                   .filter(b -> !b.getId().equals(board.getId()) && b.getPinned())
                                   .toList();
            for (Board pinned : pinnedBoards) {
              pinned.unpin();
            }
        }
        
        // 알림 중복 방지 플래그
        boolean sentNotice = false;

        // 일반 → 공지 시 알림 (공지+고정일 때도 여기 한 번만 실행)
        if (!wasNotice && Boolean.TRUE.equals(board.getNoticeYn())) { 
            String message = "공지사항입니다: " + board.getTitle();
            sentNotice = true; // 공지 알림 전송 표시

            if (loginUser.getRole() == Role.ADMIN) {
                List<Integer> allUserIds = userRepository.findAll().stream()
                                                         .map(u -> u.getId())
                                                         .filter(id -> !id.equals(loginUser.getId()))
                                                         .toList();
                notificationService.sendNotificationToUsers(
                        allUserIds, NotificationType.NOTICE, message, null, null,
                        loginUser.getId(), loginUser.getName());
            } else if (loginUser.getRole() == Role.MANAGER) {
                Integer deptId = loginUser.getDepartment() != null
                        ? loginUser.getDepartment().getId() : null;
                if (deptId != null) {
                    List<Integer> deptUserIds = userRepository.findAll().stream()
                                                              .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(deptId))
                                                              .map(u -> u.getId())
                                                              .filter(id -> !id.equals(loginUser.getId()))
                                                              .toList();
                    notificationService.sendNotificationToUsers(
                            deptUserIds, NotificationType.NOTICE, message, null, null,
                            loginUser.getId(), loginUser.getName());
                }
            }
        }

        // 일반 → 상단고정 시 알림
        if (!wasPinned && Boolean.TRUE.equals(board.getPinned()) && !sentNotice && !wasNotice) {
            String message = "공지사항입니다: " + board.getTitle();

            if (loginUser.getRole() == Role.ADMIN) {
                List<Integer> allUserIds = userRepository.findAll().stream()
                                                         .map(u -> u.getId())
                                                         .filter(id -> !id.equals(loginUser.getId()))
                                                         .toList();
                notificationService.sendNotificationToUsers(
                        allUserIds, NotificationType.NOTICE, message, null, null,
                        loginUser.getId(), loginUser.getName());
            } else if (loginUser.getRole() == Role.MANAGER) {
                Integer deptId = loginUser.getDepartment() != null
                        ? loginUser.getDepartment().getId() : null;
                if (deptId != null) {
                    List<Integer> deptUserIds = userRepository.findAll().stream()
                                                              .filter(u -> u.getDepartment() != null && u.getDepartment().getId().equals(deptId))
                                                              .map(u -> u.getId())
                                                              .filter(id -> !id.equals(loginUser.getId()))
                                                              .toList();
                    notificationService.sendNotificationToUsers(
                            deptUserIds, NotificationType.NOTICE, message, null, null,
                            loginUser.getId(), loginUser.getName());
                }
            }
        }

        return BoardResponseDTO.toDTO(board);
    }

    /** 게시글 삭제 (Soft Delete) */
    @Override
    public void softDeleteBoard(Integer boardId) {
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        // 로그인 사용자 정보 확인
        User loginUser = User.getAuthenticatedUser(userRepository);
        if (loginUser == null) {
            throw new SecurityException("로그인이 필요합니다.");
        }

        // 권한 검사: 작성자 본인 또는 관리자만 가능
        if (!loginUser.getId().equals(board.getUser().getId())
                && loginUser.getRole() != Role.ADMIN) {
            throw new SecurityException("본인 게시글만 삭제할 수 있습니다.");
        }

        // Soft delete
        board.delete();
        board.getReplies().forEach(reply -> reply.delete());
        board.getFiles().forEach(file -> file.delete());
    }

    /** 게시글 상세 조회 (조회수 중복 방지 + 최근 본 게시글 기록) */
    @Override
    @Transactional
    public BoardResponseDTO getBoardById(Integer boardId, String email) { 

        // 로그인 유저 찾기 
        User loginUser = userRepository.findByEmail(email)
                .orElseThrow(() -> new EntityNotFoundException("로그인 정보를 찾을 수 없습니다.")); 

        // 게시글 조회
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        if (board.getDeletedYn()) {
            throw new IllegalStateException("삭제된 게시글입니다.");
        }

        // 비공개 게시글 접근 권한 검사
        if (board.getPrivateYn()) {
            if (!loginUser.getId().equals(board.getUser().getId())
                    && loginUser.getRole() != Role.ADMIN) {
                throw new AccessDeniedException("비공개 게시글은 작성자 또는 관리자만 조회할 수 있습니다.");
            }
        }

        // 조회수 중복 방지 로직(이미 본 글이면 viewedAt만 갱신, 처음 보는 글이면 새로 기록 + 조회수 증가)
        Optional<BoardViewHistory> existingHistory = viewHistoryRepository.findByUserAndBoard(loginUser, board);
        if (existingHistory.isPresent()) {
            existingHistory.get().updateViewedAt(); 
        } else {
            board.increaseViewCount();              
            viewHistoryRepository.save(BoardViewHistory.create(loginUser, board));
        }
        
        // 삭제되지 않은 파일만 별도로 조회하여 DTO에 반영
        List<BoardFile> activeFiles = boardFileRepository.findByBoardIdAndDeletedYnFalse(boardId);

        // 기존 toDTO(board)를 그대로 사용하되, files만 덮어쓰기
        BoardResponseDTO dto = BoardResponseDTO.toDTO(board);
        
        // 파일 DTO 리스트 변환
        List<BoardFileResponseDTO> fileDTOs = activeFiles.stream()
                                                         .map(file -> {
                                                             String url = boardFileService.getPresignedUrlInternal(file.getS3ObjectKey()); // 프리사인드 URL 생성
                                                             return BoardFileResponseDTO.toDTO(file, url);        // 새로운 toDTO 적용
                                                         })
                                                         .toList();  

        // DTO에 파일 적용
        dto.setFiles(fileDTOs);
        
        return dto;
    }

    /** 카테고리별 게시글 목록 조회 */
    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDTO> getBoardsByCategory(Integer categoryId, Pageable pageable) {
      Page<Board> boardPage = boardRepository.findByCategoryIdOrdered(categoryId, pageable);
      List<BoardResponseDTO> dtoList = boardPage.getContent().stream()
                                                .map(board -> BoardResponseDTO.toDTO(board))
                                                .toList();

      // 미리보기 설정
      for (int i = 0; i < boardPage.getContent().size(); i++) {    
          applyPreview(boardPage.getContent().get(i), dtoList.get(i)); 
      }

      return new PageImpl<>(dtoList, pageable, boardPage.getTotalElements());
  }

    /** 사용자 이메일 기반 게시글 목록 조회 */
    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDTO> getBoardsByUser(String email, Pageable pageable) {
      Page<Board> boardPage = boardRepository.findByUserEmailAndDeletedYnFalse(email, pageable);
      List<BoardResponseDTO> dtoList = boardPage.getContent().stream()
                                                .map(board -> BoardResponseDTO.toDTO(board))
                                                .toList();

      // 미리보기 설정
      for (int i = 0; i < boardPage.getContent().size(); i++) {    
          applyPreview(boardPage.getContent().get(i), dtoList.get(i)); 
      }

      return new PageImpl<>(dtoList, pageable, boardPage.getTotalElements());
  }

    /** 공지글 목록 조회 */
    @Override
    @Transactional(readOnly = true)
    public List<BoardResponseDTO> getNoticeBoards() {
      List<Board> boardList = boardRepository.findByNoticeYnTrueAndDeletedYnFalseOrderByPinnedDescCreatedAtDesc();
      List<BoardResponseDTO> dtoList = boardList.stream()         
                                                .map(board -> BoardResponseDTO.toDTO(board))
                                                .toList();        

      for (int i = 0; i < boardList.size(); i++) {               
        applyPreview(boardList.get(i), dtoList.get(i));           
      }

      return dtoList;                               
  }
    
    /** 게시판 정렬 조회 (최신순 / 조회순 선택형) */ 
    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDTO> getBoardsSorted(String sortType, Pageable pageable) { 
      Page<Board> boardPage;

      if ("views".equalsIgnoreCase(sortType)) {
          boardPage = boardRepository.findAllOrderByPinnedNoticeAndViews(pageable);
      } else { // 기본: 최신순
          boardPage = boardRepository.findAllOrderByPinnedNoticeAndCreated(pageable);
      }

      List<BoardResponseDTO> dtoList = boardPage.getContent()
                                                .stream()
                                                .map(board -> BoardResponseDTO.toDTO(board))
                                                .toList();

      for (int i = 0; i < boardPage.getContent().size(); i++) {     
        applyPreview(boardPage.getContent().get(i), dtoList.get(i)); 
      }

      return new PageImpl<>(dtoList, pageable, boardPage.getTotalElements());
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

      List<BoardResponseDTO> dtoList = result.getContent().stream()
                                             .map(board -> BoardResponseDTO.toDTO(board))
                                             .toList();

      for (int i = 0; i < result.getContent().size(); i++) {     
        applyPreview(result.getContent().get(i), dtoList.get(i)); 
      }

      return new PageImpl<>(dtoList, pageable, result.getTotalElements());
  }
    
    /** 최근 본 게시글 10개 조회 */
    @Override
    @Transactional(readOnly = true)
    public List<BoardResponseDTO> getRecentViewedBoards(String email) {
        User user = userRepository.findByEmail(email)
                                  .orElseThrow(() -> new EntityNotFoundException("사용자를 찾을 수 없습니다."));

        List<BoardViewHistory> histories = viewHistoryRepository.findRecentByUserId(user.getId());

        return histories.stream()
                         .map(history -> history.getBoard())
                         .filter(board -> !board.getDeletedYn())
                         .map(board -> BoardResponseDTO.toDTO(board))
                         .limit(10)
                         .toList();
    }
    
    /** 카테고리별 게시글 정렬 조회 (최신순 / 조회순 지원) */
    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDTO> getBoardsByCategorySorted(Integer categoryId, String sortType, Pageable pageable) {
      Page<Board> boardPage;

      if ("views".equalsIgnoreCase(sortType)) {
          boardPage = boardRepository.findByCategoryOrderedByViews(categoryId, pageable); 
      } else {
          boardPage = boardRepository.findByCategoryIdOrdered(categoryId, pageable);
      }

      List<BoardResponseDTO> dtoList = boardPage.getContent()
                                                .stream()
                                                .map(BoardResponseDTO::toDTO)
                                                .toList();

      for (int i = 0; i < boardPage.getContent().size(); i++) {     
        applyPreview(boardPage.getContent().get(i), dtoList.get(i)); 
      }

      return new PageImpl<>(dtoList, pageable, boardPage.getTotalElements());
    }
    
    /** 전체 게시글 최신순 조회 (공지/상단고정 구분 없음) */
    @Override
    @Transactional(readOnly = true)
    public Page<BoardResponseDTO> getBoardsByLatestOnly(Pageable pageable) {
        Page<Board> boardPage = boardRepository.findAllByCreatedAtDesc(pageable);
        
        List<BoardResponseDTO> dtoList = boardPage.getContent()
                                                  .stream()
                                                  .map(BoardResponseDTO::toDTO)
                                                  .toList();
        
        for (int i = 0; i < boardPage.getContent().size(); i++) {          
          applyPreview(boardPage.getContent().get(i), dtoList.get(i));      
        }

        return new PageImpl<>(dtoList, pageable, boardPage.getTotalElements());
    }
    
}