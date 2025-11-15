package com.goodee.coreconnect.email.dto.request;

import java.util.List;

public class DeleteMailsRequest {
	private List<Long> mailIds;

    public DeleteMailsRequest() {}
    public DeleteMailsRequest(List<Long> mailIds) { this.mailIds = mailIds; }

    public List<Long> getMailIds() { return mailIds; }
    public void setMailIds(List<Long> mailIds) { this.mailIds = mailIds; }
}
