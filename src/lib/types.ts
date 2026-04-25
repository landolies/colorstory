export type ColorId = string;
export type StoryId = string;
export type Weight = 'major' | 'minor';

export interface ColorBlock {
  id: ColorId;
  hex: string;
  weight: Weight;
}

export interface SavedStory {
  id: StoryId;
  schemaVersion: 2;
  name: string;
  colors: ColorBlock[];
  createdAt: string;
  updatedAt?: string;
}
