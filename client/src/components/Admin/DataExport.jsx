import React from 'react';

function DataExport({ showNotification }) {
  const handleExportMatchingResults = async () => {
    try {
      showNotification('Exporting matching results...', 'info');
      const response = await fetch('/api/export/matching-results');
      if (!response.ok) throw new Error('Failed to fetch data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'matching_results.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('Matching results exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export matching results', 'error');
    }
  };

  const handleExportStudentList = async () => {
    try {
      showNotification('Exporting student list...', 'info');
      const response = await fetch('/api/export/student-list');
      if (!response.ok) throw new Error('Failed to fetch data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'student_list.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('Student list exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export student list', 'error');
    }
  };

  const handleExportProjectList = async () => {
    try {
      showNotification('Exporting project list...', 'info');
      const response = await fetch('/api/export/project-list');
      if (!response.ok) throw new Error('Failed to fetch data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'project_list.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('Project list exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export project list', 'error');
    }
  };

  const handleExportAll = async () => {
    try {
      showNotification('Exporting all data...', 'info');
      const responses = await Promise.all([
        fetch('/api/export/matching-results'),
        fetch('/api/export/student-list'),
        fetch('/api/export/project-list')
      ]);
      const fileNames = ['matching_results.csv', 'student_list.csv', 'project_list.csv'];
      for (let i = 0; i < responses.length; i++) {
        if (responses[i].ok) {
          const blob = await responses[i].blob();
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = fileNames[i];
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          window.URL.revokeObjectURL(url);
        }
      }
      showNotification('All data exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export all data', 'error');
    }
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Data Export</h1>
        <p>Export system data in CSV format for analysis and reporting</p>
      </div>

      <div className="export-options">
        <div className="export-card">
          <div className="export-card-header">
            <h3>📊 Matching Results</h3>
            <p>Export current matching results showing student-project assignments</p>
          </div>
          <button className="btn-export" onClick={handleExportMatchingResults}>
            Download Matching Results
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <h3>👥 Student List</h3>
            <p>Export complete student information including preferences and assignments</p>
          </div>
          <button className="btn-export" onClick={handleExportStudentList}>
            Download Student List
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <h3>📋 Project List</h3>
            <p>Export all available projects with details and requirements</p>
          </div>
          <button className="btn-export" onClick={handleExportProjectList}>
            Download Project List
          </button>
        </div>

        <div className="export-card export-all-card">
          <div className="export-card-header">
            <h3>📦 Export All Data</h3>
            <p>Download all three reports at once for comprehensive data analysis</p>
          </div>
          <button className="btn-export-all" onClick={handleExportAll}>
            Download All Reports
          </button>
        </div>
      </div>

      <div className="export-info">
        <h4>📝 Export Information</h4>
        <ul>
          <li>All files are exported in CSV format for easy import into Excel or other spreadsheet applications</li>
          <li>Matching results show current student-project assignments based on preferences</li>
          <li>Student list includes GPA, major, and submission status</li>
          <li>Project list contains capacity, popularity, and requirement details</li>
        </ul>
      </div>
    </section>
  );
}

export default DataExport;


