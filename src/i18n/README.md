# Internationalization (i18n) Implementation Guide

This guide explains how to implement internationalization in other components of the application to ensure language changes affect all pages.

## Current Implementation

Currently, the i18n system is configured correctly but not all components are using the translation hook. The main components that need to be updated are:

1. All Dashboard pages
2. Any shared components
3. Navigation components

## How to Update Components

### Step 1: Import the Translation Hook

In each component, add the following import at the top of the file:

```javascript
import { useTranslation } from 'react-i18next';
```

### Step 2: Initialize the Hook

Inside your component function, add the hook initialization:

```javascript
const { t } = useTranslation();
```

### Step 3: Replace Hardcoded Text

Replace all hardcoded text with the translation function calls:

```javascript
// Before
<h1>Dashboard</h1>

// After
<h1>{t('dashboard.title')}</h1>
```

### Step 4: Add Translation Keys

Make sure all the keys you're using are added to the translation files in:
- `src/i18n/locales/en/translation.json`
- `src/i18n/locales/fr/translation.json`
- `src/i18n/locales/es/translation.json`

## Example for Dashboard Pages

Here's what you need to do for each Dashboard page:

1. Orders.tsx
2. Inventory.tsx
3. Transactions.tsx
4. Reports.tsx
5. OrderDetails.tsx
6. PlaceOrder.tsx
7. etc.

Import the hook, initialize it, and replace all text with translation function calls.

## Testing Changes

After updating a component, test it by:

1. Go to Settings > Restaurant Settings
2. Change the language to French or Spanish
3. Verify that the updated component shows text in the selected language

## Translation Files Structure

Keep the translation files organized by section:

```json
{
  "common": {
    "save": "Save",
    "cancel": "Cancel"
  },
  "dashboard": {
    "title": "Dashboard",
    "orders": "Orders"
  },
  "orders": {
    "title": "Orders",
    "newOrder": "New Order"
  }
}
```

Add new sections as needed for different parts of the application. 