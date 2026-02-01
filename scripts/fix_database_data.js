/**
 * 修復 MongoDB 中的項目數據
 * 從 PDF 數據中提取正確的項目並寫入數據庫
 */

require('dotenv').config();
const mongoose = require('mongoose');
const Project = require('../models/Project');

// 正確的項目數據（從 PDF 原始數據中提取的完整數據）
const correctProjects = [
  { code: "D11", title: "Cybersecurity Dashboard for Small Businesses", supervisor: "Alex", description: "This project involves creating an intuitive and user-friendly cybersecurity dashboard tailored for small businesses to monitor and improve their cybersecurity posture." },
  { code: "D12", title: "Social Engineering Awareness Tool", supervisor: "Alex", description: "This project focuses on building an interactive tool designed to educate users about social engineering attacks, such as phishing, baiting, pretexting, and tailgating." },
  { code: "D13", title: "Blockchain-Based Voting System", supervisor: "Alex", description: "This project aims to design and implement a blockchain-based voting system to ensure secure, transparent, and tamper-proof elections." },
  { code: "D14", title: "Mobile Application Security Testing Tool", supervisor: "Alex", description: "Build a tool to test the security of mobile applications. The tool will focus on identifying common vulnerabilities such as insecure data storage, weak encryption, improper API usage, and insecure communication protocols." },
  { code: "L11", title: "Smart Book Sharing Platform", supervisor: "Bell", description: "This project requires student to design an android app to build a book sharing platform. Show all available books, borrow books, donate books." },
  { code: "L12", title: "FYP Matching System for Students and Teachers", supervisor: "Bell", description: "This project requires student to build an automatic fyp matching system for students and teachers. The system should support different types of users such as teachers, students, and admin." },
  { code: "L13", title: "Interactive Series-Game for Mastering Cisco Packet Tracer Commands", supervisor: "Bell", description: "This project is to help course ELEC S315F Routing and Switching Technologies to design a series of games based on Cisco Packet Tracer." },
  { code: "L14", title: "Advanced Network Scanner Using Nmap", supervisor: "Bell", description: "The advanced network scanner will utilize the Nmap scripting engine. The scanner will utilize custom or pre-existing Nmap scripts to automate complex tasks and gather detailed information about networked devices and services." },
  { code: "L15", title: "Cybersecurity Awareness APP", supervisor: "Bell", description: "The cybersecurity awareness app can help users stay safe from identity theft, phishing, cyberbullying, and privacy violations. It is an engaging platform for cybersecurity awareness training." },
  { code: "F11", title: "Malware Detection Tool for Python Package / IDE plug-in", supervisor: "Farah", description: "(HKT project) Develop a tool that scans Python packages / IDE plug-in on PyPI for obfuscated code and known malware signatures." },
  { code: "F12", title: "EDR evasion", supervisor: "Farah", description: "(HKT project) Create a comprehensive study and toolkit that demonstrates various EDR evasion techniques." },
  { code: "F13", title: "C2 Traffic Analysis", supervisor: "Farah", description: "(HKT project) Study and build a simulation environment that mimics C2 communication protocols, develop a tool that analyzes endpoint process and/or network traffic to identify and classify C2 communications." },
  { code: "F14", title: "Comparative Study of Rootkit Detection Methods", supervisor: "Farah", description: "(HKT project) Build a simulation environment that mimics the behavior of different types of rootkits, conduct a comparative study of existing rootkit detection methods." },
  { code: "F15", title: "Car price tracking system", supervisor: "Farah", description: "The project is to track the car price and find a good deal. The functions of the system includes collecting car price information automatically from the Internet, filtering prices, alerting users, and plotting price trends." },
  { code: "H11", title: "Wi-Fi Deauthentication Attack Prevention System", supervisor: "Hugh", description: "This project develops a real-time system to detect and prevent WiFi deauthentication attacks, where attackers flood networks with deauth frames to disconnect users." },
  { code: "S11", title: "Developing penetration testing framework for property management infrastructure", supervisor: "Steven", description: "This is an industrial collaborative project with a property management company. Student is expected to create a testing framework that covers both IT and OT systems." },
  { code: "S12", title: "Developing privacy-preserving tenant behavior analytics platform", supervisor: "Steven", description: "This is an industrial collaborative project with a property management company. Property managers want to understand tenant behaviour to improve services and detect security threats without compromising individual privacy." },
  { code: "S13", title: "Promoting cybersecurity education to the public to raise the awareness on protecting digital assets", supervisor: "Steven", description: "Online scams are very common in today's internet. Student is expected to review on the existing promotion on cybersecurity and state the possible solutions for solving this problem." },
  { code: "S14", title: "Analyzing the pattern and frequency of online scams to raise the awareness on protecting digital assets", supervisor: "Steven", description: "Online scams are very common in today's internet. Student is expected to review on the existing literature and figures related to cybersecurity and suggest some possible hidden patterns of online scams." },
  { code: "S15", title: "Analyzing the impact of network and link blockages on message transmission in complex networks", supervisor: "Steven", description: "Understanding the effect on link blockage in transmitting messages can be important in the digital world as the retransmission can be costly and time-consuming. We can simulate the network to understand how it affects the whole system." },
  { code: "S16", title: "Analyzing the impact of virus spread from infected computers in complex networks", supervisor: "Steven", description: "The virus spread between computers can be a disaster. To understand how it spreads, we can simulate the virus in complex networks." },
  { code: "T11", title: "Security Monitoring System for Real-World Asset Transactions on the Blockchain", supervisor: "Tabitha", description: "This capstone project addresses the critical need for proactive security in the rapidly evolving domain of tokenized Real-World Assets (RWA)." },
  { code: "T12", title: "Blockchain-enabled Trustworthy Digital Twin Management System", supervisor: "Tabitha", description: "This project designs and implements a blockchain-based management system to ensure trustworthiness and security in digital twin operations." },
  { code: "A11", title: "Cyberattack Impact on Smart Grid Control", supervisor: "Adam", description: "Simulate a simplified smart power grid control system (frequency control or dispatch control) and investigate how cyberattacks (such as false data or delayed signals) can cause incorrect operational decisions." },
  { code: "A12", title: "Cybersecurity Monitoring for a Smart Factory Digital Twin", supervisor: "Adam", description: "Build a simple digital twin simulation of a smart manufacturing process and apply an open-source Intrusion Detection System (IDS) to detect abnormal network commands caused by cyberattacks." },
  { code: "A13", title: "Anomaly Detection in Industrial Control System Data", supervisor: "Adam", description: "Create a simple Python program that simulates industrial control system data (temperature, motor speed, etc.), inject anomalies (attacks or faults), and use basic machine learning to detect these irregular patterns." },
  { code: "A14", title: "Security Evaluation of AI-Powered Industrial Chatbots", supervisor: "Adam", description: "Develop a Python-based LLM chatbot assistant for industrial operations and test how it can be tricked into giving unsafe or confidential answers. Then implement a basic safeguard to block malicious queries." },
  { code: "A15", title: "Cybersecurity Risk Demonstration for a Smart Healthcare Monitoring System", supervisor: "Adam", description: "Simulate a basic smart healthcare IoT monitoring system and study how cyberattacks, such as data tampering or eavesdropping, could compromise patient safety. Implement a simple security enhancement." },
  { code: "Y11", title: "Deep Reinforcement Learning-Based Intelligent Traffic Light Control System", supervisor: "Yaru", description: "Deep Reinforcement Learning (DRL) technology revolutionizes traffic scenarios by offering intelligent solutions for optimizing traffic flow, reducing congestion, and enhancing safety on the roads." },
  { code: "Y12", title: "Reinforcement Learning-Based Intelligent Light Adjustment Design", supervisor: "Yaru", description: "With the development of smart home technology, this project aims to design and implement an intelligent lighting adjustment system based on Reinforcement Learning (RL)." }
];

