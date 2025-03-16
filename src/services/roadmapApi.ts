import { api } from './api';

export const roadmapApi = {
  generate: (data: { goal: string; deadline: string; detailLevel: number }) => 
    api.post('/roadmap/generate', data)
};
