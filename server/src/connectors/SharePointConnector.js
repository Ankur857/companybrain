import { BaseConnector } from './BaseConnector.js';

export class SharePointConnector extends BaseConnector {
  constructor(config = {}, account = null, isDevelopmentMode = false) {
    super(config, account, isDevelopmentMode);
    this.type = 'sharepoint';
    this.name = 'Microsoft SharePoint';

    this.clientId = (this.config.clientId && this.config.clientId !== 'undefined')
      ? this.config.clientId
      : process.env.MICROSOFT_CLIENT_ID;
    this.clientSecret = (this.config.clientSecret && this.config.clientSecret !== 'undefined')
      ? this.config.clientSecret
      : process.env.MICROSOFT_CLIENT_SECRET;
    this.tenantId = (this.config.tenantId && this.config.tenantId !== 'undefined')
      ? this.config.tenantId
      : (process.env.MICROSOFT_TENANT_ID || 'common');
  }

  isConfigured() {
    return Boolean((this.clientId && this.clientSecret) || this.account?.credential_reference?.access_token || this.isDevelopmentMode);
  }

  getAuthorizationUrl(state, redirectUri) {
    if (!this.clientId) {
      throw new Error('SharePoint integration is not configured. Missing MICROSOFT_CLIENT_ID.');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      response_type: 'code',
      redirect_uri: redirectUri,
      response_mode: 'query',
      scope: [
        'https://graph.microsoft.com/Files.Read.All',
        'https://graph.microsoft.com/Sites.Read.All',
        'https://graph.microsoft.com/User.Read',
        'offline_access',
      ].join(' '),
      state,
    });

