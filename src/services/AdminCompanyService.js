const { Company, User, Job } = require('../models');

// ==============================================================================
// 1. DANH SÁCH CÔNG TY CẦN DUYỆT (status = pending)
// ==============================================================================
exports.getPendingCompanies = async () => {
    return await Company.findAll({
        where: { status: 'pending' },
        include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'phone', 'created_at']
        }],
        order: [['created_at', 'ASC']]  // Cũ nhất lên đầu (FIFO)
    });
};

// ==============================================================================
// 2. DANH SÁCH TẤT CẢ CÔNG TY (lọc theo status)
// ==============================================================================
exports.getAllCompanies = async (filters = {}) => {
    const where = {};
    if (filters.status) where.status = filters.status;

    return await Company.findAll({
        where,
        include: [{
            model: User,
            as: 'user',
            attributes: ['id', 'full_name', 'email', 'phone']
        }],
        order: [['created_at', 'DESC']]
    });
};

// ==============================================================================
// 3. DUYỆT CÔNG TY (approved / rejected)
// ==============================================================================
/**
 * @param {string} companyId
 * @param {'approved' | 'rejected'} action
 * @param {string} [reason] - Lý do từ chối (bắt buộc khi rejected)
 */
exports.reviewCompany = async (companyId, action, reason) => {
    if (!['approved', 'rejected'].includes(action)) {
        throw new Error('Hành động không hợp lệ. Chỉ chấp nhận: approved hoặc rejected.');
    }
    if (action === 'rejected' && !reason?.trim()) {
        throw new Error('Vui lòng cung cấp lý do từ chối.');
    }

    const company = await Company.findByPk(companyId);
    if (!company) throw new Error('Công ty không tồn tại.');

    if (company.status !== 'pending') {
        throw new Error(`Công ty này đã được xử lý (trạng thái hiện tại: ${company.status}).`);
    }

    await company.update({
        status:           action,
        rejection_reason: action === 'rejected' ? reason.trim() : null
    });

    return await Company.findByPk(companyId, {
        include: [{ model: User, as: 'user', attributes: ['full_name', 'email'] }]
    });
};
