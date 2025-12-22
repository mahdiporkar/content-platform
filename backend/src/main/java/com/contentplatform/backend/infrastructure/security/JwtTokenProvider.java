package com.contentplatform.backend.infrastructure.security;

import com.contentplatform.backend.application.port.out.TokenProvider;
import com.contentplatform.backend.domain.model.AdminUser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.SignatureAlgorithm;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.List;

@Component
public class JwtTokenProvider implements TokenProvider {
    private final byte[] secret;
    private final long expirationMinutes;

    public JwtTokenProvider(@Value("${app.jwt.secret}") String secret,
                            @Value("${app.jwt.expiration-minutes}") long expirationMinutes) {
        this.secret = secret.getBytes(StandardCharsets.UTF_8);
        this.expirationMinutes = expirationMinutes;
    }

    @Override
    public String generate(AdminUser adminUser) {
        Instant now = Instant.now();
        Instant expiry = now.plus(expirationMinutes, ChronoUnit.MINUTES);
        return Jwts.builder()
            .setSubject(adminUser.getId())
            .claim("email", adminUser.getEmail())
            .claim("applicationIds", adminUser.getAllowedApplicationIds())
            .setIssuedAt(Date.from(now))
            .setExpiration(Date.from(expiry))
            .signWith(Keys.hmacShaKeyFor(secret), SignatureAlgorithm.HS256)
            .compact();
    }

    public JwtUser parse(String token) {
        Claims claims = Jwts.parserBuilder()
            .setSigningKey(Keys.hmacShaKeyFor(secret))
            .build()
            .parseClaimsJws(token)
            .getBody();
        String subject = claims.getSubject();
        String email = claims.get("email", String.class);
        List<String> applicationIds = claims.get("applicationIds", List.class);
        return new JwtUser(subject, email, applicationIds);
    }
}
