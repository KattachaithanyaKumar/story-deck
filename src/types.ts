export type StoryStatus = "todo" | "in_progress" | "in_review" | "done";

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

export interface Sprint {
  id: string;
  projectId: string;
  name: string;
  startDate?: string;
  endDate?: string;
  createdAt: string;
}

export interface Story {
  id: string;
  sprintId: string;
  title: string;
  jiraLink: string;
  description?: string;
  status: StoryStatus;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: string;
  storyId: string;
  text: string;
  createdAt: string;
}

export interface AppData {
  projects: Project[];
  sprints: Sprint[];
  stories: Story[];
  comments: Comment[];
}

export const INITIAL_DATA: AppData = {
  projects: [],
  sprints: [],
  stories: [],
  comments: [],
};
