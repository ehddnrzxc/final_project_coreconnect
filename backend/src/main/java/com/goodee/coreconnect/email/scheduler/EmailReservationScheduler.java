package com.goodee.coreconnect.email.scheduler;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import com.goodee.coreconnect.email.dto.request.EmailSendRequestDTO;
import com.goodee.coreconnect.email.entity.EmailFile;
import com.goodee.coreconnect.email.entity.EmailRecipient;
import com.goodee.coreconnect.email.repository.EmailFileRepository;
import com.goodee.coreconnect.email.repository.EmailRecipientRepository;
import com.goodee.coreconnect.email.repository.EmailRepository;
import com.goodee.coreconnect.email.service.EmailService;
import com.goodee.coreconnect.user.repository.UserRepository;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Component
public class EmailReservationScheduler {

    private final EmailRepository emailRepository;
    private final EmailFileRepository emailFileRepository;
    private final EmailRecipientRepository emailRecipientRepository;
    private final UserRepository userRepository;
    private final EmailService emailService;

    @Autowired
    public EmailReservationScheduler(
            EmailRepository emailRepository,
            EmailFileRepository emailFileRepository,
            EmailRecipientRepository emailRecipientRepository,
            UserRepository userRepository,
            EmailService emailService) {
        this.emailRepository = emailRepository;
        this.emailFileRepository = emailFileRepository;
        this.emailRecipientRepository = emailRecipientRepository;
        this.userRepository = userRepository;
        this.emailService = emailService;
    }

    // 1분마다 예약메일 발송 시도
    @Scheduled(cron = "0 */1 * * * *")
    public void sendReservedMails() {
        // 1. 예약메일 중 예약 시간이 지난 메일 모두 조회
        List<com.goodee.coreconnect.email.entity.Email> reservedEmails = emailRepository.findAllByEmailStatusAndReservedAtLessThanEqual(
                com.goodee.coreconnect.email.enums.EmailStatusEnum.RESERVED, LocalDateTime.now());

        for (com.goodee.coreconnect.email.entity.Email email : reservedEmails) {
            try {
                // 2. 예약메일 엔티티에서 정보를 추출하여 DTO로 변환
                EmailSendRequestDTO dto = new EmailSendRequestDTO();
                dto.setEmailTitle(email.getEmailTitle());
                dto.setEmailContent(email.getEmailContent());
                dto.setSenderId(email.getSenderId());
                dto.setSenderAddress(email.getSenderEmail());
                dto.setEmailType(email.getEmailType());
                dto.setReservedAt(email.getReservedAt());
                dto.setReplyToEmailId(email.getReplyToEmailId());

                // 3. 수신자,참조,숨은참조 정보 추출 및 dto에 세팅
                List<EmailRecipient> recipients = emailRecipientRepository.findByEmail(email);
                List<String> toAddrs = new ArrayList<>();
                List<String> ccAddrs = new ArrayList<>();
                List<String> bccAddrs = new ArrayList<>();
                for (EmailRecipient r : recipients) {
                    switch (r.getEmailRecipientType()) {
                        case "TO":
                            toAddrs.add(r.getEmailRecipientAddress());
                            break;
                        case "CC":
                            ccAddrs.add(r.getEmailRecipientAddress());
                            break;
                        case "BCC":
                            bccAddrs.add(r.getEmailRecipientAddress());
                            break;
                    }
                }
                dto.setRecipientAddress(toAddrs);
                dto.setCcAddresses(ccAddrs);
                dto.setBccAddresses(bccAddrs);

                // 4. 첨부파일 리스트 추출 (실제 파일아니라 DB메타 콜렉션, 업로드파일 없으므로 null로 둔다)
                List<EmailFile> emailFiles = emailFileRepository.findByEmail(email);
                List<MultipartFile> attachments = null; // 실제 S3에서 파일 다운로드 하거나 null (이 예시는 null, 메타만 전송)

                // 5. DB에 SENT 상태로 저장 및 실제 메일 발송 로직 실행 (sendActualMail 내부에서 처리)
                emailService.sendActualMail(email, null);

                // 6. 예약메일 상태를 SENT로 변경, 발송시각 저장
                email.setEmailStatus(com.goodee.coreconnect.email.enums.EmailStatusEnum.SENT);
                email.setEmailSentTime(LocalDateTime.now());
                email.setEmailFolder("SENT");
                emailRepository.save(email);
            } catch (Exception e) {
                // 실패하면 로깅. (운영 환경에선 재시도 큐 추가 등 권장)
                System.err.println("예약메일 발송 실패 emailId=" + email.getEmailId() + ", 사유=" + e.getMessage());
                e.printStackTrace();
            }
        }
    }
}