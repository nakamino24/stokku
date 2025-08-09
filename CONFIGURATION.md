# Stokku Configuration Guide

## Environment Setup

To configure Stokku, create a `.env.local` file in the root directory with the following content:

```bash
# Stokku Configuration
# Set to 'false' to use sample data mode (no authentication required)
# Set to 'true' to use Supabase database (authentication required)
NEXT_PUBLIC_USE_SUPABASE=false

# Supabase Configuration (only needed if NEXT_PUBLIC_USE_SUPABASE=true)
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Admin Access

### Sample Data Mode (NEXT_PUBLIC_USE_SUPABASE=false)
- Admin page is accessible without authentication
- Uses sample data for all operations
- Perfect for testing and development

### Supabase Mode (NEXT_PUBLIC_USE_SUPABASE=true)
- Requires user authentication
- Requires user profile with role='admin'
- Uses real Supabase database

## Quick Setup for Admin Access

For immediate admin access, create `.env.local` with:

```bash
NEXT_PUBLIC_USE_SUPABASE=false
```

This enables sample data mode where the admin page works without authentication.
