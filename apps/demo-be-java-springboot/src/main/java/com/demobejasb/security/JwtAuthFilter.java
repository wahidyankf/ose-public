package com.demobejasb.security;

import com.demobejasb.auth.repository.RevokedTokenRepository;
import com.demobejasb.auth.repository.UserRepository;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import org.springframework.http.HttpHeaders;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtUtil jwtUtil;
    private final UserDetailsService userDetailsService;
    private final RevokedTokenRepository revokedTokenRepository;
    private final UserRepository userRepository;

    public JwtAuthFilter(
            final JwtUtil jwtUtil,
            final UserDetailsService userDetailsService,
            final RevokedTokenRepository revokedTokenRepository,
            final UserRepository userRepository) {
        this.jwtUtil = jwtUtil;
        this.userDetailsService = userDetailsService;
        this.revokedTokenRepository = revokedTokenRepository;
        this.userRepository = userRepository;
    }

    @Override
    protected void doFilterInternal(
            final HttpServletRequest request,
            final HttpServletResponse response,
            final FilterChain filterChain)
            throws ServletException, IOException {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header != null && header.startsWith("Bearer ")) {
            String token = header.substring(7);
            if (jwtUtil.isTokenValid(token) && !revokedTokenRepository.existsByJti(token)) {
                String username = jwtUtil.extractUsername(token);
                // Check current user status from DB
                boolean isActive = userRepository.findByUsername(username)
                        .map(u -> "ACTIVE".equals(u.getStatus()))
                        .orElse(false);
                if (isActive) {
                    UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                    if (userDetails.isEnabled() && !userDetails.isAccountNonLocked()) {
                        // Skip locked accounts
                    } else if (userDetails.isEnabled()) {
                        UsernamePasswordAuthenticationToken auth =
                                new UsernamePasswordAuthenticationToken(
                                        userDetails, null, userDetails.getAuthorities());
                        auth.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                        SecurityContextHolder.getContext().setAuthentication(auth);
                    }
                }
            }
        }
        filterChain.doFilter(request, response);
    }
}
