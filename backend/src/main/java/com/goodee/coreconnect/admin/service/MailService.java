package com.goodee.coreconnect.admin.service;

public interface MailService {
  
  public void sendTempPassword(String to, String tempPassword);

}
