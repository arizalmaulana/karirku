import type { JobListing, Profile, JobLevel } from "@/lib/types";

/**
 * Extract education level dari job level atau requirements
 */
export function extractEducationFromJob(job: JobListing): string | null {
    // Jika ada job_level, map ke education
    if (job.job_level) {
        const levelToEducation: Record<JobLevel, string> = {
            'Entry Level': 'SMA/SMK',
            'Mid Level': 'S1',
            'Senior Level': 'S1',
            'Executive': 'S2',
        };
        return levelToEducation[job.job_level] || null;
    }

    // Extract dari requirements jika ada
    if (job.requirements && job.requirements.length > 0) {
        const requirementsText = job.requirements.join(' ').toLowerCase();
        if (requirementsText.includes('s3') || requirementsText.includes('doktor')) return 'S3';
        if (requirementsText.includes('s2') || requirementsText.includes('magister')) return 'S2';
        if (requirementsText.includes('s1') || requirementsText.includes('sarjana')) return 'S1';
        if (requirementsText.includes('d3') || requirementsText.includes('diploma')) return 'D3';
        if (requirementsText.includes('sma') || requirementsText.includes('smk')) return 'SMA/SMK';
    }

    return null;
}

/**
 * Extract experience years dari job level atau requirements
 */
export function extractExperienceFromJob(job: JobListing): string | null {
    // Jika ada job_level, map ke experience
    if (job.job_level) {
        const levelToExperience: Record<JobLevel, string> = {
            'Entry Level': '0-1 tahun',
            'Mid Level': '2-4 tahun',
            'Senior Level': '5+ tahun',
            'Executive': '10+ tahun',
        };
        return levelToExperience[job.job_level] || null;
    }

    // Extract dari requirements jika ada
    if (job.requirements && job.requirements.length > 0) {
        const requirementsText = job.requirements.join(' ').toLowerCase();
        
        // Pattern: "X tahun", "X+ tahun", "minimal X tahun"
        const yearPatterns = [
            /(\d+)\+\s*tahun/i,
            /minimal\s*(\d+)\s*tahun/i,
            /(\d+)\s*tahun/i,
        ];

        for (const pattern of yearPatterns) {
            const match = requirementsText.match(pattern);
            if (match) {
                const years = parseInt(match[1]);
                return `${years}+ tahun`;
            }
        }

        // Keyword-based
        if (requirementsText.includes('fresh graduate') || requirementsText.includes('entry level')) {
            return '0-1 tahun';
        }
        if (requirementsText.includes('senior') || requirementsText.includes('lead')) {
            return '5+ tahun';
        }
    }

    return null;
}

/**
 * Menghitung skor kecocokan antara profil job seeker dan lowongan pekerjaan
 * berdasarkan 4 variabel: Pendidikan, Jurusan, Pengalaman, dan Skill
 * 
 * Persentase:
 * - Skill: 40% (paling penting)
 * - Jurusan: 25% (penting untuk relevansi)
 * - Pengalaman: 20% (penting untuk kualifikasi)
 * - Pendidikan: 15% (pendukung)
 */
