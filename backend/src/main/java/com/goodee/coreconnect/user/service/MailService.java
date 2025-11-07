package com.goodee.coreconnect.user.service;

public interface MailService {
  
  public void sendTempPassword(String to, String tempPassword);

}
