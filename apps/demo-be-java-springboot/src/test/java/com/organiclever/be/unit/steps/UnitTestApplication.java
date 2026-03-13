package com.organiclever.be.unit.steps;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.data.jpa.autoconfigure.DataJpaRepositoriesAutoConfiguration;
import org.springframework.boot.hibernate.autoconfigure.HibernateJpaAutoConfiguration;
import org.springframework.boot.jdbc.autoconfigure.DataSourceAutoConfiguration;
import org.springframework.boot.liquibase.autoconfigure.LiquibaseAutoConfiguration;
import org.springframework.boot.security.autoconfigure.SecurityAutoConfiguration;
import org.springframework.boot.security.autoconfigure.UserDetailsServiceAutoConfiguration;
import org.springframework.context.annotation.ComponentScan;

/**
 * Minimal Spring Boot application class for unit tests. Excludes all database, JPA, Liquibase, and
 * web security auto-configurations so the context starts with service beans and mocked repositories
 * only.
 */
@SpringBootApplication(
        exclude = {
            DataSourceAutoConfiguration.class,
            HibernateJpaAutoConfiguration.class,
            DataJpaRepositoriesAutoConfiguration.class,
            LiquibaseAutoConfiguration.class,
            SecurityAutoConfiguration.class,
            UserDetailsServiceAutoConfiguration.class
        },
        scanBasePackages = {})
@ComponentScan(
        basePackages = {
            "com.organiclever.be.unit.steps"
        })
public class UnitTestApplication {

    public static void main(final String[] args) {
        SpringApplication.run(UnitTestApplication.class, args);
    }
}
