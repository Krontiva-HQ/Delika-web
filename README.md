
# Delika-Main

Note: Please ensure you have installed <code><a href="https://nodejs.org/en/download/">nodejs</a></code>

To preview and run the project on your device:
1) Open project folder in <a href="https://code.visualstudio.com/download">Visual Studio Code</a>
2) In the terminal, run `npm install`
3) Run `npm start` to view project in browser

## Project Overview

RestaurantHub is a comprehensive web application designed to streamline restaurant operations by managing delivery orders, inventory, and customer relationships. The system provides real-time tracking of food deliveries, inventory levels, and sales analytics, helping restaurant owners make data-driven decisions and improve operational efficiency.

## Features

### Order Management
- Real-time order tracking and status updates
- Multiple delivery zone management
- Automated delivery dispatch system
- Order history and status tracking
- Custom order notifications
- Delivery time estimation

### Inventory Management
- Real-time stock level monitoring
- Automated low-stock alerts
- Ingredient usage tracking
- Purchase order management
- Supplier relationship management
- Waste tracking and reporting

### Customer Management
- Customer profile management
- Order history tracking
- Loyalty program integration
- Customer feedback system
- Personalized promotions
- Address management

### Payment Processing
- Secure payment gateway integration
- Multiple payment method support
- Automated billing
- Invoice generation
- Refund management
- Transaction history

### Reporting & Analytics
- Sales performance metrics
- Inventory turnover reports
- Customer behavior analytics
- Delivery performance tracking
- Financial reporting
- Custom report generation

### User Roles & Permissions
- Admin dashboard
- Restaurant staff access
- Delivery partner portal
- Customer interface
- Supplier portal
- Role-based access control

## Tech Stack

### Frontend
- TypeScript
- React.js
- Vite (Bundler)
- Tailwind CSS
- React Query
- React Router
- Axios

### Backend
- XANO (Backend-as-a-Service)
- RESTful API
- Authentication & Authorization
- File Storage
- Database Management
- Workflow Automation

### Database
- XANO's built-in database system
- Relational data structure
- Real-time data synchronization

## Getting Started

1. Clone the repository

# Project Documentation

## Design Principles

### Layout and Responsiveness Guidelines

Our application follows strict design principles to ensure consistency across all pages and components.

#### Core Layout Philosophy

Every page in the application adheres to these fundamental layout principles:

1. **Full Viewport Height**
   - All pages must utilize `min-h-screen` to ensure full viewport coverage
   - Prevents unwanted white spaces and maintains visual consistency

2. **Responsive Design**
   - Pages adapt seamlessly from mobile to desktop views
   - Uses Tailwind's responsive prefixes (sm:, md:, lg:, xl:)
   - Default mobile-first approach

3. **Layout Structure**
   ```jsx
   <div className="flex min-h-screen overflow-hidden flex-col lg:flex-row">
     {/* Page content */}
   </div>
   ```

#### Implementation Guidelines

When creating new pages or components:

1. **Container Setup**
   - Always use `min-h-screen` for the main container
   - Include `overflow-hidden` to prevent unwanted scrollbars
   - Use `flex` or `grid` for responsive layouts

2. **Responsive Behavior**
   - Mobile: Stack elements vertically (`flex-col`)
   - Desktop: Arrange elements horizontally when appropriate (`lg:flex-row`)
   - Use appropriate spacing utilities (`space-y-`, `gap-`, etc.)

3. **Common Classes**
   ```css
   .page-container {
     @apply flex min-h-screen overflow-hidden flex-col lg:flex-row
   }
   ```

## Development Guidelines

### TypeScript Configuration

- Use strict TypeScript mode
- Follow Pascal Case for component names: `OrderManagement.tsx`, `InventoryTracker.tsx`
- Define interfaces for all props and state:
```typescript
interface OrderProps {
  orderId: string;
  customerDetails: CustomerDetails;
  deliveryStatus: DeliveryStatus;
}
```

### Vite Setup
- Using Vite for faster development and optimized builds
- Configuration in `vite.config.ts`:
```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
  }
});
```

### Styling Guidelines

#### Tailwind Configuration
- Use Tailwind's built-in units and utilities
- Maintain consistent spacing with rem/px units
- Example component structure:
```typescript
const PageContainer: React.FC = () => {
  return (
    <div className="min-h-screen w-full overflow-hidden bg-white">
      <div className="mx-auto max-w-[1440px] px-4 py-6">
        {/* Content */}
      </div>
    </div>
  );
};
```

#### Viewport Management
1. **Root Layout Template**
```typescript
const RootLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="min-h-screen w-full flex flex-col overflow-x-hidden">
      <Header />
      <main className="flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
};
```

2. **Page Structure**
```typescript
const PageComponent: React.FC = () => {
  return (
    <div className="min-h-screen w-full flex flex-col">
      <div className="flex-1 container mx-auto px-4">
        {/* Page content */}
      </div>
    </div>
  );
};
```

### Component Structure

#### Base Component Template
```typescript
interface ComponentProps {
  title: string;
  onAction: () => void;
}

const ComponentName: React.FC<ComponentProps> = ({ title, onAction }) => {
  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Component content */}
    </div>
  );
};

export default ComponentName;
```

### Common Layout Classes

```typescript
// Common utility classes for layouts
const layoutClasses = {
  pageContainer: "min-h-screen w-full overflow-hidden",
  contentWrapper: "mx-auto max-w-[1440px] px-4 py-6",
  flexColumn: "flex flex-col",
  flexRow: "flex flex-row",
  fullWidth: "w-full",
  fullHeight: "h-full",
};
```

### Responsive Design Rules

1. **Breakpoints**
```typescript
// Follow Tailwind's default breakpoints
const breakpoints = {
  sm: '640px',   // @media (min-width: 640px)
  md: '768px',   // @media (min-width: 768px)
  lg: '1024px',  // @media (min-width: 1024px)
  xl: '1280px',  // @media (min-width: 1280px)
  '2xl': '1536px' // @media (min-width: 1536px)
};
```

2. **Container Widths**s
```css
.container {
  @apply mx-auto px-4;
  max-width: 1440px; /* Maximum content width */
}
```
  