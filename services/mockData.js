// 模擬數據庫
const mockData = {
    projects: [
        {
            id: 1,
            title: "AI-based Learning System",
            supervisor: "Dr. Bell Liu",
            supervisorId: "T001",
            description: "Develop an intelligent learning platform that adapts to student learning patterns using machine learning algorithms.",
            skills: ["Python", "Machine Learning", "Web Development"],
            popularity: 15,
            capacity: 3,
            status: "active",
            createdAt: "2025-01-15"
        },
        {
            id: 2,
            title: "IoT Smart Campus",
            supervisor: "Prof. Zhang Wei", 
            supervisorId: "T002",
            description: "Build an IoT system to monitor and optimize campus resource usage including energy, water, and space utilization.",
            skills: ["IoT", "Embedded Systems", "Python"],
            popularity: 8,
            capacity: 2,
            status: "active",
            createdAt: "2025-01-10"
        },
        {
            id: 3,
            title: "Blockchain Security Analysis",
            supervisor: "Dr. Sarah Chen",
            supervisorId: "T003", 
            description: "Analyze security vulnerabilities in blockchain systems and develop improved security protocols.",
            skills: ["Blockchain", "Cryptography", "Security"],
            popularity: 12,
            capacity: 2,
            status: "active",
            createdAt: "2025-01-12"
        },
        {
            id: 4,
            title: "Mobile Health App",
            supervisor: "Prof. David Wong",
            supervisorId: "T004",
            description: "Create a mobile application for health monitoring and personalized fitness recommendations.",
            skills: ["Mobile Development", "Healthcare", "Data Analysis"],
            popularity: 6,
            capacity: 3,
            status: "active",
            createdAt: "2025-01-08"
        },
        {
            id: 5,
            title: "Data Visualization Platform", 
            supervisor: "Dr. Emily Zhao",
            supervisorId: "T005",
            description: "Develop an interactive platform for visualizing complex datasets with real-time analytics.",
            skills: ["Data Visualization", "JavaScript", "D3.js"],
            popularity: 9,
            capacity: 2,
            status: "active",
            createdAt: "2025-01-05"
        }
    ],
    
    students: [
        {
            id: "S001",
            name: "Chan Tai Man",
            email: "student@hkmu.edu.hk",
            gpa: "3.45",
            major: "Computer Science",
            year: "Year 4",
            preferences: [], // 項目ID數組，按偏好順序
            proposalSubmitted: false,
            assignedProject: null
        }
    ],
    
    preferences: [
        // 格式: { studentId, projectId, rank, submittedAt }
    ],
    
    system: {
        currentPhase: "preference", // proposal, preference, matching, results
        deadlines: {
            proposal: "2025-03-20T23:59:00",
            preference: "2025-04-15T22:59:00", 
            results: "2025-05-30T23:59:00"
        }
    }
};

module.exports = mockData;