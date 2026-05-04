# FYP Matching System - Report Additions (English Version)
# Tailored to Actual System Implementation

---

## ============================================
## SECTION 1: ABSTRACT
## Insert Location: AFTER Declaration Page, BEFORE Table of Contents
## ============================================

This project presents the design and development of a web-based Final Year Project (FYP) Matching System for the Electronic and Computer Engineering programme at Hong Kong Metropolitan University. The current allocation process relies heavily on manual coordination, dispersed communication tools, and a "black-box" matching mechanism that lacks transparency. This study addresses these limitations by proposing a centralized platform built on the MERN technology stack (MongoDB, Express.js, React, Node.js) with three distinct role-based portals for students, supervisors, and administrators. The system implements a preference-based matching algorithm that considers students' ranked project choices and GPA as a tiebreaker, ensuring fairness while maintaining transparency. Key features include student self-proposal functionality, real-time project popularity tracking, drag-and-drop preference ranking with up to ten choices, automated deadline management, batch account creation via CSV import, and a manual clearing mechanism for unmatched students. The methodology follows a three-tier client-server architecture with role-based authentication, requiring mandatory password change on first login. As of this interim report, the core functionality—including login authentication with password enforcement, the student portal with drag-and-drop ranking, the matching algorithm, and admin controls—has been implemented. Future work will focus on completing the supervisor and admin portal integrations, enhancing data visualization, implementing a notification system, and conducting comprehensive usability and load testing.

---

## ============================================
## SECTION 2: SYSTEM ARCHITECTURE
## Insert Location: BEGINNING of Section 3 (Methodology), BEFORE 3.1 System Interface Design
## ============================================

## 3. System Architecture and Design

This section describes the overall system architecture, including the three-tier structure, component interactions, security mechanisms, and database design implemented in the FYP Matching System.

### 3.1 Three-Tier Architecture Overview

The system adopts the industry-standard three-tier client-server architecture, which divides the application into three distinct layers: the Presentation Layer, the Business Logic Layer, and the Data Layer. This architectural approach ensures modularity, scalability, and ease of maintenance throughout the development and deployment lifecycle.

The Presentation Layer handles all user interface operations and runs entirely in the client's web browser. The Business Logic Layer processes requests, executes application logic, and manages communication between the presentation and data layers. The Data Layer is responsible for data persistence, storage, and retrieval operations using MongoDB.

### 3.2 Presentation Layer (Client)

The frontend is built using React with Vite as the build tool, providing a modern and efficient development environment. The presentation layer implements several key architectural features that ensure a responsive and maintainable user interface.

The component-based architecture allows the system to break down the user interface into reusable building blocks organized into three distinct portal directories. The Student directory contains components for student proposal submission, project browsing, preference management, and results viewing. The Teacher directory contains components for reviewing student proposals, managing teacher-proposed projects, and viewing supervision assignments. The Admin directory contains components for system configuration, matching control, and account management.

Role-based routing is implemented using React Router, which ensures that users are directed to appropriate pages based on their authentication status and assigned role. Protected routes prevent unauthorized access to sensitive pages, and each role (student, teacher, administrator) is granted access only to the functionality relevant to their responsibilities.

The authentication system implements a mandatory password change mechanism. When new accounts are created, users are required to change their password on first login. The system prevents users from reusing their initial password and enforces a minimum password length of eight characters. This security measure ensures that temporary credentials are replaced with personalized, secure passwords before users can access system features.

### 3.3 Application Layer (Server)

The backend is constructed using Node.js with the Express.js framework, providing a robust and scalable server-side environment. The application layer contains several key routes and services that work together to process user requests and execute business logic.

The server exposes RESTful API endpoints organized by functionality. The authentication endpoints handle user login and password change operations. The student endpoints manage project browsing, preference submission, proposal submission, and assignment status checking. The teacher endpoints handle project creation, proposal review, and supervision list management. The admin endpoints provide system configuration, deadline management, matching control, and batch account creation functionality.

The matching engine is the core algorithmic component located in the server routes. It processes student preferences and generates allocation results by considering preference rankings, GPA scores, and project capacity constraints to produce fair and transparent matching outcomes.

### 3.4 Data Layer (Database)