export function calculateMatchScore(
    jobSeekerSkills: string[],
    jobRequiredSkills: string[] | null,
    jobSeekerMajor: string | null = null,
    jobRequiredMajor: string | null = null,
    jobSeekerEducation: string | null = null,
    jobRequiredEducation: string | null = null,
    jobSeekerExperience: string | null = null,
    jobRequiredExperience: string | null = null
): number {
    let skillScore = 0;
    let majorScore = 0;
    let educationScore = 0;
    let experienceScore = 0;

    // 1. Hitung skill match score (40% dari total score)
    if (jobRequiredSkills && jobRequiredSkills.length > 0) {
        if (jobSeekerSkills.length > 0) {
            const seekerSkillsLower = jobSeekerSkills.map((s) => s.toLowerCase().trim());
            const requiredSkillsLower = jobRequiredSkills.map((s) => s.toLowerCase().trim());

            const matchedSkills = requiredSkillsLower.filter((requiredSkill) =>
                seekerSkillsLower.some((seekerSkill) =>
                    seekerSkill.includes(requiredSkill) || requiredSkill.includes(seekerSkill)
                )
            );

            const matchRatio = matchedSkills.length / requiredSkillsLower.length;
            
            // Jika semua skill match, beri score penuh
            if (matchRatio === 1) {
                skillScore = 40;
            } else if (matchRatio >= 0.75) {
                // 75%+ match = score sangat tinggi
                skillScore = 38;
            } else if (matchRatio >= 0.5) {
                // 50%+ match = score tinggi
                skillScore = 32;
            } else if (matchRatio >= 0.25) {
                // 25%+ match = score sedang
                skillScore = 20;
            } else if (matchRatio > 0) {
                // Ada match sedikit = score minimal tapi masih ada
                skillScore = 12;
            } else {
                // Tidak ada match sama sekali, tapi user punya skill = score minimal
                skillScore = 8;
            }
        } else {
            // Jika ada skill required tapi user tidak punya skill, beri score minimal
            skillScore = 8;
        }
    } else {
        // Jika tidak ada skill required, beri score penuh untuk skill
        skillScore = 40;
    }

    // 2. Hitung major match score (25% dari total score)
    if (jobRequiredMajor) {
        if (jobSeekerMajor) {
            const seekerMajorLower = jobSeekerMajor.toLowerCase().trim();
            const requiredMajorLower = jobRequiredMajor.toLowerCase().trim();

            // Exact match
            if (seekerMajorLower === requiredMajorLower) {
                majorScore = 25;
            } else if (
                seekerMajorLower.includes(requiredMajorLower) ||
                requiredMajorLower.includes(seekerMajorLower)
            ) {
                // Partial match - beri score tinggi
                majorScore = 20;
            } else {
                // Tidak match exact, tapi user punya major = score sedang
                majorScore = 10;
            }
        } else {
            // Jika ada major required tapi user tidak punya major, beri score minimal
            majorScore = 8;
        }
    } else {
        // Jika tidak ada major required, beri score penuh untuk major
        majorScore = 25;
    }

    // 3. Hitung education match score (15% dari total score)
    if (jobRequiredEducation && jobSeekerEducation) {
        const seekerEduLower = jobSeekerEducation.toLowerCase().trim();
        const requiredEduLower = jobRequiredEducation.toLowerCase().trim();

        // Map education levels untuk perbandingan
        const educationLevels: Record<string, number> = {
            'sma': 1,
            'smk': 1,
            'd3': 2,
            'diploma': 2,
            's1': 3,
            'sarjana': 3,
            'strata 1': 3,
            's2': 4,
            'magister': 4,
            'strata 2': 4,
            's3': 5,
            'doktor': 5,
        };

        const getEducationLevel = (edu: string): number => {
            for (const [key, level] of Object.entries(educationLevels)) {
                if (edu.includes(key)) {
                    return level;
                }
            }
            return 0;
        };

        const seekerLevel = getEducationLevel(seekerEduLower);
        const requiredLevel = getEducationLevel(requiredEduLower);

        if (seekerLevel >= requiredLevel && seekerLevel > 0 && requiredLevel > 0) {
            // Jika pendidikan job seeker >= required, beri score penuh
            educationScore = 15;
        } else if (seekerLevel > 0 && requiredLevel > 0) {
            // Jika pendidikan job seeker < required, beri score parsial (lebih murah hati)
            const ratio = seekerLevel / requiredLevel;
            if (ratio >= 0.8) {
                educationScore = 14; // Hampir sesuai
            } else if (ratio >= 0.6) {
                educationScore = 11; // Cukup sesuai
            } else if (ratio >= 0.4) {
                educationScore = 8; // Agak sesuai
            } else {
                educationScore = 6; // Kurang sesuai tapi masih ada
            }
        } else {
            // Exact match jika tidak bisa di-parse
            if (seekerEduLower === requiredEduLower) {
                educationScore = 15;
            } else if (seekerEduLower.includes(requiredEduLower) || requiredEduLower.includes(seekerEduLower)) {
                educationScore = 12;
            } else if (jobSeekerEducation && jobSeekerEducation.trim().length > 0) {
                // User punya education tapi tidak match = score sedang
                educationScore = 7;
            } else {
                // Tidak match, tapi beri score minimal
                educationScore = 5;
            }
        }
    } else if (!jobRequiredEducation) {
        // Jika tidak ada education required, beri score penuh untuk education
        educationScore = 15;
    } else {
        // Jika ada education required tapi user tidak punya education, beri score minimal
        educationScore = 5;
    }

    // 4. Hitung experience match score (20% dari total score)
    if (jobRequiredExperience && jobSeekerExperience) {
        const seekerExpLower = jobSeekerExperience.toLowerCase().trim();
        const requiredExpLower = jobRequiredExperience.toLowerCase().trim();

        // Extract years dari experience text
        const extractYears = (text: string): number => {
            // Pattern: "X tahun", "X years", "X+ tahun", dll
            const yearMatch = text.match(/(\d+)\s*(?:tahun|years|yr|th)/i);
            if (yearMatch) {
                return parseInt(yearMatch[1]);
            }
            // Pattern: "X+ tahun"
            const plusMatch = text.match(/(\d+)\+/i);
            if (plusMatch) {
                return parseInt(plusMatch[1]);
            }
            return 0;
        };

        const seekerYears = extractYears(seekerExpLower);
        const requiredYears = extractYears(requiredExpLower);

        if (seekerYears >= requiredYears && seekerYears > 0 && requiredYears > 0) {
            // Jika pengalaman job seeker >= required, beri score penuh
            experienceScore = 20;
        } else if (seekerYears > 0 && requiredYears > 0) {
            // Jika pengalaman job seeker < required, beri score parsial (lebih murah hati)
            const ratio = seekerYears / requiredYears;
            if (ratio >= 0.8) {
                experienceScore = 19; // Hampir sesuai
            } else if (ratio >= 0.6) {
                experienceScore = 16; // Cukup sesuai
            } else if (ratio >= 0.4) {
                experienceScore = 12; // Agak sesuai
            } else if (ratio >= 0.2) {
                experienceScore = 9; // Kurang sesuai tapi masih ada
            } else {
                experienceScore = 7; // Sangat kurang tapi masih ada
            }
        } else {
            // Jika tidak bisa extract years, cek keyword match
            const experienceKeywords = ['pengalaman', 'experience', 'bekerja', 'kerja', 'tahun'];
            const hasExperienceKeyword = experienceKeywords.some(keyword => 
                seekerExpLower.includes(keyword) && requiredExpLower.includes(keyword)
            );
            
            if (hasExperienceKeyword) {
                experienceScore = 14; // Ada keyword match
            } else if (seekerExpLower.length > 10 && requiredExpLower.length > 10) {
                // Jika ada teks pengalaman yang cukup panjang, beri score sedang
                experienceScore = 10;
            } else if (jobSeekerExperience && jobSeekerExperience.trim().length > 0) {
                // Jika user punya experience text, beri score sedang
                experienceScore = 8;
            } else {
                experienceScore = 6; // Tidak ada tapi beri score minimal
            }
        }
    } else if (!jobRequiredExperience) {
        // Jika tidak ada experience required, beri score penuh untuk experience
        experienceScore = 20;
    } else {
        // Jika ada experience required tapi user tidak punya experience, beri score minimal
        experienceScore = 6;
    }

    let totalScore = skillScore + majorScore + educationScore + experienceScore;
    
    // Bonus jika banyak aspek yang match dengan baik
    const excellentMatch = [
        skillScore >= 35,      // Skill match sangat baik
        majorScore >= 20,      // Major match baik
        educationScore >= 12,   // Education match baik
        experienceScore >= 16   // Experience match baik
    ].filter(Boolean).length;
    
    const goodMatch = [
        skillScore >= 25,      // Skill match baik
        majorScore >= 15,      // Major match cukup
        educationScore >= 9,    // Education match cukup
        experienceScore >= 12   // Experience match cukup
    ].filter(Boolean).length;
    
    // Bonus berdasarkan jumlah aspek yang match dengan baik
    if (excellentMatch >= 3) {
        totalScore += 10; // Bonus besar jika 3+ aspek match sangat baik
    } else if (excellentMatch >= 2) {
        totalScore += 7; // Bonus jika 2 aspek match sangat baik
    } else if (goodMatch >= 3) {
        totalScore += 5; // Bonus jika 3+ aspek match baik
    } else if (goodMatch >= 2) {
        totalScore += 3; // Bonus jika 2 aspek match baik
    }
    
    // Bonus tambahan jika skill match sangat baik (>= 35)
    if (skillScore >= 35) {
        totalScore += 5;
    } else if (skillScore >= 30) {
        totalScore += 3;
    }
    
    // Bonus jika major exact match
    if (majorScore === 25) {
        totalScore += 3;
    }
    
    // Bonus jika semua aspek ada (tidak ada yang 0 atau sangat kecil)
    const allAspectsPresent = skillScore > 5 && majorScore > 5 && educationScore > 5 && experienceScore > 5;
    if (allAspectsPresent) {
        totalScore += 2;
    }
    
    return Math.min(Math.round(totalScore), 100); // Maksimal 100%
}

