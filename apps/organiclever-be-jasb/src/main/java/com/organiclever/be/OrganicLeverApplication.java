package com.organiclever.be;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/** Entry point for the OrganicLever Spring Boot application. */
@SpringBootApplication
public final class OrganicLeverApplication {

    private OrganicLeverApplication() {
    }

    /**
     * Starts the Spring Boot application.
     *
     * @param args command-line arguments passed to the application
     */
    public static void main(final String[] args) {
        SpringApplication.run(OrganicLeverApplication.class, args);
    }
}
