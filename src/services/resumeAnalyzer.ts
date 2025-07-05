import { ResumeData, AnalysisResult } from '../types';

export class ResumeAnalyzer {
  private static skillDatabase = {
    'frontend': ['React', 'Vue.js', 'Angular', 'JavaScript', 'TypeScript', 'HTML', 'CSS', 'SCSS', 'Tailwind', 'Bootstrap', 'jQuery', 'Webpack', 'Vite'],
    'backend': ['Node.js', 'Python', 'Java', 'C#', 'PHP', 'Ruby', 'Go', 'Rust', 'Express', 'Django', 'Flask', 'Spring', 'Laravel'],
    'database': ['MySQL', 'PostgreSQL', 'MongoDB', 'Redis', 'SQLite', 'Oracle', 'SQL Server', 'DynamoDB', 'Cassandra'],
    'cloud': ['AWS', 'Azure', 'Google Cloud', 'Docker', 'Kubernetes', 'Terraform', 'Jenkins', 'CI/CD', 'DevOps'],
    'mobile': ['React Native', 'Flutter', 'Swift', 'Kotlin', 'Ionic', 'Xamarin'],
    'tools': ['Git', 'GitHub', 'GitLab', 'Jira', 'Slack', 'VS Code', 'IntelliJ', 'Postman', 'Figma'],
    'soft': ['Leadership', 'Communication', 'Problem Solving', 'Team Work', 'Project Management', 'Agile', 'Scrum']
  };

  private static jobKeywords = [
    'experience', 'years', 'senior', 'junior', 'lead', 'manager', 'developer', 'engineer',
    'architect', 'analyst', 'consultant', 'specialist', 'coordinator', 'administrator',
    'responsible', 'managed', 'developed', 'implemented', 'designed', 'created', 'built',
    'optimized', 'improved', 'increased', 'reduced', 'achieved', 'delivered', 'collaborated'
  ];

  static async analyzeResume(resume: ResumeData, jobDescription?: string): Promise<AnalysisResult> {
    const content = resume.content.toLowerCase();
    
    // Extract skills from resume
    const extractedSkills = this.extractSkills(content);
    
    // Analyze sections
    const sectionScores = this.analyzeSections(resume, content);
    
    // Calculate keyword frequency
    const keywordFrequency = this.analyzeKeywords(content);
    
    // Generate skill match analysis
    const skillMatch = this.analyzeSkillMatch(extractedSkills, jobDescription);
    
    // Calculate overall score
    const overallScore = this.calculateOverallScore(sectionScores, skillMatch, keywordFrequency);
    
    // Generate insights
    const insights = this.generateInsights(resume, extractedSkills, sectionScores, skillMatch);

    return {
      overallScore,
      skillMatch,
      sectionScores,
      keywordFrequency,
      suggestions: insights.suggestions,
      strengths: insights.strengths,
      weaknesses: insights.weaknesses
    };
  }

  private static extractSkills(content: string): string[] {
    const foundSkills: string[] = [];
    
    Object.values(this.skillDatabase).flat().forEach(skill => {
      const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, 'gi');
      if (regex.test(content)) {
        foundSkills.push(skill);
      }
    });

