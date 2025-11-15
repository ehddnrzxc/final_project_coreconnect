package com.goodee.coreconnect.email.dto.response;

import java.util.List;

public class DeleteMailsResponse {
	private List<Long> deletedMailIds;

    public DeleteMailsResponse() {}
    public DeleteMailsResponse(List<Long> deletedMailIds) { this.deletedMailIds = deletedMailIds; }

    public List<Long> getDeletedMailIds() { return deletedMailIds; }
    public void setDeletedMailIds(List<Long> deletedMailIds) { this.deletedMailIds = deletedMailIds; }
}
