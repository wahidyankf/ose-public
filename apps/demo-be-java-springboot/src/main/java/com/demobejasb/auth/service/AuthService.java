package com.demobejasb.auth.service;

import com.demobejasb.auth.model.RefreshToken;
import com.demobejasb.auth.model.RevokedToken;
import com.demobejasb.auth.model.User;
import com.demobejasb.auth.repository.RefreshTokenRepository;
import com.demobejasb.auth.repository.RevokedTokenRepository;
import com.demobejasb.auth.repository.UserRepository;
import com.demobejasb.config.ValidationException;
import com.demobejasb.contracts.AuthTokens;
import com.demobejasb.contracts.LoginRequest;
import com.demobejasb.contracts.RegisterRequest;
import com.demobejasb.security.JwtUtil;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Objects;
import java.util.regex.Pattern;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class AuthService {

    private static final int MAX_FAILED_ATTEMPTS = 5;
    private static final long REFRESH_TOKEN_EXPIRY_DAYS = 30;
    private static final Pattern EMAIL_PATTERN =
            Pattern.compile("^[a-zA-Z0-9._%+\\-]+@[a-zA-Z0-9.\\-]+\\.[a-zA-Z]{2,}$");
    private static final Pattern UPPER_PATTERN = Pattern.compile("[A-Z]");
    private static final Pattern SPECIAL_PATTERN = Pattern.compile("[^a-zA-Z0-9]");

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
    public com.demobejasb.contracts.User register(final RegisterRequest request)
            throws UsernameAlreadyExistsException {
        validateEmail(request.getEmail());
        validatePasswordStrength(request.getPassword());
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new UsernameAlreadyExistsException(request.getUsername());
        }
        String encoded = Objects.requireNonNull(passwordEncoder.encode(request.getPassword()));
        User user = new User(request.getUsername(), request.getEmail(), encoded);
        User saved = userRepository.save(user);
        return buildUserResponse(saved);
    }

    @Transactional
    public AuthTokens login(final LoginRequest request)
            throws InvalidCredentialsException, AccountNotActiveException {
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(InvalidCredentialsException::new);

        if ("LOCKED".equals(user.getStatus())) {
            throw new InvalidCredentialsException("Account is locked due to too many failed login attempts");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            user.setFailedLoginAttempts(user.getFailedLoginAttempts() + 1);
            if (user.getFailedLoginAttempts() >= MAX_FAILED_ATTEMPTS) {
                user.setStatus("LOCKED");
                userRepository.save(user);
                throw new InvalidCredentialsException("Account is locked due to too many failed login attempts");
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
    public AuthTokens refresh(final String rawRefreshToken)
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
        if (!revokedTokenRepository.existsByJti(accessToken)) {
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
        if (revokedTokenRepository.existsByJti(token)) {
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

    private AuthTokens generateTokenPair(final User user) {
        String accessToken = jwtUtil.generateAccessToken(user.getUsername(), user.getId());
        String rawRefreshToken = jwtUtil.generateRefreshToken();
        String tokenHash = hashToken(rawRefreshToken);
        Instant expiresAt = Instant.now().plus(REFRESH_TOKEN_EXPIRY_DAYS, ChronoUnit.DAYS);
        refreshTokenRepository.save(new RefreshToken(user, tokenHash, expiresAt));
        AuthTokens tokens = new AuthTokens();
        tokens.setAccessToken(accessToken);
        tokens.setRefreshToken(rawRefreshToken);
        tokens.setTokenType("Bearer");
        return tokens;
    }

    public static com.demobejasb.contracts.User buildUserResponse(final User user) {
        com.demobejasb.contracts.User response = new com.demobejasb.contracts.User();
        response.setId(user.getId().toString());
        response.setUsername(user.getUsername());
        response.setEmail(user.getEmail() != null ? user.getEmail() : "");
        response.setDisplayName(
                user.getDisplayName() != null ? user.getDisplayName() : user.getUsername());
        response.setStatus(
                com.demobejasb.contracts.User.StatusEnum.fromValue(user.getStatus()));
        response.setRoles(List.of(user.getRole()));
        response.setCreatedAt(
                user.getCreatedAt() != null
                        ? user.getCreatedAt().atOffset(java.time.ZoneOffset.UTC)
                        : OffsetDateTime.now());
        response.setUpdatedAt(
                user.getUpdatedAt() != null
                        ? user.getUpdatedAt().atOffset(java.time.ZoneOffset.UTC)
                        : OffsetDateTime.now());
        return response;
    }

    private static void validateEmail(final String email) {
        if (email == null || !EMAIL_PATTERN.matcher(email).matches()) {
            throw new ValidationException("invalid email format", "email");
        }
    }

    private static void validatePasswordStrength(final String password) {
        if (password == null || password.isEmpty()) {
            throw new ValidationException("password is required", "password");
        }
        if (password.length() < 12) {
            throw new ValidationException("password must be at least 12 characters", "password");
        }
        if (!UPPER_PATTERN.matcher(password).find()) {
            throw new ValidationException(
                    "password must contain at least one uppercase letter", "password");
        }
        if (!SPECIAL_PATTERN.matcher(password).find()) {
            throw new ValidationException(
                    "password must contain at least one special character", "password");
        }
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
