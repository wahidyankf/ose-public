package com.organiclever.be.auth.controller;

import com.organiclever.be.auth.dto.AuthResponse;
import com.organiclever.be.auth.dto.LoginRequest;
import com.organiclever.be.auth.dto.RegisterRequest;
import com.organiclever.be.auth.dto.RegisterResponse;
import com.organiclever.be.auth.service.AuthService;
import com.organiclever.be.auth.service.InvalidCredentialsException;
import com.organiclever.be.auth.service.UsernameAlreadyExistsException;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(final AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(
            @Valid @RequestBody final RegisterRequest request)
            throws UsernameAlreadyExistsException {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody final LoginRequest request)
            throws InvalidCredentialsException {
        return ResponseEntity.ok(authService.login(request));
    }
}
