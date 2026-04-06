import React, { useState, useEffect } from 'react';
import AppModal from '../common/AppModal';
import { SearchOutlineGlyph } from '../common/StageGlyphs';

function AllProjects({ showNotification }) {
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedSkill, setSelectedSkill] = useState('');
  const [selectedSupervisor, setSelectedSupervisor] = useState('');
  const [sortBy, setSortBy] = useState('popularity');
  const [detailProject, setDetailProject] = useState(null);
  
  const userEmail = sessionStorage.getItem('userEmail') || 't001@hkmu.edu.hk';

  useEffect(() => {
    fetchAllProjects();
  }, []);

  const fetchAllProjects = async () => {
    try {
      setLoading(true);
      // Fetch all projects (excluding own projects)
      const response = await fetch(`/api/projects/all?excludeTeacher=${encodeURIComponent(userEmail)}`);
      const data = await response.json();
      if (data.success && data.projects) {
        setProjects(data.projects);
      }
    } catch (error) {
      console.error('Error fetching all projects:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get all unique skills
  const allSkills = [...new Set(projects.flatMap(p => p.skills || []))].sort();
  
  // Get all unique supervisors
  const allSupervisors = [...new Set(projects.map(p => p.supervisor).filter(Boolean))].sort();

  // Filter and sort projects
  const filteredProjects = projects.filter(project => {
    if (searchKeyword) {
      const keyword = searchKeyword.toLowerCase();
      const matchesKeyword = 
        project.title?.toLowerCase().includes(keyword) ||
        project.description?.toLowerCase().includes(keyword) ||
        project.supervisor?.toLowerCase().includes(keyword);
      if (!matchesKeyword) return false;
    }

    if (selectedSkill) {
      const skills = project.skills || [];
      if (!skills.includes(selectedSkill)) return false;
    }

    if (selectedSupervisor && project.supervisor !== selectedSupervisor) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    switch (sortBy) {
      case 'popularity':
        return (b.popularity || 0) - (a.popularity || 0);
      case 'alphabetical':
        return (a.title || '').localeCompare(b.title || '');
      case 'supervisor':
        return (a.supervisor || '').localeCompare(b.supervisor || '');
      default:
        return 0;
    }
  });

  const clearFilters = () => {
    setSearchKeyword('');
    setSelectedSkill('');
    setSelectedSupervisor('');
    setSortBy('popularity');
  };

  if (loading) {
    return (
      <section className="content-section active">
        <div className="loading-spinner">Loading other projects...</div>
      </section>
    );
  }

  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>Other Teacher Projects</h1>
        <p className="section-description">
          View all teacher-proposed projects from other teachers. Your own projects are not shown here.
        </p>
      </div>

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
        
        <div className="filter-actions">
          <button className="btn-secondary" onClick={clearFilters}>
            Clear Filters
          </button>
          <span className="results-count">
            {filteredProjects.length} project{filteredProjects.length !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

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
          filteredProjects.map(project => (
            <div key={project._id || project.id} className="project-card">
              <div className="project-header">
                <h3>{project.title}</h3>
                <span className="popularity-badge">{project.popularity || 0} selections</span>
              </div>
              <div className="project-supervisor">
                <strong>Supervisor:</strong> {project.supervisor}
              </div>
              {project.major && (
                <div className="project-major">
                  <strong>Major:</strong> {project.major}
                </div>
              )}
              <div className="project-description">
                {project.description}
              </div>
              <div className="project-skills">
                <strong>Required Skills:</strong>
                <div className="skill-tags">
                  {(project.skills || []).map(skill => (
                    <span key={skill} className="skill-tag">{skill}</span>
                  ))}
                </div>
              </div>
              <div className="project-actions">
                <button 
                  type="button" 
                  className="btn-secondary" 
                  onClick={() => setDetailProject(project)}
                >
                  View Details
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <ProjectDetailModal project={detailProject} onClose={() => setDetailProject(null)} />
    </section>
  );
}

function ProjectDetailModal({ project, onClose }) {
  if (!project) return null;

  return (
    <AppModal
      open
      title="Project Details"
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
        {project.major && (
          <>
            <dt>Major</dt>
            <dd>{project.major}</dd>
          </>
        )}
        <dt>Description</dt>
        <dd>{project.description}</dd>
        <dt>Required Skills</dt>
        <dd>
          {(project.skills || []).length > 0 ? (
            <div className="app-modal-skill-tags">
              {(project.skills || []).map(skill => (
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
        <dd>{project.popularity || 0} selections</dd>
        <dt>Capacity</dt>
        <dd>{project.capacity || 1} students</dd>
        <dt>Status</dt>
        <dd>{project.status}</dd>
      </dl>
    </AppModal>
  );
}

export default AllProjects;
