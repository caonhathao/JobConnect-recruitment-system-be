# 🚀 JobConnect API Documentation (Full-Stack Standard)

## 🔐 1. Authentication (Auth Module)
*Quản lý đăng ký, đăng nhập và phiên làm việc.*

| Feature | Endpoint | Method | Request Body (JSON) | Success Response (200/201) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Đăng ký** | `/api/auth/register` | `POST` | `{ "fullName": "Nguyễn Văn A", "email": "abc@gmail.com", "phone": "0901234567", "password": "123456", "companyName": "ABC Corp", "address": "HCM" }` | `{ "status": "success", "data": { "id": "uuid", "email": "abc@gmail.com", "phone": "0901234567", "fullName": "Nguyễn Văn A", "role": "candidate", "accessToken": "ey...", "refreshToken": "ey..." } }` | `companyName` & `address` chỉ dùng cho Recruiter. |
| **Đăng nhập** | `/api/auth/login` | `POST` | `{ "email": "abc@gmail.com", "password": "123456" }` | `{ "status": "success", "data": { "id": "uuid", "email": "abc@gmail.com", "phone": "0901234567", "fullName": "Nguyễn Văn A", "role": "candidate", "avatarUrl": "...", "accessToken": "ey...", "refreshToken": "ey..." } }` | Trả về `accessToken`, `refreshToken`. |
| **Refresh Token**| `/api/auth/refresh-token` | `POST` | `{ "refreshToken": "ey..." }` | `{ "accessToken": "ey..." }` | Lấy access token mới. |
| **Đăng xuất** | `/api/auth/logout` | `POST` | (Header `Authorization: Bearer <accessToken>`) | `{ "message": "Đăng xuất thành công" }` | Hủy phiên làm việc. |

---

## 👤 2. Candidate Module (Ứng viên)
*Yêu cầu Header: `Authorization: Bearer <accessToken>`*

### 2.1 Profile & Portfolio
| Feature | Endpoint | Method | Request Body (JSON) | Success Response (200) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Xem Profile** | `/api/candidate/profile` | `GET` | (None) | `{ "status": "success", "data": { "fullName": "...", "phone": "...", "role": "candidate", "avatarUrl": "...", "headline": "...", "summary": "...", "address": "...", "city": "...", "dateOfBirth": "2000-01-01T00:00:00.000Z", "gender": "male", "createdAt": "...", "updatedAt": "..." } }` | |
| **Cập nhật Profile** | `/api/candidate/profile` | `PUT` | `{ "fullName": "Nguyễn Văn B", "phone": "0901234567", "headline": "Junior Dev", "summary": "...", "address": "...", "city": "HCM", "dateOfBirth": "2000-01-01", "gender": "male", "linkedinUrl": "https://..." }` | `{ "status": "success", "message": "Cập nhật thông tin thành công", "data": { "fullName": "...", "email": "...", "headline": "...", ... } }` | |
| **Kinh nghiệm (Experience)** | `/api/portfolio/experiences` | `GET` | (None) | `{ "status": "success", "data": [{ "id": "uuid", "profileId": "uuid", "title": "Dev", "company": "ABC", "startDate": "...", "endDate": "...", "description": "..." }] }` | |
| **Thêm Experience** | `/api/portfolio/experiences` | `POST` | `{ "company": "ABC Corp", "title": "Junior Dev", "startDate": "2023-01-01", "endDate": "2024-01-01", "description": "..." }` | `{ "status": "success", "data": {...} }` | |
| **Học vấn (Education)** | `/api/portfolio/educations` | `GET` | (None) | `{ "status": "success", "data": [{ "id": "uuid", "profileId": "uuid", "school": "ĐH ABC", "degree": "Cử nhân", "field": "CNTT", "startDate": "...", "endDate": "..." }] }` | |
| **Thêm Education** | `/api/portfolio/educations` | `POST` | `{ "school": "ĐH ABC", "degree": "Cử nhân", "field": "CNTT", "startDate": "2020-01-01", "endDate": "2024-01-01" }` | `{ "status": "success", "data": {...} }` | |
| **Kỹ năng (Skills)** | `/api/portfolio/skills` | `GET` | (None) | `{ "status": "success", "data": [{ "id": "uuid", "profileId": "uuid", "skillId": "uuid", "skill": { "id": "uuid", "name": "JavaScript" } }] }` | |
| **Cập nhật Skills** | `/api/portfolio/skills` | `PUT` | `{ "skills": ["React", "NodeJS"] }` | `{ "status": "success", "data": [...] }` | Thay thế toàn bộ danh sách |