MongoDB serves as the primary data storage solution, selected for its flexibility and seamless integration with the JavaScript ecosystem. The document-based model aligns naturally with JSON data structures used throughout the application.

The database contains four primary collections. The User collection stores information for all users, with a role field distinguishing between students, teachers, and administrators. For students, additional fields include GPA, major (either Electronics and Computer Engineering or Computer and Cyber Security), and preference tracking. For teachers, fields include department and major assignments. The Project collection contains all project information, with a type field distinguishing between teacher-proposed and student-proposed projects. Projects include capacity settings, required skills, popularity tracking, and review status. The SystemSettings collection stores global configuration including deadline timestamps for each phase, matching completion status, and current system phase.

### 3.5 Security Architecture

The system implements multiple security mechanisms to protect user data and prevent unauthorized access.

Password security is implemented using bcryptjs for hashing. All passwords are hashed before storage, and the system enforces minimum length requirements. The mustChangePassword flag forces new users to change their password on first login, preventing use of default credentials. The system also prevents users from changing their password to match their initial password.

Role-based access control ensures that users can only access functionality appropriate to their role. Students can browse projects, submit preferences, and view their own assignment. Teachers can manage their projects and review student proposals assigned to them. Administrators have full access to system configuration, matching control, and all user management functions.

Input validation is performed on all API endpoints to ensure data integrity and prevent injection attacks.

---

## ============================================
## SECTION 3: DATABASE DESIGN
## Insert Location: AFTER System Architecture Section 3.5, BEFORE 3.2 System Interface Design
## ============================================

### 3.6 Database Schema Design

The MongoDB database contains four main collections that store all system data. This section describes the complete schema design for each collection.

### 3.6.1 User Collection

The User collection stores essential information for all system users, distinguishing between students, teachers, and administrators through the role field.

For all users, the schema includes email as a unique identifier, a password field storing the bcrypt-hashed password, and role as an enumerated value specifying student, teacher, or admin. For student users, additional fields include studentId for the official student number, gpa for academic performance tracking, and major indicating either Electronics and Computer Engineering or Computer and Cyber Security. The preferencesSubmitted boolean tracks whether the student has locked in their project choices. The proposalSubmitted boolean tracks whether the student has submitted their own project proposal. The assignedProject field references the matched project after the matching algorithm runs. The proposedProject field references the student's self-proposed project if applicable. The proposalStatus field tracks the approval status of the student's proposal. The teacherNotes array stores feedback from teachers who have reviewed the student's proposal. The mustChangePassword boolean forces password change on first login. The initialPassword stores the original generated password for reference.

For teacher users, the schema includes teacherId as a unique identifier, department for the academic department, and major for their specialization. Teachers can supervise projects in either ECE, CCS, or both departments.

### 3.6.2 Project Collection

The Project collection contains detailed information about all FYP projects, including both teacher-proposed and student-proposed projects.

The core fields include code for the project identifier, title for the project name, and description for detailed project information. The type field distinguishes between teacher-proposed and student-proposed projects. The capacity field specifies the maximum number of students allowed, defaulting to one. The skills array lists the technical competencies needed. The category and department fields classify the project. The major field indicates which department the project belongs to.

Status tracking fields include status for overall project status, proposalStatus for student proposals specifically, and isActive for visibility control.

For teacher-proposed projects, supervisor references the teacher's user record, supervisorEmail stores the email for display, and teacherReviews contains an array of review records showing which teachers have reviewed the project.

Popularity tracking fields include popularity counting how many students have added the project to their preferences, and assignedCount tracking how many students have been matched to the project.

### 3.6.3 SystemSettings Collection

The SystemSettings collection is a singleton document storing global system configuration.

The deadlines object contains timestamp fields for studentSelfProposal, preference submission, teacherProposalReview, and teacherSelfProposal. These deadlines control which features are active and when users can perform certain actions. The matchingCompleted boolean indicates whether the matching algorithm has been executed for the current cycle. The currentPhase string indicates the active system phase.

### 3.7 Database Relationships

The collections maintain referential integrity through ObjectId references. User documents are referenced by Project documents as supervisors. User documents are referenced by Project documents as proposedBy students. User documents are referenced by Project documents as assigned supervisors after matching. Project documents are referenced by User documents as assigned projects.

