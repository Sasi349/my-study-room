import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const categories = [
  "Frontend", "Backend", "Database", "DevOps", "Mobile",
  "Data Science", "Machine Learning", "Cloud Computing", "Cybersecurity", "UI/UX Design",
  "System Design", "DSA", "Operating Systems", "Networking", "Web3",
  "Game Development", "Testing", "API Design", "Microservices", "Performance",
];

const subjectsMap: Record<string, string[]> = {
  "Frontend": ["React", "Next.js", "Vue.js", "Angular", "Svelte", "Tailwind CSS", "TypeScript", "HTML/CSS", "Redux", "Webpack"],
  "Backend": ["Node.js", "Express.js", "NestJS", "Django", "Flask", "Spring Boot", "FastAPI", "Go Fiber", "Ruby on Rails", "Laravel"],
  "Database": ["PostgreSQL", "MongoDB", "MySQL", "Redis", "SQLite", "DynamoDB", "Cassandra", "Neo4j", "Supabase", "Prisma ORM"],
  "DevOps": ["Docker", "Kubernetes", "CI/CD", "Terraform", "Ansible", "AWS", "GitHub Actions", "Nginx", "Linux Admin", "Monitoring"],
  "Mobile": ["React Native", "Flutter", "Swift", "Kotlin", "Expo", "Ionic", "Capacitor", "App Store Deploy", "Push Notifications", "Offline Storage"],
  "Data Science": ["Python Basics", "Pandas", "NumPy", "Data Visualization", "Statistics", "Jupyter", "Data Cleaning", "EDA", "SQL for DS", "Storytelling"],
  "Machine Learning": ["Supervised Learning", "Unsupervised Learning", "Neural Networks", "NLP", "Computer Vision", "TensorFlow", "PyTorch", "Scikit-learn", "MLOps", "Transformers"],
  "Cloud Computing": ["AWS Services", "GCP", "Azure", "Serverless", "Lambda", "S3 & Storage", "CloudFront", "VPC", "IAM", "Cost Optimization"],
  "Cybersecurity": ["OWASP Top 10", "Penetration Testing", "Encryption", "Auth & OAuth", "Network Security", "SQL Injection", "XSS Prevention", "Firewalls", "SOC", "Bug Bounty"],
  "UI/UX Design": ["Figma", "Design Systems", "Wireframing", "Prototyping", "User Research", "Color Theory", "Typography", "Accessibility", "Responsive Design", "Motion Design"],
  "System Design": ["Scalability", "Load Balancing", "Caching", "Message Queues", "Database Sharding", "CDN", "Rate Limiting", "Consistent Hashing", "CAP Theorem", "Design Patterns"],
  "DSA": ["Arrays", "Linked Lists", "Trees", "Graphs", "Dynamic Programming", "Sorting", "Searching", "Stacks & Queues", "Hashing", "Recursion"],
  "Operating Systems": ["Processes", "Threads", "Memory Management", "File Systems", "Scheduling", "Deadlocks", "Virtual Memory", "I/O Systems", "Linux Kernel", "Shell Scripting"],
  "Networking": ["TCP/IP", "HTTP/HTTPS", "DNS", "WebSockets", "REST vs GraphQL", "OSI Model", "Firewalls", "VPN", "Load Balancers", "CDN"],
  "Web3": ["Blockchain Basics", "Ethereum", "Solidity", "Smart Contracts", "DeFi", "NFTs", "IPFS", "Wallets", "DAOs", "Layer 2"],
  "Game Development": ["Unity Basics", "Unreal Engine", "Godot", "Game Physics", "2D vs 3D", "Shaders", "Game AI", "Level Design", "Sound Design", "Publishing"],
  "Testing": ["Unit Testing", "Integration Testing", "E2E Testing", "Jest", "Cypress", "Playwright", "TDD", "Mocking", "Code Coverage", "Load Testing"],
  "API Design": ["REST Principles", "GraphQL", "gRPC", "OpenAPI/Swagger", "Versioning", "Authentication", "Rate Limiting", "Pagination", "Error Handling", "HATEOAS"],
  "Microservices": ["Service Discovery", "API Gateway", "Event-Driven", "Saga Pattern", "CQRS", "Service Mesh", "Circuit Breaker", "Containerization", "Logging", "Distributed Tracing"],
  "Performance": ["Web Vitals", "Lighthouse", "Bundle Size", "Lazy Loading", "Code Splitting", "Image Optimization", "Caching Strategies", "Profiling", "Memory Leaks", "SSR vs CSR"],
};

const roomTemplates = [
  "Basics", "Getting Started", "Core Concepts", "Advanced Topics", "Best Practices",
  "Common Patterns", "Error Handling", "Configuration", "Deployment", "Troubleshooting",
];

const sampleNotes = [
  { title: "Key Takeaway", content: "Remember to always follow the documentation for the latest updates and breaking changes." },
  { title: "Important Concept", content: "This is a fundamental concept that forms the basis of everything else in this topic." },
  { title: "Quick Reference", content: "Use this as a quick reference when working on related projects." },
];

const sampleLinks = [
  { title: "Official Documentation", url: "https://docs.example.com" },
  { title: "Tutorial Video", url: "https://youtube.com/watch?v=example" },
  { title: "Cheat Sheet", url: "https://cheatsheets.example.com" },
];

export async function GET() {
  // Check if dummy data already exists
  const count = await prisma.category.count();
  if (count >= 20) {
    return NextResponse.json({ message: "Dummy data already exists", categories: count });
  }

  let totalSubjects = 0;
  let totalRooms = 0;
  let totalNotes = 0;
  let totalLinks = 0;

  for (let i = 0; i < categories.length; i++) {
    const category = await prisma.category.create({
      data: { name: categories[i], order: i },
    });

    const subjects = subjectsMap[categories[i]] || [];
    for (let j = 0; j < subjects.length; j++) {
      const subject = await prisma.subject.create({
        data: { name: subjects[j], categoryId: category.id, order: j },
      });
      totalSubjects++;

      // Create 2-4 rooms per subject
      const roomCount = 2 + (j % 3);
      for (let k = 0; k < roomCount; k++) {
        const roomName = roomTemplates[(j + k) % roomTemplates.length];
        const room = await prisma.room.create({
          data: { name: roomName, subjectId: subject.id, order: k },
        });
        totalRooms++;

        // Add 1-2 notes to some rooms
        if ((j + k) % 2 === 0) {
          const note = sampleNotes[(j + k) % sampleNotes.length];
          await prisma.note.create({
            data: { title: note.title, content: note.content, roomId: room.id },
          });
          totalNotes++;
        }

        // Add 1 link to some rooms
        if ((j + k) % 3 === 0) {
          const link = sampleLinks[(j + k) % sampleLinks.length];
          await prisma.link.create({
            data: { title: link.title, url: link.url, roomId: room.id },
          });
          totalLinks++;
        }
      }
    }
  }

  return NextResponse.json({
    message: "Dummy data created",
    stats: {
      categories: categories.length,
      subjects: totalSubjects,
      rooms: totalRooms,
      notes: totalNotes,
      links: totalLinks,
    },
  });
}
