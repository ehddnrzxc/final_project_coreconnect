package com.goodee.coreconnect.auth;

/**
 * Access Token, Refresh Token의 유효기간을 상수로 나타내는 클래스
 */

public class JwtConstants {
  // Access Token: 24시간
  public static final int ACCESS_TOKEN_MINUTES = 60*24; 
  // Refresh Token: 7일
  public static final int REFRESH_TOKEN_DAYS = 7;
}