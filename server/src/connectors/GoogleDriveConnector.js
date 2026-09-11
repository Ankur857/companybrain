import { BaseConnector } from './BaseConnector.js';

export class GoogleDriveConnector extends BaseConnector {
  constructor(config = {}, account = null, isDevelopmentMode = false) {
    super(config, account, isDevelopmentMode);
    this.type = 'google_drive';
    this.name = 'Google Drive';

    this.clientId = (this.config.clientId && this.config.clientId !== 'undefined')
      ? this.config.clientId
      : process.env.GOOGLE_CLIENT_ID;
    this.clientSecret = (this.config.clientSecret && this.config.clientSecret !== 'undefined')
      ? this.config.clientSecret
      : process.env.GOOGLE_CLIENT_SECRET;
  }

  isConfigured() {
    return Boolean((this.clientId && this.clientSecret) || this.account?.credential_reference?.access_token || this.isDevelopmentMode);
  }

  getAuthorizationUrl(state, redirectUri) {
    if (!this.clientId) {
      throw new Error('Google Drive integration is not configured. Missing GOOGLE_CLIENT_ID.');
    }

    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: [
        'https://www.googleapis.com/auth/drive.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile',
      ].join(' '),
      access_type: 'offline',
      prompt: 'consent',
      state,
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleOAuthCallback(code, redirectUri) {
    if (!this.clientId || !this.clientSecret) {
      throw new Error('Google Drive integration is not configured. Missing Client ID or Client Secret.');
    }

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: this.clientId,
        client_secret: this.clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || !tokenData.access_token) {
      throw new Error(`Google OAuth error: ${tokenData.error_description || tokenData.error || 'Failed to exchange token'}`);
    }

    // Fetch user profile from Google
    const profileRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const profile = await profileRes.json();

    const expiresAt = Date.now() + (tokenData.expires_in || 3600) * 1000;

    return {
      providerAccountId: profile.id,
      accountEmail: profile.email,
      accountName: profile.name,
      picture: profile.picture,
      credentials: {
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        token_type: tokenData.token_type || 'Bearer',
        expires_at: expiresAt,
        scope: tokenData.scope,
      },
    };
  }

