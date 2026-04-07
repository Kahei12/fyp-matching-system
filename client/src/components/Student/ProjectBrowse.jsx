import React, { useState, useMemo } from 'react';
import AppModal from '../common/AppModal';
import { SearchOutlineGlyph } from '../common/StageGlyphs';

function ProjectBrowse({ projects, preferences, onAddPreference, isAssigned = false, expiredDeadlineKeys = new Set() }) {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('popularity');
  const [detailProject, setDetailProject] = useState(null);

  const isPreferenceExpired = expiredDeadlineKeys.has('preference');
  const isBrowseDisabled = isPreferenceExpired || isAssigned;

  // Get all skills options
  const allSkills = useMemo(() => {
    const skills = new Set();
    projects.forEach(project => {
      if (Array.isArray(project.skills)) {
        project.skills.forEach(skill => skills.add(skill));
      }
    });
    return Array.from(skills).sort();
  }, [projects]);

  // Get all supervisor options
  const allSupervisors = useMemo(() => {
    const supervisors = new Set();
    projects.forEach(project => supervisors.add(project.supervisor));
    return Array.from(supervisors).sort();
  }, [projects]);

  // Filter and sort projects
  const filteredProjects = useMemo(() => {
    let filtered = projects.filter(project => {
      // Keyword search
      if (searchKeyword) {
        const keyword = searchKeyword.toLowerCase();
        const matchesKeyword = 
          project.title.toLowerCase().includes(keyword) ||
          project.description.toLowerCase().includes(keyword) ||
          project.supervisor.toLowerCase().includes(keyword);
        if (!matchesKeyword) return false;
      }

      // Skill filter
      if (selectedSkill) {
        const skills = Array.isArray(project.skills) ? project.skills : [project.skills];
        const hasMatchingSkill = skills.includes(selectedSkill);
        if (!hasMatchingSkill) return false;
      }

      // Supervisor filter
      if (selectedSupervisor && project.supervisor !== selectedSupervisor) {
        return false;
      }

      // Status filter - default show all projects (including Under Review)
      if (statusFilter === 'active' && project.status !== 'active') {
        return false;
      }

      return true;
    });

    // Sort
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
  }, [projects, searchKeyword, selectedSkill, selectedSupervisor, statusFilter, sortBy]);

  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedSkill('');
    setSelectedSupervisor('');
    setStatusFilter('all');
    setSortBy('popularity');
  };

  return (
    <section className="content-section active">
      <div className="section-header">
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

      {/* Search filters */}
      <div className="search-filters">
        <div className="filter-group">
          <label htmlFor="skillFilter">Filter by Skills:</label>
          <select 
            id="skillFilter" 
            className="filter-select" 
            value={selectedSkill}
            onChange={(e) => setSelectedSkill(e.target.value)}
          >
            <option value="">All Skills</option>
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
            <option value="active">Active Only</option>
            <option value="all">All Projects</option>
          </select>
        </div>
        
        <div className="filter-actions">
          {!isBrowseDisabled && (
            <button className="btn-secondary" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
          <span className="results-count">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Project grid */}
      <div className="projects-grid">
        {filteredProjects.length === 0 ? (
          <div className="no-results">
            <div className="no-results-icon" aria-hidden>
              <SearchOutlineGlyph className="stage-glyph-svg" />
            </div>
            <h3>No projects found</h3>
            <p>Try adjusting your search criteria or filters</p>
            <button className="btn-primary" onClick={clearFilters}>Clear All Filters</button>
          </div>
        ) : (
          <>
            {filteredProjects.map(project => (
              <ProjectCard
                key={project.id ?? project._id}
                project={project}
                isInPreferences={Array.isArray(preferences) && preferences.some(p => p.id === project.id)}
                onAddPreference={onAddPreference}
                isAssigned={isAssigned}
                isBrowseDisabled={isBrowseDisabled}
                onOpenDetails={() => setDetailProject(project)}
              />
            ))}
          </>
        )}
      </div>

      <ProjectDetailModal project={detailProject} onClose={() => setDetailProject(null)} />
    </section>
  );
}

function ProjectDetailModal({ project, onClose }) {
  if (!project) return null;
  const skillsList = Array.isArray(project.skills) ? project.skills : project.skills ? [project.skills] : [];

  return (
    <AppModal
      open
      title="Project details"
      onClose={onClose}
      size="xl"
      footer="ok"
      okLabel="OK"
    >
      <dl className="app-modal-dl">
        <dt>Project</dt>
        <dd>{project.title}</dd>
        <dt>Supervisor</dt>
        <dd>{project.supervisor}</dd>
        <dt>Description</dt>
        <dd>{project.description}</dd>
        <dt>Required skills</dt>
        <dd>
          {skillsList.length > 0 ? (
            <div className="app-modal-skill-tags">
              {skillsList.map((skill) => (
                <span key={skill} className="app-modal-skill-tag">
                  {skill}
                </span>
              ))}
            </div>
          ) : (
            <span style={{ color: '#6c757d' }}>None specified</span>
          )}
        </dd>
        <dt>Popularity</dt>
        <dd>{project.popularity} selections</dd>
        <dt>Capacity</dt>
        <dd>{project.capacity} students</dd>
        <dt>Status</dt>
        <dd>{project.status}</dd>
      </dl>
    </AppModal>
  );
}

function ProjectCard({ project, isInPreferences, onAddPreference, isAssigned = false, isBrowseDisabled = false, onOpenDetails }) {
  return (
    <div className="project-card">
      <div className="project-header">
        <h3>{project.title}</h3>
        <span className="popularity-badge">{project.popularity} selections</span>
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
          disabled={isInPreferences || isAssigned || isBrowseDisabled}
        >
          {isAssigned ? 'Already Assigned' : isInPreferences ? 'Already Added' : isBrowseDisabled ? 'Closed' : 'Add to Preferences'}
        </button>
        <button type="button" className="btn-secondary" onClick={() => onOpenDetails?.()}>
          View Details
        </button>
      </div>
    </div>
  );
}

export default ProjectBrowse;

