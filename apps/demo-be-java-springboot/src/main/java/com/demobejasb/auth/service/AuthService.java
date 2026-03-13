package com.demobejasb.auth.service;

import com.demobejasb.auth.dto.AuthResponse;
import com.demobejasb.auth.dto.LoginRequest;
import com.demobejasb.auth.dto.RegisterRequest;
import com.demobejasb.auth.dto.RegisterResponse;
import com.demobejasb.auth.model.RefreshToken;
import com.demobejasb.auth.model.RevokedToken;
import com.demobejasb.auth.model.User;
import com.demobejasb.auth.repository.RefreshTokenRepository;
import com.demobejasb.auth.repository.RevokedTokenRepository;
import com.demobejasb.auth.repository.UserRepository;
import com.demobejasb.security.JwtUtil;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Objects;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long REFRESH_TOKEN_EXPIRY_DAYS = 30;

    private final UserRepository userRepository;
    private final RefreshTokenRepository refreshTokenRepository;
    private final RevokedTokenRepository revokedTokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            final UserRepository userRepository,
            final RefreshTokenRepository refreshTokenRepository,
            final RevokedTokenRepository revokedTokenRepository,
            final PasswordEncoder passwordEncoder,
            final JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.refreshTokenRepository = refreshTokenRepository;
        this.revokedTokenRepository = revokedTokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    @Transactional
    public RegisterResponse register(final RegisterRequest request)
            throws UsernameAlreadyExistsException {
        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException(request.username());
        }
        String encoded = Objects.requireNonNull(passwordEncoder.encode(request.password()));
        User user = new User(request.username(), request.email(), encoded);
        User saved = userRepository.save(user);
        return new RegisterResponse(
                saved.getId(), saved.getUsername(), saved.getCreatedAt().toString());
    }

    @Transactional
    public AuthResponse login(final LoginRequest request)
            throws InvalidCredentialsException, AccountNotActiveException {
        User user = userRepository.findByUsername(request.username())
                .orElseThrow(InvalidCredentialsException::new);

        if ("LOCKED".equals(user.getStatus())) {
            throw new InvalidCredentialsException();
        }

        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                user.setStatus("LOCKED");
            }
            userRepository.save(user);
            throw new InvalidCredentialsException();
        }

        if ("DISABLED".equals(user.getStatus())) {
            throw new AccountNotActiveException("Account is disabled");
        }

        user.setFailedLoginAttempts(0);
        userRepository.save(user);

        return generateTokenPair(user);
    }

    @Transactional
    public AuthResponse refresh(final String rawRefreshToken)
            throws InvalidTokenException, AccountNotActiveException {
        String tokenHash = hashToken(rawRefreshToken);
        RefreshToken refreshToken = refreshTokenRepository.findByTokenHash(tokenHash)
                .orElseThrow(() -> new InvalidTokenException("Invalid refresh token"));

        if (refreshToken.isRevoked()) {
            throw new InvalidTokenException("Refresh token has been revoked");
        }
        if (refreshToken.getExpiresAt().isBefore(Instant.now())) {
            throw new TokenExpiredException("Refresh token has expired");
        }

        User user = refreshToken.getUser();
        if ("DISABLED".equals(user.getStatus()) || "LOCKED".equals(user.getStatus())) {
            throw new AccountNotActiveException("Account is not active");
        }

        refreshToken.setRevoked(true);
        refreshTokenRepository.save(refreshToken);

        return generateTokenPair(user);
    }

    @Transactional
    public void logout(final String accessToken) {
        if (!revokedTokenRepository.existsByToken(accessToken)) {
            revokedTokenRepository.save(new RevokedToken(accessToken));
        }
    }

    @Transactional
    public void logoutAll(final String accessToken, final String username) {
        logout(accessToken);
        userRepository.findByUsername(username).ifPresent(
                user -> refreshTokenRepository.revokeAllByUser(user));
    }

    public boolean isTokenRevoked(final String token) {
        if (revokedTokenRepository.existsByToken(token)) {
            return true;
        }
        // A token issued to a disabled or locked account is effectively revoked.
        // This ensures that disabling a user immediately invalidates all outstanding tokens
        // without requiring an explicit logout.
        try {
            String username = jwtUtil.extractUsername(token);
            return userRepository.findByUsername(username)
                    .map(u -> !"ACTIVE".equals(u.getStatus()))
                    .orElse(false);
        } catch (Exception e) {
            return false;
        }
    }

    private AuthResponse generateTokenPair(final User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getUsername(), user.getId());
        String rawRefreshToken = jwtUtil.generateRefreshToken();
        String tokenHash = hashToken(rawRefreshToken);
        Instant expiresAt = Instant.now().plus(REFRESH_TOKEN_EXPIRY_DAYS, ChronoUnit.DAYS);
        refreshTokenRepository.save(new RefreshToken(user, tokenHash, expiresAt));
        return AuthResponse.bearer(accessToken, rawRefreshToken);
    }

    private String hashToken(final String token) {
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            byte[] hash = md.digest(token.getBytes(StandardCharsets.UTF_8));
            StringBuilder sb = new StringBuilder();
            for (byte b : hash) {
                sb.append(String.format("%02x", b));
            }
            return sb.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }
}
