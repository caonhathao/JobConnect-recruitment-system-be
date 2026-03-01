const PortfolioService = require('../services/PortfolioService');

// ==============================================================================
// 1. ĐỌC THÔNG TIN PORTFOLIO
// ==============================================================================

// GET /api/portfolio - Lấy toàn bộ hồ sơ
exports.getFullProfile = async (req, res) => {
    try {
        const userId = req.user.id;
        const profile = await PortfolioService.getFullProfile(userId);
        
        if (!profile) {
            return res.status(404).json({ message: 'Hồ sơ không tồn tại' });
        }
        
        return res.status(200).json({
            status: 'success',
            data: profile
        });
    } catch (error) {
        console.error('Lỗi khi lấy hồ sơ:', error);
        
        // Handle specific error: user chưa có profile
        if (error.message === 'Hồ sơ ứng viên không tồn tại. Vui lòng tạo hồ sơ chung trước.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi lấy hồ sơ',
            error: error.message
        });
    }
};

// GET /api/portfolio/experiences - Lấy danh sách kinh nghiệm
exports.getExperiences = async (req, res) => {
    try {
        const userId = req.user.id;
        const experiences = await PortfolioService.getExperiences(userId);
        
        return res.status(200).json({
            status: 'success',
            data: experiences
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách kinh nghiệm:', error);
        
        if (error.message === 'Hồ sơ ứng viên không tồn tại. Vui lòng tạo hồ sơ chung trước.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi lấy danh sách kinh nghiệm',
            error: error.message
        });
    }
};

// GET /api/portfolio/educations - Lấy danh sách học vấn
exports.getEducations = async (req, res) => {
    try {
        const userId = req.user.id;
        const educations = await PortfolioService.getEducations(userId);
        
        return res.status(200).json({
            status: 'success',
            data: educations
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách học vấn:', error);
        
        if (error.message === 'Hồ sơ ứng viên không tồn tại. Vui lòng tạo hồ sơ chung trước.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi lấy danh sách học vấn',
            error: error.message
        });
    }
};

// GET /api/portfolio/skills - Lấy danh sách kỹ năng
exports.getSkills = async (req, res) => {
    try {
        const userId = req.user.id;
        const skills = await PortfolioService.getSkills(userId);
        
        return res.status(200).json({
            status: 'success',
            data: skills
        });
    } catch (error) {
        console.error('Lỗi khi lấy danh sách kỹ năng:', error);
        
        if (error.message === 'Hồ sơ ứng viên không tồn tại. Vui lòng tạo hồ sơ chung trước.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi lấy danh sách kỹ năng',
            error: error.message
        });
    }
};

// ==============================================================================
// 2. QUẢN LÝ KINH NGHIỆM (EXPERIENCE)
// ==============================================================================

// POST /api/portfolio/experiences - Thêm kinh nghiệm
exports.createExperience = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = req.body;
        
        const experience = await PortfolioService.createExperience(userId, data);
        
        return res.status(201).json({
            message: 'Thêm kinh nghiệm thành công',
            data: experience
        });
    } catch (error) {
        console.error('Lỗi khi thêm kinh nghiệm:', error);
        
        // Handle validation errors
        if (error.message.includes('không được để trống') || 
            error.message.includes('phải sau')) {
            return res.status(400).json({ message: error.message });
        }
        
        if (error.message === 'Hồ sơ ứng viên không tồn tại. Vui lòng tạo hồ sơ chung trước.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi thêm kinh nghiệm',
            error: error.message
        });
    }
};

// PUT /api/portfolio/experiences/:id - Cập nhật kinh nghiệm
exports.updateExperience = async (req, res) => {
    try {
        const userId = req.user.id;
        const expId = req.params.id;
        const data = req.body;
        
        const experience = await PortfolioService.updateExperience(userId, expId, data);
        
        return res.status(200).json({
            message: 'Cập nhật kinh nghiệm thành công',
            data: experience
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật kinh nghiệm:', error);
        
        // Handle validation errors
        if (error.message.includes('không được để trống') || 
            error.message.includes('phải sau')) {
            return res.status(400).json({ message: error.message });
        }
        
        // Handle not found or permission error
        if (error.message === 'Không tìm thấy dữ liệu hoặc bạn không có quyền sửa.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi cập nhật kinh nghiệm',
            error: error.message
        });
    }
};

// DELETE /api/portfolio/experiences/:id - Xóa kinh nghiệm
exports.deleteExperience = async (req, res) => {
    try {
        const userId = req.user.id;
        const expId = req.params.id;
        
        await PortfolioService.deleteExperience(userId, expId);
        
        return res.status(200).json({
            message: 'Xóa kinh nghiệm thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa kinh nghiệm:', error);
        
        if (error.message === 'Không tìm thấy dữ liệu để xóa.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi xóa kinh nghiệm',
            error: error.message
        });
    }
};

// DELETE /api/portfolio/experiences - Xóa tất cả kinh nghiệm
exports.deleteAllExperiences = async (req, res) => {
    try {
        const userId = req.user.id;
        await PortfolioService.deleteAllExperiences(userId);
        
        return res.status(200).json({
            message: 'Xóa tất cả kinh nghiệm thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa tất cả kinh nghiệm:', error);
        
        if (error.message === 'Hồ sơ ứng viên không tồn tại. Vui lòng tạo hồ sơ chung trước.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi xóa tất cả kinh nghiệm',
            error: error.message
        });
    }
};

// ==============================================================================
// 3. QUẢN LÝ HỌC VẤN (EDUCATION)
// ==============================================================================

// POST /api/portfolio/educations - Thêm học vấn
exports.createEducation = async (req, res) => {
    try {
        const userId = req.user.id;
        const data = req.body;
        
        const education = await PortfolioService.createEducation(userId, data);
        
        return res.status(201).json({
            message: 'Thêm học vấn thành công',
            data: education
        });
    } catch (error) {
        console.error('Lỗi khi thêm học vấn:', error);
        
        if (error.message.includes('không được để trống') || 
            error.message.includes('phải sau')) {
            return res.status(400).json({ message: error.message });
        }
        
        if (error.message === 'Hồ sơ ứng viên không tồn tại. Vui lòng tạo hồ sơ chung trước.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi thêm học vấn',
            error: error.message
        });
    }
};

