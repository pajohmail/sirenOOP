import JSZip from 'jszip';
import { DesignDocument } from '@/core/models/DesignDocument';
import { DesignArchitectService } from '@/services/DesignArchitectService';

/**
 * Generates a ZIP file containing design documents for multiple projects
 * @param documents Array of design documents to include in ZIP
 * @param service DesignArchitectService instance for generating reports
 * @returns Blob containing the ZIP file
 */
export async function generateProjectsZip(
    documents: DesignDocument[],
    service: DesignArchitectService
): Promise<Blob> {
    const zip = new JSZip();

    for (const doc of documents) {
        // Use cached report if available, otherwise generate on-the-fly
        let report: string;
        if (doc.validation?.generatedReport) {
            report = doc.validation.generatedReport;
        } else {
            // Fallback: generate report on-the-fly
            try {
                report = await service.generateFinalReport(doc);
            } catch (error) {
                console.error(`Failed to generate report for ${doc.projectName}:`, error);
                report = `# ${doc.projectName}\n\nError: Failed to generate report`;
            }
        }

        // Create safe filename
        const filename = doc.projectName
            ? `${doc.projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.md`
            : `${doc.id}.md`;

        zip.file(filename, report);
    }

    // Add a README with metadata
    const readme = `# SirenOOP Design Documents
Generated: ${new Date().toISOString()}
Total Projects: ${documents.length}

## Projects Included:
${documents.map((d, i) => `${i + 1}. ${d.projectName} (ID: ${d.id})`).join('\n')}

---
Generated with SirenOOP - Object-Oriented Design Documentation Tool
`;
    zip.file('README.md', readme);

    return await zip.generateAsync({ type: 'blob' });
}

/**
 * Downloads a blob as a file
 * @param blob The blob to download
 * @param filename The filename to save as
 */
export function downloadBlob(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const a = window.document.createElement('a');
    a.href = url;
    a.download = filename;
    window.document.body.appendChild(a);
    a.click();
    window.document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
