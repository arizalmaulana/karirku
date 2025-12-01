import type { JobListing, Profile } from "@/lib/types";

/**
 * Menghitung skor kecocokan antara profil job seeker dan lowongan pekerjaan
 * berdasarkan skills dan major yang dimiliki
 */
export function calculateMatchScore(
    jobSeekerSkills: string[],
    jobRequiredSkills: string[] | null,
    jobSeekerMajor: string | null = null,
    jobRequiredMajor: string | null = null
): number {
    let skillScore = 0;
    let majorScore = 0;

    // Hitung skill match score (70% dari total score)
    if (jobRequiredSkills && jobRequiredSkills.length > 0 && jobSeekerSkills.length > 0) {
        const seekerSkillsLower = jobSeekerSkills.map((s) => s.toLowerCase().trim());
        const requiredSkillsLower = jobRequiredSkills.map((s) => s.toLowerCase().trim());

        const matchedSkills = requiredSkillsLower.filter((requiredSkill) =>
            seekerSkillsLower.some((seekerSkill) =>
                seekerSkill.includes(requiredSkill) || requiredSkill.includes(seekerSkill)
            )
        );

        skillScore = (matchedSkills.length / requiredSkillsLower.length) * 70;
    } else if (jobRequiredSkills && jobRequiredSkills.length > 0) {
        // Jika ada skill required tapi user tidak punya skill
        skillScore = 0;
    } else {
        // Jika tidak ada skill required, beri score 50% untuk skill
        skillScore = 50;
    }

    // Hitung major match score (30% dari total score)
    if (jobRequiredMajor && jobSeekerMajor) {
        const seekerMajorLower = jobSeekerMajor.toLowerCase().trim();
        const requiredMajorLower = jobRequiredMajor.toLowerCase().trim();

        // Exact match
        if (seekerMajorLower === requiredMajorLower) {
            majorScore = 30;
        } else if (
            seekerMajorLower.includes(requiredMajorLower) ||
            requiredMajorLower.includes(seekerMajorLower)
        ) {
            // Partial match
            majorScore = 20;
        } else {
            majorScore = 0;
        }
    } else if (!jobRequiredMajor) {
        // Jika tidak ada major required, beri score penuh untuk major
        majorScore = 30;
    } else {
        // Jika ada major required tapi user tidak punya major
        majorScore = 0;
    }

    const totalScore = skillScore + majorScore;
    return Math.round(totalScore);
}

/**
 * Mencari lowongan pekerjaan yang cocok berdasarkan skills dan major job seeker
 */
export function findMatchingJobs(
    profile: Profile,
    allJobs: JobListing[],
    locationFilter?: string
): Array<JobListing & { matchScore: number }> {
    const userSkills = profile.skills || [];
    const userMajor = profile.major || null;

    // Filter berdasarkan lokasi jika ada
    let filteredJobs = allJobs;
    if (locationFilter && locationFilter.trim() !== "") {
        filteredJobs = allJobs.filter(
            (job) =>
                job.location_city.toLowerCase().includes(locationFilter.toLowerCase()) ||
                job.location_province?.toLowerCase().includes(locationFilter.toLowerCase())
        );
    }

    // Hitung match score untuk setiap job
    const jobsWithScore = filteredJobs.map((job) => ({
        ...job,
        matchScore: calculateMatchScore(
            userSkills,
            job.skills_required,
            userMajor,
            job.major_required || null
        ),
    }));

    // Urutkan berdasarkan match score (tertinggi dulu)
    return jobsWithScore.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Menghitung progress kelengkapan profil
 */
export function calculateProfileProgress(profile: Profile): number {
    let completed = 0;
    const total = 6;

    if (profile.full_name) completed++;
    if (profile.headline) completed++;
    if (profile.location_city) completed++;
    if (profile.major) completed++;
    if (profile.skills && profile.skills.length > 0) completed++;
    // Tambahkan field lain jika diperlukan

    return Math.round((completed / total) * 100);
}