### 2.2 Quản lý CV (Resume)
| Feature | Endpoint | Method | Request / Body | Success Response (200/201) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Upload CV** | `/api/resumes/upload` | `POST` | Form-data: `cv` (file PDF) | `{ "status": "success", "message": "Upload CV thành công", "data": { "id": "uuid", "fileUrl": "...", "isDefault": true, "createdAt": "..." } }` | Chỉ nhận PDF, max 5MB |
| **Danh sách CV** | `/api/resumes` | `GET` | (None) | `{ "status": "success", "count": 2, "data": [{ "id": "uuid", "fileUrl": "...", "isDefault": true, "createdAt": "..." }] }` | |
| **Đặt mặc định** | `/api/resumes/:id/default` | `PATCH` | (None) | `{ "status": "success", "message": "Đã đặt làm CV mặc định", "data": {...} }` | |
| **Xóa CV** | `/api/resumes/:id` | `DELETE` | (None) | `{ "status": "success", "message": "Xóa CV thành công" }` | |

### 2.3 Bookmark (Lưu tin)
| Feature | Endpoint | Method | Request / Body | Success Response (200) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Danh sách đã lưu** | `/api/bookmarks` | `GET` | (None) | `{ "status": "success", "count": 2, "data": [{ "bookmarkId": "uuid", "savedAt": "...", "job": { "id": "uuid", "title": "...", "company": {...} } }] }` | Yêu cầu đăng nhập |
| **Lưu / Bỏ lưu** | `/api/bookmarks/:jobId` | `POST` | (None) | `{ "bookmarked": true, "message": "Đã lưu tin tuyển dụng." }` hoặc `{ "bookmarked": false, "message": "Đã bỏ lưu tin tuyển dụng." }` | Toggle |

---

## 🏢 3. Recruiter Module (Nhà tuyển dụng)
*Yêu cầu Header: `Authorization: Bearer <accessToken>`, Role: `RECRUITER`*

### 3.1 Thông tin Công ty & Dashboard
| Feature | Endpoint | Method | Request Body (JSON) | Success Response (200) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Xem Profile** | `/api/employer/` | `GET` | (None) | `{ "status": "success", "data": { "id": "uuid", "name": "ABC Corp", "description": "...", "website": "...", "logoUrl": "...", "address": "...", "city": "...", "size": "50-100", "status": "approved", "rejectionReason": null, "recruiter": { "fullName": "...", "email": "...", "phone": "...", "avatarUrl": "..." } } }` | |
| **Cập nhật Profile** | `/api/employer/` | `PUT` | `{ "name": "ABC Corp", "description": "...", "website": "...", "address": "...", "city": "HCM", "size": "50-100" }` | `{ "status": "success", "message": "Cập nhật thành công", "data": {...} }` | |
| **Upload Logo** | `/api/employer/logo` | `PUT` | Form-data: `logo` (image) | `{ "status": "success", "message": "Upload logo thành công", "data": { "logoUrl": "..." } }` | Max 5MB |
| **Xóa Logo** | `/api/employer/logo` | `DELETE` | (None) | `{ "status": "success", "message": "Xóa logo thành công" }` | |
| **Dashboard** | `/api/employer/dashboard` | `GET` | (None) | `{ "status": "success", "data": { "companyName": "ABC Corp", "companyStatus": "approved", "jobs": { "total": 10, "approved": 8, "pending": 1, "rejected": 1, "paused": 0 }, "applications": { "total": 50, "submitted": 30, "under_review": 10, "interview": 5, "accepted": 3, "rejected": 2 }, "successRate": "6%", "recentApplications": [...] } }` | Thống kê tổng quan |

