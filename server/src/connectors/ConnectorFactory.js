import { GoogleDriveConnector } from './GoogleDriveConnector.js';
import { SharePointConnector } from './SharePointConnector.js';
import { SupabaseConnector } from './SupabaseConnector.js';

export class ConnectorFactory {
  /**
   * Instantiate appropriate connector instance
   * @param {string} type - 'google_drive' | 'sharepoint' | 'supabase'
   * @param {Object} config - connector configuration
   * @param {Object|null} account - connected account credentials (server-side only)
   * @param {boolean} isDevelopmentMode - explicit development mode
   */
  static create(type, config = {}, account = null, isDevelopmentMode = false) {
    switch (type) {
      case 'google_drive':
        return new GoogleDriveConnector(config, account, isDevelopmentMode);
      case 'sharepoint':
        return new SharePointConnector(config, account, isDevelopmentMode);
      case 'supabase':
        return new SupabaseConnector(config, account, isDevelopmentMode);
      default:
        throw new Error(`Unsupported connector type: [${type}]. Currently supported: google_drive, sharepoint, supabase.`);
    }
  }

  /**
   * Get metadata for the 3 supported connectors with live configuration status
   */
  static getSupportedTypes() {
    const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const hasMicrosoft = Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET);
    const hasSupabase = Boolean(process.env.SUPABASE_URL && (process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY));

    return [
      {
        type: 'google_drive',
        name: 'Google Drive',
        tagline: 'Connect company Google Drive',
        category: 'Cloud Storage',
        icon: 'Folder',
        description: 'Connect your company Google Drive account to browse and index real folders, Google Docs, and files.',
        authType: 'OAuth 2.0',
        isConfigured: hasGoogle,
        unconfiguredMessage: 'Google Drive integration is not configured. OAuth Client ID and Secret required on server.',
        supportsOAuth: true,
      },
      {
        type: 'sharepoint',
        name: 'Microsoft SharePoint',
        tagline: 'Connect Microsoft SharePoint',
        category: 'Enterprise Intranet',
        icon: 'FileText',
        description: 'Sign in with your Microsoft 365 work account to access real SharePoint sites, document libraries, and intranet files.',
        authType: 'Microsoft Graph / Azure AD OAuth',
        isConfigured: hasMicrosoft,
        unconfiguredMessage: 'SharePoint integration is not configured. Azure App registration Client ID and Secret required.',
        supportsOAuth: true,
      },
      {
        type: 'supabase',
        name: 'Supabase',
        tagline: 'Connect Supabase/PostgreSQL data',
        category: 'Relational Database',
        icon: 'Database',
        description: 'Connect your Supabase project to discover real schemas and tables for permission-aware knowledge queries.',
        authType: 'Project URL & API Key',
        isConfigured: hasSupabase,
        unconfiguredMessage: 'Supabase connection required. Enter your Supabase Project URL and API Key.',
        supportsOAuth: false,
      },
    ];
  }
}
