// 模擬數據庫 - 現在包含實際的 FYP 項目數據
const fypProjectsData = require('./fypProjectsData');

const mockData = {
    projects: fypProjectsData.map(project => ({
        ...project,
        popularity: Math.floor(Math.random() * 20) + 1 // 隨機設置受歡迎度
    })),
    
    students: [
        {
            id: "S001",
            name: "Chan Tai Man",
            email: "student001@hkmu.edu.hk",
            gpa: "3.45",
            major: "Computer Science",
            year: "Year 4",
            preferences: [11, 22, 25], // Cybersecurity Dashboard, FYP Matching System, Cybersecurity Awareness APP
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S002",
            name: "Wong Mei Ling",
            email: "student002@hkmu.edu.hk",
            gpa: "3.67",
            major: "Electronic Engineering",
            year: "Year 4",
            preferences: [31, 32, 33], // Smart Grid, Digital Twin, Anomaly Detection
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S003",
            name: "Li Wei",
            email: "student003@hkmu.edu.hk",
            gpa: "3.52",
            major: "Computer Science",
            year: "Year 4",
            preferences: [41, 42, 12], // Traffic Light Control, Light Adjustment, Social Engineering
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S004",
            name: "Zhang Xiaoyu",
            email: "student004@hkmu.edu.hk",
            gpa: "3.78",
            major: "Computer Science",
            year: "Year 4",
            preferences: [13, 14, 24], // Blockchain Voting, Mobile Security, Network Scanner
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S005",
            name: "Chen Jun",
            email: "student005@hkmu.edu.hk",
            gpa: "3.41",
            major: "Electronic Engineering",
            year: "Year 4",
            preferences: [34, 35, 31], // AI Chatbot Security, Healthcare Security, Smart Grid
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S006",
            name: "Lam Siu Ming",
            email: "student006@hkmu.edu.hk",
            gpa: "3.33",
            major: "Computer Science",
            year: "Year 4",
            preferences: [21, 23, 25], // Book Sharing, Packet Tracer Game, Cybersecurity APP
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S007",
            name: "Ng Wai Yee",
            email: "student007@hkmu.edu.hk",
            gpa: "3.69",
            major: "Electronic Engineering",
            year: "Year 4",
            preferences: [32, 33, 35], // Digital Twin, Anomaly Detection, Healthcare Security
            proposalSubmitted: false,
            assignedProject: null
        },
        {
            id: "S008",
            name: "Ho Chun Kit",
            email: "student008@hkmu.edu.hk",
            gpa: "3.55",
            major: "Computer Science",
            year: "Year 4",
            preferences: [11, 12, 22], // Cybersecurity Dashboard, Social Engineering, FYP System
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S009",
            name: "Tang Wai Man",
            email: "student009@hkmu.edu.hk",
            gpa: "3.62",
            major: "Electronic Engineering",
            year: "Year 4",
            preferences: [41, 31, 35], // Traffic Light Control, Smart Grid, Healthcare Security
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S010",
            name: "Yip Ka Ming",
            email: "student010@hkmu.edu.hk",
            gpa: "3.48",
            major: "Computer Science",
            year: "Year 4",
            preferences: [13, 25, 14], // Blockchain Voting, Cybersecurity APP, Mobile Security
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S011",
            name: "Fung Chi Wai",
            email: "student011@hkmu.edu.hk",
            gpa: "3.71",
            major: "Computer Science",
            year: "Year 4",
            preferences: [22, 21, 23], // FYP System, Book Sharing, Packet Tracer
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S012",
            name: "Leung Tsz Ching",
            email: "student012@hkmu.edu.hk",
            gpa: "3.39",
            major: "Electronic Engineering",
            year: "Year 4",
            preferences: [32, 34, 33], // Digital Twin, AI Chatbot, Anomaly Detection
            proposalSubmitted: false,
            assignedProject: null
        },
        {
            id: "S013",
            name: "Mak Ho Yin",
            email: "student013@hkmu.edu.hk",
            gpa: "3.58",
            major: "Computer Science",
            year: "Year 4",
            preferences: [24, 11, 12], // Network Scanner, Cybersecurity Dashboard, Social Engineering
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S014",
            name: "Chow Wing Sze",
            email: "student014@hkmu.edu.hk",
            gpa: "3.65",
            major: "Electronic Engineering",
            year: "Year 4",
            preferences: [35, 31, 32], // Healthcare Security, Smart Grid, Digital Twin
            proposalSubmitted: true,
            assignedProject: null
        },
        {
            id: "S015",
            name: "Wu Ka Ho",
            email: "student015@hkmu.edu.hk",
            gpa: "3.43",
            major: "Computer Science",
            year: "Year 4",
            preferences: [42, 41, 25], // Light Adjustment, Traffic Light, Cybersecurity APP
            proposalSubmitted: true,
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