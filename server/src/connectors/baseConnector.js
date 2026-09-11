/**
 * Base Connector Class
 * Standard contract for real enterprise knowledge source connectors.
 */
export class BaseConnector {
  constructor(config = {}, account = null, isDevelopmentMode = false) {
    this.config = config || {};
    this.account = account || null;
    this.isDevelopmentMode = Boolean(isDevelopmentMode);
    this.type = 'generic';
    this.name = 'Base Connector';
  }

  /**
   * Check if this connector integration has required credentials configured
   */
  isConfigured() {
    return false;
  }

  /**
   * Generate OAuth authorization URL for the user to sign in
   * @param {string} state - Cryptographically signed state containing tenant_id, user_id
   * @param {string} redirectUri - OAuth callback URL
   */
  getAuthorizationUrl(state, redirectUri) {
    throw new Error('Method getAuthorizationUrl() must be implemented.');
  }

  /**
   * Exchange authorization code for access & refresh tokens
   */
  async handleOAuthCallback(code, redirectUri) {
    throw new Error('Method handleOAuthCallback() must be implemented.');
  }

  /**
   * Test connection validity and latency
   */
  async testConnection() {
    throw new Error('Method testConnection() must be implemented.');
  }

  /**
   * Disconnect and revoke credentials
   */
  async disconnect() {
    return { success: true, message: `${this.name} disconnected.` };
  }

  /**
   * List real items from the connected source
   * @param {string|null} folderId - ID of parent folder/site/schema
   * @param {string} search - Search query
   */
  async listItems(folderId = null, search = '') {
    throw new Error('Method listItems() must be implemented.');
  }

  /**
   * Get metadata for a specific item
   */
  async getItem(itemId) {
    throw new Error('Method getItem() must be implemented.');
  }

  /**
   * Download or export real content from the source item
   */
  async downloadItem(itemId, metadata = {}) {
    throw new Error('Method downloadItem() must be implemented.');
  }

  /**
   * Format selected items into CompanyBrain knowledge documents
   */
  async sync(selectedItems = []) {
    throw new Error('Method sync() must be implemented.');
  }

  getMetadata() {
    return {
      type: this.type,
      name: this.name,
      isConfigured: this.isConfigured(),
      isDevelopmentMode: this.isDevelopmentMode,
      supportsOAuth: true,
    };
  }
}
