const { User, Candidate_profile, sequelize } = require('../models');

/**
 * Get candidate profile by user ID
 * @param {string} userId 
 * @returns {Promise<Object>} Formatted profile data
 */
exports.getProfile = async (userId) => {
    const profile = await Candidate_profile.findOne({
        where: { user_id: userId },
        include: [
            {
                model: User,
                attributes: ['full_name', 'phone', 'role', 'avatar_url']
            }]
    });

    if (!profile) {
        return null; // Or throw custom error
    }

    // Return formatted data (DTO-like)
    return {
        full_name: profile.User?.full_name,
        phone: profile.User?.phone,
        role: profile.User?.role,
        avatar_url: profile.User?.avatar_url,
        headline: profile.headline,
        bio: profile.bio,
        website: profile.website,
        linkedin: profile.linkedin || profile.linkedin_url,
        created_at: profile.created_at,
        updated_at: profile.updated_at
    };
};

/**
 * Update candidate profile and user info
 * @param {string} userId 
 * @param {Object} data - fields to update
 * @returns {Promise<Object>} Updated profile
 */
exports.updateProfile = async (userId, data) => {
    const {
        full_name, phone, bio,
        website, headline, linkedin_url, avatar_url
    } = data;

    // Validation (Logic business)
    if (phone && !/^\d{10,11}$/.test(phone)) {
        throw new Error('Số điện thoại không hợp lệ');
    }

    if (linkedin_url && !linkedin_url.startsWith('https://linkedin.com/')) {
        throw new Error('LinkedIn URL không hợp lệ');
    }

    const t = await sequelize.transaction();

    try {
        // Update table users
        const userUpdateData = {};
        if (full_name) userUpdateData.full_name = full_name;
        if (phone) userUpdateData.phone = phone;
        if (avatar_url) userUpdateData.avatar_url = avatar_url;

        if (Object.keys(userUpdateData).length > 0) {
            await User.update(userUpdateData, {
                where: { id: userId },
                transaction: t
            });
        }

        // Update table candidate_profile
        const profileUpdateData = {
            user_id: userId,
            ...(headline !== undefined && { headline }),
            ...(bio !== undefined && { bio }),
            ...(website !== undefined && { website }),
            ...(linkedin_url !== undefined && { linkedin_url }) // Assuming strict check, or use nullish coalescing if needed
        };

        await Candidate_profile.upsert(profileUpdateData, {
            transaction: t
        });

        await t.commit();

        // Fetch updated data to return
        const updatedProfile = await Candidate_profile.findOne({
            where: { user_id: userId },
            include: [{
                model: User,
                attributes: ['id', 'full_name', 'phone', 'avatar_url', 'email']
            }],
            attributes: ['headline', 'bio', 'website', 'linkedin_url', 'created_at', 'updated_at']
        });

        return updatedProfile;

    } catch (error) {
        await t.rollback();
        throw error;
    }
};