/**
 * Wrapper function untuk calculateMatchScore dengan JobListing dan Profile
 */
export function calculateMatchScoreFromJobAndProfile(
    job: JobListing,
    profile: Profile
): number {
    const jobEducation = extractEducationFromJob(job);
    const jobExperience = extractExperienceFromJob(job);

    return calculateMatchScore(
        profile.skills || [],
        job.skills_required || null,
        profile.major || null,
        job.major_required || null,
        profile.education || null,
        jobEducation,
        profile.experience || null,
        jobExperience
    );
}

/**
 * Wrapper function untuk calculateMatchScore dengan Job (UI type) dan Profile
 * Menggunakan education_required dan experience_required dari Job jika tersedia,
 * jika tidak, extract dari job level/requirements
 */
export function calculateMatchScoreFromJobUIAndProfile(
    job: { 
        skills_required?: string[] | null;
        major_required?: string | null;
        education_required?: string | null;
        experience_required?: string | null;
        level?: string;
        requirements?: string[];
    },
    profile: Profile
): number {
    // Gunakan education_required dan experience_required jika sudah ada
    // Jika tidak, extract dari level atau requirements
    let jobEducation = job.education_required || null;
    let jobExperience = job.experience_required || null;

    // Jika tidak ada, coba extract dari level
    if (!jobEducation && job.level) {
        const levelToEducation: Record<string, string> = {
            'Entry Level': 'SMA/SMK',
            'Mid Level': 'S1',
            'Senior Level': 'S1',
            'Executive': 'S2',
        };
        jobEducation = levelToEducation[job.level] || null;
    }

    if (!jobExperience && job.level) {
        const levelToExperience: Record<string, string> = {
            'Entry Level': '0-1 tahun',
            'Mid Level': '2-4 tahun',
            'Senior Level': '5+ tahun',
            'Executive': '10+ tahun',
        };
        jobExperience = levelToExperience[job.level] || null;
    }

    // Jika masih tidak ada, coba extract dari requirements
    if (!jobEducation && job.requirements && job.requirements.length > 0) {
        const requirementsText = job.requirements.join(' ').toLowerCase();
        if (requirementsText.includes('s3') || requirementsText.includes('doktor')) jobEducation = 'S3';
        else if (requirementsText.includes('s2') || requirementsText.includes('magister')) jobEducation = 'S2';
        else if (requirementsText.includes('s1') || requirementsText.includes('sarjana')) jobEducation = 'S1';
        else if (requirementsText.includes('d3') || requirementsText.includes('diploma')) jobEducation = 'D3';
        else if (requirementsText.includes('sma') || requirementsText.includes('smk')) jobEducation = 'SMA/SMK';
    }

    if (!jobExperience && job.requirements && job.requirements.length > 0) {
        const requirementsText = job.requirements.join(' ').toLowerCase();
        const yearPatterns = [
            /(\d+)\+\s*tahun/i,
            /minimal\s*(\d+)\s*tahun/i,
            /(\d+)\s*tahun/i,
        ];

        for (const pattern of yearPatterns) {
            const match = requirementsText.match(pattern);
            if (match) {
                const years = parseInt(match[1]);
                jobExperience = `${years}+ tahun`;
                break;
            }
        }

        if (!jobExperience) {
            if (requirementsText.includes('fresh graduate') || requirementsText.includes('entry level')) {
                jobExperience = '0-1 tahun';
            } else if (requirementsText.includes('senior') || requirementsText.includes('lead')) {
                jobExperience = '5+ tahun';
            }
        }
    }

    return calculateMatchScore(
        profile.skills || [],
        job.skills_required || null,
        profile.major || null,
        job.major_required || null,
        profile.education || null,
        jobEducation,
        profile.experience || null,
        jobExperience
    );
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
    const userEducation = profile.education || null;
    const userExperience = profile.experience || null;

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
    const jobsWithScore = filteredJobs.map((job) => {
        const jobEducation = extractEducationFromJob(job);
        const jobExperience = extractExperienceFromJob(job);

        return {
            ...job,
            matchScore: calculateMatchScore(
                userSkills,
                job.skills_required || null,
                userMajor,
                job.major_required || null,
                userEducation,
                jobEducation,
                userExperience,
                jobExperience
            ),
        };
    });

    // Urutkan berdasarkan match score (tertinggi dulu)
    return jobsWithScore.sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Menghitung progress kelengkapan profil
 * Field yang dihitung:
 * 1. full_name
 * 2. headline
 * 3. location_city
 * 4. major
 * 5. skills (minimal 1 skill)
 * 6. avatar_url
 * 7. phone
 * 8. bio
 * 9. experience
 * 10. education
 */
export function calculateProfileProgress(profile: Profile): number {
    let completed = 0;
    const total = 10;

    if (profile.full_name && profile.full_name.trim() !== '') completed++;
    if (profile.headline && profile.headline.trim() !== '') completed++;
    if (profile.location_city && profile.location_city.trim() !== '') completed++;
    if (profile.major && profile.major.trim() !== '') completed++;
    if (profile.skills && profile.skills.length > 0) completed++;
    if (profile.avatar_url && profile.avatar_url.trim() !== '') completed++;
    if (profile.phone && profile.phone.trim() !== '') completed++;
    if (profile.bio && profile.bio.trim() !== '') completed++;
    if (profile.experience && profile.experience.trim() !== '') completed++;
    if (profile.education && profile.education.trim() !== '') completed++;

    return Math.round((completed / total) * 100);
}
