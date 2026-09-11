import { GoogleDriveConnector } from './GoogleDriveConnector.js';
import { SharePointConnector } from './SharePointConnector.js';
import { SupabaseConnector } from './SupabaseConnector.js';

export class ConnectorFactory {
  /**
   * Instantiate appropriate connector instance
   * @param {string} type - 'google_drive' | 'sharepoint' | 'supabase'
   * @param {Object} config - connector configuration
   * @param {boolean} isDemo - demo mode flag
   */
  static create(type, config = {}, isDemo = false) {
    switch (type) {
      case 'google_drive':
        return new GoogleDriveConnector(config, isDemo);
      case 'sharepoint':
        return new SharePointConnector(config, isDemo);
      case 'supabase':
        return new SupabaseConnector(config, isDemo);
      default:
        throw new Error(`Unsupported connector type: [${type}]. Currently supported: google_drive, sharepoint, supabase.`);
    }
  }

  /**
   * Get metadata for the 3 supported connectors
   */
  static getSupportedTypes() {
    return [
      {
        type: 'google_drive',
        name: 'Google Drive',
        tagline: 'Connect company Google Drive',
        category: 'Cloud Storage',
        icon: 'Folder',
        description: 'Index shared enterprise drives, Project Alpha engineering specs, and HR materials.',
        authType: 'OAuth2 / Service Account',
        supportsDemo: true,
      },
      {
        type: 'sharepoint',
        name: 'SharePoint',
        tagline: 'Connect Microsoft SharePoint',
        category: 'Enterprise Intranet',
        icon: 'FileText',
        description: 'Ingest company intranet sites, engineering libraries, and global HR compliance policies.',
        authType: 'Microsoft Graph / Azure AD',
        supportsDemo: true,
      },
      {
        type: 'supabase',
        name: 'Supabase',
        tagline: 'Connect Supabase/PostgreSQL data',
        category: 'Relational Database',
        icon: 'Database',
        description: 'Direct SQL table ingestion with schema inspection and row-level security mapping.',
        authType: 'PostgREST / API Key',
        supportsDemo: true,
      },
    ];
  }
}
