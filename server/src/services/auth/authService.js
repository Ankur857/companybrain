import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { db } from '../../database/db.js';
import { AuditService } from '../audit/auditService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'companybrain_super_secure_jwt_secret_key_2026_enterprise';

export class AuthService {
  /**
   * Authenticate employee credentials and issue signed tenant-aware JWT
   */
  static async login({ email, password, requestedTenantId = null }) {
    if (!email || !password) {
      throw new Error('Email and password are required.');
    }

    // 1. Fetch user by email
    const { data: user } = await db.from('users').select('*').eq('email', email.toLowerCase().trim()).single();
    if (!user) {
      throw new Error('Invalid email or password.');
    }

    // 2. Validate password
    const isMatch = bcrypt.compareSync(password, user.password_hash);
    if (!isMatch) {
      await AuditService.logEvent({
        tenant_id: user.tenant_id,
        user_id: user.id,
        user_name: user.name,
        action: 'AUTH_LOGIN',
        resource_type: 'USER',
        resource_id: user.id,
        decision: 'DENY',
        reason: 'Failed login attempt: incorrect password credentials.',
      });
      throw new Error('Invalid email or password.');
    }

    // 3. User status check
    if (user.status !== 'ACTIVE') {
      throw new Error(`Account is ${user.status}. Contact company administrator.`);
    }

    // 4. Fetch Role
    let roleName = 'Employee';
    if (user.role_id) {
      const { data: role } = await db.from('roles').select('*').eq('id', user.role_id).single();
      if (role) roleName = role.name;
    }

    // 5. Tenant determination
    // If Super Admin, they can choose active tenant context; otherwise tenant is strictly user.tenant_id
    let activeTenantId = user.tenant_id;
    if (roleName === 'Super Admin' && requestedTenantId) {
      activeTenantId = requestedTenantId;
    }

    // Fetch Tenant details
    const { data: tenant } = await db.from('tenants').select('*').eq('id', activeTenantId).single();

    // 6. Fetch User Access Groups
    const userProfile = await this.getUserFullProfile(user.id, activeTenantId);

    // 7. Sign JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        tenantId: activeTenantId,
        roleName: userProfile.role_name,
        email: user.email,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await AuditService.logEvent({
      tenant_id: activeTenantId,
      user_id: user.id,
      user_name: user.name,
      action: 'AUTH_LOGIN',
      resource_type: 'USER',
      resource_id: user.id,
      decision: 'ALLOW',
      reason: `User authenticated successfully with role [${userProfile.role_name}] in [${tenant?.name || 'Company'}].`,
      metadata: { tenant_id: activeTenantId },
    });

    return {
      token,
      user: userProfile,
      tenant,
    };
  }

  /**
   * Hydrate complete user access profile including access groups and current role
   */
  static async getUserFullProfile(userId, tenantId = null) {
    const { data: user } = await db.from('users').select('*').eq('id', userId).single();
    if (!user) return null;

    const effectiveTenantId = tenantId || user.tenant_id;

    // Role
    let role = { name: 'Employee', permissions: [] };
    if (user.role_id) {
      const { data: roleData } = await db.from('roles').select('*').eq('id', user.role_id).single();
      if (roleData) role = roleData;
    }

    // Groups
    const { data: userGroupLinks } = await db.from('user_groups').select('*').eq('user_id', userId);
    const groupIds = (userGroupLinks || []).map((ug) => ug.group_id);

    let accessGroups = [];
    if (groupIds.length > 0) {
      const { data: groups } = await db.from('groups').select('*').in('id', groupIds);
      accessGroups = groups || [];
    }

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      tenant_id: effectiveTenantId,
      department: user.department,
      status: user.status,
      role_id: user.role_id,
      role_name: role.name,
      permissions: role.permissions,
      access_groups: accessGroups,
    };
  }

  /**
   * Switch active tenant for Super Admin or multi-tenant authorized users
   */
  static async switchTenant(currentUser, targetTenantId) {
    // Super Admins can switch anywhere
    if (currentUser.role_name !== 'Super Admin' && currentUser.tenant_id !== targetTenantId) {
      throw new Error('Access denied: You do not have permission to switch to another company tenant.');
    }

    const { data: targetTenant } = await db.from('tenants').select('*').eq('id', targetTenantId).single();
    if (!targetTenant) {
      throw new Error('Target company tenant not found.');
    }

    const userProfile = await this.getUserFullProfile(currentUser.id, targetTenantId);

    const token = jwt.sign(
      {
        userId: currentUser.id,
        tenantId: targetTenantId,
        roleName: userProfile.role_name,
        email: currentUser.email,
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    await AuditService.logEvent({
      tenant_id: targetTenantId,
      user_id: currentUser.id,
      user_name: currentUser.name,
      action: 'TENANT_SWITCH',
      resource_type: 'TENANT',
      resource_id: targetTenantId,
      decision: 'ALLOW',
      reason: `Context switched to tenant [${targetTenant.name}].`,
    });

    return {
      token,
      user: userProfile,
      tenant: targetTenant,
    };
  }
}
