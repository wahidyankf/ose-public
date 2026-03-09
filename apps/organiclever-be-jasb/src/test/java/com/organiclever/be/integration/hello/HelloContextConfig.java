package com.organiclever.be.integration.hello;

import com.organiclever.be.integration.steps.BaseCucumberContextConfig;
import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.TestPropertySource;

@CucumberContextConfiguration
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@ActiveProfiles("test")
@TestPropertySource(
    properties = {
        "spring.datasource.url="
            + "jdbc:h2:mem:testdb_hello;DB_CLOSE_DELAY=-1;"
            + "MODE=PostgreSQL;DATABASE_TO_UPPER=false"
    })
public class HelloContextConfig extends BaseCucumberContextConfig {}