    return [...new Set(foundSkills)];
  }

  private static analyzeSections(resume: ResumeData, content: string): Record<string, number> {
    const sections = {
      contact: this.analyzeContactSection(content),
      summary: this.analyzeSummarySection(content),
      education: this.analyzeEducationSection(content),
      experience: this.analyzeExperienceSection(content),
      skills: this.analyzeSkillsSection(content),
      projects: this.analyzeProjectsSection(content),
      certifications: this.analyzeCertificationsSection(content)
    };

    return sections;
  }

  private static analyzeContactSection(content: string): number {
    let score = 0;
    
    // Check for email
    if (/@/.test(content)) score += 30;
    
    // Check for phone
    if (/\d{3}[-.\s]?\d{3}[-.\s]?\d{4}/.test(content)) score += 25;
    
    // Check for LinkedIn
    if (/linkedin/i.test(content)) score += 20;
    
    // Check for GitHub
    if (/github/i.test(content)) score += 15;
    
    // Check for location
    if (/(city|state|country|address)/i.test(content)) score += 10;

    return Math.min(score, 100);
  }

  private static analyzeSummarySection(content: string): number {
    let score = 0;
    
    // Check for summary keywords
    const summaryKeywords = ['summary', 'objective', 'profile', 'about'];
    const hasSummary = summaryKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
    
    if (hasSummary) {
      score += 40;
      
      // Check for professional keywords
      const professionalWords = ['experienced', 'skilled', 'passionate', 'dedicated', 'results-driven'];
      professionalWords.forEach(word => {
        if (new RegExp(`\\b${word}\\b`, 'i').test(content)) score += 12;
      });
    }

    return Math.min(score, 100);
  }

  private static analyzeEducationSection(content: string): number {
    let score = 0;
    
    const educationKeywords = ['education', 'degree', 'university', 'college', 'bachelor', 'master', 'phd', 'diploma'];
    const hasEducation = educationKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
    
    if (hasEducation) {
      score += 50;
      
      // Check for GPA
      if (/gpa|grade/i.test(content)) score += 15;
      
      // Check for graduation year
      if (/20\d{2}/.test(content)) score += 20;
      
      // Check for relevant coursework
      if (/coursework|courses/i.test(content)) score += 15;
    }

    return Math.min(score, 100);
  }

  private static analyzeExperienceSection(content: string): number {
    let score = 0;
    
    const experienceKeywords = ['experience', 'work', 'employment', 'position', 'role'];
    const hasExperience = experienceKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
    
    if (hasExperience) {
      score += 30;
      
      // Check for action verbs
      const actionVerbs = ['developed', 'managed', 'led', 'created', 'implemented', 'designed', 'optimized'];
      actionVerbs.forEach(verb => {
        if (new RegExp(`\\b${verb}\\b`, 'i').test(content)) score += 8;
      });
      
      // Check for quantifiable achievements
      if (/\d+%|\$\d+|increased|decreased|improved/i.test(content)) score += 20;
    }

    return Math.min(score, 100);
  }

  private static analyzeSkillsSection(content: string): number {
    const extractedSkills = this.extractSkills(content);
    let score = 0;
    
    if (extractedSkills.length > 0) {
      score = Math.min(extractedSkills.length * 8, 100);
    }

    return score;
  }

  private static analyzeProjectsSection(content: string): number {
    let score = 0;
    
    const projectKeywords = ['project', 'portfolio', 'built', 'developed', 'created'];
    const hasProjects = projectKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
    
    if (hasProjects) {
      score += 40;
      
      // Check for GitHub links
      if (/github\.com/i.test(content)) score += 30;
      
      // Check for live demo links
      if (/demo|live|deployed/i.test(content)) score += 30;
    }

    return Math.min(score, 100);
  }

  private static analyzeCertificationsSection(content: string): number {
    let score = 0;
    
    const certKeywords = ['certification', 'certified', 'certificate', 'license'];
    const hasCertifications = certKeywords.some(keyword => 
      new RegExp(`\\b${keyword}\\b`, 'i').test(content)
    );
    
    if (hasCertifications) {
      score += 60;
      
      // Check for specific certifications
      const certifications = ['AWS', 'Google', 'Microsoft', 'Oracle', 'Cisco', 'CompTIA'];
      certifications.forEach(cert => {
        if (new RegExp(`\\b${cert}\\b`, 'i').test(content)) score += 10;
      });
    }

    return Math.min(score, 100);
  }

  private static analyzeKeywords(content: string): Record<string, number> {
    const frequency: Record<string, number> = {};
    
    // Analyze technical skills
    Object.values(this.skillDatabase).flat().forEach(skill => {
      const regex = new RegExp(`\\b${skill.toLowerCase()}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        frequency[skill] = matches.length;
      }
    });

    // Analyze job-related keywords
    this.jobKeywords.forEach(keyword => {
      const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
      const matches = content.match(regex);
      if (matches) {
        frequency[keyword] = matches.length;
      }
    });

    // Return top 10 most frequent keywords
    return Object.fromEntries(
      Object.entries(frequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
    );
  }

  private static analyzeSkillMatch(extractedSkills: string[], jobDescription?: string) {
    if (!jobDescription) {
      // Default analysis without job description
      const allSkills = Object.values(this.skillDatabase).flat();
      const missing = allSkills.filter(skill => !extractedSkills.includes(skill)).slice(0, 8);
      
      return {
        matched: extractedSkills,
        missing,
        matchPercentage: Math.round((extractedSkills.length / (extractedSkills.length + missing.length)) * 100)
      };
    }

    const jobContent = jobDescription.toLowerCase();
    const requiredSkills = this.extractSkills(jobContent);
    
    const matched = extractedSkills.filter(skill => 
      requiredSkills.some(reqSkill => reqSkill.toLowerCase() === skill.toLowerCase())
    );
    
    const missing = requiredSkills.filter(skill => 
      !extractedSkills.some(extractedSkill => extractedSkill.toLowerCase() === skill.toLowerCase())
    );

    const matchPercentage = requiredSkills.length > 0 
      ? Math.round((matched.length / requiredSkills.length) * 100)
      : 0;

    return {
      matched,
      missing,
      matchPercentage
    };
  }

  private static calculateOverallScore(
    sectionScores: Record<string, number>,
    skillMatch: any,
    keywordFrequency: Record<string, number>
  ): number {
    const sectionWeights = {
      contact: 0.1,
      summary: 0.15,
      education: 0.15,
      experience: 0.25,
      skills: 0.2,
      projects: 0.1,
      certifications: 0.05
    };

    let weightedScore = 0;
    Object.entries(sectionScores).forEach(([section, score]) => {
      weightedScore += score * (sectionWeights[section as keyof typeof sectionWeights] || 0);
    });

    // Adjust based on skill match
    const skillBonus = skillMatch.matchPercentage * 0.2;
    
    // Adjust based on keyword frequency
    const keywordBonus = Math.min(Object.keys(keywordFrequency).length * 2, 10);

    const finalScore = Math.round(weightedScore + skillBonus + keywordBonus);
    return Math.min(finalScore, 100);
  }

  private static generateInsights(
    resume: ResumeData,
    extractedSkills: string[],
    sectionScores: Record<string, number>,
    skillMatch: any
  ) {
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    const suggestions: string[] = [];

    // Analyze strengths
    if (extractedSkills.length >= 8) {
      strengths.push('Strong technical skill set with diverse technologies');
    }
    
    if (sectionScores.experience >= 80) {
      strengths.push('Well-documented professional experience with clear achievements');
    }
    
    if (sectionScores.education >= 80) {
      strengths.push('Solid educational background with relevant qualifications');
    }
    
    if (skillMatch.matchPercentage >= 70) {
      strengths.push('Good alignment with job requirements and industry standards');
    }

    // Analyze weaknesses
    if (extractedSkills.length < 5) {
      weaknesses.push('Limited technical skills mentioned - consider expanding skill section');
    }
    
    if (sectionScores.projects < 60) {
      weaknesses.push('Lack of project portfolio - add personal or professional projects');
    }
    
    if (sectionScores.certifications < 40) {
      weaknesses.push('No professional certifications - consider industry-relevant certifications');
    }
    
    if (sectionScores.summary < 60) {
      weaknesses.push('Missing or weak professional summary - add compelling career overview');
    }

    // Generate suggestions
    if (sectionScores.experience < 70) {
      suggestions.push('Add more quantifiable achievements and specific results in experience section');
    }
    
    if (skillMatch.missing.length > 0) {
      suggestions.push(`Consider learning these in-demand skills: ${skillMatch.missing.slice(0, 3).join(', ')}`);
    }
    
    if (sectionScores.contact < 90) {
      suggestions.push('Include professional links like LinkedIn and GitHub profiles');
    }
    
    if (extractedSkills.length < 10) {
      suggestions.push('Expand technical skills section with relevant technologies and tools');
    }
    
    suggestions.push('Use action verbs and quantify achievements wherever possible');
    suggestions.push('Tailor resume content to match specific job requirements');

    return {
      strengths: strengths.length > 0 ? strengths : ['Professional presentation and clear structure'],
      weaknesses: weaknesses.length > 0 ? weaknesses : ['Consider adding more specific technical details'],
      suggestions: suggestions.length > 0 ? suggestions : ['Continue to update and refine resume content regularly']
    };
  }
}