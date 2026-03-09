package com.organiclever.be.integration.steps;

import org.springframework.context.annotation.Import;

/**
 * Abstract base for Cucumber context configs. Not annotated with @CucumberContextConfiguration —
 * only concrete subclasses are.
 *
 * Imports MockMvcConfig which provides MockMvc with Spring Security applied.
 */
@Import(MockMvcConfig.class)
public abstract class BaseCucumberContextConfig {}
