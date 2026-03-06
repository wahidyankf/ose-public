---
title: "React Routing"
description: Client-side routing patterns with React Router
category: explanation
subcategory: platform-web
tags:
  - react
  - routing
  - react-router
  - navigation
  - typescript
related:
  - ./ex-soen-plwe-fere__best-practices.md
principles:
  - explicit-over-implicit
updated: 2026-01-25
---

# React Routing

## Quick Reference

**Navigation**: [Stack Libraries](../README.md) > [TypeScript React](./README.md) > Routing

**Related Guides**:

- [Best Practices](ex-soen-plwe-to-fere__best-practices.md) - Routing standards
- [Component Architecture](ex-soen-plwe-to-fere__component-architecture.md) - Component patterns

## Overview

React Router enables client-side routing in single-page applications. This guide covers route configuration, navigation, protected routes, and advanced patterns.

**Target Audience**: Developers building multi-page React applications, particularly Islamic finance platforms with complex navigation and role-based access.

**React Router Version**: v6+

## Basic Routing

### Route Configuration

```typescript
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HomePage } from './pages/HomePage';
import { DashboardPage } from './pages/DashboardPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/dashboard" element={<DashboardPage />} />
      <Route path="/zakat" element={<ZakatCalculator />} />
      <Route path="/donations" element={<DonationsList />} />

      {/* Redirect */}
      <Route path="/home" element={<Navigate to="/" replace />} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);
```

### Route Hierarchy

React Router organizes routes in a tree structure:

```mermaid
%% Color Palette: Blue #0173B2, Orange #DE8F05, Teal #029E73, Purple #CC78BC
%% All colors are color-blind friendly and meet WCAG AA contrast standards

graph TD
    A[BrowserRouter] --> B[Routes]
    B --> C[Route /]
    B --> D[Route /dashboard]
    B --> E[Route /zakat]
    B --> F[Route /donations]
    B --> G[Route *]

    C --> H[HomePage]
    D --> I[DashboardPage]
    E --> J[ZakatCalculator]
    F --> K[DonationsList]
    G --> L[NotFoundPage]

    D --> M[Nested Routes]
    M --> N[/dashboard/overview]
    M --> O[/dashboard/reports]
    M --> P[/dashboard/settings]

    style A fill:#0173B2
    style B fill:#029E73
    style C fill:#DE8F05
    style D fill:#DE8F05
    style E fill:#DE8F05
    style F fill:#DE8F05
    style G fill:#CC78BC
    style M fill:#029E73
```

**Route Structure**:

- **BrowserRouter** - Top-level router component
- **Routes** - Container for route definitions
- **Route** - Individual route with path and element
- **Nested Routes** - Routes within parent routes (using Outlet)

### Nested Routes

```typescript
import { Outlet, Routes, Route } from 'react-router-dom';

// Layout component
export const DashboardLayout: React.FC = () => (
  <div className="dashboard-layout">
    <DashboardSidebar />
    <main>
      <Outlet /> {/* Nested routes render here */}
    </main>
  </div>
);

// Route configuration
export const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />

      {/* Nested routes */}
      <Route path="/dashboard" element={<DashboardLayout />}>
        <Route index element={<DashboardHome />} />
        <Route path="zakat" element={<ZakatSection />} />
        <Route path="donations" element={<DonationsSection />} />
        <Route path="reports" element={<ReportsSection />} />
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </BrowserRouter>
);
```

### Dynamic Routes

```typescript
import { useParams } from 'react-router-dom';

// Route with parameters
<Route path="/campaigns/:campaignId" element={<CampaignDetails />} />
<Route path="/donations/:donationId/edit" element={<EditDonation />} />

// Access parameters in component
export const CampaignDetails: React.FC = () => {
  const { campaignId } = useParams<{ campaignId: string }>();

  const { data: campaign, isLoading } = useQuery({
    queryKey: ['campaign', campaignId],
    queryFn: () => campaignApi.getById(campaignId!),
  });

  if (isLoading) return <LoadingSpinner />;
  if (!campaign) return <NotFound />;

  return (
    <div>
      <h1>{campaign.name}</h1>
      <p>Goal: {campaign.goal}</p>
      <p>Raised: {campaign.raised}</p>
    </div>
  );
};

// Multiple parameters
export const EditDonation: React.FC = () => {
  const { donationId } = useParams<{ donationId: string }>();

  return <DonationForm donationId={donationId} />;
};
```