---

## ============================================
## SECTION 4: MATCHING ALGORITHM
## Insert Location: AFTER existing Algorithm description in Section 3.3.3 (Enhancements)
## ============================================

### 3.3.5 Matching Algorithm Implementation Details

The matching algorithm is the core component of the FYP Matching System, responsible for fairly allocating students to projects based on their preferences and academic standing. This section provides the detailed implementation of the algorithm.

#### Algorithm Overview

The matching algorithm operates through a multi-phase process that prioritizes student preferences while using GPA as a tiebreaker when projects are oversubscribed. The algorithm processes students in descending order of GPA, ensuring that higher-performing students have their preferences considered first.

#### Algorithm Process

The first phase begins by sorting all students who have submitted their preferences in descending order by GPA. Students who have not submitted preferences are excluded from the matching process and will be handled in the clearing phase.

The second phase iterates through each student. For each student, the algorithm examines their preferences in the order they ranked them. The system allows students to rank up to ten project choices. When examining a preference, the algorithm first checks whether the project has remaining capacity.

If the project has available slots, the student is assigned to that project immediately. The assignment record stores the student ID, project ID, supervisor ID, preference rank (which choice resulted in the match), and match type.

If the project is at capacity, the algorithm compares the student's GPA with the lowest-GPA student currently assigned to that project. If the current student has a higher GPA, they replace the lower-GPA student, who becomes unmatched and will be reconsidered for their remaining preferences.

The third phase identifies all students who were not matched to any project. These students are collected for the admin-managed clearing phase.

#### Tiebreaker Mechanism

When multiple students compete for the same project slot and share the same GPA, the system uses a secondary criterion to ensure deterministic results. The algorithm compares the submission timestamp of each student's preferences, with earlier submissions receiving priority. This approach ensures that the matching result is consistent and reproducible across multiple executions.

#### Real-time Popularity Tracking

The system maintains a popularity counter for each project. When a student adds a project to their preferences, the counter increments. When a student removes a project, the counter decrements. This real-time tracking allows other students to see how many of their peers are interested in each project, enabling informed decision-making when ranking preferences.

#### Time Complexity

The matching algorithm runs in O(n log n + n * k) time, where n is the number of students and k is the average number of preferences per student. The sorting phase dominates with O(n log n), while the matching phase is linear in the number of preference checks.

---

## ============================================
## SECTION 5: FEATURE IMPLEMENTATION DETAILS
## Insert Location: AFTER Section 3.3.4 (Data Export), AS NEW SUBSECTION 3.3.5
## ============================================

### 3.3.6 Authentication and Account Management

The system implements a secure authentication mechanism with mandatory password management to ensure account security from the moment of creation.

When an administrator creates a new account through the batch creation interface, the system generates a temporary password following the institutional naming convention. For students, the format is Changeme123!, while for teachers, it is 00000001 through 00000008 for the first eight teacher accounts. The mustChangePassword flag is automatically set to true for all newly created accounts.

Upon first login, users whose mustChangePassword flag is true are redirected to a password change form. The system enforces a minimum password length of eight characters and prevents users from setting their password to match their initialPassword value. This prevents users from simply confirming their default credentials rather than creating a secure personal password.

The authentication flow also supports normal password changes for all users, allowing them to update their credentials at any time through the profile section of their respective portals.

### 3.3.7 Batch Account Creation via CSV Import

To streamline the account creation process for administrators managing large numbers of users, the system provides a batch creation feature supporting both individual form entry and CSV file import.

The admin account creation interface offers two modes of operation. In single-entry mode, administrators fill out a form with student or teacher details. In batch mode, administrators can download a CSV template, populate it with user data, and upload the file for processing.

The CSV template includes columns for Student ID, Name, Major, and an optional Notes field. For teachers, the template uses Teacher ID, Name, Department, and Major columns. The system validates the uploaded data, checking for required fields, valid major values (ECE, CCS, or ECE+CCS), and duplicate entries. Valid records are processed in batch, creating user accounts with default credentials. The system generates a summary report showing the number of successfully created accounts and any validation errors encountered.

This batch creation feature significantly reduces the administrative burden of setting up accounts at the beginning of each academic year or term.

