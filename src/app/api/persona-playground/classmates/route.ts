import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/lib/db';
import { users, personaCards, presentablePersonas, studentProjects } from '@/lib/schema';

export async function GET(request: NextRequest) {
  try {
    // Fetch all non-guest users with their persona cards and related data
    const usersWithPersonas = await db
      .select({
        userId: users.id,
        userName: users.name,
        // Persona card data
        personaName: personaCards.name,
        academicBackground: personaCards.academicBackground,
        researchInterest: personaCards.researchInterest,
        recentReading: personaCards.recentReading,
        learningGoal: personaCards.learningGoal,
        discussionStyle: personaCards.discussionStyle,
        avatarColor: personaCards.avatarColor,
        introMessage: personaCards.introMessage,
        // Sub-bullet data
        academicBackgroundSubBullets: personaCards.academicBackgroundSubBullets,
        researchInterestSubBullets: personaCards.researchInterestSubBullets,
        recentReadingSubBullets: personaCards.recentReadingSubBullets,
        learningGoalSubBullets: personaCards.learningGoalSubBullets,
        // Presentable persona data
        affiliation: presentablePersonas.affiliation,
        background: presentablePersonas.background,
        guidingQuestion: presentablePersonas.guidingQuestion,
        learningGoals: presentablePersonas.learningGoals,
        recentInterests: presentablePersonas.recentInterests,
      })
      .from(users)
      .leftJoin(personaCards, eq(users.id, personaCards.userId))
      .leftJoin(presentablePersonas, eq(users.id, presentablePersonas.userId))
      .where(eq(users.isGuest, false));

    // Also fetch project data for each user
    const projectsData = await db
      .select({
        userId: studentProjects.userId,
        projectType: studentProjects.projectType,
        projectDescription: studentProjects.projectDescription,
      })
      .from(studentProjects)
      .where(eq(studentProjects.isLatest, true));

    // Create a map of userId to project data
    const projectsMap = new Map();
    projectsData.forEach(project => {
      projectsMap.set(project.userId, project);
    });

    // Hidden usernames that should not appear in the playground
    const hiddenUsernames = ['test1', 'student_test', 'pilot3', 'pilot1', 'student3', 'pilot2', 'prof324'];

    // Filter out users without persona cards and hidden users
    // Match The Square's filtering logic: only require personaName, default affiliation to 'Student' if missing
    const classmates = usersWithPersonas
      .filter(user => 
        user.personaName && user.personaName.trim() !== '' && // Has persona card with non-empty name
        !hiddenUsernames.includes(user.userName) // Not a hidden user
      )
      .map(user => {
        const project = projectsMap.get(user.userId);
        
        // Use personaName if it exists and is not empty, otherwise fall back to userName
        const displayName = (user.personaName && user.personaName.trim() !== '') 
          ? user.personaName 
          : user.userName;
        
        return {
          id: user.userId,
          userId: user.userId, // Include userId for filtering in matching
          name: displayName,
          userName: user.userName,
          affiliation: user.affiliation || 'Student', // Use the exact affiliation from presentablePersonas, same as The Square
          avatarColor: user.avatarColor || '#262D59',
          
          // Main persona fields
          academicBackground: user.academicBackground,
          researchInterest: user.researchInterest,
          recentReading: user.recentReading,
          learningGoal: user.learningGoal,
          discussionStyle: user.discussionStyle,
          introMessage: user.introMessage,
          
          // Sub-bullets (parse JSON strings)
          academicBackgroundSubBullets: user.academicBackgroundSubBullets 
            ? JSON.parse(user.academicBackgroundSubBullets) 
            : null,
          researchInterestSubBullets: user.researchInterestSubBullets
            ? JSON.parse(user.researchInterestSubBullets)
            : null,
          recentReadingSubBullets: user.recentReadingSubBullets
            ? JSON.parse(user.recentReadingSubBullets)
            : null,
          learningGoalSubBullets: user.learningGoalSubBullets
            ? JSON.parse(user.learningGoalSubBullets)
            : null,
          
          // Presentable persona data
          background: user.background,
          guidingQuestion: user.guidingQuestion,
          learningGoals: user.learningGoals,
          recentInterests: user.recentInterests,
          
          // Project data
          projectType: project?.projectType || null,
          projectDescription: project?.projectDescription || null,
        };
      });

    return NextResponse.json({
      success: true,
      classmates,
      count: classmates.length
    });

  } catch (error) {
    console.error('Error fetching classmates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch classmates' },
      { status: 500 }
    );
  }
}

