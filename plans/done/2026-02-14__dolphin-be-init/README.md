# Dolphin Backend Initialization

> **Historical Note**: This plan was executed for the initial `dolphin-be` application, which was later renamed to `orca-grid-be` and repurposed from a Learning Management System to a Knowledge Management System. The application was removed on 2026-02-14 as it was no longer needed.

**Status**: Completed
**Completion Date**: 2026-01-17

## Overview

Initialize a Java Spring Boot application using Maven in the `apps/` folder named "dolphin-be". The application will serve as the backend for a Learning Management System (LMS) platform. The name "dolphin-be" (dolphin backend) was chosen because dolphins are known for their intelligence and love of learning, symbolizing the LMS's purpose of facilitating education and knowledge growth.

**Location**: `apps/dolphin-be/`

**Delivery Type**: Single commit

**Technology Stack**:

- Java 25 (LTS)
- Spring Boot 4.0.x (Jakarta EE 10 - uses jakarta._namespace, not javax._)
- Maven (build tool)

## Problem Statement

The open-sharia-enterprise platform currently lacks a backend service for its Learning Management System (LMS) component. Without this backend, the platform cannot:

- Manage user enrollments and progress tracking
- Store and serve course content dynamically
- Handle authentication and authorization for learners
- Provide APIs for future frontend applications

This plan establishes the foundational backend infrastructure to enable these capabilities.

## Prerequisites

**Development Environment**:

- Java 25 (recommended LTS) or Java 17+ (minimum required by Spring Boot 4.0)
- Maven 3.8+
- Node.js 24.11.1 (for Nx monorepo)
- npm 11.6.3

**Repository Setup**:

- Nx monorepo structure exists in open-sharia-enterprise
- apps/ directory available for new applications
- Nx workspace configured (nx.json, package.json)

**Access Requirements**:

- Write access to repository
- Ability to create new branches (if needed for testing)

**External Dependencies**:

- None for initial setup (future: PostgreSQL database)

**Team Dependencies**:

- None (self-contained initialization)

## Goals

- Set up a Spring Boot Maven project with proper structure
- Configure basic Spring Boot dependencies
- Create initial application properties for dev and production profiles
- Set up project.json for Nx integration
- Create basic health check endpoint
- Add basic logging configuration
- Set up proper .gitignore for Java/Maven
- Create README.md with setup and development instructions

## Context

The open-sharia-enterprise platform needs a robust backend service for its Learning Management System (LMS) component. This plan establishes the foundation for a scalable, maintainable Spring Boot application that will handle user management, course management, progress tracking, and other core LMS features.

## Quick Links

- [Requirements](./requirements.md) - Detailed requirements and acceptance criteria
- [Technical Documentation](./tech-docs.md) - Architecture and implementation details
- [Delivery Plan](./delivery.md) - Milestones, deliverables, and validation

## Next Steps After Initial Setup

Once this plan is completed, future work will include:

1. Implement user authentication and authorization (Spring Security)
2. Create domain models for users, courses, enrollments
3. Implement REST API endpoints for CRUD operations
4. Add comprehensive integration tests
5. Set up continuous integration pipeline
6. Implement caching layer (Redis)
7. Add API documentation (OpenAPI/Swagger)
8. Implement rate limiting
9. Add monitoring and observability (Prometheus, Grafana)
10. Set up database integration (Spring Data JPA, PostgreSQL)

> Home prefix normalised: absolute home-directory paths in this plan's files were rewritten to a portable form (such as `~/`, `$HOME/`, or a `<placeholder>`), so captured output here is not byte-verbatim.
