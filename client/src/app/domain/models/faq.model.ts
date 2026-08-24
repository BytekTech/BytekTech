import { Lang } from './language.model';

export interface FaqCopy {
  question: string;
  answer: string;
}

export interface FaqEntry {
  id: string;
  copy: Record<Lang, FaqCopy>;
}