### 3.2 Quản lý Tin tuyển dụng (Jobs)
| Feature | Endpoint | Method | Request Body (JSON) | Success Response (200/201) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Đăng Job** | `/api/employer/jobs` | `POST` | `{ "title": "Tuyển dụng NodeJS", "description": "...", "requirements": "...", "benefits": "...", "salaryMin": 1000, "salaryMax": 2000, "location": "HCM", "jobType": "Full-time", "jobLevel": "Junior", "deadline": "2026-12-31", "skills": ["NodeJS", "Express"] }` | `{ "status": "success", "message": "Đăng tin thành công, đang chờ duyệt", "data": { "id": "uuid", "title": "...", "status": "pending", ... } }` | Trạng thái mặc định: `pending` |
| **Danh sách Job** | `/api/employer/jobs?status=approved` | `GET` | (None) | `{ "status": "success", "count": 5, "data": [{ "id": "uuid", "title": "...", "status": "...", "company": {...}, "skills": [...] }] }` | Lọc theo `status` |
| **Toggle Pause** | `/api/employer/jobs/:id/toggle-pause` | `PATCH` | (None) | `{ "status": "success", "message": "Đã tạm dừng tin đăng." }` hoặc `"Đã mở lại tin đăng." }` | `approved` ↔ `paused` |

---

## 🤖 4. Tuyển dụng & AI Features (Public / Candidate)

| Feature | Endpoint | Method | Query / Body | Success Response (200) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tìm kiếm (Public)** | `/api/search-jobs/search-jobs?keyword=NodeJS&location=HCM&jobType=Full-time&jobLevel=Junior&salary=1000&page=1&limit=10` | `GET` | Query params | `{ "status": "success", "total_items": 100, "total_pages": 10, "current_page": 1, "jobs": [{ "id": "uuid", "title": "NodeJS Dev", "location": "HCM", "jobType": "Full-time", "salaryMin": 1000, "company": {...}, "skills": [...], "similarityScore": 0.85 }] }` | Sử dụng Vector Search (`job_vectors`) khi có từ khóa, fallback text search |
| **Gợi ý việc làm (AI)** | `/api/suggestions?limit=10` | `GET` | Query: `limit` (optional) | `{ "status": "success", "data": [{ "id": "uuid", "title": "...", "location": "...", "jobType": "...", "salaryMin": 1000, "company": {...}, "skills": [...], "similarityScore": 0.92 }] }` | Sử dụng Vector Matching từ `resume_vectors` |
| **Nộp đơn (Apply)** | `/api/applications` | `POST` | `{ "jobId": "uuid", "resumeId": "uuid", "coverLetter": "Tôi rất quan tâm..." }` | `{ "message": "Nộp đơn ứng tuyển thành công!", "data": { "id": "uuid", "status": "submitted", ... } }` | `resumeId` optional, dùng CV mặc định nếu không có |
| **Lịch sử ứng tuyển** | `/api/applications` | `GET` | (None) | `{ "status": "success", "count": 5, "data": [{ "id": "uuid", "status": "submitted", "coverLetter": "...", "resumeUrl": "...", "appliedAt": "...", "job": { "id": "uuid", "title": "...", "company": {...} } }] }` | |

---

## 🛡️ 5. Admin Module (Quản trị viên)
*Yêu cầu Header: `Authorization: Bearer <accessToken>`, Role: `ADMIN`*

### 5.1 User Management
| Feature | Endpoint | Method | Query / Body | Success Response (200) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Danh sách Users** | `/api/admin/users?role=candidate&isActive=true&keyword=nguyen&page=1&limit=10` | `GET` | Query params | `{ "status": "success", "count": 2, "data": [{ "id": "uuid", "email": "abc@gmail.com", "fullName": "Nguyễn Văn A", "role": "candidate", "phone": "...", "avatarUrl": "...", "isActive": true, "createdAt": "...", "updatedAt": "..." }] }` | Lọc theo `role`, `isActive`, `keyword` |
| **Toggle Khóa/Mở** | `/api/admin/users/:id/toggle-lock` | `PATCH` | (None) | `{ "id": "uuid", "fullName": "...", "email": "...", "role": "candidate", "isActive": false, "message": "Đã khóa tài khoản." }` | Toggle `isActive` |
| **Xóa User** | `/api/admin/users/:id` | `DELETE` | (None) | `{ "message": "Đã xóa user thành công" }` | Không thể xóa Admin |

