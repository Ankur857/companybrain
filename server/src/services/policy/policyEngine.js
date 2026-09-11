import { db } from '../../database/db.js';

export class PolicyEngine {
  /**
   * Evaluate whether a user is authorized to access a specific document.
   * Enforces Tenant Isolation, Classification rules, Access Group memberships, and Roles.
   *
   * @param {Object} user - Authenticated user profile with role, tenant_id, and access_groups
   * @param {Object} document - Document entity with tenant_id, classification, required_groups, department
   * @returns {Object} { allowed: boolean, reason: string, policy: string, classification: string }
   */
  static canAccess(user, document) {
    if (!user) {
      return {
        allowed: false,
        reason: 'Authentication required. No user context provided.',
        policy: 'Zero Trust Anonymous Access Policy',
        classification: document?.classification || 'UNKNOWN',
      };
    }

    if (!document) {
      return {
        allowed: false,
        reason: 'Requested resource does not exist.',
        policy: 'Resource Existence Policy',
        classification: 'UNKNOWN',
      };
    }

    // 1. TENANT ISOLATION CHECK (Strict Security Boundary)
    const isSuperAdmin = user.role_name === 'Super Admin';
    if (document.tenant_id !== user.tenant_id && !isSuperAdmin) {
      return {
        allowed: false,
        reason: `Tenant isolation violation: User belongs to tenant [${user.tenant_id}] but document belongs to tenant [${document.tenant_id}].`,
        policy: 'Strict Multi-Tenant Isolation Boundary',
        classification: document.classification,
      };
    }

    // 2. USER STATUS CHECK
    if (user.status !== 'ACTIVE') {
      return {
        allowed: false,
        reason: `User account status is [${user.status}]. Active credentials required.`,
        policy: 'Account Status Verification Policy',
        classification: document.classification,
      };
    }

    const classification = (document.classification || 'INTERNAL').toUpperCase();
    const userGroups = Array.isArray(user.access_groups) ? user.access_groups : [];
    const userGroupIds = userGroups.map((g) => (typeof g === 'object' ? g.id : g));
    const userGroupNames = userGroups.map((g) => (typeof g === 'object' ? g.name : g));

    const requiredGroups = Array.isArray(document.required_groups)
      ? document.required_groups
      : [];

    // 2b. DIRECT USER ACCESS GRANT (Connector Knowledge Access)
    const allowedUserIds = Array.isArray(document.metadata?.allowed_user_ids)
      ? document.metadata.allowed_user_ids
      : [];
    if (allowedUserIds.includes(user.id)) {
      return {
        allowed: true,
        reason: 'Access granted: User is explicitly granted direct access permission by Administrator.',
        policy: 'Direct User Access Grant Policy',
        classification,
      };
    }

    // 3. PUBLIC CLASSIFICATION
    if (classification === 'PUBLIC') {
      return {
        allowed: true,
        reason: 'Document has PUBLIC classification and is accessible to all authenticated tenant members.',
        policy: 'Public Knowledge Access Policy',
        classification,
      };
    }

    // 4. HIGHLY_CONFIDENTIAL CLASSIFICATION
    if (classification === 'HIGHLY_CONFIDENTIAL') {
      // Must explicitly belong to at least one required group
      const hasRequiredGroup = requiredGroups.length > 0 && requiredGroups.some((reqGroup) => {
        return userGroupIds.includes(reqGroup) || userGroupNames.includes(reqGroup);
      });

      if (!hasRequiredGroup) {
        return {
          allowed: false,
          reason: `Access Denied: Document classification is HIGHLY_CONFIDENTIAL and user does not belong to the required access group(s).`,
          policy: 'Confidential Data Guard Policy',
          classification,
        };
      }

      return {
        allowed: true,
        reason: 'Access granted: User possesses matching high-clearance access group membership.',
        policy: 'Confidential Data Guard Policy',
        classification,
      };
    }

    // 5. REQUIRED ACCESS GROUPS CHECK (for INTERNAL and CONFIDENTIAL)
    if (requiredGroups.length > 0) {
      const hasGroup = requiredGroups.some((reqGroup) => {
        return userGroupIds.includes(reqGroup) || userGroupNames.includes(reqGroup);
      });

      if (!hasGroup) {
        // Company Admins have access to internal documentation if tenant matches,
        // but not if document is marked strictly department-restricted without group
        const isCompanyAdmin = user.role_name === 'Company Admin';
        if (isCompanyAdmin && classification === 'INTERNAL') {
          return {
            allowed: true,
            reason: 'Company Admin privilege permits access to tenant-internal operational documents.',
            policy: 'Administrative Access Policy',
            classification,
          };
        }

        return {
          allowed: false,
          reason: `Access Denied: User lacks required access group membership for this resource.`,
          policy: 'Role & Access Group Policy',
          classification,
        };
      }
    }

    // 6. CONFIDENTIAL CLASSIFICATION WITH DEPARTMENT CHECK
    if (classification === 'CONFIDENTIAL') {
      const deptMatches = document.department && user.department &&
        document.department.toLowerCase() === user.department.toLowerCase();

      const hasGroup = requiredGroups.length > 0 && requiredGroups.some((reqGroup) => {
        return userGroupIds.includes(reqGroup) || userGroupNames.includes(reqGroup);
      });

      const isManagerOrAdmin = ['Company Admin', 'Super Admin', 'Manager'].includes(user.role_name);

      if (!deptMatches && !hasGroup && !isManagerOrAdmin) {
        return {
          allowed: false,
          reason: `Access Denied: Document is CONFIDENTIAL to department [${document.department}].`,
          policy: 'Departmental Confidentiality Boundary',
          classification,
        };
      }

      return {
        allowed: true,
        reason: 'Access granted: User meets departmental or role clearance criteria.',
        policy: 'Departmental Confidentiality Boundary',
        classification,
      };
    }

    // Default INTERNAL access
    return {
      allowed: true,
      reason: 'Access granted: User is an active member of this organization.',
      policy: 'Standard Organization Knowledge Policy',
      classification,
    };
  }

  /**
   * Filter a collection of documents for a user, returning ONLY authorized documents
   * and logging any blocked documents.
   *
   * @param {Object} user
   * @param {Array} documents
   * @returns {Object} { authorized: Array, denied: Array }
   */
  static filterAuthorizedDocuments(user, documents) {
    const authorized = [];
    const denied = [];

    for (const doc of documents) {
      const decision = this.canAccess(user, doc);
      if (decision.allowed) {
        authorized.push({ ...doc, accessEvaluation: decision });
      } else {
        denied.push({ ...doc, accessEvaluation: decision });
      }
    }

    return { authorized, denied };
  }
}
