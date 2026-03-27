package com.demobejasb.unit.steps;

import com.demobejasb.admin.controller.AdminController;
import com.demobejasb.attachment.controller.AttachmentController;
import com.demobejasb.attachment.model.Attachment;
import com.demobejasb.attachment.repository.AttachmentRepository;
import com.demobejasb.auth.controller.AuthController;
import com.demobejasb.auth.controller.JwksController;
import com.demobejasb.auth.model.RefreshToken;
import com.demobejasb.auth.model.RevokedToken;
import com.demobejasb.auth.model.User;
import com.demobejasb.auth.repository.RefreshTokenRepository;
import com.demobejasb.auth.repository.RevokedTokenRepository;
import com.demobejasb.auth.repository.UserRepository;
import com.demobejasb.auth.service.AuthService;
import com.demobejasb.config.GlobalExceptionHandler;
import com.demobejasb.expense.controller.ExpenseController;
import com.demobejasb.expense.model.Expense;
import com.demobejasb.expense.repository.ExpenseRepository;
import com.demobejasb.report.controller.ReportController;
import com.demobejasb.security.JwtUtil;
import com.demobejasb.user.controller.UserController;
import org.mockito.Mockito;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.PlatformTransactionManager;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

/**
 * Provides all service beans and mock repositories for unit tests. No web layer, no DB, no
 * security filter chain — pure service/repository wiring with the in-memory data store.
 *
 * <p>Active only under the {@code unit-test} profile to prevent this configuration from being
 * picked up by the integration-test context, which loads the full {@code OrganicLeverApplication}
 * and scans all sub-packages.
 */