// PUT /api/portfolio/educations/:id - Cập nhật học vấn
exports.updateEducation = async (req, res) => {
    try {
        const userId = req.user.id;
        const eduId = req.params.id;
        const data = req.body;
        
        const education = await PortfolioService.updateEducation(userId, eduId, data);
        
        return res.status(200).json({
            message: 'Cập nhật học vấn thành công',
            data: education
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật học vấn:', error);
        
        if (error.message.includes('không được để trống') || 
            error.message.includes('phải sau')) {
            return res.status(400).json({ message: error.message });
        }
        
        if (error.message === 'Không tìm thấy dữ liệu hoặc bạn không có quyền sửa.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi cập nhật học vấn',
            error: error.message
        });
    }
};

// DELETE /api/portfolio/educations/:id - Xóa học vấn
exports.deleteEducation = async (req, res) => {
    try {
        const userId = req.user.id;
        const eduId = req.params.id;
        
        await PortfolioService.deleteEducation(userId, eduId);
        
        return res.status(200).json({
            message: 'Xóa học vấn thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa học vấn:', error);
        
        if (error.message === 'Không tìm thấy dữ liệu để xóa.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi xóa học vấn',
            error: error.message
        });
    }
};

// DELETE /api/portfolio/educations - Xóa tất cả học vấn
exports.deleteAllEducations = async (req, res) => {
    try {
        const userId = req.user.id;
        await PortfolioService.deleteAllEducations(userId);
        
        return res.status(200).json({
            message: 'Xóa tất cả học vấn thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa tất cả học vấn:', error);
        
        if (error.message === 'Hồ sơ ứng viên không tồn tại. Vui lòng tạo hồ sơ chung trước.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi xóa tất cả học vấn',
            error: error.message
        });
    }
};

// ==============================================================================
// 4. QUẢN LÝ KỸ NĂNG (SKILLS)
// ==============================================================================

// PUT /api/portfolio/skills - Cập nhật danh sách kỹ năng
exports.updateSkills = async (req, res) => {
    try {
        const userId = req.user.id;
        const { skills } = req.body;
        
        // Validation: kiểm tra trường skills có tồn tại và là mảng
        if (!skills || !Array.isArray(skills)) {
            return res.status(400).json({ 
                message: 'Vui lòng cung cấp danh sách kỹ năng (dạng mảng)' 
            });
        }
        
        const savedSkills = await PortfolioService.updateSkills(userId, skills);
        
        return res.status(200).json({
            message: 'Cập nhật kỹ năng thành công',
            data: savedSkills
        });
    } catch (error) {
        console.error('Lỗi khi cập nhật kỹ năng:', error);
        
        if (error.message === 'Dữ liệu gửi lên phải là danh sách (Mảng).') {
            return res.status(400).json({ message: error.message });
        }
        
        if (error.message === 'Hồ sơ ứng viên không tồn tại. Vui lòng tạo hồ sơ chung trước.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi cập nhật kỹ năng',
            error: error.message
        });
    }
};

// DELETE /api/portfolio/skills - Xóa tất cả kỹ năng
exports.deleteAllSkills = async (req, res) => {
    try {
        const userId = req.user.id;
        await PortfolioService.deleteAllSkills(userId);
        
        return res.status(200).json({
            message: 'Xóa tất cả kỹ năng thành công'
        });
    } catch (error) {
        console.error('Lỗi khi xóa tất cả kỹ năng:', error);
        
        if (error.message === 'Hồ sơ ứng viên không tồn tại. Vui lòng tạo hồ sơ chung trước.') {
            return res.status(404).json({ message: error.message });
        }
        
        return res.status(500).json({
            message: 'Lỗi server khi xóa tất cả kỹ năng',
            error: error.message
        });
    }
};