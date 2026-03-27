package com.demobejasb.integration.steps;

import com.demobejasb.attachment.model.Attachment;
import com.demobejasb.attachment.repository.AttachmentRepository;
import com.demobejasb.auth.model.RefreshToken;
import com.demobejasb.auth.model.RevokedToken;
import com.demobejasb.auth.model.User;
import com.demobejasb.auth.repository.RefreshTokenRepository;
import com.demobejasb.auth.repository.RevokedTokenRepository;
import com.demobejasb.auth.repository.UserRepository;
import com.demobejasb.expense.model.Expense;
import com.demobejasb.expense.repository.ExpenseRepository;
import org.mockito.Mockito;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Primary;
import org.springframework.context.annotation.Profile;
import org.springframework.transaction.PlatformTransactionManager;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

/**
 * Provides mocked repositories and a no-op transaction manager for the legacy {@code test}
 * profile. All repository calls delegate to {@link InMemoryDataStore} so tests run without a
 * real database.
 *
 * <p>This configuration is inactive under the {@code integration-test} profile, which uses a
 * real PostgreSQL database instead.
 */
@Configuration
@Profile("test")
public class MockRepositoriesConfig {

    @Bean
    @Primary
    public UserRepository userRepository(final InMemoryDataStore dataStore) {
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
        when(repo.findAllByEmailContaining(anyString(),
                any(org.springframework.data.domain.Pageable.class)))
                .thenAnswer(inv -> dataStore.findAllUsersByEmail(
                        inv.getArgument(0), inv.getArgument(1)));
        when(repo.findAllByEmailOrUsernameContaining(anyString(),
                any(org.springframework.data.domain.Pageable.class)))
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
    public RefreshTokenRepository refreshTokenRepository(final InMemoryDataStore dataStore) {
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
    public RevokedTokenRepository revokedTokenRepository(final InMemoryDataStore dataStore) {
        RevokedTokenRepository repo = Mockito.mock(RevokedTokenRepository.class);

        when(repo.save(any(RevokedToken.class)))
                .thenAnswer(inv -> dataStore.saveRevokedToken(inv.getArgument(0)));
        when(repo.existsByJti(anyString()))
                .thenAnswer(inv -> dataStore.existsRevokedToken(inv.getArgument(0)));

        return repo;
    }

    @Bean
    @Primary
    public ExpenseRepository expenseRepository(final InMemoryDataStore dataStore) {
        ExpenseRepository repo = Mockito.mock(ExpenseRepository.class);

        when(repo.save(any(Expense.class)))
                .thenAnswer(inv -> dataStore.saveExpense(inv.getArgument(0)));
        when(repo.findById(any()))
                .thenAnswer(inv -> dataStore.findExpenseById(inv.getArgument(0)));
        when(repo.findAllByUser(any(User.class),
                any(org.springframework.data.domain.Pageable.class)))
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
    public AttachmentRepository attachmentRepository(final InMemoryDataStore dataStore) {
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
    @Primary
    public PlatformTransactionManager transactionManager() {
        return Mockito.mock(PlatformTransactionManager.class);
    }
}