### 3.3.8 Student Self-Proposal Feature

The system supports a student self-proposal workflow that allows students to propose their own FYP topics for supervisor consideration. This feature enables students with specific research interests to seek supervisor approval for original project ideas.

During the student self-proposal phase, students access a proposal submission form through their portal. The form requires a project title, a detailed description of at least fifty characters, and the selection of required skills from a predefined list with an option for custom skills. Students must also select their major, which determines which teachers will see their proposal for review.

Once submitted, the proposal enters a review state. Teachers with matching major specialization can view the proposal in their portal and choose to approve or reject it. When a teacher approves a proposal, the system automatically assigns the teacher as the project supervisor, changes the project type to teacher-proposed, and sets the proposal status to approved. When a teacher rejects a proposal, the status changes to rejected and the student is notified.

If the student self-proposal deadline passes without approval, the system automatically rejects all pending proposals through a scheduled task. Students can view the status of their proposal through their portal interface, which displays whether the proposal is pending review, approved, or rejected.

### 3.3.9 Drag-and-Drop Preference Ranking

The My Preferences section implements an intuitive drag-and-drop interface that allows students to easily rank their project choices in order of preference.

Students can add projects to their preference list by browsing available projects and clicking an Add to Preferences button. Once added, projects appear in a ranked list showing their current position. Students can reorder the list by either dragging and dropping projects to their desired positions or using Up and Down arrow buttons for precise single-position adjustments.

The drag-and-drop implementation uses the HTML5 drag and drop API, with visual indicators showing which item is being dragged and where it will be dropped. As students reorder their preferences, the system synchronizes the order to the backend in real-time, ensuring that the preference ranking is preserved even if the browser is refreshed.

The system enforces a maximum of ten preferences to prevent analysis paralysis and ensure focused decision-making. Once students are satisfied with their ranking, they can submit their preferences. After submission, the preferences are locked and cannot be modified, ensuring the integrity of the matching process.

### 3.3.10 Real-time Assignment Status Polling

After the matching algorithm is executed, students need to know when their assignment has been determined. The system implements a real-time polling mechanism that checks for assignment status updates.

On the Results page, the student's browser automatically polls the server every five seconds to check whether the matching algorithm has assigned them to a project. When a match is found, the polling stops and the system displays the assignment details, including the project title, supervisor information, and project code.

The polling mechanism also displays informative banners while the matching is in progress or when results are not yet available. This approach provides students with timely feedback without requiring manual page refreshes.

### 3.3.11 Major-Based Project Filtering

The system supports filtering projects by academic major, enabling students to focus on projects relevant to their specialization. The system recognizes three major categories: Electronics and Computer Engineering, Computer and Cyber Security, and a combined option for projects that accept students from both departments.

When students browse projects, they can filter by their major to see only applicable options. Teachers creating projects specify which majors their project is open to. When reviewing student proposals, teachers see only proposals from students whose major matches the teacher's specialization.

This filtering ensures that students are matched to projects appropriate for their academic background and that teachers receive proposals from students they are qualified to supervise.

---

## ============================================
## SECTION 6: USER INTERFACE FEATURES
## Insert Location: AFTER Section 3.1.4 (Admin Portal Interfaces), AS NEW SECTION 3.1.5
## ============================================

### 3.1.5 Additional User Interface Features

This subsection describes additional interface elements and interactions that enhance the user experience across all portals.

#### Account Creation Interface (Admin)

The admin account creation interface provides a dual-mode system for adding new users to the platform. Administrators can toggle between Student and Teacher account creation modes using a tabbed interface.

In single creation mode, administrators fill out a form with the necessary information. In batch creation mode, administrators can download a CSV template file by clicking a template download button. After filling out the template with multiple user records, administrators upload the file through a file input component. The interface displays a preview of the data before processing and shows a detailed report of successful creations and any errors.

The email address for each account is automatically generated based on the institutional naming convention. For students, emails follow the format s followed by the student ID and @hkmu.edu.hk. For teachers, emails follow the format t followed by the teacher ID and @hkmu.edu.hk. These generated emails are displayed to the administrator for confirmation before account creation.

#### Project Filtering Interface (Student)

