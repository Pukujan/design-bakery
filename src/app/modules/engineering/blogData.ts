import blogDataJson from './blog-data.json';
import categoriesJson from './blog-categories.json';

export interface Blog {
  id: number;
  title: string;
  excerpt: string;
  date: string;
  readTime: string;
  tags: string[];
  category: string;
  color: string;
  author: string;
  content: string;
}

export interface BlogCategory {
  id: string;
  label: string;
  color: string;
}

export const blogData = blogDataJson as Blog[];
export const categories = categoriesJson as BlogCategory[];
