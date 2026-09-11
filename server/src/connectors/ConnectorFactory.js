import { GoogleDriveConnector } from './GoogleDriveConnector.js';
import { SupabaseConnector } from './SupabaseConnector.js';

export class ConnectorFactory {
  /**
   * Instantiate appropriate connector instance
   * @param {string} type - 'google_drive' | 'supabase'
   * @param {Object} config - connector configuration
   * @param {Object|null} account - connected account credentials (server-side only)
   * @param {boolean} isDevelopmentMode - explicit development mode
   */
  static create(type, config = {}, account = null, isDevelopmentMode = false) {
    switch (type) {
      case 'google_drive':
        return new GoogleDriveConnector(config, account, isDevelopmentMode);
      case 'supabase':
        return new SupabaseConnector(config, account, isDevelopmentMode);
      default:
        throw new Error(`Unsupported connector type: [${type}]. Currently supported: google_drive, supabase.`);
    }
  }

  /**
   * Get metadata for the supported connectors with live configuration status
   */
  static getSupportedTypes() {
    const hasGoogle = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
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
        type: 'supabase',
        name: 'Supabase',
        tagline: 'Admin Manual Upload & Storage',
        category: 'Knowledge Storage',
        icon: 'Database',
        description: 'Securely upload company documents and files into Supabase knowledge storage with fine-grained access control (Admin only).',
        authType: 'Supabase Storage & API',
        isConfigured: hasSupabase,
        unconfiguredMessage: 'Supabase connection required. Enter your Supabase Project URL and API Key.',
        supportsOAuth: false,
        supportsManualUpload: true,
      },
    ];
  }
}