@Configuration
@Profile("unit-test")
public class UnitServicesConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public JwtUtil jwtUtil() {
        return new JwtUtil(
                "unit-test-jwt-secret-at-least-32-chars-long",
                3600000L,
                "demo-be");
    }

    @Bean
    @Primary
    public UserRepository userRepository(final UnitInMemoryDataStore dataStore) {
        UserRepository repo = Mockito.mock(UserRepository.class);
        when(repo.save(any(User.class)))
                .thenAnswer(inv -> dataStore.saveUser(inv.getArgument(0)));
        when(repo.findByUsername(anyString()))
                .thenAnswer(inv -> dataStore.findUserByUsername(inv.getArgument(0)));
        when(repo.existsByUsername(anyString()))
                .thenAnswer(inv -> dataStore.existsUserByUsername(inv.getArgument(0)));
        when(repo.findByEmail(anyString()))
                .thenAnswer(inv -> dataStore.findUserByEmail(inv.getArgument(0)));
        when(repo.findById(any()))
                .thenAnswer(inv -> dataStore.findUserById(inv.getArgument(0)));
        when(repo.findAll(any(org.springframework.data.domain.Pageable.class)))
                .thenAnswer(inv -> dataStore.findAllUsers(inv.getArgument(0)));
        when(repo.findAllByEmailContaining(
                anyString(), any(org.springframework.data.domain.Pageable.class)))
                .thenAnswer(inv -> dataStore.findAllUsersByEmail(
                        inv.getArgument(0), inv.getArgument(1)));
        when(repo.findAllByEmailOrUsernameContaining(
                anyString(), any(org.springframework.data.domain.Pageable.class)))
                .thenAnswer(inv -> dataStore.findAllUsersBySearch(
                        inv.getArgument(0), inv.getArgument(1)));
        doAnswer(inv -> {
            dataStore.deleteUserById(inv.getArgument(0));
            return null;
        }).when(repo).deleteById(any());
        return repo;
    }

    @Bean
    @Primary
    public RefreshTokenRepository refreshTokenRepository(final UnitInMemoryDataStore dataStore) {
        RefreshTokenRepository repo = Mockito.mock(RefreshTokenRepository.class);
        when(repo.save(any(RefreshToken.class)))
                .thenAnswer(inv -> dataStore.saveRefreshToken(inv.getArgument(0)));
        when(repo.findByTokenHash(anyString()))
                .thenAnswer(inv -> dataStore.findRefreshTokenByHash(inv.getArgument(0)));
        doAnswer(inv -> {
            dataStore.revokeAllRefreshTokensByUser(inv.getArgument(0));
            return null;
        }).when(repo).revokeAllByUser(any(User.class));
        return repo;
    }

    @Bean
    @Primary
    public RevokedTokenRepository revokedTokenRepository(final UnitInMemoryDataStore dataStore) {
        RevokedTokenRepository repo = Mockito.mock(RevokedTokenRepository.class);
        when(repo.save(any(RevokedToken.class)))
                .thenAnswer(inv -> dataStore.saveRevokedToken(inv.getArgument(0)));
        when(repo.existsByJti(anyString()))
                .thenAnswer(inv -> dataStore.existsRevokedToken(inv.getArgument(0)));
        return repo;
    }

    @Bean
    @Primary
    public ExpenseRepository expenseRepository(final UnitInMemoryDataStore dataStore) {
        ExpenseRepository repo = Mockito.mock(ExpenseRepository.class);
        when(repo.save(any(Expense.class)))
                .thenAnswer(inv -> dataStore.saveExpense(inv.getArgument(0)));
        when(repo.findById(any()))
                .thenAnswer(inv -> dataStore.findExpenseById(inv.getArgument(0)));
        when(repo.findAllByUser(
                any(User.class), any(org.springframework.data.domain.Pageable.class)))
                .thenAnswer(inv -> dataStore.findAllExpensesByUser(
                        inv.getArgument(0), inv.getArgument(1)));
        when(repo.findByIdAndUser(any(), any(User.class)))
                .thenAnswer(inv -> dataStore.findExpenseByIdAndUser(
                        inv.getArgument(0), inv.getArgument(1)));
        doAnswer(inv -> {
            dataStore.deleteExpense(inv.getArgument(0));
            return null;
        }).when(repo).delete(any(Expense.class));
        return repo;
    }

    @Bean
    @Primary
    public AttachmentRepository attachmentRepository(final UnitInMemoryDataStore dataStore) {
        AttachmentRepository repo = Mockito.mock(AttachmentRepository.class);
        when(repo.save(any(Attachment.class)))
                .thenAnswer(inv -> dataStore.saveAttachment(inv.getArgument(0)));
        when(repo.findAllByExpense(any(Expense.class)))
                .thenAnswer(inv -> dataStore.findAllAttachmentsByExpense(inv.getArgument(0)));
        when(repo.findByIdAndExpense(any(), any(Expense.class)))
                .thenAnswer(inv -> dataStore.findAttachmentByIdAndExpense(
                        inv.getArgument(0), inv.getArgument(1)));
        doAnswer(inv -> {
            dataStore.deleteAttachment(inv.getArgument(0));
            return null;
        }).when(repo).delete(any(Attachment.class));
        return repo;
    }

    @Bean
    public AuthService authService(
            final UserRepository userRepository,
            final RefreshTokenRepository refreshTokenRepository,
            final RevokedTokenRepository revokedTokenRepository,
            final PasswordEncoder passwordEncoder,
            final JwtUtil jwtUtil) {
        return new AuthService(
                userRepository,
                refreshTokenRepository,
                revokedTokenRepository,
                passwordEncoder,
                jwtUtil);
    }

    @Bean
    @Primary
    public PlatformTransactionManager transactionManager() {
        return Mockito.mock(PlatformTransactionManager.class);
    }

    // ============================================================
    // Controller beans — plain Java objects, no Spring context needed
    // ============================================================

    @Bean
    public AuthController authController(final AuthService authService) {
        return new AuthController(authService);
    }

    @Bean
    public JwksController jwksController(final JwtUtil jwtUtil) {
        return new JwksController(jwtUtil);
    }

    @Bean
    public AdminController adminController(final UserRepository userRepository) {
        return new AdminController(userRepository);
    }

    @Bean
    public ExpenseController expenseController(
            final ExpenseRepository expenseRepository,
            final UserRepository userRepository) {
        return new ExpenseController(expenseRepository, userRepository);
    }

    @Bean
    public UserController userController(
            final UserRepository userRepository,
            final PasswordEncoder passwordEncoder) {
        return new UserController(userRepository, passwordEncoder);
    }

    @Bean
    public ReportController reportController(
            final ExpenseRepository expenseRepository,
            final UserRepository userRepository) {
        return new ReportController(expenseRepository, userRepository);
    }

    @Bean
    public AttachmentController attachmentController(
            final AttachmentRepository attachmentRepository,
            final ExpenseRepository expenseRepository,
            final UserRepository userRepository) {
        return new AttachmentController(attachmentRepository, expenseRepository, userRepository);
    }

    @Bean
    public GlobalExceptionHandler globalExceptionHandler() {
        return new GlobalExceptionHandler();
    }
}
