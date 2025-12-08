/**
 * Protected Route Component
 * 
 * Uses ShieldForge RequireAuth to protect routes.
 */
import { RequireAuth as ShieldForgeRequireAuth } from '@appforgeapps/shieldforge-react';

export { ShieldForgeRequireAuth as RequireAuth };

/**
 * USAGE:
 * 
 * <RequireAuth fallback={<LoginPage />}>
 *   <ProtectedContent />
 * </RequireAuth>
 */
