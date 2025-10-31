package com.goodee.coreconnect.board.service;

import java.io.IOException;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.board.dto.request.BoardFileRequestDTO;
import com.goodee.coreconnect.board.dto.response.BoardFileResponseDTO;
import com.goodee.coreconnect.board.entity.Board;
import com.goodee.coreconnect.board.entity.BoardFile;
import com.goodee.coreconnect.board.repository.BoardFileRepository;
import com.goodee.coreconnect.board.repository.BoardRepository;
import com.goodee.coreconnect.common.S3Service;
import com.goodee.coreconnect.user.entity.Role;
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardFileServiceImpl implements BoardFileService {

    private final BoardRepository boardRepository;
    private final BoardFileRepository fileRepository;
    private final UserRepository userRepository;
    private final S3Service s3Service;
    private final S3Client s3Client;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    /**
     * 다중 파일 업로드
     * - 게시글 존재 검증
     * - 작성자/관리자만 업로드 가능
     * - S3 업로드 + DB 저장
     */
    @Override
    public List<BoardFileResponseDTO> uploadFiles(Integer boardId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) return List.of();

        // 게시글 존재 확인
        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        // 로그인 사용자 검증
        User loginUser = User.getAuthenticatedUser(userRepository);
        if (loginUser == null) {
            throw new AccessDeniedException("인증된 사용자만 파일을 업로드할 수 있습니다.");
        }

        // 본인 글이 아니면 업로드 불가 (단, ADMIN 예외 허용)
        if (!loginUser.getId().equals(board.getUser().getId())
                && loginUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("본인 게시글만 파일을 업로드할 수 있습니다.");
        }

        //  업로드 로직
        List<BoardFileResponseDTO> resultList = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            try {
                String originalFileName = file.getOriginalFilename();
                String uniqueFileName = UUID.randomUUID() + "_" + originalFileName;
                String key = "board/" + boardId + "/" + uniqueFileName;

                // S3 업로드
                PutObjectRequest putRequest = PutObjectRequest.builder()
                                                              .bucket(bucket)
                                                              .key(key)
                                                              .contentType(file.getContentType())
                                                              .build();

                s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

                // DB 저장
                BoardFileRequestDTO requestDTO = BoardFileRequestDTO.builder()
                                                                    .boardId(boardId)
                                                                    .fileName(originalFileName)
                                                                    .fileSize(file.getSize())
                                                                    .s3ObjectKey(key)
                                                                    .build();
                
                BoardFile boardFile = requestDTO.toEntity(board);
                BoardFile saved = fileRepository.save(boardFile);

                // 응답 DTO 변환 (S3 URL 포함)
                String fileUrl = s3Service.getFileUrl(key);
                resultList.add(BoardFileResponseDTO.builder()
                                                   .id(saved.getId())
                                                   .fileName(saved.getFileName())
                                                   .fileSize(saved.getFileSize())
                                                   .s3ObjectKey(fileUrl)
                                                   .deletedYn(saved.getDeletedYn())
                                                   .build());

            } catch (IOException e) {
                throw new RuntimeException("파일 업로드 중 오류 발생: " + file.getOriginalFilename(), e);
            }
        }

        return resultList;
    }

    /**
     * 단일 파일 조회 (미리보기/다운로드)
     * - Soft Delete 제외
     */
    @Override
    @Transactional(readOnly = true)
    public BoardFileResponseDTO getFile(Integer fileId) {
        BoardFile file = fileRepository.findByIdAndDeletedYnFalse(fileId)
                .orElseThrow(() -> new EntityNotFoundException("파일을 찾을 수 없습니다."));

        String fileUrl = s3Service.getFileUrl(file.getS3ObjectKey());

        return BoardFileResponseDTO.builder()
                                    .id(file.getId())
                                    .fileName(file.getFileName())
                                    .fileSize(file.getFileSize())
                                    .s3ObjectKey(fileUrl)
                                    .deletedYn(file.getDeletedYn())
                                    .build();
    }

    /**
     * 파일 목록 조회 (게시글 기준)
     * - Soft Delete 제외
     */
    @Override
    @Transactional(readOnly = true)
    public List<BoardFileResponseDTO> getFilesByBoard(Integer boardId) {
        List<BoardFile> files = fileRepository.findByBoardIdAndDeletedYnFalse(boardId);
        List<BoardFileResponseDTO> dtoList = new ArrayList<>();

        for (BoardFile file : files) {
            String fileUrl = s3Service.getFileUrl(file.getS3ObjectKey());
            dtoList.add(BoardFileResponseDTO.builder()
                                            .id(file.getId())
                                            .fileName(file.getFileName())
                                            .fileSize(file.getFileSize())
                                            .s3ObjectKey(fileUrl)
                                            .deletedYn(file.getDeletedYn())
                                            .build());
        }

        return dtoList;
    }

    /**
     * 파일 삭제 (Soft Delete)
     * - S3 실제 삭제 하지 않음
     * - 본인 글 또는 ADMIN만 가능
     */
    @Override
    public void deleteFile(Integer fileId) {
        BoardFile file = fileRepository.findByIdAndDeletedYnFalse(fileId)
                .orElseThrow(() -> new EntityNotFoundException("파일을 찾을 수 없습니다."));

        User loginUser = User.getAuthenticatedUser(userRepository);
        if (loginUser == null) {
            throw new AccessDeniedException("인증된 사용자만 파일을 삭제할 수 있습니다.");
        }

        // 본인 또는 관리자만 삭제 가능
        if (!loginUser.getId().equals(file.getBoard().getUser().getId())
                && loginUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("본인 게시글의 파일만 삭제할 수 있습니다.");
        }

        // Soft Delete
        file.delete();
    }
}