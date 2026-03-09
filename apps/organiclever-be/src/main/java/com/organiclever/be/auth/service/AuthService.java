package com.organiclever.be.auth.service;

import com.organiclever.be.auth.dto.AuthResponse;
import com.organiclever.be.auth.dto.LoginRequest;
import com.organiclever.be.auth.dto.RegisterRequest;
import com.organiclever.be.auth.dto.RegisterResponse;
import com.organiclever.be.auth.model.User;
import com.organiclever.be.auth.repository.UserRepository;
import com.organiclever.be.security.JwtUtil;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    public AuthService(
            final UserRepository userRepository,
            final PasswordEncoder passwordEncoder,
            final JwtUtil jwtUtil) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtUtil = jwtUtil;
    }

    public RegisterResponse register(final RegisterRequest request)
            throws UsernameAlreadyExistsException {
        if (userRepository.existsByUsername(request.username())) {
            throw new UsernameAlreadyExistsException(request.username());
        }
        User user = new User(request.username(), passwordEncoder.encode(request.password()));
        User saved = userRepository.save(user);
        return new RegisterResponse(saved.getId(), saved.getUsername(), saved.getCreatedAt());
    }

    public AuthResponse login(final LoginRequest request) throws InvalidCredentialsException {
        User user =
                userRepository
                        .findByUsername(request.username())
                        .orElseThrow(InvalidCredentialsException::new);
        if (!passwordEncoder.matches(request.password(), user.getPasswordHash())) {
            throw new InvalidCredentialsException();
        }
        String token = jwtUtil.generateToken(user.getUsername());
        return AuthResponse.bearer(token);
    }
}
