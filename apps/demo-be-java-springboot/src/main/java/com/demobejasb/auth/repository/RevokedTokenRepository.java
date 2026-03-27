package com.demobejasb.auth.repository;

import com.demobejasb.auth.model.RevokedToken;
import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, UUID> {
    boolean existsByJti(String jti);
}
