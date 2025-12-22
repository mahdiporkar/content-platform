package com.contentplatform.backend.infrastructure.security;

import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

import java.util.List;

public class JwtAuthenticationToken extends AbstractAuthenticationToken {
    private final JwtUser principal;

    public JwtAuthenticationToken(JwtUser principal) {
        super(List.of(new SimpleGrantedAuthority("ROLE_ADMIN")));
        this.principal = principal;
        setAuthenticated(true);
    }

    @Override
    public Object getCredentials() {
        return "";
    }

    @Override
    public Object getPrincipal() {
        return principal;
    }
}
