package com.goodee.coreconnect.board.service;

import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

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
import com.goodee.coreconnect.user.entity.User;
import com.goodee.coreconnect.user.enums.Role;
import com.goodee.coreconnect.user.repository.UserRepository;

import jakarta.persistence.EntityNotFoundException;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.GetObjectPresignRequest;

@Service
@RequiredArgsConstructor
@Transactional
public class BoardFileServiceImpl implements BoardFileService {

    private final BoardRepository boardRepository;
    private final BoardFileRepository fileRepository;
    private final UserRepository userRepository;
    private final S3Client s3Client;
    private final S3Presigner presigner;

    @Value("${cloud.aws.s3.bucket}")
    private String bucket;

    /** Presigned URL 생성 */
    public String getPresignedUrlWithFilename(String key, String originalFileName) {

      String encoded = URLEncoder.encode(originalFileName, StandardCharsets.UTF_8)
                                 .replaceAll("\\+", "%20"); 

      GetObjectPresignRequest presignRequest = GetObjectPresignRequest.builder()
                                                                      .signatureDuration(Duration.ofMinutes(3))
                                                                      .getObjectRequest(req -> req.bucket(bucket)
                                                                              .key(key)
                                                                              .responseContentDisposition(
                                                                                  "attachment; filename*=UTF-8''" + encoded))
                                                                      .build();

      return presigner.presignGetObject(presignRequest).url().toString();
    }
    
    /**
     * 다중 파일 업로드
     * - S3 업로드 + DB 저장
     */
    @Override
    public List<BoardFileResponseDTO> uploadFiles(Integer boardId, List<MultipartFile> files) {
        if (files == null || files.isEmpty()) return List.of();

        Board board = boardRepository.findById(boardId)
                .orElseThrow(() -> new EntityNotFoundException("게시글을 찾을 수 없습니다."));

        User loginUser = User.getAuthenticatedUser(userRepository);
        if (loginUser == null) throw new AccessDeniedException("인증된 사용자만 파일을 업로드할 수 있습니다.");

        if (!loginUser.getId().equals(board.getUser().getId()) && loginUser.getRole() != Role.ADMIN)
            throw new AccessDeniedException("본인 게시글만 파일을 업로드할 수 있습니다.");

        List<BoardFileResponseDTO> result = new ArrayList<>();

        for (MultipartFile file : files) {
            if (file == null || file.isEmpty()) continue;
            try {
                String originalName = file.getOriginalFilename();
                String uniqueName = UUID.randomUUID() + "_" + originalName;
                String key = "board/" + boardId + "/" + uniqueName;

                PutObjectRequest putRequest = PutObjectRequest.builder()
                                                              .bucket(bucket)
                                                              .key(key)
                                                              .contentType(file.getContentType())
                                                              .build();

                s3Client.putObject(putRequest, RequestBody.fromInputStream(file.getInputStream(), file.getSize()));

                BoardFileRequestDTO reqDto = BoardFileRequestDTO.builder()
                                                                .boardId(boardId)
                                                                .fileName(originalName)
                                                                .fileSize(file.getSize())
                                                                .s3ObjectKey(key)
                                                                .build();

                BoardFile saved = fileRepository.save(reqDto.toEntity(board));

                String url = getPresignedUrlWithFilename(key, originalName);  

                result.add(BoardFileResponseDTO.builder()
                                               .id(saved.getId())
                                               .fileName(saved.getFileName())
                                               .fileSize(saved.getFileSize())
                                               .s3ObjectKey(saved.getS3ObjectKey())
                                               .fileUrl(url)
                                               .deletedYn(saved.getDeletedYn())
                                               .build());
            } catch (IOException e) {
                throw new RuntimeException("파일 업로드 실패: " + file.getOriginalFilename());
            }
        }

        return result;
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

        String url = getPresignedUrlWithFilename(file.getS3ObjectKey(), file.getFileName());

        return BoardFileResponseDTO.builder()
                                    .id(file.getId())
                                    .fileName(file.getFileName())
                                    .fileSize(file.getFileSize())
                                    .s3ObjectKey(file.getS3ObjectKey())
                                    .fileUrl(url)
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
        List<BoardFileResponseDTO> result = new ArrayList<>();

        for (BoardFile file : files) {

            String url = getPresignedUrlWithFilename(file.getS3ObjectKey(), file.getFileName()); // 변경됨

            result.add(BoardFileResponseDTO.builder()
                                           .id(file.getId())
                                           .fileName(file.getFileName())
                                           .fileSize(file.getFileSize())
                                           .s3ObjectKey(file.getS3ObjectKey())
                                           .fileUrl(url)
                                           .deletedYn(file.getDeletedYn())
                                           .build());
        }

        return result;
    }

