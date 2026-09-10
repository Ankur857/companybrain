/**
 * Base Connector Interface
 * All enterprise data source connectors extend this contract.
 */
export class BaseConnector {
  constructor(config = {}) {
    this.config = config;
    this.type = 'generic';
    this.name = 'Base Connector';
  }

  async connect() {
    throw new Error('Method connect() must be implemented.');
  }

  async testConnection() {
    throw new Error('Method testConnection() must be implemented.');
  }

  async fetchDocuments() {
    throw new Error('Method fetchDocuments() must be implemented.');
  }

  async fetchPermissions() {
    return [];
  }

  async detectChanges(lastSyncTimestamp) {
    return { added: [], updated: [], deleted: [] };
  }

  async disconnect() {
    return { success: true, message: 'Disconnected successfully.' };
  }

  getMetadata() {
    return {
      type: this.type,
      name: this.name,
      supportsIncrementalSync: true,
      requiresOAuth: false,
    };
  }
}
