package com.organiclever.be.unit.unit_handling;

import com.organiclever.be.unit.steps.BaseUnitCucumberContextConfig;
import com.organiclever.be.unit.steps.UnitTestApplication;
import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Cucumber context configuration for the UnitHandling unit test suite.
 */
@CucumberContextConfiguration
@SpringBootTest(
        classes = UnitTestApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("unit-test")
public class UnitHandlingUnitContextConfig extends BaseUnitCucumberContextConfig {}
