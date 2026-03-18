import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const categoryNames = [
  "Mathematics", "Physics", "Chemistry", "Biology", "Computer Science",
  "History", "Geography", "Literature", "Economics", "Philosophy",
];

const subjectNames: Record<string, string[]> = {
  "Mathematics": ["Algebra", "Calculus"],
  "Physics": ["Mechanics", "Thermodynamics"],
  "Chemistry": ["Organic Chemistry", "Inorganic Chemistry"],
  "Biology": ["Genetics", "Ecology"],
  "Computer Science": ["Algorithms", "Databases"],
  "History": ["Ancient History", "Modern History"],
  "Geography": ["Physical Geography", "Human Geography"],
  "Literature": ["Poetry", "Fiction"],
  "Economics": ["Microeconomics", "Macroeconomics"],
  "Philosophy": ["Ethics", "Logic"],
};

const roomNames = [
  "Introduction", "Core Concepts", "Advanced Topics", "Practice Problems",
  "Revision Notes", "Key Formulas", "Case Studies", "Exam Prep",
  "Quick Reference", "Deep Dive",
];

const noteData = [
  { title: "Key Definitions", content: "Important definitions and terminology to remember for this topic." },
  { title: "Summary", content: "A brief summary of the main concepts covered in this section." },
  { title: "Tips & Tricks", content: "Useful shortcuts and techniques to solve problems faster." },
  { title: "Common Mistakes", content: "Avoid these frequently made errors when working through exercises." },
  { title: "Formula Sheet", content: "All the essential formulas you need for quick reference." },
  { title: "Study Plan", content: "Recommended approach to mastering this topic step by step." },
  { title: "Real World Applications", content: "How these concepts are applied in real-world scenarios." },
  { title: "Comparison Notes", content: "Comparing and contrasting related concepts for better understanding." },
  { title: "Historical Context", content: "The history behind the development of these ideas." },
  { title: "Further Reading", content: "Suggested books and papers for deeper exploration of this topic." },
];

const linkData = [
  { title: "Wikipedia Overview", url: "https://en.wikipedia.org/wiki/Main_Page" },
  { title: "Khan Academy Course", url: "https://www.khanacademy.org" },
  { title: "MIT OpenCourseWare", url: "https://ocw.mit.edu" },
  { title: "Coursera Class", url: "https://www.coursera.org" },
  { title: "YouTube Lecture", url: "https://www.youtube.com" },
  { title: "Stack Overflow Discussion", url: "https://stackoverflow.com" },
  { title: "Medium Article", url: "https://medium.com" },
  { title: "Research Paper", url: "https://arxiv.org" },
  { title: "Interactive Tutorial", url: "https://www.freecodecamp.org" },
  { title: "Practice Platform", url: "https://leetcode.com" },
  { title: "Official Documentation", url: "https://developer.mozilla.org" },
  { title: "Textbook Reference", url: "https://openstax.org" },
  { title: "Video Playlist", url: "https://www.youtube.com/playlist" },
  { title: "Cheat Sheet", url: "https://devhints.io" },
  { title: "Blog Post", url: "https://dev.to" },
  { title: "Online Calculator", url: "https://www.wolframalpha.com" },
  { title: "Flashcards", url: "https://quizlet.com" },
  { title: "Study Guide", url: "https://www.sparknotes.com" },
  { title: "Podcast Episode", url: "https://podcasts.apple.com" },
  { title: "GitHub Repository", url: "https://github.com" },
];

export async function GET() {
  const testUser = await prisma.user.findUnique({
    where: { username: "test@gmail.com" },
  });
  if (!testUser) {
    return NextResponse.json({ error: "Test user not found. Run /api/seed first." }, { status: 404 });
  }

  // Check if test user already has data
  const existing = await prisma.category.count({ where: { userId: testUser.id } });
  if (existing > 0) {
    return NextResponse.json({ message: "Test user already has data", categories: existing });
  }

  const allRoomIds: string[] = [];
  let subjectCount = 0;
  let roomCount = 0;

  // Create 10 categories, 20 subjects (2 per category), 30 rooms (3 per subject on first 10, then adjust)
  for (let i = 0; i < 10; i++) {
    const cat = await prisma.category.create({
      data: { name: categoryNames[i], icon: null, order: i, userId: testUser.id },
    });

    const subs = subjectNames[categoryNames[i]];
    for (let j = 0; j < subs.length; j++) {
      const sub = await prisma.subject.create({
        data: { name: subs[j], categoryId: cat.id, order: j },
      });
      subjectCount++;

      // Distribute 30 rooms across 20 subjects: first 10 subjects get 2 rooms, last 10 get 1 room
      const roomsForSubject = subjectCount <= 10 ? 2 : 1;
      for (let k = 0; k < roomsForSubject; k++) {
        if (roomCount >= 30) break;
        const room = await prisma.room.create({
          data: { name: roomNames[roomCount % roomNames.length], subjectId: sub.id, order: k },
        });
        allRoomIds.push(room.id);
        roomCount++;
      }
    }
  }

  // Add 10 notes spread across first 10 rooms
  for (let i = 0; i < 10; i++) {
    const n = noteData[i];
    await prisma.note.create({
      data: { title: n.title, content: n.content, roomId: allRoomIds[i % allRoomIds.length] },
    });
  }

  // Add 20 links spread across first 20 rooms
  for (let i = 0; i < 20; i++) {
    const l = linkData[i];
    await prisma.link.create({
      data: { title: l.title, url: l.url, roomId: allRoomIds[i % allRoomIds.length] },
    });
  }

  return NextResponse.json({
    message: "Test user data created",
    stats: { categories: 10, subjects: subjectCount, rooms: roomCount, notes: 10, links: 20 },
  });
}
