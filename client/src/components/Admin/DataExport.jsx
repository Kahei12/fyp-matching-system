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

  const handleExportTeacherList = async () => {
    try {
      showNotification('Exporting teacher list...', 'info');
      const response = await fetch('/api/export/teacher-list');
      if (!response.ok) throw new Error('Failed to fetch data');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'teacher_list.csv';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      showNotification('Teacher list exported successfully!', 'success');
    } catch (error) {
      console.error('Export error:', error);
      showNotification('Failed to export teacher list', 'error');
    }
  };

  const downloadFile = (blob, fileName) => {
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const handleExportAll = async () => {
    try {
      showNotification('Exporting all data...', 'info');
      
      // Download each file independently with delay between them
      // Order: Project List, Student List, Teacher List, Matching Results
      const exportConfigs = [
        { url: '/api/export/project-list', name: 'project_list.csv', label: 'Project list' },
        { url: '/api/export/student-list', name: 'student_list.csv', label: 'Student list' },
        { url: '/api/export/teacher-list', name: 'teacher_list.csv', label: 'Teacher list' },
        { url: '/api/export/matching-results', name: 'matching_results.csv', label: 'Matching results' }
      ];

      let successCount = 0;
      
      for (let i = 0; i < exportConfigs.length; i++) {
        const config = exportConfigs[i];
        try {
          showNotification(`Exporting ${config.label}...`, 'info');
          const response = await fetch(config.url);
          
          if (!response.ok) {
            console.warn(`Failed to fetch ${config.label}:`, response.status);
            continue;
          }
          
          const blob = await response.blob();
          downloadFile(blob, config.name);
          successCount++;
          
          // Small delay between downloads to prevent browser blocking
          if (i < exportConfigs.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        } catch (err) {
          console.warn(`Error exporting ${config.label}:`, err);
        }
      }

      if (successCount === exportConfigs.length) {
        showNotification('All 4 files exported successfully!', 'success');
      } else if (successCount > 0) {
        showNotification(`Exported ${successCount}/${exportConfigs.length} files`, 'warning');
      } else {
        showNotification('Failed to export any file', 'error');
      }
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
            <h3>Project List</h3>
            <p>Export all available projects with details and requirements</p>
          </div>
          <button className="btn-export" onClick={handleExportProjectList}>
            Download Project List
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <h3>Student List</h3>
            <p>Export complete student information including preferences and assignments</p>
          </div>
          <button className="btn-export" onClick={handleExportStudentList}>
            Download Student List
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <h3>Teacher List</h3>
            <p>Export all teacher information including contact details and majors</p>
          </div>
          <button className="btn-export" onClick={handleExportTeacherList}>
            Download Teacher List
          </button>
        </div>

        <div className="export-card">
          <div className="export-card-header">
            <h3>Matching Results</h3>
            <p>Export current matching results showing student-project assignments</p>
          </div>
          <button className="btn-export" onClick={handleExportMatchingResults}>
            Download Matching Results
          </button>
        </div>

        <div className="export-card export-all-card">
          <div className="export-card-header">
            <h3>Export All Data</h3>
            <p>Download all four reports at once for comprehensive data analysis</p>
          </div>
          <button className="btn-export-all" onClick={handleExportAll}>
            Download All Reports
          </button>
        </div>
      </div>

      <div className="export-info">
        <h4>Export Information</h4>
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