The project browsing interface provides multiple filtering options to help students find suitable projects. A search bar allows keyword searching across project titles, descriptions, and supervisor names. A skills filter presents a multi-select dropdown of available skills, showing only projects that match the selected skills. A supervisor filter dropdown lists all available supervisors for targeted browsing. A status filter toggles between showing only active projects or including all projects regardless of status. Sort options allow ordering by popularity (how many students have selected the project), alphabetically by title, or by supervisor name.

Each project card displays the project title, supervisor name, description excerpt, required skills tags, and current popularity count. A View Details button opens a modal with complete project information.

#### Preference Management Interface (Student)

The My Preferences section displays the student's current preference list with clear visual indicators of order. Each preference item shows the project title, supervisor, and current rank number. Drag handles on the left side of each item indicate that items can be reordered. Up and Down buttons on the right side provide alternative ranking methods for accessibility. A Clear All button allows resetting the entire preference list. A Submit Preferences button finalizes the choices, triggering a confirmation dialog before locking the preferences.

After submission, the interface displays a confirmation message and changes the display to a read-only view of the submitted preferences, with the Submit button disabled.

#### Results Interface (Student)

The Results interface provides clear feedback about the student's assignment status. Before matching is complete, a banner informs the student that results are pending. During the matching process, a loading indicator shows that the system is checking for results. After matching, the interface displays the assigned project details in a highlighted card format, including the project title, project code, and supervisor contact information.

#### Project Creation Interface (Teacher)

Teachers creating new projects use a form with fields for title, description, required skills selection, major assignment, and capacity setting. The skills selection allows multiple skills to be chosen from a predefined list. The major field determines which students will see the project. The capacity field defaults to one but can be increased for projects suitable for multiple students.

An existing projects list shows all projects the teacher has created, with options to edit or delete each project.

#### Proposal Review Interface (Teacher)

The proposal review interface lists all student proposals that match the teacher's major specialization. Each proposal displays the student's name, student ID, major, GPA, proposal title, and submission timestamp. The interface allows the teacher to click into the proposal details and choose to approve or reject it. Approved proposals automatically become active projects under the teacher's supervision. Rejected proposals are marked as declined.

#### Matching Control Interface (Admin)

The admin matching control panel provides centralized management of the matching process. A prominent Start Matching button triggers the matching algorithm. A Reset Server button clears all current preferences and assignments to allow a fresh start. Live statistics display the current counts of total students, submitted preferences, matched students, and unmatched students. Statistics are broken down by major (ECE and CCS) to provide granular insight into the matching status.

A refresh button allows administrators to update the statistics display without triggering the matching algorithm.

#### Final Assignment Interface (Admin)

The final assignment interface handles the clearing phase for students who were not automatically matched. An unmatched students table displays all students without assignments, with pagination for large lists. A matched students table shows current assignments. An available projects panel lists projects with remaining capacity, supporting lazy loading for performance.

Administrators can select an unmatched student and a project, then click Assign to manually create an assignment. The interface also supports editing existing assignments by selecting a matched student and choosing a different project. A Clear Assignment option removes an existing assignment to allow reassignment.

#### Batch Assignment Interface (Admin)

For efficiency when many students require manual assignment, the interface supports batch operations. Administrators can select multiple unmatched students and use an auto-assign feature that assigns each selected student to a project with available capacity based on the student's major. This reduces the administrative burden when handling clearing at scale.

#### Data Export Interface (Admin)

The data export section provides download functionality for various system reports. Export options include matching results CSV, student list CSV, project list CSV, and teacher list CSV. Each export generates a downloadable file containing the relevant data in comma-separated format, suitable for import into spreadsheet applications or external systems.

---

## ============================================
## SECTION 7: TESTING METHODOLOGY
## Insert Location: BEGINNING of Section 4 (Experiment), AS NEW SECTION 4.1
## Note: Keep existing 4.1 as 4.2
## ============================================

## 4. Testing Methodology

This section describes the comprehensive testing strategy employed to ensure the reliability, stability, and security of the FYP Matching System.

### 4.1 Testing Strategy Overview

The testing strategy follows a layered approach. At the foundation, input validation and error handling catch invalid data at the API level. Functional testing verifies that each feature behaves as expected based on user requirements. Integration testing verifies that components work together correctly. System testing verifies that the complete application functions as a cohesive unit.

