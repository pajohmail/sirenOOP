import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GoogleDriveRepository } from '@/repositories/GoogleDriveRepository';
import { google } from 'googleapis';

// Mock googleapis
vi.mock('googleapis', () => {
    const createMock = vi.fn().mockResolvedValue({
        data: {
            id: 'mock-folder-id',
            name: 'Test Folder',
            webViewLink: 'http://drive.google.com/folder',
            mimeType: 'application/vnd.google-apps.folder',
            files: [{ id: 'file1', name: 'File 1', webViewLink: 'link1', mimeType: 'text/plain' }]
        }
    });

    const listMock = vi.fn().mockResolvedValue({
        data: {
            files: [{ id: 'file1', name: 'File 1', webViewLink: 'link1', mimeType: 'text/plain' }]
        }
    });

    return {
        google: {
            auth: {
                OAuth2: vi.fn().mockImplementation(function () {
                    return {
                        setCredentials: vi.fn(),
                    };
                }),
            },
            drive: vi.fn(() => ({
                files: {
                    create: createMock,
                    list: listMock
                }
            })),
        },
    };
});

describe('GoogleDriveRepository', () => {
    let driveRepository: GoogleDriveRepository;
    const mockUserToken = 'mock-user-token';

    beforeEach(() => {
        vi.clearAllMocks();
        driveRepository = new GoogleDriveRepository(mockUserToken);
    });

    it('should create folder and return folder ID', async () => {
        const folderId = await driveRepository.createFolder('Test Folder');
        expect(typeof folderId).toBe('string');
        expect(folderId).toBe('mock-folder-id');
    });

    it('should upload markdown file and return Drive file', async () => {
        const mockFolderId = 'mock-folder-id';
        const fileName = 'test.md';
        const content = '# Test Document';

        const file = await driveRepository.uploadFile(
            mockFolderId,
            fileName,
            content,
            'text/markdown'
        );

        expect(file).toHaveProperty('id', 'mock-folder-id'); // reusing mock response
        expect(file).toHaveProperty('webViewLink');
        expect(file.name).toBe('Test Folder'); // mock return name
    });

    it('should list files in folder', async () => {
        const mockFolderId = 'mock-folder-id';
        const files = await driveRepository.listFiles(mockFolderId);

        expect(Array.isArray(files)).toBe(true);
        expect(files.length).toBe(1);
        expect(files[0].id).toBe('file1');
    });

    it('should use user token for authentication', () => {
        expect(google.auth.OAuth2).toHaveBeenCalled();
    });
});