### 5.2 Company & Job Browsing (Admin)
| Feature | Endpoint | Method | Query / Body | Success Response (200) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Danh sách Companies** | `/api/admin/companies` | `GET` | (None) | `{ "status": "success", "data": [...] }` | Admin xem tất cả công ty |
| **Duyệt/Reject Company** | `/api/admin/companies/:id/approve` | `PATCH` | `{ "status": "approved" }` | `{ "status": "success", "data": {...} }` | Admin duyệt hồ sơ công ty |
| **Danh sách Jobs (Admin)** | `/api/admin/jobs` | `GET` | (None) | `{ "status": "success", "data": [...] }` | Admin xem tất cả job |

### 5.3 Statistics & Reports (Admin)
| Feature | Endpoint | Method | Query / Body | Success Response (200) | Note |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Tổng quan hệ thống** | `/api/admin/reports/overview` | `GET` | (None) | `{ "status": "success", "data": { "users": { "total": 1000, "candidates": 800, "recruiters": 200 }, "companies": { "total": 50, "approved": 45, "pending": 5 }, "jobs": { "total": 200, "approved": 180, "pending": 10, "rejected": 10 }, "applications": { "total": 500, "accepted": 50, "successRate": "10%" } } }` | Thống kê tổng quan |
| **Tăng trưởng User** | `/api/admin/reports/users/growth` | `GET` | (None) | `{ "status": "success", "data": [{ "month": "2025-06", "candidate": 50, "recruiter": 10, "total": 60 }] }` | 12 tháng gần nhất |
| **Đơn ứng tuyển theo tháng** | `/api/admin/reports/applications/monthly` | `GET` | (None) | `{ "status": "success", "data": [{ "month": "2025-06", "total": 100, "accepted": 20, "rejected": 30 }] }` | 12 tháng gần nhất |
| **Job theo loại hình** | `/api/admin/reports/jobs/by-type` | `GET` | (None) | `{ "status": "success", "data": [{ "jobType": "Full-time", "count": 100 }, { "jobType": "Part-time", "count": 50 }] }` | Thống kê theo `jobType` |
| **Job theo cấp độ** | `/api/admin/reports/jobs/by-level` | `GET` | (None) | `{ "status": "success", "data": [{ "jobLevel": "Junior", "count": 80 }, { "jobLevel": "Senior", "count": 40 }] }` | Thống kê theo `jobLevel` |

---

## 🛠 6. HTTP Error Codes
| Code | Meaning | Example Message |
| :--- | :--- | :--- |
| **200 / 201** | Thành công | `"Đăng nhập thành công"`, `"Nộp đơn ứng tuyển thành công!"` |
| **400 (Bad Request)** | Dữ liệu đầu vào sai format hoặc thiếu trường bắt buộc | `"Email, password, họ tên và số điện thoại là bắt buộc"`, `"Tiêu đề công việc không được để trống."` |
| **401 (Unauthorized)** | Thiếu hoặc sai Access Token | `"Vui lòng cung cấp Refresh Token"`, `"Email hoặc mật khẩu không đúng"` |
| **403 (Forbidden)** | Sai quyền truy cập (Role không khớp) | `"Không thể xóa tài khoản Admin."`, `"Không thể khóa tài khoản Admin."` |
| **404 (Not Found)** | ID tài nguyên không tồn tại trong Database | `"Không tìm thấy đơn ứng tuyển."`, `"Công việc không tồn tại hoặc đã đóng tuyển."` |
| **500 (Internal Server Error)** | Lỗi server không xác định | `"Lỗi server khi tìm kiếm việc làm"`, `"Lỗi server khi nộp đơn ứng tuyển"` |

---

## 📝 7. Data Model Conventions
- **ID Fields**: Tất cả sử dụng UUID (`String @id @default(uuid())` trong Prisma)
- **Naming**: API sử dụng `camelCase` cho tất cả Request/Response fields (ví dụ: `fullName`, `jobType`, `salaryMin`)
- **Database**: Prisma schema sử dụng `@map("snake_case")` để ánh xạ với cột DB, code sử dụng camelCase
- **Enums/Status**: `pending`, `approved`, `rejected`, `paused` (Jobs); `submitted`, `under_review`, `interview`, `accepted`, `rejected` (Applications)
- **Vector Search**: AI features sử dụng `resume_vectors` và `job_vectors` với `pgvector` extension, toán tử `<=>` cho cosine similarity