  /**
   * Refresh expired access token using refresh_token
   */
  async getValidAccessToken() {
    if (this.isDevelopmentMode) {
      return 'dev-mock-access-token';
    }

    const creds = this.account?.credential_reference;
    if (!creds || !creds.access_token) {
      throw new Error('Google Drive account is not connected. Please connect your Google account.');
    }

    // Check expiration (buffer 2 minutes)
    if (creds.expires_at && Date.now() < creds.expires_at - 120000) {
      return creds.access_token;
    }

    // Refresh if refresh_token available
    if (creds.refresh_token && this.clientId && this.clientSecret) {
      try {
        const refreshRes = await fetch('https://oauth2.googleapis.com/token', {
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
        console.warn('Token refresh error:', err);
      }
    }

    return creds.access_token;
  }

  async testConnection() {
    if (this.isDevelopmentMode) {
      return {
        success: true,
        latencyMs: 95,
        service: 'Google Drive API v3 (DEVELOPMENT MODE)',
        authenticatedAs: this.account?.account_email || 'developer@companybrain.local',
        rootFolderAccessible: true,
        isDevelopmentMode: true,
      };
    }

    const accessToken = await this.getValidAccessToken();
    const t0 = Date.now();
    const res = await fetch('https://www.googleapis.com/drive/v3/about?fields=user,storageQuota', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const latencyMs = Date.now() - t0;

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Google Drive API test failed: ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return {
      success: true,
      latencyMs,
      service: 'Google Drive API v3',
      authenticatedAs: data.user?.emailAddress || this.account?.account_email,
      rootFolderAccessible: true,
      storageQuota: data.storageQuota,
    };
  }

  /**
   * List actual files and folders from the user's Google Drive account
   */
  async listItems(folderId = 'root', search = '') {
    // Development mode simulation if no live credentials
    if (this.isDevelopmentMode && (!this.account || !this.account.credential_reference?.access_token)) {
      return this.getDevelopmentDataset(folderId, search);
    }

    const cleanFolderId = (folderId && folderId !== 'undefined') ? folderId : 'root';
    const cleanSearch = (search && search !== 'undefined') ? search.trim() : '';

    const accessToken = await this.getValidAccessToken();
    let query = cleanSearch
      ? `name contains '${cleanSearch.replace(/'/g, "\\'")}' and trashed = false`
      : `'${cleanFolderId}' in parents and trashed = false`;

    const url = new URL('https://www.googleapis.com/drive/v3/files');
    url.searchParams.set('q', query);
    url.searchParams.set('fields', 'files(id, name, mimeType, modifiedTime, size, owners, webViewLink, parents)');
    url.searchParams.set('pageSize', '100');
    url.searchParams.set('orderBy', 'folder,modifiedTime desc');

    const res = await fetch(url.toString(), {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(`Google Drive API error (${res.status}): ${err.error?.message || res.statusText}`);
    }

    const data = await res.json();
    return (data.files || []).map((file) => {
      const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
      return {
        id: file.id,
        external_id: file.id,
        name: file.name,
        item_type: isFolder ? 'folder' : 'file',
        mime_type: file.mimeType,
        path: `/${file.name}`,
        source_type: 'google_drive',
        modified_time: file.modifiedTime,
        size: file.size ? parseInt(file.size, 10) : null,
        owner: file.owners?.[0]?.displayName || file.owners?.[0]?.emailAddress || 'Me',
        source_url: file.webViewLink || '',
        parent_id: folderId === 'root' ? null : folderId,
        metadata: {
          googleFileId: file.id,
          isFolder,
          owners: file.owners,
        },
      };
    });
  }

  /**
   * Download or export real file content
   */
  async downloadItem(itemId, metadata = {}) {
    if (this.isDevelopmentMode) {
      return `Development mode simulated document content for file [${itemId}]. Real text indexing occurs when live Google OAuth is authenticated.`;
    }

    const accessToken = await this.getValidAccessToken();
    const mimeType = metadata.mime_type || '';

    // Handle Google Docs / Sheets / Slides exports
    if (mimeType.startsWith('application/vnd.google-apps.')) {
      let exportMime = 'text/plain';
      if (mimeType.includes('spreadsheet')) exportMime = 'text/csv';
      const exportUrl = `https://www.googleapis.com/drive/v3/files/${itemId}/export?mimeType=${encodeURIComponent(exportMime)}`;
      const res = await fetch(exportUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      if (!res.ok) throw new Error(`Failed to export Google document: ${res.statusText}`);
      return await res.text();
    }

    // Binary / text files
    const res = await fetch(`https://www.googleapis.com/drive/v3/files/${itemId}?alt=media`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!res.ok) throw new Error(`Failed to download file from Google Drive: ${res.statusText}`);
    return await res.text();
  }

  async disconnect() {
    const creds = this.account?.credential_reference;
    if (creds?.access_token) {
      try {
        await fetch(`https://oauth2.googleapis.com/revoke?token=${creds.access_token}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
      } catch (err) {
        console.warn('Google token revocation warning:', err.message);
      }
    }
    return { success: true, message: 'Google Drive disconnected.' };
  }

  /**
   * Explicit Development Mode Dataset (only used when isDevelopmentMode is explicitly enabled)
   */
  getDevelopmentDataset(folderId = 'root', search = '') {
    const items = [
      {
        id: 'dev_gdrive_folder_1',
        external_id: 'dev_gdrive_folder_1',
        name: 'Company Projects',
        item_type: 'folder',
        mime_type: 'application/vnd.google-apps.folder',
        path: '/Company Projects',
        source_type: 'google_drive',
        modified_time: new Date().toISOString(),
        size: null,
        owner: 'Admin',
        parent_id: null,
        metadata: { isFolder: true, isDevelopmentMode: true },
      },
      {
        id: 'dev_gdrive_file_1',
        external_id: 'dev_gdrive_file_1',
        name: 'Project Roadmap.pdf',
        item_type: 'file',
        mime_type: 'application/pdf',
        path: '/Company Projects/Project Roadmap.pdf',
        source_type: 'google_drive',
        modified_time: new Date().toISOString(),
        size: 1450000,
        owner: 'Admin',
        parent_id: 'dev_gdrive_folder_1',
        metadata: { isDevelopmentMode: true },
      },
      {
        id: 'dev_gdrive_file_2',
        external_id: 'dev_gdrive_file_2',
        name: 'Architecture Specification.docx',
        item_type: 'file',
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        path: '/Company Projects/Architecture Specification.docx',
        source_type: 'google_drive',
        modified_time: new Date().toISOString(),
        size: 890000,
        owner: 'Admin',
        parent_id: 'dev_gdrive_folder_1',
        metadata: { isDevelopmentMode: true },
      },
    ];

    if (search) {
      return items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()));
    }
    if (folderId === 'root' || !folderId) {
      return items.filter((i) => !i.parent_id);
    }
    return items.filter((i) => i.parent_id === folderId);
  }
}
