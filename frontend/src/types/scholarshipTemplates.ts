export type QuestionType = 'text' | 'email' | 'date' | 'select' | 'textarea' | 'number';

export interface QuestionOption {
  label: string;
  value: string;
}

export interface ApplicationQuestion {
  id: string;
  label: string;
  helperText: string;
  type: QuestionType;
  required: boolean;
  options?: QuestionOption[];
  autoComplete?: string;
  placeholder?: string;
}

export interface ApplicationSection {
  id: string;
  title: string;
  description: string;
  questions: ApplicationQuestion[];
}

export interface ApplicationTemplate {
  id: string;
  title: string;
  description: string;
  statusMessage: string;
  sections: ApplicationSection[];
}

export const SCHOLARSHIP_TEMPLATES: ApplicationTemplate[] = [
  {
    id: 'scholarship-prep',
    title: 'Scholarship Application Preparation',
    description: 'A structured, step-by-step guide to help you organize your personal profile, academic goals, application essay, and supporting details.',
    statusMessage: 'Primary Student Workflow • In-Memory Preparation Draft',
    sections: [
      {
        id: 'profile',
        title: 'Your Profile',
        description: 'Provide your basic contact information and current educational background.',
        questions: [
          {
            id: 'fullName',
            label: 'Full Legal Name',
            helperText: 'Enter your full name as it appears on official school or identity records.',
            type: 'text',
            required: true,
            autoComplete: 'name',
            placeholder: 'e.g. Ananya Sharma',
          },
          {
            id: 'email',
            label: 'Email Address',
            helperText: 'Your primary contact email address.',
            type: 'email',
            required: true,
            autoComplete: 'email',
            placeholder: 'name@example.com',
          },
          {
            id: 'schoolOrCollege',
            label: 'School or College Name',
            helperText: 'Name of your current or most recent educational institution.',
            type: 'text',
            required: true,
            placeholder: 'e.g. Government Higher Secondary School',
          },
          {
            id: 'fieldOfStudy',
            label: 'Intended Course or Field of Study',
            helperText: 'The discipline, degree, or subject area you are pursuing or plan to study.',
            type: 'text',
            required: true,
            placeholder: 'e.g. Computer Science, Mechanical Engineering, Commerce',
          },
        ],
      },
      {
        id: 'academic',
        title: 'Your Academic Direction',
        description: 'Describe your educational level, strengths, and future academic goals.',
        questions: [
          {
            id: 'studyLevel',
            label: 'Current Study Level',
            helperText: 'Select your current education level.',
            type: 'select',
            required: true,
            options: [
              { label: 'Select study level...', value: '' },
              { label: 'High School / Grade 12', value: 'high_school' },
              { label: 'Undergraduate Degree', value: 'undergraduate' },
              { label: 'Postgraduate Degree', value: 'postgraduate' },
              { label: 'Diploma / Vocational Training', value: 'diploma' },
            ],
          },
          {
            id: 'academicStrengths',
            label: 'Academic Strengths & Subjects',
            helperText: 'List subjects or academic areas where you demonstrate strong performance.',
            type: 'text',
            required: true,
            placeholder: 'e.g. Mathematics, Science, English Literature',
          },
          {
            id: 'futureGoals',
            label: 'Educational & Career Goals',
            helperText: 'Describe what you aim to achieve through your education and career over the next few years.',
            type: 'textarea',
            required: true,
            placeholder: 'Describe your aspirations in 2-4 sentences...',
          },
        ],
      },
      {
        id: 'statement',
        title: 'Your Application Statement',
        description: 'Articulate your motivation and highlight relevant accomplishments.',
        questions: [
          {
            id: 'motivationStatement',
            label: 'Motivation Statement',
            helperText: 'Explain why you are applying for scholarship support and how it helps your education.',
            type: 'textarea',
            required: true,
            placeholder: 'Explain your motivation in your own words...',
          },
          {
            id: 'achievements',
            label: 'Key Achievements or Activities (Optional)',
            helperText: 'Mention any academic awards, leadership roles, or community activities (optional).',
            type: 'textarea',
            required: false,
            placeholder: 'List any relevant achievements...',
          },
        ],
      },
      {
        id: 'support',
        title: 'Support Context',
        description: 'Optional space to share personal context. Do not enter sensitive identity or financial keys.',
        questions: [
          {
            id: 'additionalContext',
            label: 'Additional Circumstances (Optional)',
            helperText: 'Optional space to describe any personal background context you choose to share. Do not enter passwords, ID numbers, or bank details.',
            type: 'textarea',
            required: false,
            placeholder: 'Share any additional details you feel are relevant...',
          },
        ],
      },
    ],
  },
  {
    id: 'other-prep',
    title: 'Other Application Preparation',
    description: 'A general configurable form template for drafting contact details and program interest before specific questions are configured.',
    statusMessage: 'General Preparation Flow • In-Memory Draft',
    sections: [
      {
        id: 'general',
        title: 'General Contact & Purpose',
        description: 'Provide basic details and select the purpose of this application draft.',
        questions: [
          {
            id: 'contactName',
            label: 'Contact Name',
            helperText: 'Your full name for correspondence.',
            type: 'text',
            required: true,
            autoComplete: 'name',
            placeholder: 'e.g. Rahul Verma',
          },
          {
            id: 'contactEmail',
            label: 'Contact Email',
            helperText: 'Your preferred email address.',
            type: 'email',
            required: true,
            autoComplete: 'email',
            placeholder: 'name@example.com',
          },
          {
            id: 'applicationPurpose',
            label: 'Application Purpose',
            helperText: 'Select the purpose of this preparation draft.',
            type: 'select',
            required: true,
            options: [
              { label: 'Select purpose...', value: '' },
              { label: 'Local Community Support Program', value: 'community_support' },
              { label: 'Vocational Skill Training', value: 'vocational' },
              { label: 'General Program Inquiry', value: 'general_inquiry' },
            ],
          },
          {
            id: 'generalStatement',
            label: 'Statement of Need / Purpose',
            helperText: 'Briefly outline your background and reasons for preparing this application form.',
            type: 'textarea',
            required: true,
            placeholder: 'Describe your purpose...',
          },
        ],
      },
    ],
  },
];
