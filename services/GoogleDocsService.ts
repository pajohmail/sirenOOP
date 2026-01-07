import { google } from 'googleapis';
import { DesignDocument } from '@/core/models/DesignDocument';

export class GoogleDocsService {
    private docs;
    private drive;

    constructor() {
        const auth = new google.auth.GoogleAuth({
            credentials: {
                client_email: process.env.GOOGLE_CLIENT_EMAIL,
                private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
                project_id: process.env.NEXT_PUBLIC_GOOGLE_CLOUD_PROJECT_ID,
            },
            scopes: [
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive.file'
            ],
        });

        this.docs = google.docs({ version: 'v1', auth });
        this.drive = google.drive({ version: 'v3', auth });
    }

    private getMermaidImageUrl(mermaidCode: string): string {
        const encoded = Buffer.from(mermaidCode).toString('base64');
        return `https://mermaid.ink/img/${encoded}`;
    }

    async getOrCreateFolder(folderName: string): Promise<string> {
        const q = `mimeType='application/vnd.google-apps.folder' and name='${folderName}' and trashed=false`;
        const res = await this.drive.files.list({
            q,
            spaces: 'drive',
            fields: 'files(id, name)',
        });

        if (res.data.files && res.data.files.length > 0) {
            return res.data.files[0].id!;
        }

        const createRes = await this.drive.files.create({
            requestBody: {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            },
            fields: 'id',
        });

        return createRes.data.id!;
    }

    async createDesignDoc(document: DesignDocument, userEmail: string): Promise<string> {
        // 1. Get or Create Project Folder
        const folderId = await this.getOrCreateFolder(document.projectName);

        // 2. Share the FOLDER with the user (File will inherit permissions)
        await this.drive.permissions.create({
            fileId: folderId,
            requestBody: {
                role: 'writer',
                type: 'user',
                emailAddress: userEmail,
            },
        }).catch(() => {
            // Ignore error if already shared or other minor issue, 
            // but ideally check first. Proceeding to ensure flow doesn't break.
        });

        // 3. Create the blank document INSIDE the folder
        const createResponse = await this.drive.files.create({
            requestBody: {
                name: `Design Document: ${document.projectName}`,
                mimeType: 'application/vnd.google-apps.document',
                parents: [folderId],
            },
        });

        const docId = createResponse.data.id!;

        // 4. Build the content requests
        const requests: any[] = [];
        let index = 1;

        const insertText = (text: string, style: 'NORMAL_TEXT' | 'HEADING_1' | 'HEADING_2' | 'HEADING_3' = 'NORMAL_TEXT') => {
            requests.push({
                insertText: {
                    location: { index },
                    text: text + '\n',
                },
            });
            if (style !== 'NORMAL_TEXT') {
                requests.push({
                    updateParagraphStyle: {
                        range: { startIndex: index, endIndex: index + text.length },
                        paragraphStyle: { namedStyleType: style },
                        fields: 'namedStyleType',
                    },
                });
            }
            // No index update needed here if we rely on reverse insertion? 
            // Wait, if we pull from bottom up, index 1 is always correct.
            // BUT helpers usually imply forward progress.
            // Let's stick to the REVERSE insertion strategy at Index 1.
            // effectively LIFO queue for the document structure.
        };

        const insertImage = (url: string) => {
            requests.push({
                insertInlineImage: {
                    location: { index },
                    uri: url,
                    objectSize: {
                        height: { magnitude: 300, unit: 'PT' },
                        width: { magnitude: 500, unit: 'PT' }
                    }
                },
            });
        };

        // CONTENT GENERATION (REVERSE ORDER)

        // Description (At bottom of what we insert, so it ends up top? No.)
        // If we insert at Index 1:
        // Action 1: Insert "Footer" -> Doc: [Footer]
        // Action 2: Insert "Header" -> Doc: [Header, Footer]

        // So we must process document sections in REVERSE order.
        // Validation -> Object Design -> System Design -> Analysis -> Description.

        if (document.validation) {
            const aiReview = document.validation.reviews.find(r => r.author === 'AI Validator');
            if (aiReview) {
                insertText(aiReview.content);
                insertText('Traceability & Review', 'HEADING_2');
            }
        }

        if (document.objectDesign?.classDiagramMermaid) {
            insertImage(this.getMermaidImageUrl(document.objectDesign.classDiagramMermaid));
            insertText(document.objectDesign.classDiagramMermaid);
            insertText('Class Diagram', 'HEADING_3');
            insertText('Phase 3: Object Design', 'HEADING_1');
        }

        if (document.systemDesign?.architectureDiagramMermaid) {
            insertImage(this.getMermaidImageUrl(document.systemDesign.architectureDiagramMermaid));
            insertText(document.systemDesign.architectureDiagramMermaid);
            insertText('System Architecture', 'HEADING_3');
            insertText('Phase 2: System Design', 'HEADING_1');
        }

        if (document.analysis) {
            if (document.analysis.domainModelMermaid) {
                insertImage(this.getMermaidImageUrl(document.analysis.domainModelMermaid));
                insertText(document.analysis.domainModelMermaid);
                insertText('Domain Model', 'HEADING_3');
            }

            // Use cases are a list. To keep order 1, 2, 3... we must insert 3, then 2, then 1 at Index 1.
            // So we iterate REVERSE.
            [...document.analysis.useCases].reverse().forEach(uc => {
                insertText(uc.narrative);
                insertText(uc.title, 'HEADING_3'); // Using H3 for title
            });

            insertText('Phase 1: Analysis', 'HEADING_1');
        }

        insertText(document.description);
        insertText('Project Description', 'HEADING_1');

        // Execute batch update
        if (requests.length > 0) {
            await this.docs.documents.batchUpdate({
                documentId: docId,
                requestBody: { requests },
            });
        }

        return `https://docs.google.com/document/d/${docId}/edit`;
    }
}
