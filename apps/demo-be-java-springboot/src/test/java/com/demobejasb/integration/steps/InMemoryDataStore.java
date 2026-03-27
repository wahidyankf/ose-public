package com.demobejasb.integration.steps;

import com.demobejasb.attachment.model.Attachment;
import com.demobejasb.auth.model.RefreshToken;
import com.demobejasb.auth.model.RevokedToken;
import com.demobejasb.auth.model.User;
import com.demobejasb.expense.model.Expense;
import java.lang.reflect.Field;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ConcurrentHashMap;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.context.annotation.Profile;
import org.springframework.stereotype.Component;

/**
 * In-memory data store backing mocked repositories during the legacy {@code test} profile.
 * Thread-safe via ConcurrentHashMap. Provides save/find/delete operations and secondary indexes
 * for lookups.
 *
 * <p>Inactive under the {@code integration-test} profile, which uses a real PostgreSQL database.
 */
@Component
@Profile("test")
public class InMemoryDataStore {

    // Primary stores keyed by UUID
    private final ConcurrentHashMap<UUID, User> users = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, RefreshToken> refreshTokens = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, RevokedToken> revokedTokens = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, Expense> expenses = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<UUID, Attachment> attachments = new ConcurrentHashMap<>();

    // Secondary indexes
    private final ConcurrentHashMap<String, UUID> usersByUsername = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, UUID> usersByEmail = new ConcurrentHashMap<>();
    private final ConcurrentHashMap<String, UUID> refreshTokensByHash = new ConcurrentHashMap<>();
    private final Set<String> revokedTokenStrings = ConcurrentHashMap.newKeySet();

    // ============================================================
    // User operations
    // ============================================================

    public User saveUser(final User user) {
        assignIdIfMissing(user);
        setAuditFields(user);
        users.put(user.getId(), user);
        usersByUsername.put(user.getUsername(), user.getId());
        if (user.getEmail() != null) {
            usersByEmail.put(user.getEmail(), user.getId());
        }
        return user;
    }

    public Optional<User> findUserById(final UUID id) {
        return Optional.ofNullable(users.get(id));
    }

    public Optional<User> findUserByUsername(final String username) {
        UUID id = usersByUsername.get(username);
        return id == null ? Optional.empty() : Optional.ofNullable(users.get(id));
    }

    public boolean existsUserByUsername(final String username) {
        return usersByUsername.containsKey(username);
    }

    public Optional<User> findUserByEmail(final String email) {
        UUID id = usersByEmail.get(email);
        return id == null ? Optional.empty() : Optional.ofNullable(users.get(id));
    }

    public Page<User> findAllUsers(final Pageable pageable) {
        List<User> all = new ArrayList<>(users.values());
        // Sort by createdAt ascending (default)
        all.sort((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()));
        return toPage(all, pageable);
    }

    public Page<User> findAllUsersByEmail(final String email, final Pageable pageable) {
        List<User> matching = users.values().stream()
                .filter(u -> email.equals(u.getEmail()))
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .toList();
        return toPage(matching, pageable);
    }

