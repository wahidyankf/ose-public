package com.demobejavx.repository.pg;

import com.demobejavx.domain.model.Attachment;
import com.demobejavx.repository.AttachmentRepository;
import io.vertx.core.Future;
import io.vertx.sqlclient.Pool;
import io.vertx.sqlclient.Row;
import io.vertx.sqlclient.Tuple;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

public class PgAttachmentRepository implements AttachmentRepository {

    private final Pool pool;

    public PgAttachmentRepository(Pool pool) {
        this.pool = pool;
    }

    @Override
    public Future<Attachment> save(Attachment attachment) {
        String id = UUID.randomUUID().toString();
        Instant now = Instant.now();
        return pool.preparedQuery(
                        "INSERT INTO attachments (id, expense_id, user_id, filename,"
                                + " content_type, size, data, created_at)"
                                + " VALUES ($1::uuid, $2::uuid, $3::uuid, $4, $5, $6, $7, $8)"
                                + " RETURNING id, expense_id, user_id, filename, content_type,"
                                + " size, data, created_at")
                .execute(Tuple.of(
                        id,
                        attachment.expenseId(),
                        attachment.userId(),
                        attachment.filename(),
                        attachment.contentType(),
                        attachment.size(),
                        attachment.data(),
                        OffsetDateTime.ofInstant(now, java.time.ZoneOffset.UTC)))
                .map(rows -> rowToAttachment(rows.iterator().next()));
    }

    @Override
    public Future<Optional<Attachment>> findById(String id) {
        if (!isValidUuid(id)) {
            return Future.succeededFuture(Optional.empty());
        }
        return pool.preparedQuery(
                        "SELECT id, expense_id, user_id, filename, content_type, size, data,"
                                + " created_at FROM attachments WHERE id = $1::uuid")
                .execute(Tuple.of(id))
                .map(rows -> {
                    if (rows.size() == 0) {
                        return Optional.empty();
                    }
                    return Optional.of(rowToAttachment(rows.iterator().next()));
                });
    }

    @Override
    public Future<List<Attachment>> findByExpenseId(String expenseId) {
        if (!isValidUuid(expenseId)) {
            return Future.succeededFuture(new ArrayList<>());
        }
        return pool.preparedQuery(
                        "SELECT id, expense_id, user_id, filename, content_type, size, data,"
                                + " created_at FROM attachments WHERE expense_id = $1::uuid"
                                + " ORDER BY created_at ASC")
                .execute(Tuple.of(expenseId))
                .map(rows -> {
                    List<Attachment> result = new ArrayList<>();
                    rows.forEach(row -> result.add(rowToAttachment(row)));
                    return result;
                });
    }

    private static boolean isValidUuid(String id) {
        if (id == null) {
            return false;
        }
        try {
            UUID.fromString(id);
            return true;
        } catch (IllegalArgumentException e) {
            return false;
        }
    }

    @Override
    public Future<Boolean> deleteById(String id) {
        return pool.preparedQuery("DELETE FROM attachments WHERE id = $1::uuid")
                .execute(Tuple.of(id))
                .map(rows -> rows.rowCount() > 0);
    }

    public Pool getPool() {
        return pool;
    }

    private Attachment rowToAttachment(Row row) {
        OffsetDateTime createdAt = row.getOffsetDateTime("created_at");
        Instant instant = createdAt != null ? createdAt.toInstant() : Instant.now();
        byte[] data = row.getBuffer("data") != null
                ? row.getBuffer("data").getBytes()
                : new byte[0];
        return new Attachment(
                row.getUUID("id").toString(),
                row.getUUID("expense_id").toString(),
                row.getUUID("user_id").toString(),
                row.getString("filename"),
                row.getString("content_type"),
                row.getLong("size"),
                data,
                instant);
    }
}
