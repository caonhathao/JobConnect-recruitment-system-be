const cron = require("node-cron");
const prisma = require("../lib/prisma"); // Đường dẫn tới Prisma client của bạn
const { storeJobVector } = require("../services/JobVectorService");
/**
 * Thiết lập lịch quét các Job chưa được xử lý vector thành công.
 * @description Chạy vào lúc 00:00 mỗi ngày (theo yêu cầu check mỗi 24h).
 */
const setupVectorSchedule = () => {
  // Cấu trúc: 'phút giờ ngày tháng thứ_trong_tuần'
  // '0 0 * * *' tương ứng với 00:00 hàng ngày
  cron.schedule("0 0 * * *", async () => {
    console.log(
      "[SCHEDULE] Bắt đầu quét các Job lỗi hoặc chưa xử lý vector...",
    );

    try {
      // Tìm các Job có trạng thái PENDING hoặc FAILED
      const incompleteJobs = await prisma.job.findMany({
        where: {
          OR: [{ vectorStatus: "PENDING" }, { vectorStatus: "FAILED" }],
        },
      });

      console.log(
        `[SCHEDULE] Tìm thấy ${incompleteJobs.length} Job cần xử lý lại.`,
      );

      for (const job of incompleteJobs) {
        // Thực hiện xử lý lại (Không dùng await để không làm nghẽn vòng lặp nếu 1 job lỗi)
        storeJobVector(job.id, job.description)
          .then(() => console.log(`[SCHEDULE] Re-processed Job ID: ${job.id}`))
          .catch((err) =>
            console.error(`[SCHEDULE] Error re-processing Job ${job.id}:`, err),
          );
      }
    } catch (error) {
      console.error(
        "[SCHEDULE] Lỗi nghiêm trọng khi thực thi Cron Job:",
        error,
      );
    }
  });

  console.log(
    "[SYSTEM] Vectorization Schedule đã được kích hoạt (00:00 daily).",
  );
};

module.exports = { setupVectorSchedule };
