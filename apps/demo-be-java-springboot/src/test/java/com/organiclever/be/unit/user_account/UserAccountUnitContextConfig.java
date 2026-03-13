package com.organiclever.be.unit.user_account;

import com.organiclever.be.unit.steps.BaseUnitCucumberContextConfig;
import com.organiclever.be.unit.steps.UnitTestApplication;
import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Cucumber context configuration for the UserAccount unit test suite.
 */
@CucumberContextConfiguration
@SpringBootTest(
        classes = UnitTestApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("unit-test")
public class UserAccountUnitContextConfig extends BaseUnitCucumberContextConfig {}
