export interface Job {
    id: string;
    title: string;
    company: string;
    location: string;
    type: string;
    salary: string;
    description: string;
    requirements: string[];
    posted: string;
    logo: string;
    category: string;
    level: string;
    coordinates?: {
        lat: number;
        lng: number;
    };
    costOfLiving?: string;
    // Fields untuk match score calculation
    skills_required?: string[] | null;
    major_required?: string | null;
}  