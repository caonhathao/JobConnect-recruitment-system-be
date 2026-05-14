const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const resumes = await prisma.resume.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' }
  });
  console.log(JSON.stringify(resumes, null, 2));
}

main().catch(console.error).finally(() => prisma.$disconnect());
