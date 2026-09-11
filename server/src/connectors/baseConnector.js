/**
 * Base Connector Class
 * Standard contract for enterprise knowledge source connectors.
 */
export class BaseConnector {
  constructor(config = {}, isDemo = false) {
    this.config = config || {};
    this.isDemo = Boolean(isDemo);
    this.type = 'generic';
    this.name = 'Base Connector';
  }

  /**
   * Connect to source repository using provided configuration or demo mock
   */
  async connect() {
    throw new Error('Method connect() must be implemented.');
  }

  /**
   * Test connection latency, credentials, and reachability
   */
  async testConnection() {
    throw new Error('Method testConnection() must be implemented.');
  }

  /**
   * Disconnect connector
   */
  async disconnect() {
    return { success: true, message: `${this.name} disconnected successfully.` };
  }

  /**
   * List hierarchical items (folders, files, tables, schemas)
   * @param {string|null} parentId - Filter by parent external_id, null for root
   */
  async listItems(parentId = null) {
    throw new Error('Method listItems() must be implemented.');
  }

  /**
   * Get single item details by external_id
   * @param {string} itemId
   */
  async getItem(itemId) {
    throw new Error('Method getItem() must be implemented.');
  }

  /**
   * Format and prepare selected items for ingestion into CompanyBrain knowledge base
   * @param {Array<Object>} selectedItems
   */
  async sync(selectedItems = []) {
    throw new Error('Method sync() must be implemented.');
  }

  /**
   * Fetch documents for legacy IngestionPipeline compatibility
   */
  async fetchDocuments() {
    const items = await this.listItems('ALL');
    return items
      .filter((item) => item.item_type === 'file' || item.item_type === 'table')
      .map((item) => ({
        external_id: item.external_id,
        title: item.name,
        content: item.content || `Synchronized content for ${item.name}`,
        source_type: this.type,
        source_url: `https://${this.type}.corp.internal${item.path}`,
        raw_metadata: item.metadata || {},
        classification: item.metadata?.classification || 'INTERNAL',
      }));
  }

  getMetadata() {
    return {
      type: this.type,
      name: this.name,
      isDemo: this.isDemo,
      supportsHierarchicalBrowse: true,
      supportsFolderAccessInheritance: true,
    };
  }
}
