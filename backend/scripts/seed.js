const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('../models/User');
const Project = require('../models/Project');
const CollaborationRequest = require('../models/CollaborationRequest');
const Bookmark = require('../models/Bookmark');

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://harshmaghnani220_db_user:WwIfgoxbr7OKH329@testing.n4eus3t.mongodb.net/?appName=testing';

const seedData = async () => {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Clear existing data
    await User.deleteMany({});
    await Project.deleteMany({});
    await CollaborationRequest.deleteMany({});
    await Bookmark.deleteMany({});

    // Create users
    const students = [];
    const mentors = [];
    const investors = [];

    // Create 12+ students
    const studentData = [
      {
        email: 'student1@engiverse.com',
        password: 'password123',
        name: 'Alice Johnson',
        bio: 'Passionate full-stack developer interested in AI/ML projects. Love building scalable applications.',
        college: 'MIT',
        skills: ['React', 'Node.js', 'Python', 'MongoDB', 'TensorFlow']
      },
      {
        email: 'student2@engiverse.com',
        password: 'password123',
        name: 'Bob Smith',
        bio: 'Mobile app developer with experience in React Native and Flutter. Focused on user experience.',
        college: 'Stanford University',
        skills: ['React Native', 'Firebase', 'JavaScript', 'Flutter']
      },
      {
        email: 'student3@engiverse.com',
        password: 'password123',
        name: 'Charlie Brown',
        bio: 'Blockchain enthusiast and smart contract developer. Building decentralized applications.',
        college: 'UC Berkeley',
        skills: ['Solidity', 'Web3.js', 'Ethereum', 'IPFS']
      },
      {
        email: 'student4@engiverse.com',
        password: 'password123',
        name: 'Diana Prince',
        bio: 'Cybersecurity specialist with expertise in penetration testing and secure coding practices.',
        college: 'Carnegie Mellon',
        skills: ['Python', 'Kali Linux', 'OWASP', 'Cryptography']
      },
      {
        email: 'student5@engiverse.com',
        password: 'password123',
        name: 'Ethan Hunt',
        bio: 'Data scientist passionate about machine learning and big data analytics.',
        college: 'Harvard University',
        skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Data Visualization']
      },
      {
        email: 'student6@engiverse.com',
        password: 'password123',
        name: 'Fiona Green',
        bio: 'Frontend developer specializing in modern UI/UX design and React ecosystem.',
        college: 'Yale University',
        skills: ['React', 'TypeScript', 'CSS', 'Figma', 'Next.js']
      },
      {
        email: 'student7@engiverse.com',
        password: 'password123',
        name: 'George White',
        bio: 'Backend engineer with expertise in microservices and cloud infrastructure.',
        college: 'Princeton University',
        skills: ['Java', 'Spring Boot', 'Docker', 'Kubernetes', 'AWS']
      },
      {
        email: 'student8@engiverse.com',
        password: 'password123',
        name: 'Hannah Black',
        bio: 'Game developer passionate about creating immersive gaming experiences.',
        college: 'USC',
        skills: ['Unity', 'C#', 'Game Design', '3D Modeling', 'VR/AR']
      },
      {
        email: 'student9@engiverse.com',
        password: 'password123',
        name: 'Ian Gray',
        bio: 'DevOps engineer focused on CI/CD pipelines and infrastructure automation.',
        college: 'Georgia Tech',
        skills: ['Jenkins', 'GitLab CI', 'Terraform', 'Ansible', 'Linux']
      },
      {
        email: 'student10@engiverse.com',
        password: 'password123',
        name: 'Julia Blue',
        bio: 'Full-stack developer with passion for building scalable web applications.',
        college: 'UT Austin',
        skills: ['Vue.js', 'Laravel', 'MySQL', 'Redis', 'Nginx']
      },
      {
        email: 'student11@engiverse.com',
        password: 'password123',
        name: 'Kevin Red',
        bio: 'Mobile developer specializing in iOS and Android app development.',
        college: 'UC San Diego',
        skills: ['Swift', 'Kotlin', 'Flutter', 'Firebase', 'REST APIs']
      },
      {
        email: 'student12@engiverse.com',
        password: 'password123',
        name: 'Luna Silver',
        bio: 'AI researcher working on computer vision and natural language processing.',
        college: 'Caltech',
        skills: ['PyTorch', 'OpenCV', 'NLP', 'Transformers', 'TensorFlow']
      }
    ];

    for (const data of studentData) {
      const student = new User({
        email: data.email,
        password: data.password,
        role: 'Student',
        emailVerified: true,
        profile: {
          name: data.name,
          bio: data.bio,
          college: data.college,
          skills: data.skills,
          completed: true
        }
      });
      await student.save();
      students.push(student);
    }

    // Create 12+ mentors
    const mentorData = [
      {
        email: 'mentor1@engiverse.com',
        password: 'password123',
        name: 'Dr. Sarah Chen',
        bio: 'Senior Software Architect with 15+ years of experience in cloud computing and distributed systems.',
        company: 'Tech Corp',
        skills: ['System Design', 'Cloud Architecture', 'DevOps', 'AWS', 'Kubernetes']
      },
      {
        email: 'mentor2@engiverse.com',
        password: 'password123',
        name: 'Prof. James Wilson',
        bio: 'AI/ML researcher and professor. Expert in deep learning and neural networks.',
        company: 'AI Research Labs',
        skills: ['Deep Learning', 'Neural Networks', 'PyTorch', 'Computer Vision']
      },
      {
        email: 'mentor3@engiverse.com',
        password: 'password123',
        name: 'Lisa Anderson',
        bio: 'Full-stack development mentor with expertise in modern web technologies and best practices.',
        company: 'Web Solutions Inc',
        skills: ['React', 'Vue.js', 'Node.js', 'TypeScript', 'GraphQL']
      },
      {
        email: 'mentor4@engiverse.com',
        password: 'password123',
        name: 'Dr. Mark Thompson',
        bio: 'Senior Data Engineer with 12+ years in big data and analytics platforms.',
        company: 'Data Systems Corp',
        skills: ['Hadoop', 'Spark', 'Kafka', 'Airflow', 'Python']
      },
      {
        email: 'mentor5@engiverse.com',
        password: 'password123',
        name: 'Emily Davis',
        bio: 'Security expert specializing in application security and penetration testing.',
        company: 'SecureTech Solutions',
        skills: ['OWASP', 'Penetration Testing', 'Security Auditing', 'Cryptography']
      },
      {
        email: 'mentor6@engiverse.com',
        password: 'password123',
        name: 'Robert Lee',
        bio: 'Blockchain architect with extensive experience in DeFi and smart contracts.',
        company: 'Blockchain Innovations',
        skills: ['Solidity', 'Ethereum', 'DeFi', 'Smart Contracts', 'Web3']
      },
      {
        email: 'mentor7@engiverse.com',
        password: 'password123',
        name: 'Dr. Amanda Foster',
        bio: 'ML engineer and researcher focused on deep learning and neural networks.',
        company: 'AI Research Labs',
        skills: ['Deep Learning', 'Neural Networks', 'PyTorch', 'Computer Vision']
      },
      {
        email: 'mentor8@engiverse.com',
        password: 'password123',
        name: 'David Kim',
        bio: 'Mobile development lead with expertise in cross-platform frameworks.',
        company: 'Mobile First Inc',
        skills: ['React Native', 'Flutter', 'iOS', 'Android', 'Mobile Architecture']
      },
      {
        email: 'mentor9@engiverse.com',
        password: 'password123',
        name: 'Jennifer Brown',
        bio: 'Cloud architect specializing in AWS and multi-cloud deployments.',
        company: 'Cloud Solutions Group',
        skills: ['AWS', 'Azure', 'GCP', 'Terraform', 'Cloud Architecture']
      },
      {
        email: 'mentor10@engiverse.com',
        password: 'password123',
        name: 'Michael Zhang',
        bio: 'DevOps expert with focus on containerization and orchestration.',
        company: 'DevOps Pro',
        skills: ['Docker', 'Kubernetes', 'CI/CD', 'Monitoring', 'Infrastructure']
      },
      {
        email: 'mentor11@engiverse.com',
        password: 'password123',
        name: 'Sarah Williams',
        bio: 'UI/UX design mentor with expertise in design systems and user research.',
        company: 'Design Studio',
        skills: ['Figma', 'User Research', 'Design Systems', 'Prototyping']
      },
      {
        email: 'mentor12@engiverse.com',
        password: 'password123',
        name: 'Dr. Thomas Moore',
        bio: 'Database architect specializing in high-performance database systems.',
        company: 'Database Experts',
        skills: ['PostgreSQL', 'MongoDB', 'Redis', 'Database Design', 'Optimization']
      }
    ];

    for (const data of mentorData) {
      const mentor = new User({
        email: data.email,
        password: data.password,
        role: 'Mentor',
        emailVerified: true,
        profile: {
          name: data.name,
          bio: data.bio,
          company: data.company,
          skills: data.skills,
          completed: true
        }
      });
      await mentor.save();
      mentors.push(mentor);
    }

    // Create 12+ investors
    const investorData = [
      {
        email: 'investor1@engiverse.com',
        password: 'password123',
        name: 'Michael Roberts',
        bio: 'Angel investor focused on tech startups. Looking for innovative projects with strong potential.',
        company: 'Venture Capital Partners'
      },
      {
        email: 'investor2@engiverse.com',
        password: 'password123',
        name: 'Sophia Martinez',
        bio: 'Early-stage investor specializing in AI and blockchain technologies.',
        company: 'Tech Ventures LLC'
      },
      {
        email: 'investor3@engiverse.com',
        password: 'password123',
        name: 'Robert Taylor',
        bio: 'Venture capitalist focused on SaaS and enterprise software solutions.',
        company: 'Enterprise Ventures'
      },
      {
        email: 'investor4@engiverse.com',
        password: 'password123',
        name: 'Emma Wilson',
        bio: 'Angel investor with interest in fintech and payment solutions.',
        company: 'Fintech Capital'
      },
      {
        email: 'investor5@engiverse.com',
        password: 'password123',
        name: 'Daniel Garcia',
        bio: 'Investor specializing in healthcare technology and medical devices.',
        company: 'HealthTech Investments'
      },
      {
        email: 'investor6@engiverse.com',
        password: 'password123',
        name: 'Olivia Brown',
        bio: 'Early-stage investor focused on edtech and learning platforms.',
        company: 'EduVentures'
      },
      {
        email: 'investor7@engiverse.com',
        password: 'password123',
        name: 'James Miller',
        bio: 'Venture partner interested in cybersecurity and data protection.',
        company: 'Security Capital'
      },
      {
        email: 'investor8@engiverse.com',
        password: 'password123',
        name: 'Isabella Davis',
        bio: 'Investor with focus on e-commerce and marketplace platforms.',
        company: 'Commerce Ventures'
      },
      {
        email: 'investor9@engiverse.com',
        password: 'password123',
        name: 'William Johnson',
        bio: 'Angel investor specializing in mobile apps and consumer technology.',
        company: 'Mobile Ventures'
      },
      {
        email: 'investor10@engiverse.com',
        password: 'password123',
        name: 'Ava Martinez',
        bio: 'Investor focused on sustainability and green technology solutions.',
        company: 'GreenTech Capital'
      },
      {
        email: 'investor11@engiverse.com',
        password: 'password123',
        name: 'Christopher Lee',
        bio: 'Venture capitalist interested in IoT and smart device innovations.',
        company: 'IoT Ventures'
      },
      {
        email: 'investor12@engiverse.com',
        password: 'password123',
        name: 'Mia Anderson',
        bio: 'Early-stage investor with focus on social impact and nonprofit tech.',
        company: 'Impact Ventures'
      }
    ];

    for (const data of investorData) {
      const investor = new User({
        email: data.email,
        password: data.password,
        role: 'Investor',
        emailVerified: true,
        profile: {
          name: data.name,
          bio: data.bio,
          company: data.company,
          completed: true
        }
      });
      await investor.save();
      investors.push(investor);
    }

    // Create admin
    const admin1 = new User({
      email: 'admin@engiverse.com',
      password: 'password123',
      role: 'Admin',
      emailVerified: true,
      profile: {
        name: 'Admin User',
        bio: 'Platform Administrator',
        company: 'ENGIVERSE',
        completed: true
      }
    });
    await admin1.save();

    console.log('Users created');

    // Create 12+ projects
    const projectsData = [
      {
        title: 'AI-Powered Learning Platform',
        description: 'An intelligent learning platform that adapts to individual student needs using machine learning algorithms. Features include personalized content recommendations, progress tracking, interactive assessments, and adaptive difficulty adjustment. The platform uses NLP to analyze student responses and provide targeted feedback.',
        domain: 'AI/ML',
        techStack: ['React', 'Node.js', 'Python', 'TensorFlow', 'MongoDB', 'OpenAI API'],
        difficulty: 'Advanced',
        status: 'Adopted',
        owner: students[0]._id,
        collaborators: [
          { user: students[1]._id, role: 'Frontend Developer' },
          { user: students[4]._id, role: 'ML Engineer' }
        ],
        mentor: mentors[1]._id,
        progressTimeline: [
          { update: 'Project initialized and team assembled', addedBy: students[0]._id },
          { update: 'Completed initial research and architecture design', addedBy: students[0]._id },
          { update: 'Implemented core ML models for recommendation engine', addedBy: students[4]._id },
          { update: 'Built frontend dashboard with React', addedBy: students[1]._id },
          { update: 'Integrated OpenAI API for content generation', addedBy: students[0]._id }
        ],
        healthScore: 85
      },
      {
        title: 'Blockchain Voting System',
        description: 'A secure and transparent voting system built on blockchain technology. Ensures voter anonymity while maintaining auditability. Features include voter registration, ballot casting, real-time results, and immutable vote records. Uses smart contracts for vote validation and counting.',
        domain: 'Blockchain',
        techStack: ['Solidity', 'Web3.js', 'React', 'Ethereum', 'IPFS'],
        difficulty: 'Advanced',
        status: 'Open',
        owner: students[2]._id,
        progressTimeline: [
          { update: 'Project concept finalized', addedBy: students[2]._id },
          { update: 'Smart contract architecture designed', addedBy: students[2]._id }
        ],
        healthScore: 45
      },
      {
        title: 'IoT Smart Home Controller',
        description: 'Centralized control system for smart home devices with voice commands and mobile app integration. Supports multiple protocols including Zigbee, Z-Wave, and Wi-Fi. Features include scheduling, automation rules, energy monitoring, and remote access.',
        domain: 'IoT',
        techStack: ['Arduino', 'React Native', 'MQTT', 'Node.js', 'Raspberry Pi'],
        difficulty: 'Intermediate',
        status: 'Open',
        owner: students[0]._id,
        healthScore: 30
      },
      {
        title: 'E-Commerce Platform',
        description: 'Full-featured e-commerce platform with payment integration, inventory management, and analytics dashboard. Includes features like product catalog, shopping cart, order management, customer reviews, and admin panel. Supports multiple payment gateways.',
        domain: 'Web Development',
        techStack: ['React', 'Express', 'PostgreSQL', 'Stripe API', 'Redis'],
        difficulty: 'Intermediate',
        status: 'Completed',
        owner: students[0]._id,
        mentor: mentors[2]._id,
        progressTimeline: [
          { update: 'Project completed successfully', addedBy: students[0]._id }
        ],
        healthScore: 100
      },
      {
        title: 'Cybersecurity Threat Detection System',
        description: 'AI-powered threat detection system that monitors network traffic and identifies potential security threats in real-time. Uses machine learning to detect anomalies, malware, and intrusion attempts. Features include automated alerts, threat analysis, and incident response.',
        domain: 'Cybersecurity',
        techStack: ['Python', 'TensorFlow', 'Elasticsearch', 'Kibana', 'Docker'],
        difficulty: 'Advanced',
        status: 'Adopted',
        owner: students[3]._id,
        mentor: mentors[0]._id,
        progressTimeline: [
          { update: 'System architecture designed', addedBy: students[3]._id },
          { update: 'ML models trained on threat datasets', addedBy: students[3]._id },
          { update: 'Real-time monitoring system implemented', addedBy: students[3]._id }
        ],
        healthScore: 70
      },
      {
        title: 'Social Media Analytics Dashboard',
        description: 'Comprehensive analytics dashboard for social media platforms. Tracks engagement metrics, sentiment analysis, audience demographics, and content performance. Provides insights and recommendations for content optimization.',
        domain: 'Data Science',
        techStack: ['Python', 'React', 'D3.js', 'Twitter API', 'MongoDB'],
        difficulty: 'Intermediate',
        status: 'Open',
        owner: students[4]._id,
        healthScore: 40
      },
      {
        title: 'Decentralized File Storage',
        description: 'Peer-to-peer file storage system using blockchain and IPFS. Ensures data integrity, redundancy, and censorship resistance. Features include file encryption, access control, and distributed storage across network nodes.',
        domain: 'Blockchain',
        techStack: ['Solidity', 'IPFS', 'React', 'Web3.js', 'Node.js'],
        difficulty: 'Advanced',
        status: 'Adopted',
        owner: students[2]._id,
        collaborators: [
          { user: students[0]._id, role: 'Backend Developer' }
        ],
        progressTimeline: [
          { update: 'IPFS integration completed', addedBy: students[2]._id },
          { update: 'Smart contracts deployed', addedBy: students[2]._id }
        ],
        healthScore: 60
      },
      {
        title: 'Fitness Tracking Mobile App',
        description: 'Comprehensive fitness tracking app with workout plans, nutrition tracking, and progress monitoring. Features include step counting, calorie tracking, workout videos, social sharing, and personalized recommendations.',
        domain: 'Mobile App',
        techStack: ['React Native', 'Firebase', 'Chart.js', 'Health APIs'],
        difficulty: 'Intermediate',
        status: 'Open',
        owner: students[1]._id,
        healthScore: 35
      },
      {
        title: 'Automated Code Review System',
        description: 'AI-powered code review system that analyzes code quality, security vulnerabilities, and best practices. Provides automated suggestions, code metrics, and integration with CI/CD pipelines.',
        domain: 'AI/ML',
        techStack: ['Python', 'Machine Learning', 'GitHub API', 'Docker', 'FastAPI'],
        difficulty: 'Advanced',
        status: 'Adopted',
        owner: students[4]._id,
        mentor: mentors[1]._id,
        collaborators: [
          { user: students[0]._id, role: 'ML Engineer' }
        ],
        progressTimeline: [
          { update: 'ML model training completed', addedBy: students[4]._id },
          { update: 'API endpoints developed', addedBy: students[0]._id }
        ],
        healthScore: 75
      },
      {
        title: 'Real Estate Management Platform',
        description: 'Complete real estate management platform for property listings, tenant management, and financial tracking. Features include property search, virtual tours, lease management, payment processing, and reporting.',
        domain: 'Web Development',
        techStack: ['React', 'Node.js', 'PostgreSQL', 'Stripe', 'AWS'],
        difficulty: 'Intermediate',
        status: 'Open',
        owner: students[1]._id,
        healthScore: 50
      },
      {
        title: 'Cryptocurrency Trading Bot',
        description: 'Automated cryptocurrency trading bot with strategy backtesting and risk management. Features include multiple exchange support, technical analysis, portfolio management, and real-time trading execution.',
        domain: 'Blockchain',
        techStack: ['Python', 'Binance API', 'Pandas', 'NumPy', 'WebSocket'],
        difficulty: 'Advanced',
        status: 'Adopted',
        owner: students[2]._id,
        mentor: mentors[0]._id,
        progressTimeline: [
          { update: 'Trading strategies implemented', addedBy: students[2]._id },
          { update: 'Backtesting framework completed', addedBy: students[2]._id }
        ],
        healthScore: 65
      },
      {
        title: 'Healthcare Appointment System',
        description: 'Digital healthcare platform for scheduling appointments, managing patient records, and telemedicine consultations. Features include doctor availability, patient portal, prescription management, and video consultations.',
        domain: 'Web Development',
        techStack: ['React', 'Node.js', 'MongoDB', 'WebRTC', 'Stripe'],
        difficulty: 'Intermediate',
        status: 'Open',
        owner: students[3]._id,
        healthScore: 55
      },
      {
        title: 'Food Delivery Aggregator',
        description: 'Multi-restaurant food delivery platform with real-time tracking, order management, and payment processing. Features include restaurant listings, menu browsing, order tracking, ratings, and reviews.',
        domain: 'Mobile App',
        techStack: ['React Native', 'Node.js', 'MongoDB', 'Google Maps API', 'Stripe'],
        difficulty: 'Intermediate',
        status: 'Adopted',
        owner: students[1]._id,
        collaborators: [
          { user: students[0]._id, role: 'Backend Developer' }
        ],
        mentor: mentors[2]._id,
        progressTimeline: [
          { update: 'Restaurant API integrated', addedBy: students[1]._id },
          { update: 'Order tracking system implemented', addedBy: students[0]._id }
        ],
        healthScore: 80
      },
      {
        title: 'Virtual Reality Learning Environment',
        description: 'Immersive VR learning platform for educational content. Features include 3D environments, interactive simulations, progress tracking, and multiplayer support for collaborative learning.',
        domain: 'Other',
        techStack: ['Unity', 'C#', 'Oculus SDK', 'Node.js', 'WebSocket'],
        difficulty: 'Advanced',
        status: 'Open',
        owner: students[4]._id,
        healthScore: 25
      }
    ];

    const projects = [];
    for (const data of projectsData) {
      const project = new Project(data);
      await project.save();
      projects.push(project);
    }

    console.log(`Created ${projects.length} projects`);

    // Create 12+ collaboration requests
    const requests = [
      {
        project: projects[1]._id, // Blockchain Voting System
        requester: students[0]._id,
        message: 'I have experience with blockchain development and would love to contribute!',
        status: 'Pending'
      },
      {
        project: projects[5]._id, // Social Media Analytics
        requester: students[2]._id,
        message: 'Interested in data science and analytics. Can help with data processing.',
        status: 'Pending'
      },
      {
        project: projects[7]._id, // Fitness App
        requester: students[3]._id,
        message: 'Mobile development enthusiast. Would love to work on this project!',
        status: 'Accepted'
      },
      {
        project: projects[2]._id, // IoT Smart Home
        requester: students[4]._id,
        message: 'I have IoT experience and can help with hardware integration.',
        status: 'Pending'
      },
      {
        project: projects[3]._id, // E-Commerce Platform
        requester: students[5]._id,
        message: 'Frontend developer here! Can help improve the UI/UX.',
        status: 'Accepted'
      },
      {
        project: projects[6]._id, // Decentralized File Storage
        requester: students[7]._id,
        message: 'Backend engineer interested in distributed systems.',
        status: 'Pending'
      },
      {
        project: projects[8]._id, // Automated Code Review
        requester: students[6]._id,
        message: 'ML engineer with code analysis experience.',
        status: 'Pending'
      },
      {
        project: projects[9]._id, // Real Estate Platform
        requester: students[8]._id,
        message: 'Full-stack developer ready to contribute!',
        status: 'Pending'
      },
      {
        project: projects[10]._id, // Crypto Trading Bot
        requester: students[9]._id,
        message: 'Python developer with trading algorithm experience.',
        status: 'Accepted'
      },
      {
        project: projects[11]._id, // Healthcare System
        requester: students[10]._id,
        message: 'Mobile developer interested in healthcare tech.',
        status: 'Pending'
      },
      {
        project: projects[12]._id, // Food Delivery
        requester: students[11]._id,
        message: 'AI researcher can help with recommendation systems.',
        status: 'Pending'
      },
      {
        project: projects[13]._id, // VR Learning
        requester: students[0]._id,
        message: 'VR developer with Unity experience.',
        status: 'Rejected'
      },
      {
        project: projects[0]._id, // AI Learning Platform
        requester: students[2]._id,
        message: 'Data scientist interested in educational AI.',
        status: 'Pending'
      }
    ];

    for (const reqData of requests) {
      const request = new CollaborationRequest(reqData);
      await request.save();
    }

    // Create 12+ bookmarks
    const bookmarks = [
      {
        investor: investors[0]._id,
        project: projects[0]._id, // AI Learning Platform
        notes: 'High potential AI project with strong team'
      },
      {
        investor: investors[0]._id,
        project: projects[4]._id, // Cybersecurity System
        notes: 'Promising security solution'
      },
      {
        investor: investors[1]._id,
        project: projects[1]._id, // Blockchain Voting
        notes: 'Innovative blockchain application'
      },
      {
        investor: investors[1]._id,
        project: projects[10]._id, // Crypto Trading Bot
        notes: 'Interesting fintech project'
      },
      {
        investor: investors[2]._id,
        project: projects[3]._id, // E-Commerce Platform
        notes: 'Scalable SaaS solution'
      },
      {
        investor: investors[3]._id,
        project: projects[11]._id, // Healthcare System
        notes: 'Healthcare tech with good market potential'
      },
      {
        investor: investors[4]._id,
        project: projects[0]._id, // AI Learning Platform
        notes: 'Edtech with AI - high growth potential'
      },
      {
        investor: investors[5]._id,
        project: projects[4]._id, // Cybersecurity System
        notes: 'Critical security solution needed'
      },
      {
        investor: investors[6]._id,
        project: projects[12]._id, // Food Delivery
        notes: 'Marketplace platform with good traction'
      },
      {
        investor: investors[7]._id,
        project: projects[7]._id, // Fitness App
        notes: 'Mobile app with strong user base potential'
      },
      {
        investor: investors[8]._id,
        project: projects[2]._id, // IoT Smart Home
        notes: 'Green tech IoT solution'
      },
      {
        investor: investors[9]._id,
        project: projects[2]._id, // IoT Smart Home
        notes: 'IoT innovation in smart devices'
      },
      {
        investor: investors[10]._id,
        project: projects[13]._id, // VR Learning
        notes: 'Immersive learning technology'
      },
      {
        investor: investors[11]._id,
        project: projects[0]._id, // AI Learning Platform
        notes: 'Social impact through education'
      }
    ];

    for (const bookmarkData of bookmarks) {
      const bookmark = new Bookmark(bookmarkData);
      await bookmark.save();
    }

    console.log('Seed data created successfully!');
    console.log('\n=== Test Accounts ===');
    console.log('Students:');
    studentData.forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.email} / password123`);
    });
    console.log('\nMentors:');
    mentorData.forEach((m, i) => {
      console.log(`  ${i + 1}. ${m.email} / password123`);
    });
    console.log('\nInvestors:');
    investorData.forEach((inv, i) => {
      console.log(`  ${i + 1}. ${inv.email} / password123`);
    });
    console.log('\nAdmin:');
    console.log('  admin@engiverse.com / password123');
    console.log(`\nTotal Projects Created: ${projects.length}`);
    console.log(`Total Users Created: ${students.length + mentors.length + investors.length + 1}`);

    process.exit(0);
  } catch (error) {
    console.error('Error seeding data:', error);
    process.exit(1);
  }
};

seedData();