async function fixDatabase() {
  const uri = process.env.MONGO_URI || 'mongodb://localhost:27017/fyp-matching';
  
  console.log('🔌 連接到 MongoDB...');
  await mongoose.connect(uri);
  console.log('✅ 已連接 MongoDB');

  console.log('\n📋 步驟 1: 先刪除所有現有項目...');
  const deleteAllResult = await Project.deleteMany({}).exec();
  console.log(`  🗑️  已刪除 ${deleteAllResult.deletedCount} 個項目`);

  console.log(`\n📋 步驟 2: 插入 ${correctProjects.length} 個正確項目...`);
  const results = { inserted: 0, errors: 0 };

  for (const p of correctProjects) {
    try {
      const projectData = new Project({
        code: p.code,
        title: p.title,
        supervisor: p.supervisor,
        description: p.description,
        skills: [],
        popularity: 0,
        capacity: 2,
        status: 'active',
        createdAt: new Date(),
        department: 'CCS',
        category: null
      });

      await projectData.save();
      results.inserted++;
      console.log(`  ✅ [${p.code}] ${p.title.substring(0, 40)}...`);
    } catch (err) {
      results.errors++;
      console.error(`  ❌ 錯誤 [${p.code}]: ${err.message}`);
    }
  }

  console.log('\n========================================');
  console.log('📊 修復完成！');
  console.log(`   成功插入: ${results.inserted}`);
  console.log(`   錯誤: ${results.errors}`);
  console.log('========================================\n');

  // 顯示數據庫中的所有項目
  console.log('📋 數據庫中的項目列表:');
  const allProjects = await Project.find({}).lean().exec();
  console.log(`   共 ${allProjects.length} 個項目\n`);
  allProjects.forEach(p => {
    console.log(`   [${p.code}] ${p.title.substring(0, 50)}...`);
  });

  await mongoose.disconnect();
  console.log('\n👋 已斷開 MongoDB 連接');
}

fixDatabase().catch(err => {
  console.error('❌ 致命錯誤:', err);
  process.exit(1);
});
