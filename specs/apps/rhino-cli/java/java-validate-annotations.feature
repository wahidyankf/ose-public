@java-validate-annotations
Feature: Java Package Null-Safety Annotation Enforcement

  As a Java developer
  I want every package in the source tree to declare a null-safety annotation
  So that NullAway can enforce null safety across the entire codebase

  Scenario: A source tree with all packages annotated passes validation
    Given a Java source tree where every package has a @NullMarked-annotated package-info.java
    When the developer runs java validate-annotations on the source root
    Then the command exits successfully
    And the output reports zero violations

  Scenario: A package missing package-info.java fails validation
    Given a Java source tree where one package has no package-info.java file
    When the developer runs java validate-annotations on the source root
    Then the command exits with a failure code
    And the output identifies the package missing package-info.java

  Scenario: A package-info.java without the required annotation fails validation
    Given a Java source tree where one package has a package-info.java without @NullMarked
    When the developer runs java validate-annotations on the source root
    Then the command exits with a failure code
    And the output identifies the package with the missing annotation

  Scenario: A custom annotation can be specified via flag
    Given a Java source tree where every package has a @NonNull-annotated package-info.java
    When the developer runs java validate-annotations with --annotation NonNull
    Then the command exits successfully
    And the output reports zero violations