### 4.2 Functional Test Scenarios

#### Authentication Tests

The authentication system requires testing of several key scenarios. Login with valid credentials should succeed and redirect to the appropriate portal based on user role. Login with invalid credentials should display an error message and remain on the login page. First-time login should redirect to the password change form when mustChangePassword is true. Password change should enforce minimum length requirements and prevent reuse of the initial password. Password change should accept valid new passwords and update the user record.

#### Student Portal Tests

The student portal requires testing of project browsing, preference management, and proposal submission. Project browsing should display all available projects matching the student's major. Search should filter projects by keyword in title, description, or supervisor name. Skill filtering should display only projects matching selected skills. Adding a project to preferences should update the popularity counter. Removing a project should decrement the popularity counter. Drag-and-drop reordering should update the preference order on the server. Submitting preferences should lock the preferences and prevent further modification. Proposal submission should validate the description length requirement. Proposal status should update when a teacher reviews the proposal.

#### Teacher Portal Tests

The teacher portal requires testing of project management and proposal review. Project creation should set the correct type and assign the supervisor. Proposal review should display only proposals matching the teacher's major. Approving a proposal should change the project status and assign the teacher as supervisor. Rejecting a proposal should update the proposal status. The supervision list should display all assigned students correctly.

#### Admin Portal Tests

The admin portal requires testing of system configuration, matching control, and account management. Deadline updates should save the new timestamps and enforce them in other parts of the system. Starting matching should execute the algorithm and create assignment records. Resetting should clear all preferences and assignments. Batch account creation should process valid CSV data and create user accounts. Manual assignment should create assignment records for unmatched students. CSV export should generate files with correct headers and data.

### 4.3 Integration Test Scenarios

Integration tests verify end-to-end workflows across multiple components.

The complete matching workflow should proceed as follows. Teachers create projects during the proposal phase. Students browse and submit preferences before the deadline. Administrators start the matching algorithm. Students view their assignment results. Unmatched students are manually assigned by administrators.

The student self-proposal workflow should proceed as follows. A student submits a proposal. The proposal appears in teacher review queues matching the student's major. A teacher approves the proposal. The project becomes available to all students. The student who proposed it sees their project with approved status.

### 4.4 Edge Case Handling Tests

The system should handle various edge cases gracefully. When a student submits no preferences, the matching algorithm should correctly identify them as unmatched. When all project slots are full, the system should continue processing remaining preferences. When a teacher deletes a project that students have selected, those preferences should be skipped during matching. When the matching algorithm runs multiple times, previous assignments should be cleared before creating new ones.

---

## ============================================
## SECTION 8: PROJECT MANAGEMENT
## Insert Location: BEFORE Section 6 (Conclusion), AS NEW SECTION 5
## Note: Renumber existing Section 5 to 6, Section 6 to 7
## ============================================

## 5. Project Management

This section describes the project management approach, including the development timeline, risk assessment, and milestones for the FYP Matching System project.

### 5.1 Development Timeline

The project spans the 2024-2025 academic year and is divided into distinct phases with specific deliverables.

The project initiation phase runs from September 2024 and lasts approximately two weeks. During this phase, the project requirements are analyzed through discussions with the supervisor, a comprehensive literature review is conducted, and the project proposal document is prepared and submitted.

The system design phase runs from late September through October 2024 and lasts approximately four weeks. During this phase, the system architecture is designed, the database schema is defined, the user interface mockups are created for all three portals, and the technology stack components are selected and configured.

The first development phase runs from October through December 2024 and lasts approximately eight weeks. During this phase, the backend server infrastructure is set up with Express.js, the authentication system with mandatory password change is implemented, the student portal with all its features including drag-and-drop preferences is developed, and the basic API endpoints for student operations are completed.

The second development phase runs from December 2024 through February 2025 and lasts approximately eight weeks. During this phase, the matching algorithm is implemented and tested, the teacher portal features including proposal review are completed, the administrator portal controls including batch account creation are finalized, and data export functionality is added.

The testing phase runs from February through April 2025 and lasts approximately eight weeks. During this phase, functional tests are written and executed for all major features, integration tests verify cross-component functionality, identified bugs are fixed and retested, and performance testing verifies system behavior under load.

