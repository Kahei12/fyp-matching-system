/**
 * In-memory catalogue — ONLY used as MongoDB fallback when DB is unavailable.
 *
 * ⚠️  WARNING: supervisor / supervisorId / supervisorEmail fields below are IGNORED.
 *             All 30 teacher-proposed projects (id 1–30) are mapped in
 *             services/projectCatalogSync.js → TEACHER_BY_PROJECT_ID.
 *             applySupervisorsToMockProjects() runs at the BOTTOM of this file
 *             and REPLACES those three fields before anything else reads them.
 *             The ONLY field this file controls is "major" (CCS/ECE).
 *
 * 30 projects: id 1–15 = CCS, id 16–30 = ECE.
 * Id 101 = student-proposed (type: 'student', skipped by catalog sync).
 */

const mockData = {
    projects: [
        // ── CCS Projects (1–15) ─────────────────────────────────────────────────
        { id: 1,  title: "AI-based Learning System",                         major: "CCS", category: "AI/ML",      status: "active", type: "teacher", popularity: 15, capacity: 3, skills: ["Python","Machine Learning","Web Development"],       description: "Develop an intelligent learning platform that adapts to student learning patterns using machine learning algorithms.",       createdAt: "2025-01-15" },
        { id: 2,  title: "Cybersecurity Awareness Training Platform",        major: "CCS", category: "Security",   status: "active", type: "teacher", popularity: 9,  capacity: 2, skills: ["Web Development","Cybersecurity","JavaScript"],          description: "Build an interactive web-based platform to train employees on cybersecurity threats, phishing awareness, and best practices.",      createdAt: "2025-01-10" },
        { id: 3,  title: "Machine Learning for Malware Detection",           major: "CCS", category: "Security",   status: "active", type: "teacher", popularity: 12, capacity: 2, skills: ["Python","Machine Learning","Cybersecurity"],             description: "Train and evaluate ML models to detect and classify malware executables based on static and dynamic features.",              createdAt: "2025-01-12" },
        { id: 4,  title: "Secure Mobile Banking Application",                 major: "CCS", category: "Mobile App",  status: "active", type: "teacher", popularity: 11, capacity: 3, skills: ["Mobile Development","Cybersecurity","Java"],              description: "Design and implement a secure mobile banking app with biometric authentication, end-to-end encryption, and fraud detection.",     createdAt: "2025-01-08" },
        { id: 5,  title: "Cloud Security Compliance Checker",                major: "CCS", category: "Cloud",      status: "active", type: "teacher", popularity: 7,  capacity: 2, skills: ["Cloud Computing","Cybersecurity","Python"],               description: "Develop a tool that audits cloud infrastructure against security frameworks such as ISO 27001 and NIST, generating compliance reports.", createdAt: "2025-01-05" },
        { id: 6,  title: "Network Intrusion Detection System",                major: "CCS", category: "Security",   status: "active", type: "teacher", popularity: 10, capacity: 2, skills: ["Python","Cybersecurity","IoT"],                           description: "Build a real-time network intrusion detection system using signature-based and anomaly-based detection techniques.",              createdAt: "2025-01-18" },
        { id: 7,  title: "AI-powered Sentiment Analysis for Social Media",   major: "CCS", category: "AI/ML",      status: "active", type: "teacher", popularity: 13, capacity: 3, skills: ["Python","Machine Learning","Data Science"],               description: "Build an NLP pipeline to analyze sentiment on social media posts, with visualization dashboards and real-time alerts.",         createdAt: "2025-01-20" },
        { id: 8,  title: "E-commerce Recommendation Engine",                 major: "CCS", category: "AI/ML",      status: "active", type: "teacher", popularity: 8,  capacity: 2, skills: ["Python","Machine Learning","Web Development"],           description: "Design a collaborative-filtering and content-based recommendation engine for e-commerce, with A/B testing support.",            createdAt: "2025-01-22" },
        { id: 9,  title: "Blockchain-based Supply Chain Tracking System",     major: "CCS", category: "Blockchain", status: "active", type: "teacher", popularity: 6,  capacity: 2, skills: ["Blockchain","Python","Web Development"],                description: "Implement a permissioned blockchain solution to provide end-to-end transparency and traceability in supply chain logistics.",     createdAt: "2025-01-25" },
        { id: 10, title: "Digital Forensics Investigation Toolkit",           major: "CCS", category: "Security",   status: "active", type: "teacher", popularity: 7,  capacity: 2, skills: ["Cybersecurity","Python","C/C++"],                         description: "Create an integrated toolkit for digital forensics, covering disk imaging, log analysis, and evidence chain-of-custody documentation.", createdAt: "2025-01-28" },
        { id: 11, title: "Automated Penetration Testing Framework",           major: "CCS", category: "Security",   status: "active", type: "teacher", popularity: 9,  capacity: 2, skills: ["Cybersecurity","Python","IoT"],                           description: "Develop an automated framework that performs network scanning, vulnerability assessment, and exploit simulation.",               createdAt: "2025-02-01" },
        { id: 12, title: "Zero-Trust Architecture Implementation",            major: "CCS", category: "Security",   status: "active", type: "teacher", popularity: 5,  capacity: 2, skills: ["Cloud Computing","Cybersecurity","Python"],               description: "Design and deploy a zero-trust network model for an enterprise, covering identity verification, micro-segmentation, and least-privilege access.", createdAt: "2025-02-05" },
        { id: 13, title: "Phishing Email Detection using Deep Learning",       major: "CCS", category: "AI/ML",      status: "active", type: "teacher", popularity: 11, capacity: 2, skills: ["Python","Deep Learning","Cybersecurity"],                 description: "Train a deep neural network to classify emails as phishing or legitimate, with explainability features highlighting suspicious elements.", createdAt: "2025-02-08" },
        { id: 14, title: "Privacy-Preserving Data Aggregation System",        major: "CCS", category: "Security",   status: "active", type: "teacher", popularity: 6,  capacity: 2, skills: ["Python","Machine Learning","Blockchain"],               description: "Implement privacy-preserving aggregation techniques (e.g., differential privacy, secure multi-party computation) for sensitive datasets.", createdAt: "2025-02-10" },
        { id: 15, title: "Security Operations Center Dashboard",               major: "CCS", category: "Security",   status: "active", type: "teacher", popularity: 8,  capacity: 3, skills: ["Web Development","Cybersecurity","JavaScript"],          description: "Build a real-time SOC dashboard integrating SIEM data, alerting rules, and incident ticketing for security analysts.",          createdAt: "2025-02-12" },

        // ── ECE Projects (16–30) ──────────────────────────────────────────────
        { id: 16, title: "IoT-based Environmental Monitoring System",         major: "ECE", category: "IoT",               status: "active", type: "teacher", popularity: 14, capacity: 3, skills: ["IoT","Embedded Systems","Python"],                              description: "Deploy a sensor network to monitor air quality, temperature, and humidity across campus, with a real-time web dashboard.",         createdAt: "2025-01-16" },
        { id: 17, title: "Smart Campus Energy Management System",             major: "ECE", category: "IoT",               status: "active", type: "teacher", popularity: 10, capacity: 2, skills: ["IoT","Data Science","Python"],                                   description: "Design an IoT-driven energy management platform to monitor and optimize electricity usage across campus buildings.",             createdAt: "2025-01-11" },
        { id: 18, title: "Autonomous Delivery Robot",                         major: "ECE", category: "Robotics",           status: "active", type: "teacher", popularity: 12, capacity: 3, skills: ["IoT","Embedded Systems","Python"],                              description: "Develop a small indoor autonomous robot capable of delivering items on campus using SLAM-based navigation.",                    createdAt: "2025-01-14" },
        { id: 19, title: "Smart Home Automation System",                     major: "ECE", category: "IoT",               status: "active", type: "teacher", popularity: 13, capacity: 3, skills: ["IoT","Mobile Development","Embedded Systems"],                 description: "Build a smart home hub integrating lighting, climate control, and security cameras with voice control and mobile app support.",  createdAt: "2025-01-09" },
        { id: 20, title: "5G Network Coverage Optimization",                  major: "ECE", category: "Wireless",           status: "active", type: "teacher", popularity: 8,  capacity: 2, skills: ["IoT","Machine Learning","Python"],                              description: "Simulate and optimize 5G small-cell placement for campus-wide coverage using ray-tracing and machine learning prediction.",     createdAt: "2025-01-06" },
        { id: 21, title: "Industrial IoT Predictive Maintenance Platform",    major: "ECE", category: "IoT",               status: "active", type: "teacher", popularity: 9,  capacity: 2, skills: ["IoT","Machine Learning","Python"],                              description: "Create a platform that collects vibration and temperature data from industrial machinery to predict failures before they occur.", createdAt: "2025-01-19" },
        { id: 22, title: "Real-time Signal Processing for Audio Applications",major: "ECE", category: "Signal Processing", status: "active", type: "teacher", popularity: 7,  capacity: 2, skills: ["IoT","Embedded Systems","C/C++"],                              description: "Implement real-time DSP algorithms (filtering, FFT, noise cancellation) on embedded hardware for audio enhancement.",              createdAt: "2025-01-21" },
        { id: 23, title: "Smart Grid Load Balancing System",                 major: "ECE", category: "Power Systems",      status: "active", type: "teacher", popularity: 6,  capacity: 2, skills: ["IoT","Machine Learning","Python"],                              description: "Design an optimization algorithm for balancing loads across a simulated microgrid, with demand-response integration.",              createdAt: "2025-01-23" },
        { id: 24, title: "Wearable Health Monitoring Device",                 major: "ECE", category: "Healthcare",         status: "active", type: "teacher", popularity: 11, capacity: 3, skills: ["IoT","Embedded Systems","Mobile Development"],                description: "Develop a wearable device that tracks heart rate, SpO2, and temperature, transmitting data to a cloud dashboard in real time.", createdAt: "2025-01-26" },
        { id: 25, title: "FPGA-based Real-time Image Processing",             major: "ECE", category: "Signal Processing",  status: "active", type: "teacher", popularity: 5,  capacity: 2, skills: ["IoT","Embedded Systems","C/C++"],                              description: "Implement real-time image processing kernels (edge detection, feature extraction) on an FPGA development board.",                createdAt: "2025-01-29" },
        { id: 26, title: "Autonomous Navigation System for Drones",           major: "ECE", category: "Robotics",           status: "active", type: "teacher", popularity: 10, capacity: 3, skills: ["IoT","Machine Learning","Python"],                              description: "Develop a flight controller and navigation algorithm for a small quadcopter, including obstacle avoidance using computer vision.", createdAt: "2025-02-02" },
        { id: 27, title: "Wireless Sensor Network for Agriculture",           major: "ECE", category: "IoT",               status: "active", type: "teacher", popularity: 8,  capacity: 2, skills: ["IoT","Embedded Systems","Python"],                              description: "Deploy a low-power WSN in a greenhouse to monitor soil moisture, light, and temperature, with automated irrigation control.",   createdAt: "2025-02-04" },
        { id: 28, title: "Mixed-Signal IC Design for IoT Applications",       major: "ECE", category: "IC Design",         status: "active", type: "teacher", popularity: 4,  capacity: 2, skills: ["IoT","Embedded Systems","C/C++"],                              description: "Design and layout a mixed-signal IC integrating an analog front-end and digital signal processing core for IoT sensing.",        createdAt: "2025-02-06" },
        { id: 29, title: "Vehicle-to-Vehicle Communication System",           major: "ECE", category: "Wireless",           status: "active", type: "teacher", popularity: 7,  capacity: 2, skills: ["IoT","Machine Learning","Python"],                              description: "Simulate a V2V communication protocol for collision avoidance, including message authentication and latency analysis.",        createdAt: "2025-02-09" },
        { id: 30, title: "Smart Parking Management System",                   major: "ECE", category: "IoT",               status: "active", type: "teacher", popularity: 9,  capacity: 3, skills: ["IoT","Mobile Development","Python"],                              description: "Build an IoT-enabled parking system with ultrasonic/IR sensors, a mobile app for spot availability, and automatic fee calculation.", createdAt: "2025-02-11" },

        // ── Student-proposed project (type: 'student' — always skipped) ───────
        { id: 101, title: "Student Research Project 1",                       type: "student", proposalStatus: "pending", proposedBy: "S001", skills: ["Research"], popularity: 0, capacity: 1, status: "active", description: "A student-proposed project", createdAt: "2025-02-01" },
    ],

    students: [
        {
            id: "s001",
            name: "Chan Tai Man",
            email: "s001@hkmu.edu.hk",
            gpa: "3.45",
            major: "Computer and Cyber Security",
            year: "Year 4",
            preferences: [],
            proposalSubmitted: false,
            assignedProject: null
        }
    ],

    preferences: [],

    assignments: [],

    system: {
        currentPhase: "preference",
        deadlines: {
            studentSelfProposal: "2025-03-20T23:59:00",
            preference: "2025-04-15T22:59:00",
            teacherProposalReview: "2025-04-15T23:59:00",
            teacherSelfProposal: "2025-05-30T23:59:00"
        },
        matchingCompleted: false
    }
};

// Apply supervisor mapping ONCE at require time — overrides any hardcoded values
const { applySupervisorsToMockProjects } = require('./projectCatalogSync');
mockData.projects = applySupervisorsToMockProjects(mockData.projects);

module.exports = mockData;
