import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const noteTitles = [
  "Getting Started Guide", "Key Concepts", "Common Mistakes to Avoid", "Performance Tips",
  "Architecture Overview", "Setup Instructions", "Debugging Techniques", "Best Practices",
  "Code Snippets", "Interview Questions", "Design Patterns", "Security Considerations",
  "Testing Strategy", "Deployment Checklist", "Migration Guide", "API Reference Notes",
  "Configuration Options", "Troubleshooting FAQ", "Version Changelog", "Learning Roadmap",
];

const noteContents = [
  "Start by understanding the core fundamentals before diving into advanced topics. This foundation will help you grasp complex concepts later.",
  "Always remember to handle edge cases and error states. These are often overlooked but critical for production applications.",
  "Use environment variables for sensitive configuration. Never hardcode API keys or credentials in your source code.",
  "Optimize performance by lazy loading components and using memoization where appropriate. Profile before optimizing.",
  "Follow the single responsibility principle. Each module should have one reason to change.",
  "Write tests first when fixing bugs. This ensures the bug is properly captured and won't regress.",
  "Use meaningful variable and function names. Code is read more often than it is written.",
  "Keep functions small and focused. If a function does too many things, break it into smaller functions.",
  "Document the 'why', not the 'what'. Good code is self-documenting for what it does, but the reasoning behind decisions needs explanation.",
  "Review error handling patterns. Ensure all async operations have proper try/catch blocks and meaningful error messages.",
  "Consider accessibility from the start. It's much harder to retrofit than to build in from the beginning.",
  "Use version control effectively. Write clear commit messages and use feature branches.",
  "Set up CI/CD early in the project. Automated testing and deployment saves time in the long run.",
  "Monitor application health in production. Set up logging, metrics, and alerts.",
  "Keep dependencies up to date. Regular updates prevent security vulnerabilities from accumulating.",
  "Use TypeScript for better developer experience. Type safety catches bugs at compile time.",
  "Implement proper caching strategies. Cache invalidation is one of the hardest problems in CS.",
  "Design APIs with backward compatibility in mind. Breaking changes should be versioned.",
  "Practice code reviews. They improve code quality and spread knowledge across the team.",
  "Take breaks and avoid burnout. Sustainable pace leads to better code quality over time.",
];

const linkData = [
  { title: "Official Documentation", url: "https://docs.example.com/getting-started" },
  { title: "Interactive Tutorial", url: "https://learn.example.com/tutorial" },
  { title: "Video Course - Beginner", url: "https://youtube.com/playlist?list=beginner-course" },
  { title: "Video Course - Advanced", url: "https://youtube.com/playlist?list=advanced-course" },
  { title: "GitHub Repository", url: "https://github.com/example/project" },
  { title: "Stack Overflow - Common Issues", url: "https://stackoverflow.com/questions/tagged/example" },
  { title: "Cheat Sheet PDF", url: "https://cheatsheets.dev/example-cheatsheet" },
  { title: "Blog - Deep Dive", url: "https://blog.example.com/deep-dive-guide" },
  { title: "Podcast Episode", url: "https://podcast.dev/episodes/example-topic" },
  { title: "Conference Talk", url: "https://youtube.com/watch?v=conference-talk" },
  { title: "Reddit Discussion", url: "https://reddit.com/r/programming/comments/example" },
  { title: "Best Practices Guide", url: "https://guides.example.com/best-practices" },
  { title: "Migration Handbook", url: "https://docs.example.com/migration" },
  { title: "Performance Benchmarks", url: "https://benchmarks.example.com/results" },
  { title: "Security Advisory", url: "https://security.example.com/advisories" },
  { title: "Community Forum", url: "https://community.example.com/forum" },
  { title: "Design Patterns Reference", url: "https://patterns.dev/example" },
  { title: "Testing Guide", url: "https://testing.example.com/guide" },
  { title: "Deployment Tutorial", url: "https://deploy.example.com/tutorial" },
  { title: "API Reference", url: "https://api.example.com/reference" },
  { title: "Troubleshooting Wiki", url: "https://wiki.example.com/troubleshooting" },
  { title: "Release Notes", url: "https://releases.example.com/changelog" },
  { title: "Comparison Article", url: "https://blog.dev/comparison-example-vs-other" },
  { title: "Free eBook", url: "https://ebooks.dev/free-example-book" },
  { title: "Interactive Playground", url: "https://playground.example.com" },
  { title: "Code Examples Gallery", url: "https://examples.example.com/gallery" },
  { title: "Architecture Diagram", url: "https://diagrams.example.com/architecture" },
  { title: "Roadmap & Future Plans", url: "https://roadmap.example.com/2026" },
  { title: "Awesome List", url: "https://github.com/awesome-lists/awesome-example" },
  { title: "Newsletter Archive", url: "https://newsletter.example.com/archive" },
];

export async function GET() {
  // Find the first room
  const room = await prisma.room.findFirst({
    include: { _count: { select: { notes: true, links: true } } },
  });

  if (!room) {
    return NextResponse.json({ error: "No rooms found. Run /api/seed-dummy first." }, { status: 404 });
  }

  let notesCreated = 0;
  let linksCreated = 0;

  // Add 20 notes
  for (let i = 0; i < 20; i++) {
    await prisma.note.create({
      data: {
        title: noteTitles[i],
        content: noteContents[i],
        roomId: room.id,
      },
    });
    notesCreated++;
  }

  // Add 30 links
  for (let i = 0; i < 30; i++) {
    await prisma.link.create({
      data: {
        title: linkData[i].title,
        url: linkData[i].url,
        roomId: room.id,
      },
    });
    linksCreated++;
  }

  return NextResponse.json({
    message: `Content added to room "${room.name}"`,
    roomId: room.id,
    notesCreated,
    linksCreated,
  });
}