The report writing phase runs from March through May 2025 and lasts approximately ten weeks. During this phase, the interim report is prepared and submitted in March, the final report content is drafted based on completed work, and the final report is reviewed, finalized, and submitted in May.

### 5.2 Risk Assessment

Several risks have been identified with corresponding mitigation strategies.

Risk R1 concerns deadline management challenges arising from the three-phase structure of the matching process. The likelihood is medium because coordinating multiple deadlines requires careful attention. The impact is high because missed deadlines affect student ability to submit preferences. The mitigation strategy implements a centralized deadline management interface in the admin portal, allowing administrators to set and modify deadlines from a single location.

Risk R2 concerns data integrity during the matching process. The likelihood is low because the matching algorithm is carefully designed. The impact is high because incorrect matching affects student academic outcomes. The mitigation strategy implements transaction-like behavior where matching either completes fully or rolls back completely, preventing partial states.

Risk R3 concerns scalability when many students submit preferences simultaneously. The likelihood is medium because students tend to submit near deadlines. The impact is medium because slow response times frustrate users. The mitigation strategy designs the system with stateless API endpoints that can be scaled horizontally, and implements efficient database queries with appropriate indexes.

Risk R4 concerns user adoption and training requirements. The likelihood is medium because users may be resistant to changing their workflows. The impact is medium because low adoption reduces the system's value. The mitigation strategy designs intuitive interfaces following established web conventions, minimizing the learning curve for users familiar with modern web applications.

### 5.3 Milestones

Milestone M1 marks the completion of requirements and design specifications by the end of September 2024, with deliverables including the requirements document and system design document.

Milestone M2 marks the completion of the backend infrastructure by the end of November 2024, with deliverables including a functional backend API with authentication working and basic CRUD operations implemented.

Milestone M3 marks the completion of the student portal by the end of December 2024, with deliverables including a fully functional student portal with project browsing, preference management with drag-and-drop, and self-proposal submission implemented.

Milestone M4 marks the completion of the matching algorithm by the end of January 2025, with deliverables including a tested matching algorithm with all edge cases handled and verified.

Milestone M5 marks the completion of the teacher and administrator portals by the end of February 2025, with deliverables including all three portals with core functionality implemented.

Milestone M6 marks the completion of system integration and testing by the end of March 2025, with deliverables including a fully integrated system with all testing completed.

Milestone M7 marks the submission of the interim report in March 2025.

Milestone M8 marks the completion of the final system by the end of April 2025, with deliverables including a production-ready system.

Milestone M9 marks the submission of the final report in May 2025.

### 5.4 Resource Allocation

The project utilizes the following resources. The development team consists of one person, the student developer. The supervisor, Dr. Bell Liu, provides guidance through weekly meetings. The development environment includes Visual Studio Code for coding, Node.js and npm for backend development, MongoDB Compass for database management, and Render.com for cloud deployment. The project budget is zero Hong Kong dollars because all required tools and platforms are available at no cost.

---

## ============================================
## SECTION 9: CONCLUSION ENHANCEMENT
## Insert Location: APPEND TO Section 6.1 (Conclusion)
## ============================================

### Additional Content for Conclusion Section

The implementation of the FYP Matching System demonstrates the successful application of web development technologies to solve real administrative challenges in academic project allocation. The system's emphasis on transparency addresses a fundamental concern raised by students who previously had no visibility into the allocation process.

The decision to implement mandatory password change on first login reflects best practices in credential management, ensuring that default credentials are replaced before users can access sensitive functionality. The batch account creation feature significantly reduces the administrative burden of setting up accounts for large cohorts of students and teachers.

The drag-and-drop interface for preference ranking provides an intuitive user experience that reduces the likelihood of errors in preference submission. Combined with the real-time popularity tracking, students can make informed decisions about their project choices based on current demand.

The matching algorithm's approach of processing students in GPA order ensures a fair and deterministic allocation process. The visibility of the tiebreaker mechanism allows students to understand exactly how their assignment was determined, addressing concerns about the opacity of previous allocation methods.

