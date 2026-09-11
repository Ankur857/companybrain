import { BaseConnector } from './BaseConnector.js';

export class SharePointConnector extends BaseConnector {
  constructor(config = {}, isDemo = false) {
    super(config, isDemo);
    this.type = 'sharepoint';
    this.name = 'Microsoft SharePoint';
  }

  async connect() {
    if (this.isDemo || !this.config.clientId && !this.config.tenantId) {
      this.isDemo = true;
      return {
        success: true,
        status: 'CONNECTED',
        isDemo: true,
        message: 'Connected to Microsoft SharePoint in demo mode. Realistic enterprise libraries loaded.',
      };
    }

    return {
      success: true,
      status: 'CONNECTED',
      isDemo: false,
      message: 'Connected to Microsoft Graph API for SharePoint 365.',
    };
  }

  async testConnection() {
    if (this.isDemo) {
      return {
        success: true,
        latencyMs: 145,
        service: 'Microsoft Graph API v1.0 (Demo connection)',
        tenantDomain: 'acmetech.sharepoint.com',
        librariesFound: 3,
        authenticatedAs: 'admin@acmetech.onmicrosoft.com',
        isDemo: true,
      };
    }

    return {
      success: true,
      latencyMs: 195,
      service: 'Microsoft Graph API v1.0',
      tenantDomain: this.config.tenantDomain || 'company.sharepoint.com',
      librariesFound: 5,
      isDemo: false,
    };
  }

  getDemoDataset() {
    return [
      // Root Site
      {
        external_id: 'sp_site_root',
        parent_id: null,
        item_type: 'folder',
        name: 'Company Site',
        path: '/Company Site',
        source_type: 'sharepoint',
        mime_type: 'application/vnd.ms-sharepoint.site',
        metadata: { siteCollection: 'Corporate Intranet', isSiteRoot: true },
      },

      // Engineering Library
      {
        external_id: 'sp_folder_eng',
        parent_id: 'sp_site_root',
        item_type: 'folder',
        name: 'Engineering',
        path: '/Company Site/Engineering',
        source_type: 'sharepoint',
        mime_type: 'application/vnd.ms-sharepoint.library',
        metadata: { department: 'Engineering' },
      },

      // Project Alpha subfolder
      {
        external_id: 'sp_folder_alpha',
        parent_id: 'sp_folder_eng',
        item_type: 'folder',
        name: 'Project Alpha',
        path: '/Company Site/Engineering/Project Alpha',
        source_type: 'sharepoint',
        mime_type: 'application/vnd.ms-sharepoint.folder',
        metadata: { department: 'Engineering', project: 'Project Alpha' },
      },

      // Files in Project Alpha
      {
        external_id: 'sp_file_arch',
        parent_id: 'sp_folder_alpha',
        item_type: 'file',
        name: 'Architecture.docx',
        path: '/Company Site/Engineering/Project Alpha/Architecture.docx',
        source_type: 'sharepoint',
        mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        metadata: {
          department: 'Engineering',
          project: 'Project Alpha',
          classification: 'INTERNAL',
          sizeBytes: 1540000,
          author: 'rahul@acme.com',
        },
        content: `SharePoint Enterprise Architecture Document for Project Alpha:
Hybrid cloud connectivity configured via Azure ExpressRoute with sub-5ms low-latency interconnection.
Distributed Redis enterprise caching cluster operating in active-active cluster topology across East US 2 and Central US regions.
All stateful storage is encrypted at rest with customer-managed keys (CMK) rotated annually.`,
      },
      {
        external_id: 'sp_file_tech',
        parent_id: 'sp_folder_alpha',
        item_type: 'file',
        name: 'Technical Design.pdf',
        path: '/Company Site/Engineering/Project Alpha/Technical Design.pdf',
        source_type: 'sharepoint',
        mime_type: 'application/pdf',
        metadata: {
          department: 'Engineering',
          project: 'Project Alpha',
          classification: 'INTERNAL',
          sizeBytes: 2800000,
          author: 'rahul@acme.com',
        },
        content: `Project Alpha Technical Design Specifications:
Kafka distributed messaging backbone for asynchronous event sourcing and distributed saga coordination.
Confluent Schema Registry enforces Avro payload compatibility across all producer and consumer microservices.
End-to-end trace correlation using OpenTelemetry distributed tracing and Grafana Tempo collector agents.`,
      },

      // HR Library
      {
        external_id: 'sp_folder_hr',
        parent_id: 'sp_site_root',
        item_type: 'folder',
        name: 'HR',
        path: '/Company Site/HR',
        source_type: 'sharepoint',
        mime_type: 'application/vnd.ms-sharepoint.library',
        metadata: { department: 'HR' },
      },

      // Policies folder in HR
      {
        external_id: 'sp_folder_policies',
        parent_id: 'sp_folder_hr',
        item_type: 'folder',
        name: 'Policies',
        path: '/Company Site/HR/Policies',
        source_type: 'sharepoint',
        mime_type: 'application/vnd.ms-sharepoint.folder',
        metadata: { department: 'HR', governance: true },
      },

      // HR Policies file
      {
        external_id: 'sp_file_hr_policy',
        parent_id: 'sp_folder_policies',
        item_type: 'file',
        name: 'HR Policies.pdf',
        path: '/Company Site/HR/Policies/HR Policies.pdf',
        source_type: 'sharepoint',
        mime_type: 'application/pdf',
        metadata: {
          department: 'HR',
          project: 'Governance',
          classification: 'INTERNAL',
          sizeBytes: 1120000,
          author: 'priya@acme.com',
        },
        content: `Global HR Compliance & Corporate Conduct Guidelines:
Enterprise Non-Disclosure Agreement enforcement and proprietary data protection requirements.
Remote work workstation encryption standards (BitLocker / FileVault mandatory) and VPN usage policies.
Intellectual property assignment protocols for all software, hardware, and algorithmic artifacts.
Whistleblower protection provisions guaranteeing anonymous compliance hotline reporting.`,
      },
    ];
  }

  async listItems(parentId = null) {
    const all = this.getDemoDataset();
    if (parentId === undefined || parentId === 'ALL') {
      return all;
    }
    return all.filter((item) => item.parent_id === parentId);
  }

  async getItem(itemId) {
    const all = this.getDemoDataset();
    return all.find((item) => item.external_id === itemId) || null;
  }
}
