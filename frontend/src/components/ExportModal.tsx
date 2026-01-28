import { X, Download, FileText, Table, Printer, FileJson } from 'lucide-react';
import { api } from '../api/client';

interface ExportModalProps {
  storyboardId: string;
  storyboardTitle: string;
  onClose: () => void;
}

const exportOptions = [
  { id: 'pdf', name: 'PDF Document', description: 'Formatted document with all scenes', icon: FileText, format: 'pdf' },
  { id: 'csv', name: 'Shot List (CSV)', description: 'Spreadsheet-compatible shot list', icon: Table, format: 'csv' },
  { id: 'json', name: 'JSON Export', description: 'Full data export for backup', icon: FileJson, format: 'json' },
  { id: 'notion', name: 'Notion (Markdown)', description: 'Import-ready for Notion', icon: FileText, format: 'notion' },
  { id: 'gdocs', name: 'Google Docs (HTML)', description: 'Import-ready for Google Docs', icon: FileText, format: 'gdocs' },
  { id: 'print', name: 'Print View', description: 'Printer-friendly layout', icon: Printer, format: 'print' },
];

export default function ExportModal({ storyboardId, storyboardTitle, onClose }: ExportModalProps) {
  const handleExport = (format: string) => {
    const url = api.getExportUrl(storyboardId, format as any);
    if (format === 'print') {
      window.open(url, '_blank');
    } else {
      const link = document.createElement('a');
      link.href = url;
      link.download = storyboardTitle.replace(/[^a-z0-9]/gi, '_') + '_' + format;
      link.click();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Download className="w-5 h-5" />
            Export Storyboard
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-2">
          {exportOptions.map((option) => (
            <button
              key={option.id}
              onClick={() => handleExport(option.format)}
              className="w-full p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors text-left flex items-start gap-3"
            >
              <option.icon className="w-5 h-5 text-gray-400 mt-0.5" />
              <div>
                <p className="font-medium">{option.name}</p>
                <p className="text-sm text-gray-500">{option.description}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