Future enhancements could include a notification system that alerts users to important events such as deadline approaching, proposal approval, and matching completion. Additional data visualization features such as charts showing project popularity trends and matching statistics would provide administrators with better insight into the allocation process. Integration with institutional single sign-on systems would further streamline the authentication process for users.

---

## ============================================
## SECTION 10: ADDITIONAL REFERENCES
## Insert Location: APPEND TO EXISTING REFERENCES LIST (after [14])
## ============================================

The following additional references support the expanded content in this report:

[15]	Auth0. (n.d.). Get started with JSON Web Tokens. Retrieved May 4, 2026, from https://auth0.com/learn/json-web-tokens/

[16]	Auth0. (n.d.). Validate JSON Web Tokens. Retrieved May 4, 2026, from https://auth0.com/docs/tokens/guides/jwt/validate-jwt

[17]	Built In. (n.d.). Gale-Shapley algorithm explained. Retrieved May 4, 2026, from https://builtin.com/articles/gale-shapley-algorithm

[18]	Express.js Foundation. (n.d.). Security best practices for Express in production. Retrieved May 4, 2026, from https://expressjs.com/en/advanced/best-practice-security.html

[19]	MongoDB, Inc. (n.d.). Mongoose ODM support. Retrieved May 4, 2026, from https://www.mongodb.com/tools/mongoose

[20]	National Institute of Standards and Technology. (2020). Digital identity guidelines: Authentication and authenticator management (NIST SP 800-63B-4). U.S. Department of Commerce. https://nvlpubs.nist.gov/nistpubs/specialpublications/nist.sp.800-63b.pdf

[21]	National Institute of Standards and Technology. (2010). Recommendation for password-based key derivation Part 1: Storage applications (NIST SP 800-132). U.S. Department of Commerce. https://nvlpubs.nist.gov/nistpubs/Legacy/SP/nistspecialpublication800-132.pdf

[22]	Nielsen Norman Group. (2021, August 29). Usability testing 101. Retrieved May 4, 2026, from https://www.nngroup.com/articles/usability-testing-101

[23]	Nielsen Norman Group. (2019, January 20). Checklist for planning usability studies. Retrieved May 4, 2026, from https://www.nngroup.com/articles/usability-test-checklist

[24]	Papa Parse. (n.d.). Powerful CSV parser for JavaScript. Retrieved May 4, 2026, from https://www.papaparse.com/

[25]	React Router. (n.d.). Middleware. Retrieved May 4, 2026, from https://reactrouter.com/how-to/middleware

[26]	React Router. (n.d.). Routing. Retrieved May 4, 2026, from https://reactrouter.com/start/data/routing

[27]	RESTful API. (n.d.). REST API best practices. Retrieved May 4, 2026, from https://restfulapi.net/rest-api-best-practices

[28]	RESTful API. (n.d.). How to design a REST API—Step by step guide. Retrieved May 4, 2026, from https://restfulapi.net/rest-api-design-tutorial-with-example

[29]	Vite. (n.d.). Next generation frontend tooling. Retrieved May 4, 2026, from https://vitejs.dev/

[30]	Vite. (n.d.). Features. Retrieved May 4, 2026, from https://v4.vitejs.dev/guide/features.html

---

## ============================================
## SUMMARY OF WORD COUNT AND INSERTION POINTS
## ============================================

| Section | Title | Insertion Location | Estimated Words |
|---------|-------|-------------------|-----------------|
| 1 | Abstract | After Declaration, Before TOC | 250 |
| 2 | System Architecture | Beginning of Section 3, before 3.1 | 850 |
| 3 | Database Design | After System Architecture 3.5, before 3.2 | 700 |
| 4 | Matching Algorithm | After existing Algorithm 3.3.3 | 500 |
| 5 | Feature Implementation | After Section 3.3.4, as 3.3.6+ | 900 |
| 6 | User Interface Features | After Section 3.1.4, as 3.1.5 | 800 |
| 7 | Testing Methodology | Beginning of Section 4, as 4.1 | 600 |
| 8 | Project Management | Before Section 6, as Section 5 | 650 |
| 9 | Conclusion Enhancement | Append to Section 6.1 | 300 |
| 10 | Additional References | Append to References [15]-[30] | - |
| | | **TOTAL** | **~5,550 words** |
