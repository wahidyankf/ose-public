package com.organiclever.be.unit.currency_handling;

import com.organiclever.be.unit.steps.BaseUnitCucumberContextConfig;
import com.organiclever.be.unit.steps.UnitTestApplication;
import io.cucumber.spring.CucumberContextConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;

/**
 * Cucumber context configuration for the CurrencyHandling unit test suite.
 */
@CucumberContextConfiguration
@SpringBootTest(
        classes = UnitTestApplication.class,
        webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("unit-test")
public class CurrencyHandlingUnitContextConfig extends BaseUnitCucumberContextConfig {}
