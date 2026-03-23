// 模擬數據庫
// 注意：這個文件作為 fallback，當 MongoDB 未連接時使用
// 建議：將數據逐步遷移到 MongoDB，並使用 MongoDB 作為主要數據源

const mockData = {
    projects: [
        {
            id: 1,
            title: "AI-based Learning System",
            supervisor: "Dr. Bell Liu",
            supervisorId: "T001",
            supervisorEmail: "teacher@hkmu.edu.hk",
            description: "Develop an intelligent learning platform that adapts to student learning patterns using machine learning algorithms.",
            skills: ["Python", "Machine Learning", "Web Development"],
            popularity: 15,
            capacity: 3,
            status: "active",
            type: "teacher",
            category: "AI/ML",
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
            type: "teacher",
            category: "IoT",
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
            type: "teacher",
            category: "Security",
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
            type: "teacher",
            category: "Mobile App",
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
            type: "teacher",
            category: "Web Development",
            createdAt: "2025-01-05"
        },
        // Student-proposed projects (for future use, currently hidden from students)
        {
            id: 101,
            title: "Student Research Project 1",
            description: "A student-proposed project",
            skills: ["Research"],
            popularity: 0,
            capacity: 1,
            status: "active",
            type: "student",           // student-proposed project
            proposalStatus: "pending",
            proposedBy: "S001",
            createdAt: "2025-02-01"
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
            proposal: "2025-03-20T23:59:00",
            preference: "2025-04-15T22:59:00", 
            results: "2025-05-30T23:59:00"
        }
    ,
    matchingCompleted: false
    }
};

module.exports = mockData;