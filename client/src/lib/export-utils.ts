import * as XLSX from 'xlsx';

export const exportToExcel = async (data: any[], filename: string, sheetName: string = 'Sheet1') => {
    try {
        if (!data || data.length === 0) {
            console.warn('No data to export to Excel');
            return false;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

        XLSX.writeFile(workbook, `${filename}.xlsx`);

        console.log('Excel export successful:', filename);
        return true;
    } catch (error) {
        console.error('Excel Export Error:', error);
        if (typeof window !== 'undefined') {
            alert('Excel Export failed: ' + (error instanceof Error ? error.message : String(error)));
        }
        return false;
    }
};

export const exportToCSV = async (data: any[], filename: string) => {
    try {
        if (!data || data.length === 0) {
            console.warn('No data to export to CSV');
            return false;
        }

        const worksheet = XLSX.utils.json_to_sheet(data);
        const csv = XLSX.utils.sheet_to_csv(worksheet);

        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `${filename}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        console.log('CSV export successful:', filename);
        return true;
    } catch (error) {
        console.error('CSV Export Error:', error);
        if (typeof window !== 'undefined') {
            alert('CSV Export failed: ' + (error instanceof Error ? error.message : String(error)));
        }
        return false;
    }
};