    /**
     * 파일 삭제 (Soft Delete)
     * - S3 실제 삭제 하지 않음
     */
    @Override
    public void deleteFile(Integer fileId) {
        BoardFile file = fileRepository.findByIdAndDeletedYnFalse(fileId)
                .orElseThrow(() -> new EntityNotFoundException("파일을 찾을 수 없습니다."));

        User loginUser = User.getAuthenticatedUser(userRepository);
        if (loginUser == null) {
            throw new AccessDeniedException("인증된 사용자만 파일을 삭제할 수 있습니다.");
        }

        if (!loginUser.getId().equals(file.getBoard().getUser().getId())
                && loginUser.getRole() != Role.ADMIN) {
            throw new AccessDeniedException("본인 게시글의 파일만 삭제할 수 있습니다.");
        }

        file.delete(); // Soft Delete
    }
    
    /** 여러 파일 삭제 (1개 이상) */
    @Override
    public void deleteFiles(List<Integer> fileIds) {
        if (fileIds == null || fileIds.isEmpty()) return;

        User loginUser = User.getAuthenticatedUser(userRepository);
        if (loginUser == null) {
            throw new AccessDeniedException("인증된 사용자만 파일을 삭제할 수 있습니다.");
        }

        List<BoardFile> files = fileRepository.findAllById(fileIds);

        for (BoardFile file : files) {
            if (!loginUser.getId().equals(file.getBoard().getUser().getId())
                    && loginUser.getRole() != Role.ADMIN) {
                throw new AccessDeniedException("본인 게시글의 파일만 삭제할 수 있습니다.");
            }

            file.delete(); // Soft Delete
        }
    }
    
    /** ZIP 전체 다운로드 */
    @Override
    public void downloadAllFiles(Integer boardId, HttpServletResponse response) throws Exception {

        List<BoardFile> files = fileRepository.findByBoardIdAndDeletedYnFalse(boardId);

        if (files.isEmpty()) {
            throw new EntityNotFoundException("첨부파일이 없습니다.");
        }

        response.setContentType("application/zip");
        response.setHeader(
                "Content-Disposition",
                "attachment; filename=attachments_" + boardId + ".zip");

        ZipOutputStream zipOut = new ZipOutputStream(response.getOutputStream());

        for (BoardFile file : files) {
            // S3 파일 스트림 가져오기
            ResponseInputStream<GetObjectResponse> s3Input = s3Client.getObject(GetObjectRequest.builder()
                                                                                                .bucket(bucket)
                                                                                                .key(file.getS3ObjectKey())
                                                                                                .build());

            // Zip 파일 항목 추가
            ZipEntry zipEntry = new ZipEntry(file.getFileName());
            zipOut.putNextEntry(zipEntry);

            // 파일 스트리밍 전송
            s3Input.transferTo(zipOut);

            zipOut.closeEntry();
            s3Input.close();
        }

        zipOut.finish();
        zipOut.close();
    }
    
    /** 단일 파일 다운로드 */
    @Override
    public void downloadSingleFile(Integer fileId, HttpServletResponse response) throws Exception {

        BoardFile file = fileRepository.findByIdAndDeletedYnFalse(fileId)
                .orElseThrow(() -> new EntityNotFoundException("파일을 찾을 수 없습니다."));

        // S3에서 파일 byte stream 가져오기
        ResponseInputStream<GetObjectResponse> s3Input = s3Client.getObject(GetObjectRequest.builder()
                                                                                            .bucket(bucket)
                                                                                            .key(file.getS3ObjectKey())
                                                                                            .build());

        // Content-Type 자동 적용
        response.setContentType(s3Input.response().contentType());

        // 다운로드 헤더
        response.setHeader("Content-Disposition",
                           "attachment; filename=\"" + new String(file.getFileName().getBytes("UTF-8"), "ISO-8859-1")  + "\"");

        // byte 전송
        s3Input.transferTo(response.getOutputStream());

        response.flushBuffer();
        s3Input.close();
    }
}