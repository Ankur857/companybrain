import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { db } from '../../database/db.js';
import { AuditService } from '../audit/auditService.js';

const JWT_SECRET = process.env.JWT_SECRET || 'companybrain_super_secure_jwt_secret_key_2026_enterprise';

export class AuthService {
  /**
   * Register a new employee or provision a brand new company tenant
   */
  static async signup({
    mode = 'JOIN_TENANT', // 'JOIN_TENANT' or 'NEW_TENANT'
    name,
    email,
    password,
    department = 'General',
    tenantId,
    companyName,
    companySlug,
    description,
  }) {
    if (!email || !password || !name) {
      throw new Error('Name, email, and password are required.');
    }

    const cleanEmail = email.toLowerCase().trim();

    // Check if email already exists
    const { data: existingUser } = await db.from('users').select('*').eq('email', cleanEmail).single();
    if (existingUser) {
      throw new Error('An account with this email address already exists.');
    }

    const password_hash = bcrypt.hashSync(password, 10);
    let targetTenantId = tenantId;
    let targetTenant = null;
    let assignedRoleId = null;

    if (mode === 'NEW_TENANT') {
      if (!companyName) {
        throw new Error('Company name is required for enterprise registration.');
      }

      const slug = companySlug || companyName.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
      const newTenantId = crypto.randomUUID();

      const { data: createdTenant } = await db.from('tenants').insert({
        id: newTenantId,
        name: companyName.trim(),
        slug: slug || `company-${Date.now()}`,
        description: description || `${companyName} enterprise workspace`,
        status: 'ACTIVE',
      });
      targetTenantId = newTenantId;
      targetTenant = createdTenant || { id: newTenantId, name: companyName };

      // Create standard roles for this tenant
      const adminRoleId = crypto.randomUUID();
      const empRoleId = crypto.randomUUID();

      await db.from('roles').insert([
        {
          id: adminRoleId,
          tenant_id: newTenantId,
          name: 'Admin',
          description: 'Tenant Administrator',
          permissions: ['ALL'],
        },
        {
          id: empRoleId,
          tenant_id: newTenantId,
          name: 'Employee',
          description: 'Regular Employee',
          permissions: ['QUERY_RAG', 'VIEW_AUTHORIZED_DOCS'],
        },
      ]);
      assignedRoleId = adminRoleId;

      // Create default access groups
      const generalGroupId = crypto.randomUUID();
      const leadershipGroupId = crypto.randomUUID();
      await db.from('groups').insert([
        { id: generalGroupId, tenant_id: newTenantId, name: 'General', description: 'All company personnel' },
        { id: leadershipGroupId, tenant_id: newTenantId, name: 'Leadership', description: 'Executive and administrative clearance' },
      ]);

      // Create the Admin User
      const newUserId = crypto.randomUUID();
      await db.from('users').insert({
        id: newUserId,
        tenant_id: newTenantId,
        name: name.trim(),
        email: cleanEmail,
        password_hash,
        role_id: assignedRoleId,
        department: department || 'Executive',
        status: 'ACTIVE',
      });

      // Add Admin to General and Leadership groups
      await db.from('user_groups').insert([
        { user_id: newUserId, group_id: generalGroupId },
        { user_id: newUserId, group_id: leadershipGroupId },
      ]);

      await AuditService.logEvent({
        tenant_id: newTenantId,
        user_id: newUserId,
        user_name: name,
        action: 'TENANT_CREATE',
        resource_type: 'TENANT',
        resource_id: newTenantId,
        decision: 'ALLOW',
        reason: `New enterprise tenant [${companyName}] provisioned with Admin [${cleanEmail}].`,
      });

      const userProfile = await this.getUserFullProfile(newUserId, newTenantId);
      const token = jwt.sign(
        { userId: newUserId, tenantId: newTenantId, roleName: userProfile.role_name, email: cleanEmail },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return { token, user: userProfile, tenant: targetTenant };
    } else {
      // JOIN_TENANT
      if (!targetTenantId) {
        const { data: allTenants } = await db.from('tenants').select('*');
        const matched = (allTenants || []).find(t => cleanEmail.endsWith(`@${t.slug}.com`)) || allTenants?.[0];
        if (matched) {
          targetTenantId = matched.id;
          targetTenant = matched;
        } else {
          throw new Error('Please select an enterprise company to join.');
        }
      } else {
        const { data: tenant } = await db.from('tenants').select('*').eq('id', targetTenantId).single();
        if (!tenant) throw new Error('Selected company tenant was not found.');
        targetTenant = tenant;
      }

      // Find Employee role for this tenant or global fallback
      const { data: roles } = await db.from('roles').select('*');
      const empRole = (roles || []).find(r => r.name === 'Employee' && (r.tenant_id === targetTenantId || !r.tenant_id)) || roles?.[0];
      assignedRoleId = empRole?.id || null;

      // Find General group for this tenant
      const { data: groups } = await db.from('groups').select('*').eq('tenant_id', targetTenantId);
      const generalGroup = (groups || []).find(g => g.name === 'General') || groups?.[0];

      const newUserId = crypto.randomUUID();
      await db.from('users').insert({
        id: newUserId,
        tenant_id: targetTenantId,
        name: name.trim(),
        email: cleanEmail,
        password_hash,
        role_id: assignedRoleId,
        department: department || 'General',
        status: 'ACTIVE',
      });

      if (generalGroup) {
        await db.from('user_groups').insert({
          user_id: newUserId,
          group_id: generalGroup.id,
        });
      }

      await AuditService.logEvent({
        tenant_id: targetTenantId,
        user_id: newUserId,
        user_name: name,
        action: 'AUTH_SIGNUP',
        resource_type: 'USER',
        resource_id: newUserId,
        decision: 'ALLOW',
        reason: `New employee [${cleanEmail}] registered into [${targetTenant.name}].`,
      });

      const userProfile = await this.getUserFullProfile(newUserId, targetTenantId);
      const token = jwt.sign(
        { userId: newUserId, tenantId: targetTenantId, roleName: userProfile.role_name, email: cleanEmail },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return { token, user: userProfile, tenant: targetTenant };
    }
  }

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