    public Page<User> findAllUsersBySearch(final String search, final Pageable pageable) {
        String lower = search.toLowerCase();
        List<User> matching = users.values().stream()
                .filter(u -> (u.getEmail() != null && u.getEmail().toLowerCase().contains(lower))
                        || (u.getUsername() != null && u.getUsername().toLowerCase().contains(lower)))
                .sorted((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                .toList();
        return toPage(matching, pageable);
    }

    public void deleteUserById(final UUID id) {
        User removed = users.remove(id);
        if (removed != null) {
            usersByUsername.remove(removed.getUsername());
            if (removed.getEmail() != null) {
                usersByEmail.remove(removed.getEmail());
            }
        }
    }

    // ============================================================
    // RefreshToken operations
    // ============================================================

    public RefreshToken saveRefreshToken(final RefreshToken token) {
        assignIdIfMissing(token);
        refreshTokens.put(token.getId(), token);
        refreshTokensByHash.put(token.getTokenHash(), token.getId());
        return token;
    }

    public Optional<RefreshToken> findRefreshTokenByHash(final String tokenHash) {
        UUID id = refreshTokensByHash.get(tokenHash);
        return id == null ? Optional.empty() : Optional.ofNullable(refreshTokens.get(id));
    }

    public void revokeAllRefreshTokensByUser(final User user) {
        refreshTokens.values().stream()
                .filter(rt -> rt.getUser().getId().equals(user.getId()) && !rt.isRevoked())
                .forEach(rt -> rt.setRevoked(true));
    }

    // ============================================================
    // RevokedToken operations
    // ============================================================

    public RevokedToken saveRevokedToken(final RevokedToken token) {
        assignIdIfMissing(token);
        revokedTokens.put(token.getId(), token);
        revokedTokenStrings.add(token.getJti());
        return token;
    }

    public boolean existsRevokedToken(final String tokenString) {
        return revokedTokenStrings.contains(tokenString);
    }

    // ============================================================
    // Expense operations
    // ============================================================

    public Expense saveExpense(final Expense expense) {
        assignIdIfMissing(expense);
        expense.setUpdatedAt(Instant.now());
        expenses.put(expense.getId(), expense);
        return expense;
    }

    public Optional<Expense> findExpenseById(final UUID id) {
        return Optional.ofNullable(expenses.get(id));
    }

    public Page<Expense> findAllExpensesByUser(final User user, final Pageable pageable) {
        List<Expense> matching = expenses.values().stream()
                .filter(e -> e.getUser().getId().equals(user.getId()))
                .sorted((a, b) -> {
                    int dateComp = b.getDate().compareTo(a.getDate());
                    return dateComp != 0 ? dateComp : b.getId().compareTo(a.getId());
                })
                .toList();
        return toPage(matching, pageable);
    }

    public Optional<Expense> findExpenseByIdAndUser(final UUID id, final User user) {
        return Optional.ofNullable(expenses.get(id))
                .filter(e -> e.getUser().getId().equals(user.getId()));
    }

    public void deleteExpense(final Expense expense) {
        expenses.remove(expense.getId());
        // Also remove associated attachments
        attachments.values().removeIf(a -> a.getExpense().getId().equals(expense.getId()));
    }

    public List<Expense> getAllExpenses() {
        return new ArrayList<>(expenses.values());
    }

    // ============================================================
    // Attachment operations
    // ============================================================

    public Attachment saveAttachment(final Attachment attachment) {
        assignIdIfMissing(attachment);
        attachments.put(attachment.getId(), attachment);
        return attachment;
    }

    public List<Attachment> findAllAttachmentsByExpense(final Expense expense) {
        return attachments.values().stream()
                .filter(a -> a.getExpense().getId().equals(expense.getId()))
                .toList();
    }

    public Optional<Attachment> findAttachmentByIdAndExpense(final UUID id, final Expense expense) {
        return Optional.ofNullable(attachments.get(id))
                .filter(a -> a.getExpense().getId().equals(expense.getId()));
    }

    public void deleteAttachment(final Attachment attachment) {
        attachments.remove(attachment.getId());
    }

    // ============================================================
    // Reset (called before/after each scenario)
    // ============================================================

    public void reset() {
        users.clear();
        refreshTokens.clear();
        revokedTokens.clear();
        expenses.clear();
        attachments.clear();
        usersByUsername.clear();
        usersByEmail.clear();
        refreshTokensByHash.clear();
        revokedTokenStrings.clear();
    }

    // ============================================================
    // Helpers
    // ============================================================

    private <T> void assignIdIfMissing(final T entity) {
        try {
            Field idField = findField(entity.getClass(), "id");
            idField.setAccessible(true);
            if (idField.get(entity) == null) {
                idField.set(entity, UUID.randomUUID());
            }
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException("Failed to assign ID via reflection", e);
        }
    }

    private void setAuditFields(final User user) {
        try {
            Instant now = Instant.now();
            setFieldIfDefault(user, "createdAt", Instant.EPOCH, now);
            setFieldIfDefault(user, "updatedAt", Instant.EPOCH, now);
            setFieldIfEmpty(user, "createdBy", "system");
            setFieldIfEmpty(user, "updatedBy", "system");
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException("Failed to set audit fields via reflection", e);
        }
    }

    private void setFieldIfDefault(
            final Object obj, final String fieldName, final Object defaultVal, final Object newVal)
            throws ReflectiveOperationException {
        Field field = findField(obj.getClass(), fieldName);
        field.setAccessible(true);
        Object current = field.get(obj);
        if (current == null || current.equals(defaultVal)) {
            field.set(obj, newVal);
        }
    }

    private void setFieldIfEmpty(final Object obj, final String fieldName, final String newVal)
            throws ReflectiveOperationException {
        Field field = findField(obj.getClass(), fieldName);
        field.setAccessible(true);
        Object current = field.get(obj);
        if (current == null || "".equals(current)) {
            field.set(obj, newVal);
        }
    }

    private Field findField(final Class<?> clazz, final String name) {
        Class<?> current = clazz;
        while (current != null) {
            try {
                return current.getDeclaredField(name);
            } catch (NoSuchFieldException e) {
                current = current.getSuperclass();
            }
        }
        throw new RuntimeException("Field '" + name + "' not found in " + clazz.getName());
    }

    private <T> Page<T> toPage(final List<T> all, final Pageable pageable) {
        int start = (int) pageable.getOffset();
        int end = Math.min(start + pageable.getPageSize(), all.size());
        List<T> pageContent = start >= all.size() ? List.of() : all.subList(start, end);
        return new PageImpl<>(pageContent, pageable, all.size());
    }
}