## Navigation

### Programmatic Navigation

```typescript
import { useNavigate } from 'react-router-dom';

export const DonationForm: React.FC = () => {
  const navigate = useNavigate();

  const handleSubmit = async (donation: NewDonation) => {
    const created = await donationApi.create(donation);

    // Navigate to confirmation page
    navigate(`/donations/${created.id}/confirmation`);

    // Navigate with state
    navigate('/success', {
      state: { donation: created },
    });

    // Go back
    navigate(-1);

    // Replace current entry
    navigate('/dashboard', { replace: true });
  };

  return <form>{/* Form fields */}</form>;
};

// Access navigation state
import { useLocation } from 'react-router-dom';

export const SuccessPage: React.FC = () => {
  const location = useLocation();
  const donation = location.state?.donation as Donation | undefined;

  if (!donation) {
    return <Navigate to="/" />;
  }

  return (
    <div>
      <h1>Thank you!</h1>
      <p>Your donation of {donation.amount} was successful.</p>
    </div>
  );
};
```

### Link Components

```typescript
import { Link, NavLink } from 'react-router-dom';

export const Navigation: React.FC = () => (
  <nav>
    {/* Basic link */}
    <Link to="/dashboard">Dashboard</Link>

    {/* NavLink with active class */}
    <NavLink
      to="/zakat"
      className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
    >
      Zakat Calculator
    </NavLink>

    {/* NavLink with style */}
    <NavLink
      to="/donations"
      style={({ isActive }) => ({
        color: isActive ? 'blue' : 'black',
        fontWeight: isActive ? 'bold' : 'normal',
      })}
    >
      Donations
    </NavLink>

    {/* Link with state */}
    <Link to="/campaign/create" state={{ from: 'navigation' }}>
      Create Campaign
    </Link>
  </nav>
);
```

## Protected Routes

### Authentication Guard

```typescript
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export const ProtectedRoute: React.FC = () => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    // Redirect to login, save attempted location
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

// Route configuration
export const App: React.FC = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/login" element={<LoginPage />} />

      {/* Protected routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/zakat" element={<ZakatCalculator />} />
        <Route path="/donations" element={<DonationsList />} />
      </Route>
    </Routes>
  </BrowserRouter>
);

// Login page redirects back to attempted page
export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || '/dashboard';

  const handleLogin = async (credentials: LoginCredentials) => {
    await authApi.login(credentials);
    navigate(from, { replace: true });
  };

  return <LoginForm onSubmit={handleLogin} />;
};
```

### Role-Based Authorization

```typescript
interface RoleGuardProps {
  allowedRoles: string[];
  children: React.ReactNode;
}

export const RoleGuard: React.FC<RoleGuardProps> = ({ allowedRoles, children }) => {
  const { user } = useAuth();

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (!allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

// Route configuration
<Routes>
  <Route
    path="/admin"
    element={
      <RoleGuard allowedRoles={['admin']}>
        <AdminPanel />
      </RoleGuard>
    }
  />

  <Route
    path="/reports"
    element={
      <RoleGuard allowedRoles={['admin', 'manager']}>
        <ReportsPage />
      </RoleGuard>
    }
  />
</Routes>
```

## Related Documentation

- **[Best Practices](ex-soen-plwe-to-fere__best-practices.md)** - Routing standards
- **[Component Architecture](ex-soen-plwe-to-fere__component-architecture.md)** - Component patterns

---

**Last Updated**: 2026-01-25
