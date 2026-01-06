import { google, drive_v3 } from 'googleapis';
import { IGoogleDriveRepository } from './interfaces/IGoogleDriveRepository';
import { DriveFile } from '@/core/types';

export class GoogleDriveRepository implements IGoogleDriveRepository {
    private drive: drive_v3.Drive;

    constructor(userToken: string) {
        // CRITICAL: Use user's OAuth token, not system credentials
        const auth = new google.auth.OAuth2();
        auth.setCredentials({ access_token: userToken });

        this.drive = google.drive({ version: 'v3', auth });
    }

    async createFolder(folderName: string, parentId?: string): Promise<string> {
        try {
            const fileMetadata: drive_v3.Schema$File = {
                name: folderName,
                mimeType: 'application/vnd.google-apps.folder',
            };

            if (parentId) {
                fileMetadata.parents = [parentId];
            }

            const folder = await this.drive.files.create({
                requestBody: fileMetadata,
                fields: 'id',
            });

            if (!folder.data.id) {
                throw new Error('Failed to create folder: no ID returned');
            }

            return folder.data.id;
        } catch (error: any) {
            throw new Error(`Failed to create folder: ${error.message}`);
        }
    }

    async uploadFile(
        folderId: string,
        fileName: string,
        content: string,
        mimeType: string = 'text/markdown'
    ): Promise<DriveFile> {
        try {
            const fileMetadata: drive_v3.Schema$File = {
                name: fileName,
                parents: [folderId],
            };

            const media = {
                mimeType,
                body: content,
            };

            const file = await this.drive.files.create({
                requestBody: fileMetadata,
                media,
                fields: 'id, name, webViewLink, mimeType',
            });

            return {
                id: file.data.id!,
                name: file.data.name!,
                webViewLink: file.data.webViewLink!,
                mimeType: file.data.mimeType!,
            };
        } catch (error: any) {
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    async listFiles(folderId?: string): Promise<DriveFile[]> {
        try {
            const query = folderId ? `'${folderId}' in parents` : undefined;

            const response = await this.drive.files.list({
                q: query,
                fields: 'files(id, name, webViewLink, mimeType)',
                pageSize: 100,
            });

            return (
                response.data.files?.map((file) => ({
                    id: file.id!,
                    name: file.name!,
                    webViewLink: file.webViewLink!,
                    mimeType: file.mimeType!,
                })) || []
            );
        } catch (error: any) {
            throw new Error(`Failed to list files: ${error.message}`);
        }
    }
}
