import React from 'react';

function Profile({ studentData }) {
  return (
    <section className="content-section active">
      <div className="section-header">
        <h1>My Profile</h1>
      </div>

      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">
            {(studentData?.name && studentData.name.charAt(0)) || 'S'}
          </div>
          <div className="profile-info">
            <h2>{studentData.name}</h2>
            <p className="profile-id">Student ID: {studentData.studentId}</p>
          </div>
        </div>

        <div className="profile-details">
          <div className="detail-group">
            <label>Email:</label>
            <span>{studentData.email}</span>
          </div>
          <div className="detail-group">
            <label>Major:</label>
            <span>{studentData.major}</span>
          </div>
          <div className="detail-group">
            <label>GPA:</label>
            <span>{studentData.gpa}</span>
          </div>
          <div className="detail-group">
            <label>Year of Study:</label>
            <span>{studentData.year}</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export default Profile;