    return `https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/authorize?${params.toString()}`;
  }

  async handleOAuthCallback(code, redirectUri) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('SharePoint integration is not configured. Missing Client ID or Client Secret.');
    }

    const tokenRes = await fetch(`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: this.clientId,
        client_secret: this.clientSecret,
        code,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(`Microsoft OAuth error: ${tokenData.error_description || tokenData.error || 'Failed to exchange token'}`);
    }

    // Get user profile from Microsoft Graph
    const profileRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;

    return {
      providerAccountId: profile.id,
      accountEmail: profile.userPrincipalName || profile.mail,
      accountName: profile.displayName || profile.userPrincipalName,
      credentials: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: expiresAt,
        scope: tokenData.scope,
      },
    };
  }

  async getValidAccessToken() {
    if (this.isDevelopmentMode) {
      return 'dev-mock-ms-access-token';
    }

    const creds = this.account?.credential_reference;
    if (!creds || !creds.access_token) {
      throw new Error('Microsoft SharePoint account is not connected. Please sign in with your Microsoft account.');
    }

    if (creds.expires_at && Date.now() < creds.expires_at - 120000) {
      return creds.access_token;
    }

    if (creds.refresh_token && this.clientId && this.clientSecret) {
      try {
        const refreshRes = await fetch(`https://login.microsoftonline.com/${this.tenantId}/oauth2/v2.0/token`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_id: this.clientId,
            client_secret: this.clientSecret,
            refresh_token: creds.refresh_token,
            grant_type: 'refresh_token',
          }),
        });
        const refreshData = await refreshRes.json();
        if (refreshRes.ok && refreshData.access_token) {
          creds.access_token = refreshData.access_token;
          creds.expires_at = Date.now() + (refreshData.expires_in || 3600) * 1000;
          return creds.access_token;
        }
      } catch (err) {
        console.warn('Microsoft token refresh error:', err);
      }
    }

    return creds.access_token;
  }

  async testConnection() {
    if (this.isDevelopmentMode) {
      return {
        success: true,
        latencyMs: 110,
        service: 'Microsoft Graph API v1.0 (DEVELOPMENT MODE)',
        authenticatedAs: this.account?.account_email || 'developer@companybrain.local',
        rootFolderAccessible: true,
        isDevelopmentMode: true,
      };
    }

    const accessToken = await this.getValidAccessToken();
    const t0 = Date.now();
    const res = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const latencyMs = Date.now() - t0;

    if (!res.ok) {
      throw new Error(`SharePoint Graph API test failed: ${res.statusText}`);
    }

    const profile = await res.json();
    return {
      success: true,
      latencyMs,
      service: 'Microsoft Graph API v1.0',
      authenticatedAs: profile.userPrincipalName || profile.mail,
      rootFolderAccessible: true,
    };
  }

  /**
   * List real SharePoint sites, document libraries, and folders/files
   */
  async listItems(folderId = null, search = '') {
    if (this.isDevelopmentMode && (!this.account || !this.account.credential_reference?.access_token)) {
      return this.getDevelopmentDataset(folderId, search);
    }

    const accessToken = await this.getValidAccessToken();

    // 1. Root Level: List accessible SharePoint sites
    if (!folderId || folderId === 'root') {
      const sitesUrl = search
        ? `https://graph.microsoft.com/v1.0/sites?search=${encodeURIComponent(search)}`
        : 'https://graph.microsoft.com/v1.0/sites/root';

      const res = await fetch(sitesUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        throw new Error(`Microsoft Graph API error (${res.status}): ${res.statusText}`);
      }

      const data = await res.json();
      const siteList = Array.isArray(data.value) ? data.value : (data.id ? [data] : []);

      return siteList.map((site) => ({
        id: `site_${site.id}`,
        external_id: `site_${site.id}`,
        name: site.displayName || site.name || 'SharePoint Site',
        item_type: 'folder',
        mime_type: 'application/vnd.ms-sharepoint.site',
        path: `/${site.name || site.displayName}`,
        source_type: 'sharepoint',
        source_url: site.webUrl || '',
        parent_id: null,
        metadata: { siteId: site.id, isSite: true },
      }));
    }

    // 2. Site selected -> List Document Libraries (Drives)
    if (folderId.startsWith('site_')) {
      const siteId = folderId.replace('site_', '');
      const res = await fetch(`https://graph.microsoft.com/v1.0/sites/${siteId}/drives`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) throw new Error(`Failed to list document libraries: ${res.statusText}`);
      const data = await res.json();

      return (data.value || []).map((drive) => ({
        id: `drive_${drive.id}`,
        external_id: `drive_${drive.id}`,
        name: drive.name || 'Document Library',
        item_type: 'folder',
        mime_type: 'application/vnd.ms-sharepoint.library',
        path: `/${drive.name}`,
        source_type: 'sharepoint',
        source_url: drive.webUrl || '',
        parent_id: folderId,
        metadata: { driveId: drive.id, isDrive: true },
      }));
    }

    // 3. Drive / Folder selected -> List files and subfolders
    let driveId = '';
    let itemId = '';

    if (folderId.startsWith('drive_')) {
      driveId = folderId.replace('drive_', '');
      itemId = 'root';
    } else if (folderId.startsWith('item_')) {
      // format: item_{driveId}_{itemId}
      const parts = folderId.replace('item_', '').split('_');
      driveId = parts[0];
      itemId = parts[1];
    }

    const itemsUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${itemId}/children`;
    const res = await fetch(itemsUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error(`Failed to list files in SharePoint library: ${res.statusText}`);
    const data = await res.json();

    return (data.value || []).map((item) => {
      const isFolder = Boolean(item.folder);
      return {
        id: `item_${driveId}_${item.id}`,
        external_id: `item_${driveId}_${item.id}`,
        name: item.name,
        item_type: isFolder ? 'folder' : 'file',
        mime_type: item.file?.mimeType || (isFolder ? 'application/vnd.ms-sharepoint.folder' : 'application/octet-stream'),
        path: `/${item.name}`,
        source_type: 'sharepoint',
        modified_time: item.lastModifiedDateTime,
        size: item.size || null,
        owner: item.createdBy?.user?.displayName || 'SharePoint User',
        source_url: item.webUrl || '',
        parent_id: folderId,
        metadata: {
          driveId,
          itemId: item.id,
          isFolder,
          webUrl: item.webUrl,
        },
      };
    });
  }

  async downloadItem(itemId, metadata = {}) {
    if (this.isDevelopmentMode) {
      return `Development mode simulated SharePoint content for item [${itemId}]. Real synchronization occurs when live Microsoft account is authenticated.`;
    }

    const accessToken = await this.getValidAccessToken();
    const driveId = metadata.driveId;
    const rawItemId = metadata.itemId;

    if (!driveId || !rawItemId) {
      throw new Error('Missing SharePoint drive or item identifier.');
    }

    const contentUrl = `https://graph.microsoft.com/v1.0/drives/${driveId}/items/${rawItemId}/content`;
    const res = await fetch(contentUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) throw new Error(`Failed to download file from SharePoint: ${res.statusText}`);
    return await res.text();
  }

  getDevelopmentDataset(folderId = null, search = '') {
    const items = [
      {
        id: 'dev_sp_site_1',
        external_id: 'dev_sp_site_1',
        name: 'Corporate Intranet',
        item_type: 'folder',
        mime_type: 'application/vnd.ms-sharepoint.site',
        path: '/Corporate Intranet',
        source_type: 'sharepoint',
        parent_id: null,
        metadata: { isSite: true, isDevelopmentMode: true },
      },
      {
        id: 'dev_sp_folder_1',
        external_id: 'dev_sp_folder_1',
        name: 'HR & Policies',
        item_type: 'folder',
        mime_type: 'application/vnd.ms-sharepoint.folder',
        path: '/Corporate Intranet/HR & Policies',
        source_type: 'sharepoint',
        parent_id: 'dev_sp_site_1',
        metadata: { isDevelopmentMode: true },
      },
      {
        id: 'dev_sp_file_1',
        external_id: 'dev_sp_file_1',
        name: 'Employee Handbook 2026.pdf',
        item_type: 'file',
        mime_type: 'application/pdf',
        path: '/Corporate Intranet/HR & Policies/Employee Handbook 2026.pdf',
        source_type: 'sharepoint',
        modified_time: new Date().toISOString(),
        size: 1980000,
        owner: 'HR Team',
        parent_id: 'dev_sp_folder_1',
        metadata: { isDevelopmentMode: true },
      },
    ];

    if (search) {
      return items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (!folderId || folderId === 'root') {
      return items.filter((i) => !i.parent_id);
    }
    return items.filter((i) => i.parent_id === folderId);
  }
}
