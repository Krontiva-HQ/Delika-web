# Multi-Business Type Implementation

## Overview

This implementation extends the Delika application to support multiple business types: **Restaurant**, **Grocery**, and **Pharmacy**. The system maintains the same login endpoint and components while providing role-based access control based on business type.

## Business Types and Roles

### Restaurant Business
- **Manager**: Full access to restaurant features
- **Store Clerk**: Limited access (orders only)
- **Admin**: Full administrative access

### Grocery Business
- **Grocery-Admin**: Full administrative access to grocery features
- **Grocery-Manager**: Full access to grocery features

### Pharmacy Business
- **Pharmacy-Admin**: Full administrative access to pharmacy features
- **Pharmacy-Manager**: Full access to pharmacy features

## Key Changes Made

### 1. User Types (`src/types/user.ts`)
- Added `BusinessUser` union type supporting all business types
- Created specific interfaces: `RestaurantUser`, `GroceryUser`, `PharmacyUser`
- Added helper functions to determine business type from role
- Added utility functions to get business-specific data (name, email, phone, etc.)

### 2. Authentication System (`src/hooks/useAuth.ts`)
- Updated to support new roles: `Grocery-Admin`, `Grocery-Manager`, `Pharmacy-Admin`, `Pharmacy-Manager`
- Added business type detection from user role
- Enhanced user profile handling with business type information
- Added helper functions to get user's business type and role

### 3. Permissions System (`src/permissions/DashboardPermissions.ts`)
- Created business-type specific permission configurations
- Added `getUserPermissions()` function to get permissions based on business type and role
- Updated menu item generation to be business-type aware
- Added display name functions for business types and roles

### 4. Dashboard Component (`src/pages/Dashboard/Dashboard.tsx`)
- Updated to use business-type aware permissions
- Added business type and role display in sidebar
- Enhanced menu item generation based on user permissions
- Updated content rendering to use new permission system

### 5. API Services (`src/services/api.ts`)
- Added business type support to relevant API functions
- Updated function signatures to include optional `businessType` parameter
- Enhanced data fetching to be business-type aware

## How It Works

### Role-Based Access Control
1. **User Login**: Users log in with the same endpoint regardless of business type
2. **Role Detection**: System determines business type from user role (e.g., `Grocery-Admin` → `grocery`)
3. **Permission Assignment**: System assigns permissions based on business type and role
4. **UI Rendering**: Dashboard shows appropriate sections based on permissions

### Business Type Detection
```typescript
// Role to business type mapping
'Admin' | 'Manager' | 'Store Clerk' → 'restaurant'
'Grocery-Admin' | 'Grocery-Manager' → 'grocery'
'Pharmacy-Admin' | 'Pharmacy-Manager' → 'pharmacy'
```

### Permission Structure
Each business type has its own permission matrix:
```typescript
BUSINESS_PERMISSIONS = {
  restaurant: {
    'Admin': { Inventory: true, Reports: true, ... },
    'Manager': { Inventory: true, Reports: true, ... },
    'Store Clerk': { Inventory: false, Reports: false, ... }
  },
  grocery: {
    'Grocery-Admin': { Inventory: true, Reports: true, ... },
    'Grocery-Manager': { Inventory: true, Reports: true, ... }
  },
  pharmacy: {
    'Pharmacy-Admin': { Inventory: true, Reports: true, ... },
    'Pharmacy-Manager': { Inventory: true, Reports: true, ... }
  }
}
```

## Usage Examples

### Getting User Permissions
```typescript
import { getUserPermissions } from '../permissions/DashboardPermissions';

const userPermissions = getUserPermissions('grocery', 'Grocery-Manager');
```

### Checking Business Access
```typescript
import { hasBusinessAccess } from '../types/user';

const hasAccess = hasBusinessAccess('Grocery-Admin', 'grocery'); // true
```

### Getting Business Information
```typescript
import { getBusinessName, getBusinessEmail } from '../types/user';

const businessName = getBusinessName(user); // Returns grocery name
const businessEmail = getBusinessEmail(user); // Returns grocery email
```

## API Integration

### Adding Business Type to API Calls
```typescript
// Before
const data = await getTeamMembers({ restaurantId, branchId });

// After
const data = await getTeamMembers({ 
  restaurantId, 
  branchId, 
  businessType: 'grocery' 
});
```

### Backend Considerations
The backend should:
1. Accept `businessType` parameter in relevant endpoints
2. Filter data based on business type
3. Apply business-type specific business logic
4. Return appropriate data structures for each business type

## Migration Guide

### For Existing Restaurant Users
- No changes needed for existing restaurant users
- All existing functionality remains the same
- New grocery and pharmacy users will have separate data

### For New Business Types
1. Create users with appropriate roles (e.g., `Grocery-Admin`)
2. System automatically detects business type from role
3. Users see appropriate sections and permissions
4. API calls include business type for proper data filtering

## Future Enhancements

### Potential Additions
1. **Business-Specific Features**: Each business type could have unique features
2. **Custom Branding**: Different logos and colors per business type
3. **Specialized Workflows**: Pharmacy-specific order processing, grocery inventory management
4. **Multi-Tenant Support**: Single application instance serving multiple business types

### Configuration Options
- Business type specific settings
- Custom permission matrices
- Business-specific API endpoints
- Custom UI components per business type

## Testing

### Test Cases
1. **Restaurant Users**: Verify existing functionality works
2. **Grocery Users**: Test grocery-specific features and permissions
3. **Pharmacy Users**: Test pharmacy-specific features and permissions
4. **Role Switching**: Test permission changes when role changes
5. **API Integration**: Verify business type is passed to backend

### Manual Testing Checklist
- [ ] Restaurant Admin can access all restaurant features
- [ ] Grocery Manager can access grocery features but not restaurant features
- [ ] Pharmacy Admin can access pharmacy features but not other business types
- [ ] Store Clerk has limited access regardless of business type
- [ ] Business type and role display correctly in sidebar
- [ ] API calls include business type parameter
- [ ] Permissions are correctly applied based on role and business type

## Security Considerations

1. **Role Validation**: Ensure users can only access their assigned business type
2. **Data Isolation**: Verify data is properly filtered by business type
3. **Permission Enforcement**: Ensure UI and API permissions are consistently applied
4. **Session Management**: Verify business type is maintained across sessions

## Troubleshooting

### Common Issues
1. **Wrong Business Type**: Check user role and business type mapping
2. **Missing Permissions**: Verify permission matrix for business type and role
3. **API Errors**: Ensure business type parameter is included in API calls
4. **UI Issues**: Check if permissions are correctly applied in dashboard

### Debug Information
```typescript
// Add to dashboard for debugging
console.log('User Business Type:', userBusinessType);
console.log('User Role:', userRole);
console.log('User Permissions:', userPermissions);
console.log('Available Menu Items:', availableMenuItems);
```
