import React, { useState, useMemo } from 'react';

function ProjectBrowse({ projects, preferences, onAddPreference }) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSkills, setSelectedSkills] = useState([]);
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [statusFilter, setStatusFilter] = useState('active');
  const [sortBy, setSortBy] = useState('popularity');

  // 獲取所有技能選項
  const allSkills = useMemo(() => {
    const skills = new Set();
    projects.forEach(project => {
      if (Array.isArray(project.skills)) {
        project.skills.forEach(skill => skills.add(skill));
      }
    });
    return Array.from(skills).sort();
  }, [projects]);

  // 獲取所有導師選項
  const allSupervisors = useMemo(() => {
    const supervisors = new Set();
    projects.forEach(project => supervisors.add(project.supervisor));
    return Array.from(supervisors).sort();
  }, [projects]);

  // 過濾和排序項目
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // 關鍵詞搜索
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchesKeyword = 
          project.title.toLowerCase().includes(keyword) ||
          project.description.toLowerCase().includes(keyword) ||
          project.supervisor.toLowerCase().includes(keyword);
        if (!matchesKeyword) return false;
      }

      // 技能過濾
      if (selectedSkills.length > 0) {
        const hasMatchingSkill = selectedSkills.some(skill => 
          project.skills.includes(skill)
        );
        if (!hasMatchingSkill) return false;
      }

      // 導師過濾
      if (selectedSupervisor && project.supervisor !== selectedSupervisor) {
        return false;
      }

      // 狀態過濾
      if (statusFilter === 'active' && project.status !== 'active') {
        return false;
      }

      return true;
    });

    // 排序
    switch (sortBy) {
      case 'popularity':
        filtered.sort((a, b) => b.popularity - a.popularity);
        break;
      case 'alphabetical':
        filtered.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'supervisor':
        filtered.sort((a, b) => a.supervisor.localeCompare(b.supervisor));
        break;
      default:
        break;
    }

    return filtered;
  }, [projects, searchKeyword, selectedSkills, selectedSupervisor, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedSkills([]);
    setSelectedSupervisor('');
    setStatusFilter('active');
    setSortBy('popularity');
  };

  const handleSkillChange = (e) => {
    const options = Array.from(e.target.selectedOptions);
    setSelectedSkills(options.map(option => option.value));
  };

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Browse Projects</h1>
        <div className="search-sort">
          <input 
            type="text" 
            className="search-input"
            placeholder="Search projects..."
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <select 
            className="sort-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="popularity">Sort by Popularity</option>
            <option value="alphabetical">Sort by Name</option>
            <option value="supervisor">Sort by Supervisor</option>
          </select>
        </div>
      </div>

      {/* 搜索過濾器 */}
      <div className="search-filters">
        <div className="filter-group">
          <label htmlFor="skillFilter">Filter by Skills:</label>
          <select 
            id="skillFilter" 
            className="filter-select" 
            multiple
            value={selectedSkills}
            onChange={handleSkillChange}
          >
            {allSkills.map(skill => (
              <option key={skill} value={skill}>{skill}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="supervisorFilter">Filter by Supervisor:</label>
          <select 
            id="supervisorFilter" 
            className="filter-select"
            value={selectedSupervisor}
            onChange={(e) => setSelectedSupervisor(e.target.value)}
          >
            <option value="">All Supervisors</option>
            {allSupervisors.map(supervisor => (
              <option key={supervisor} value={supervisor}>{supervisor}</option>
            ))}
          </select>
        </div>
        
        <div className="filter-group">
          <label htmlFor="statusFilter">Project Status:</label>
          <select 
            id="statusFilter" 
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="active">Active Projects</option>
            <option value="all">All Projects</option>
          </select>
        </div>
        
        <div className="filter-actions">
          <button className="btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
          <span className="results-count">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* 項目網格 */}
      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon">🔍</div>
            <h3>No projects found</h3>
            <p>Try adjusting your search criteria or filters</p>
            <button className="btn-primary" onClick={clearFilters}>Clear All Filters</button>
          </div>
        ) : (
          filteredProjects.map(project => (
            <ProjectCard 
              key={project.id}
              project={project}
              isInPreferences={preferences.some(p => p.id === project.id)}
              onAddPreference={onAddPreference}
            />
          ))
        )}
      </div>
    </section>
  );
}

function ProjectCard({ project, isInPreferences, onAddPreference }) {
  const handleViewDetails = () => {
    const details = `
Project: ${project.title}
Supervisor: ${project.supervisor}
Description: ${project.description}
Required Skills: ${Array.isArray(project.skills) ? project.skills.join(', ') : project.skills}
Popularity: ${project.popularity} selections
Capacity: ${project.capacity} students
Status: ${project.status}
    `;
    alert(details);
  };

  return (
    <div className="project-card">
      <div className="project-header">
        <h3>{project.title}</h3>
        <span className="popularity-badge">🔥 {project.popularity} selections</span>
      </div>
      <div className="project-supervisor">
        <strong>Supervisor:</strong> {project.supervisor}
      </div>
      <div className="project-description">
        {project.description}
      </div>
      <div className="project-skills">
        <strong>Required Skills:</strong>
        <div className="skill-tags">
          {Array.isArray(project.skills) ? (
            project.skills.map(skill => (
              <span key={skill} className="skill-tag">{skill}</span>
            ))
          ) : (
            <span className="skill-tag">{project.skills}</span>
          )}
        </div>
      </div>
      <div className="project-actions">
        <button 
          className="btn-primary" 
          onClick={() => onAddPreference(project.id)}
          disabled={isInPreferences}
        >
          {isInPreferences ? '✅ Already Added' : '⭐ Add to Preferences'}
        </button>
        <button className="btn-secondary" onClick={handleViewDetails}>
          📖 View Details
        </button>
      </div>
    </div>
  );
}

export default ProjectBrowse;

