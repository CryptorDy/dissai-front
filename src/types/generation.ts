export type GenerationStatus = 'pending' | 'completed' | 'error' | 'cancelled';

type GenerationType = 
  | 'roadmap' 
  | 'reels' 
  | 'article' 
  | 'simplify' 
  | 'educational' 
  | 'notes' 
  | 'content-plan';

export interface GenerationTask {
  id: string;
  type: GenerationType;
  title: string;
  status: GenerationStatus;
  progress: number;
  startedAt: number;
  completedAt?: number;
  result?: any;
  error?: string;
  showResult?: boolean;
  canCancel?: boolean;
  redirected?: boolean;
}

export interface TaskListResponse {
  tasks: Array<{
    id: string;
    type: string;
    status: string;
    startTime: string;
    endTime: string | null;
    isCompleted: boolean;
  }>;
}

export interface TaskResultResponse {
  id: string;
  status: string;
  result: any;
  error: string | null;
  type: string;
}
